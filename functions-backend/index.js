/**
 * Cloud Functions for Clinic Scheduler Pro
 * Comprehensive backend services for scheduling management
 * FIXED VERSION: Compatible with new rotation-based, multi-site data model
 */

// Use 1st gen API surface per Firebase guidance for Node.js 20 runtime
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors')({ origin: true });
const PDFDocument = require('pdfkit');
const {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  parseISO,
  addWeeks
} = require('date-fns');
const {
  TIME_SLOTS,
  normalizeAttending,
  buildSlotsForMoment
} = require('./lib/attending-utils.js');
const { callGemini, ACTIONS } = require('./chatbot/gemini');
const { handleAction } = require('./chatbot/action-handlers');
const { recordUsage } = require('./chatbot/undo-store');

// Import from modular configuration
const { db } = require('./src/config/firebase');
const { sendEmail } = require('./src/config/email');

// Import utility modules
const { isResidentOnVacation, hasProtectedTime, checkDutyHourCompliance } = require('./src/utils/validators');
const { deserializeValue, serializeDocument } = require('./src/utils/serialization');
const { getUserDetails, describeAssignmentType } = require('./src/utils/user');

// Import scheduling modules
const { generateSchedule } = require('./src/scheduling/autoSchedule');

// Import backup modules
const { createInstitutionBackup, restoreFromBackup } = require('./src/backup/backup');

// Import notification modules
const {
  buildAssignmentChangeEmail,
  buildDailyReminderEmail,
  sendAssignmentChangeNotification,
  sendDailyReminderNotification
} = require('./src/notifications/email');

// Import report modules
const { generateSchedulePDF: generatePDF } = require('./src/reports/pdf');

// Import sync modules
const syncExternal = require('./src/sync/external');

// ==================== Helper Functions ====================
// (Extracted to src/utils/ and src/config/ modules)

function generateSecureInviteCode(length = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function mapAccountTypeToRole(accountType) {
  switch (accountType) {
    case 'admin':
      return 'admin';
    case 'program_coordinator':
      return 'program_admin';
    case 'chief_resident':
      return 'chief_resident';
    case 'physician':
      return 'member';
    case 'resident':
      return 'member';
    default:
      return 'member';
  }
}

// ==================== 1. AUTO-SCHEDULING FUNCTION ====================

exports.autoSchedule = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, startDate, endDate, options = {} } = data;

  try {
    // Validate institution
    const institutionRef = db.collection('institutions').doc(institutionId);
    const institutionDoc = await institutionRef.get();
    if (!institutionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Institution not found');
    }

    const institution = institutionDoc.data();
    const protectedTimes = institution.settings?.protectedTimes || [];
    const sites = institution.settings?.sites || [];

    // Check permissions
    const memberDoc = await institutionRef
      .collection('members')
      .doc(context.auth.uid)
      .get();

    const allowedRoles = ['admin', 'program_admin', 'chief_resident', 'scheduler'];
    if (!memberDoc.exists || !allowedRoles.includes(memberDoc.data().role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Validate dates
    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);

    if (Number.isNaN(startDateObj) || Number.isNaN(endDateObj)) {
      throw new functions.https.HttpsError('invalid-argument', 'Start and end dates must be valid ISO strings');
    }

    if (endDateObj < startDateObj) {
      throw new functions.https.HttpsError('invalid-argument', 'End date must be on or after start date');
    }

    // Fetch data in parallel
    const [attendingsSnap, residentsSnap, existingAssignmentsSnap, rulesSnap] = await Promise.all([
      institutionRef.collection('attendings').get(),
      institutionRef.collection('residents').get(),
      institutionRef.collection('assignments')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get(),
      institutionRef.collection('rules').get()
    ]);

    const rules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const attendings = attendingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const residents = residentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const existingAssignments = existingAssignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Generate schedule using modular algorithm
    const newAssignments = generateSchedule({
      attendings,
      residents,
      existingAssignments,
      startDate,
      endDate,
      protectedTimes,
      sites,
      rules,
      options,
      userId: context.auth.uid
    });

    // Write assignments to Firestore in batch
    const batch = db.batch();
    for (const assignment of newAssignments) {
      const docRef = institutionRef.collection('assignments').doc();
      batch.set(docRef, assignment);
    }

    await batch.commit();

    // Log audit trail
    await institutionRef.collection('auditLogs').add({
      action: 'auto_schedule',
      data: {
        startDate,
        endDate,
        assignmentsCreated: newAssignments.length,
        options
      },
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      assignmentsCreated: newAssignments.length,
      assignments: newAssignments
    };
  } catch (error) {
    console.error('Auto-scheduling error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== 1b. BULK INVITE MEMBERS FUNCTION ====================

exports.bulkInviteMembers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, invites } = data || {};

  if (!institutionId || !Array.isArray(invites) || invites.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'institutionId and non-empty invites array are required');
  }

  if (invites.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'Too many invites in a single request (max 50).');
  }

  try {
    const institutionRef = db.collection('institutions').doc(institutionId);
    const institutionSnap = await institutionRef.get();

    if (!institutionSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Institution not found');
    }

    const institution = institutionSnap.data();
    const members = Array.isArray(institution.members) ? institution.members : [];
    const callerMember = members.find((m) => m.userId === context.auth.uid) || null;
    const allowedRoles = ['admin', 'program_admin', 'chief_resident', 'scheduler'];

    if (!callerMember || !allowedRoles.includes(callerMember.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to invite members');
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    const results = [];

    for (const rawInvite of invites) {
      try {
        const name = (rawInvite && rawInvite.name ? String(rawInvite.name) : '').trim();
        const email = (rawInvite && rawInvite.email ? String(rawInvite.email) : '').trim();
        const programRole = rawInvite && rawInvite.programRole ? String(rawInvite.programRole) : null;
        const accountType = rawInvite && rawInvite.accountType ? String(rawInvite.accountType) : 'member';

        if (!email) {
          throw new Error('Email is required');
        }

        const internalRole = mapAccountTypeToRole(accountType);
        const code = generateSecureInviteCode(8);

        const inviteDocRef = db.collection('inviteCodes').doc(code);

        await inviteDocRef.set({
          institutionId,
          role: internalRole,
          recipientName: name,
          recipientEmail: email.toLowerCase(),
          programRole,
          createdBy: context.auth.uid,
          createdAt: now,
          expiresAt,
          used: false,
          singleUse: true
        });

        const subject = `Invitation to join ${institution.name || 'Clinic Scheduler Pro'}`;
        const loginUrl = 'https://clinicscheduler.com'; // Frontend entrypoint

        const safeName = name || 'Colleague';
        const roleLabel = (() => {
          switch (accountType) {
            case 'admin':
              return 'Admin';
            case 'program_coordinator':
              return 'Program Coordinator';
            case 'chief_resident':
              return 'Chief Resident';
            case 'physician':
              return 'Physician (read-only)';
            case 'resident':
              return 'Resident (read-only)';
            default:
              return 'Member';
          }
        })();

        const html = [
          `<h2>Clinic Scheduler Invitation</h2>`,
          `<p>Hi ${safeName},</p>`,
          `<p>${institution.name || 'Your program'} has invited you to join Clinic Scheduler as a <strong>${roleLabel}</strong>.</p>`,
          `<p>To accept this invitation:</p>`,
          '<ol>',
          `<li>Go to <a href="${loginUrl}">${loginUrl}</a>.</li>`,
          '<li>Create an account or sign in.</li>',
          `<li>Enter the invite code <strong>${code}</strong> when prompted.</li>`,
          '</ol>',
          '<p>This code is single-use and will expire in 7 days.</p>',
          '<hr>',
          `<p><small>Sent by ${callerMember.name || 'Clinic Scheduler Admin'}</small></p>`
        ].join('\n');

        const textLines = [
          `Clinic Scheduler Invitation`,
          ``,
          `Hi ${safeName},`,
          `${institution.name || 'Your program'} has invited you to join Clinic Scheduler as a ${roleLabel}.`,
          ``,
          `To accept, go to ${loginUrl}, create an account or sign in,`,
          `and enter invite code: ${code}`,
          ``,
          `This code is single-use and will expire in 7 days.`
        ];

        const text = textLines.join('\n');

        await sendEmail(email, subject, html, text);

        results.push({ email, success: true });
      } catch (inviteError) {
        console.error('Bulk invite error for row:', inviteError);
        results.push({
          email: rawInvite && rawInvite.email ? String(rawInvite.email) : null,
          success: false,
          error: inviteError.message
        });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return {
      success: failed.length === 0,
      sent,
      failed
    };
  } catch (error) {
    console.error('bulkInviteMembers error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== 2. NOTIFICATION FUNCTIONS ====================

exports.notifyScheduleChange = functions.firestore.document('institutions/{institutionId}/assignments/{assignmentId}')
  .onWrite(async (change, context) => {
    const { institutionId, assignmentId } = context.params;

    try {
      // Determine the type of change
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;

      let changeType, assignment;
      if (!before && after) {
        changeType = 'created';
        assignment = after;
      } else if (before && after) {
        changeType = 'updated';
        assignment = after;
      } else if (before && !after) {
        changeType = 'deleted';
        assignment = before;
      } else {
        return null;
      }

      // Skip virtual assignments
      if (assignment.virtual) {
        return null;
      }

      // Get institution settings for sites
      const institutionDoc = await db.collection('institutions').doc(institutionId).get();
      const institution = institutionDoc.data();
      const sites = institution.settings?.sites || [];

      // Get resident and attending information
      let resident = null, attending = null;

      if (assignment.residentId) {
        const residentDoc = await db.collection('institutions').doc(institutionId)
          .collection('residents').doc(assignment.residentId).get();
        if (residentDoc.exists) {
          resident = residentDoc.data();
        }
      }

      if (assignment.attendingId) {
        const attendingDoc = await db.collection('institutions').doc(institutionId)
          .collection('attendings').doc(assignment.attendingId).get();
        if (attendingDoc.exists) {
          attending = attendingDoc.data();
        }
      }

      if (!resident) {
        console.log('No resident found for assignment');
        return null;
      }

      // Get site information
      const site = sites.find(s => s.id === assignment.siteId);
      const siteName = site?.name || 'Main Clinic';
      const siteAddress = site?.address || '';

      // Get user email for resident
      const memberDoc = await db.collection('institutions').doc(institutionId)
        .collection('members').where('residentId', '==', assignment.residentId).limit(1).get();

      if (memberDoc.empty) {
        console.log('No member found for resident');
        return null;
      }

      // Check if notifications are enabled
      if (!institution.settings?.notificationsEnabled) {
        console.log('Notifications disabled for institution');
        return null;
      }

      // Use extracted notification module
      await sendAssignmentChangeNotification({
        changeType,
        assignment,
        resident,
        attending,
        siteName,
        siteAddress,
        institutionName: institution.name,
        residentMemberId: memberDoc.docs[0].id
      });

      console.log(`Notification sent for assignment ${assignmentId}`);
      return null;

    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// ==================== 3. DATA VALIDATION FUNCTIONS ====================

exports.validateAssignment = functions.firestore.document('institutions/{institutionId}/assignments/{assignmentId}')
  .onCreate(async (snap, context) => {
    const { institutionId, assignmentId } = context.params;
    const assignment = snap.data();

    // Skip validation for virtual assignments
    if (assignment.virtual) {
      return null;
    }

    try {
      // Get all assignments for duty hour checking
      const assignmentsSnap = await db.collection('institutions').doc(institutionId)
        .collection('assignments')
        .where('residentId', '==', assignment.residentId)
        .get();

      const assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check duty hour compliance
      const compliance = checkDutyHourCompliance(assignments, assignment.residentId, assignment);

      if (!compliance.compliant) {
        // Delete the non-compliant assignment
        await snap.ref.delete();

        // Log the violation
        await db.collection('institutions').doc(institutionId)
          .collection('auditLogs').add({
            action: 'assignment_rejected',
            data: {
              assignment,
              reason: compliance.reason
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

        console.log(`Assignment ${assignmentId} rejected: ${compliance.reason}`);
        return null;
      }

      // Check for double-booking
      const conflictingAssignments = assignments.filter(a =>
        a.id !== assignmentId &&
        a.date === assignment.date &&
        a.timeSlot === assignment.timeSlot
      );

      if (conflictingAssignments.length > 0) {
        // Delete the conflicting assignment
        await snap.ref.delete();

        // Log the conflict
        await db.collection('institutions').doc(institutionId)
          .collection('auditLogs').add({
            action: 'assignment_rejected',
            data: {
              assignment,
              reason: 'Double booking detected',
              conflicts: conflictingAssignments
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

        console.log(`Assignment ${assignmentId} rejected: Double booking`);
        return null;
      }

      // Check attending capacity
      if (assignment.attendingId) {
        const [attendingDoc, attendingAssignmentsSnap] = await Promise.all([
          db.collection('institutions').doc(institutionId)
            .collection('attendings').doc(assignment.attendingId).get(),
          db.collection('institutions').doc(institutionId)
            .collection('assignments')
            .where('attendingId', '==', assignment.attendingId)
            .where('date', '==', assignment.date)
            .where('timeSlot', '==', assignment.timeSlot)
            .get()
        ]);

        if (attendingDoc.exists) {
          const normalizedAttending = normalizeAttending({ id: attendingDoc.id, ...attendingDoc.data() });
          const dayOfWeek = parseISO(assignment.date).getDay();

          const overridesForSlot = (normalizedAttending.scheduleOverrides || []).filter(override =>
            override?.date === assignment.date && (override.timeSlot || 'AM') === assignment.timeSlot
          );

          const cancelledIds = new Set(
            overridesForSlot
              .filter(override => override.action === 'cancel')
              .map(override => override.clinicId)
              .filter(Boolean)
          );

          let slotCapacity = 0;

          (normalizedAttending.clinics || []).forEach(clinic => {
            const hasDefault = clinic.defaultSessions?.some(session =>
              session.dayOfWeek === dayOfWeek && session.timeSlot === assignment.timeSlot
            );

            if (hasDefault && !cancelledIds.has(clinic.id)) {
              slotCapacity += Number.isFinite(clinic.residentCapacity)
                ? clinic.residentCapacity
                : 0;
            }
          });

          overridesForSlot
            .filter(override => override.action === 'add')
            .forEach(override => {
              const clinic = normalizedAttending.clinics?.find(c => c.id === override.clinicId);
              const capacity = Number.isFinite(override.residentCapacity)
                ? override.residentCapacity
                : (clinic?.residentCapacity || 0);
              slotCapacity += capacity;
            });

          const maxResidents = slotCapacity > 0 ? slotCapacity : 2;

          if (attendingAssignmentsSnap.size > maxResidents) {
            // Delete the over-capacity assignment
            await snap.ref.delete();

            // Log the violation
            await db.collection('institutions').doc(institutionId)
              .collection('auditLogs').add({
                action: 'assignment_rejected',
                data: {
                  assignment,
                  reason: `Attending capacity exceeded (max: ${maxResidents})`
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });

            console.log(`Assignment ${assignmentId} rejected: Attending over capacity`);
            return null;
          }
        }
      }

      // Add updatedAt timestamp if not present
      if (!assignment.updatedAt) {
        await snap.ref.update({
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log(`Assignment ${assignmentId} validated successfully`);
      return null;

    } catch (error) {
      console.error('Error validating assignment:', error);
      return null;
    }
  });

// Continue in next message due to length...
// ==================== 4. SCHEDULED OPERATIONS ====================

exports.weeklyScheduleGeneration = functions.pubsub
  .schedule('every sunday 23:00')
  .timeZone('America/New_York')
  .onRun(async (_context) => {
    try {
      // Get all institutions with auto-scheduling enabled
      const institutionsSnap = await db.collection('institutions')
        .where('settings.autoScheduleEnabled', '==', true)
        .get();

      const results = [];

      for (const institutionDoc of institutionsSnap.docs) {
        const institutionId = institutionDoc.id;
        const institution = institutionDoc.data();

        // Generate schedule for next week
        const nextWeekStart = format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 0 }), 1), 'yyyy-MM-dd');
        const nextWeekEnd = format(addWeeks(endOfWeek(new Date(), { weekStartsOn: 0 }), 1), 'yyyy-MM-dd');

        // Get the program admin to use as the creator
        const adminMember = await db.collection('institutions').doc(institutionId)
          .collection('members')
          .where('role', 'in', ['admin', 'program_admin'])
          .limit(1)
          .get();

        if (!adminMember.empty) {
          // Call auto-schedule function
          const autoScheduleResult = await exports.autoSchedule(
            {
              institutionId,
              startDate: nextWeekStart,
              endDate: nextWeekEnd,
              options: {
                includeWeekends: false,
                overwrite: false
              }
            },
            { auth: { uid: adminMember.docs[0].id } }
          );

          results.push({
            institutionId,
            institutionName: institution.name,
            ...autoScheduleResult
          });

          // Send summary email to administrators
          for (const memberDoc of adminMember.docs) {
            const userDetails = await getUserDetails(memberDoc.id);
            if (userDetails && userDetails.email) {
              const summaryHtml = [
                '<h2>Weekly Schedule Generated</h2>',
                `<p>The schedule for ${nextWeekStart} to ${nextWeekEnd} has been generated.</p>`,
                `<p>Assignments created: ${autoScheduleResult.assignmentsCreated}</p>`,
                '<p><a href="https://clinicscheduler.com">View Schedule</a></p>'
              ].join('\n');

              const summaryText = [
                `Weekly schedule generated for ${nextWeekStart} to ${nextWeekEnd}.`,
                `Assignments created: ${autoScheduleResult.assignmentsCreated}`
              ].join(' ');

              await sendEmail(
                userDetails.email,
                'Weekly Schedule Generated',
                summaryHtml,
                summaryText
              );
            }
          }
        }
      }

      console.log('Weekly schedule generation completed:', results);
      return null;

    } catch (error) {
      console.error('Error in weekly schedule generation:', error);
      return null;
    }
  });

exports.dailyReminders = functions.pubsub
  .schedule('every day 07:00')
  .timeZone('America/New_York')
  .onRun(async (_context) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get all institutions
      const institutionsSnap = await db.collection('institutions').get();

      for (const institutionDoc of institutionsSnap.docs) {
        const institutionId = institutionDoc.id;
        const institution = institutionDoc.data();

        // Check if notifications are enabled
        if (!institution.settings?.notificationsEnabled) {
          continue;
        }

        const sites = institution.settings?.sites || [];

        // Get all assignments for today
        const assignmentsSnap = await db.collection('institutions').doc(institutionId)
          .collection('assignments')
          .where('date', '==', today)
          .get();

        for (const assignmentDoc of assignmentsSnap.docs) {
          const assignment = assignmentDoc.data();

          // Skip virtual assignments
          if (assignment.virtual) continue;

          // Get resident info
          if (!assignment.residentId) continue;

          const residentDoc = await db.collection('institutions').doc(institutionId)
            .collection('residents').doc(assignment.residentId).get();

          if (!residentDoc.exists) continue;

          const resident = residentDoc.data();

          // Get attending info if available
          let attending = null;
          if (assignment.attendingId) {
            const attendingDoc = await db.collection('institutions').doc(institutionId)
              .collection('attendings').doc(assignment.attendingId).get();
            if (attendingDoc.exists) {
              attending = attendingDoc.data();
            }
          }

          // Get site information
          const site = sites.find(s => s.id === assignment.siteId);
          const siteName = site?.name || 'Main Clinic';
          const siteAddress = site?.address || '';

          // Get user email
          const memberDoc = await db.collection('institutions').doc(institutionId)
            .collection('members').where('residentId', '==', assignment.residentId).limit(1).get();

          if (!memberDoc.empty) {
            // Use extracted notification module
            await sendDailyReminderNotification({
              assignment,
              resident,
              attending,
              siteName,
              siteAddress,
              residentMemberId: memberDoc.docs[0].id
            });
          }
        }
      }

      console.log('Daily reminders sent');
      return null;

    } catch (error) {
      console.error('Error sending daily reminders:', error);
      return null;
    }
  });

// ==================== 5. PDF GENERATION ====================

exports.generateSchedulePDF = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, startDate, endDate, residentId } = data;

  try {
    // Get institution and verify permissions
    const [institutionDoc, memberDoc] = await Promise.all([
      db.collection('institutions').doc(institutionId).get(),
      db.collection('institutions').doc(institutionId)
        .collection('members').doc(context.auth.uid).get()
    ]);

    if (!institutionDoc.exists || !memberDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Institution or member not found');
    }

    const institution = institutionDoc.data();
    const sites = institution.settings?.sites || [];
    const rotations = institution.settings?.rotations || [];

    // Get assignments
    let assignmentsQuery = db.collection('institutions').doc(institutionId)
      .collection('assignments')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate);

    if (residentId) {
      assignmentsQuery = assignmentsQuery.where('residentId', '==', residentId);
    }

    const assignmentsSnap = await assignmentsQuery.orderBy('date').orderBy('timeSlot').get();

    // Get residents and attendings
    const [residentsSnap, attendingsSnap] = await Promise.all([
      db.collection('institutions').doc(institutionId).collection('residents').get(),
      db.collection('institutions').doc(institutionId).collection('attendings').get()
    ]);

    // Prepare data for PDF generation
    const residents = residentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const attendings = attendingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Use extracted PDF generation module
    const pdfBase64 = await generatePDF({
      institutionName: institution.name,
      startDate,
      endDate,
      assignments,
      residents,
      attendings,
      sites,
      rotations,
      residentId
    });

    // Add audit log
    await db.collection('institutions').doc(institutionId)
      .collection('auditLogs').add({
        action: 'pdf_generated',
        data: { startDate, endDate, residentId },
        userId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    return {
      success: true,
      pdf: pdfBase64,
      filename: `schedule_${startDate}_${endDate}.pdf`
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== 6. ANALYTICS FUNCTIONS ====================

exports.calculateAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, startDate, endDate } = data;

  try {
    // Verify permissions
    const memberDoc = await db.collection('institutions').doc(institutionId)
      .collection('members').doc(context.auth.uid).get();

    if (!memberDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Not a member of institution');
    }

    // Get institution settings
    const institutionDoc = await db.collection('institutions').doc(institutionId).get();
    const institution = institutionDoc.data();
    const sites = institution.settings?.sites || [];
    const rotations = institution.settings?.rotations || [];

    // Get all assignments in date range
    const assignmentsSnap = await db.collection('institutions').doc(institutionId)
      .collection('assignments')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get residents and attendings
    const [residentsSnap, attendingsSnap] = await Promise.all([
      db.collection('institutions').doc(institutionId).collection('residents').get(),
      db.collection('institutions').doc(institutionId).collection('attendings').get()
    ]);

    const residents = residentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const attendings = attendingsSnap.docs.map(doc => normalizeAttending({ id: doc.id, ...doc.data() }, sites));

    // Calculate statistics
    const analytics = {
      totalAssignments: assignments.length,
      byResident: {},
      byAttending: {},
      bySite: {},
      byRotation: {},
      byType: {
        clinical: 0,
        continuity: 0,
        protected: 0
      },
      dutyHours: {},
      fairnessScore: 0,
      coverage: {
        total: 0,
        filled: 0,
        percentage: 0
      }
    };

    // Initialize site and rotation counters
    sites.forEach(site => {
      analytics.bySite[site.id] = {
        name: site.name,
        count: 0
      };
    });

    rotations.forEach(rotation => {
      analytics.byRotation[rotation.id] = {
        name: rotation.name,
        count: 0
      };
    });

    // Resident statistics
    residents.forEach(resident => {
      const residentAssignments = assignments.filter(a => a.residentId === resident.id);
      analytics.byResident[resident.id] = {
        name: resident.name,
        pgyStatus: resident.pgyStatus,
        totalAssignments: residentAssignments.length,
        hours: residentAssignments.length * 4, // 4 hours per half-day
        continuity: residentAssignments.filter(a => a.type === 'continuity').length,
        clinical: residentAssignments.filter(a => a.type === 'clinical').length,
        protected: residentAssignments.filter(a => a.type === 'protected').length
      };

      analytics.dutyHours[resident.id] = residentAssignments.length * 4;
    });

    // Attending statistics
    attendings.forEach(attending => {
      const attendingAssignments = assignments.filter(a => a.attendingId === attending.id);
      analytics.byAttending[attending.id] = {
        name: attending.name,
        totalAssignments: attendingAssignments.length,
        averageResidents: 0
      };

      // Calculate average residents per session
      const uniqueSessions = new Set(attendingAssignments.map(a => `${a.date}_${a.timeSlot}`));
      if (uniqueSessions.size > 0) {
        analytics.byAttending[attending.id].averageResidents = 
          (attendingAssignments.length / uniqueSessions.size).toFixed(2);
      }
    });

    // Process assignments for type, site, and rotation distribution
    assignments.forEach(assignment => {
      // Type distribution
      if (assignment.type === 'continuity') {
        analytics.byType.continuity++;
      } else if (assignment.type === 'protected') {
        analytics.byType.protected++;
      } else {
        analytics.byType.clinical++;
      }

      // Site distribution
      if (assignment.siteId && analytics.bySite[assignment.siteId]) {
        analytics.bySite[assignment.siteId].count++;
      }

      // Rotation distribution
      if (assignment.rotationId && analytics.byRotation[assignment.rotationId]) {
        analytics.byRotation[assignment.rotationId].count++;
      }
    });

    // Calculate fairness score (standard deviation of assignments)
    const residentCounts = Object.values(analytics.byResident)
      .map(residentStat => residentStat.totalAssignments);

    if (residentCounts.length > 0) {
      const totalAssignmentsByResident = residentCounts.reduce((sum, value) => sum + value, 0);
      const mean = totalAssignmentsByResident / residentCounts.length;

      const varianceSum = residentCounts.reduce((sum, count) => {
        const diff = count - mean;
        return sum + diff * diff;
      }, 0);

      const variance = varianceSum / residentCounts.length;
      const stdDev = Math.sqrt(variance);
      const fairness = mean > 0 ? 100 - (stdDev / mean) * 100 : 100;
      analytics.fairnessScore = Math.max(0, fairness).toFixed(2);
    } else {
      analytics.fairnessScore = 100;
    }

    // Calculate coverage based on actual clinic schedules
    let totalSlots = 0;
    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);

    for (let date = startDateObj; date <= endDateObj; date = addDays(date, 1)) {
      const dayOfWeek = date.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const timeSlot of TIME_SLOTS) {
        attendings.forEach(attending => {
          const slots = buildSlotsForMoment(attending, format(date, 'yyyy-MM-dd'), dayOfWeek, timeSlot);
          slots.forEach(slot => {
            totalSlots += slot.capacity;
          });
        });
      }
    }

    analytics.coverage.total = totalSlots;
    analytics.coverage.filled = assignments.filter(a => a.type === 'clinical').length;
    analytics.coverage.percentage = totalSlots > 0
      ? ((analytics.coverage.filled / totalSlots) * 100).toFixed(2)
      : 0;

    // Add audit log
    await db.collection('institutions').doc(institutionId)
      .collection('auditLogs').add({
        action: 'analytics_calculated',
        data: { startDate, endDate },
        userId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    return {
      success: true,
      analytics
    };

  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== 6. EXTERNAL SYSTEM SYNC ====================

exports.syncWithExternalSystem = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'method-not-allowed' });
      return;
    }

    const secret = functions.config().webhook?.secret;
    const providedSecret = req.headers['x-webhook-secret'] || req.headers['x-api-key'];

    if (secret && providedSecret !== secret) {
      res.status(401).json({ success: false, error: 'invalid-secret' });
      return;
    }

    const { action, institutionId, payload = {}, options = {} } = req.body || {};

    if (!action || !institutionId) {
      res.status(400).json({ success: false, error: 'missing-parameters' });
      return;
    }

    try {
      const institutionRef = db.collection('institutions').doc(institutionId);
      const institutionSnap = await institutionRef.get();

      if (!institutionSnap.exists) {
        res.status(404).json({ success: false, error: 'institution-not-found' });
        return;
      }

      if (action === 'import_residents') {
        const result = await syncExternal.importResidents({
          db,
          institutionRef,
          residents: payload.residents,
          options
        });

        if (result?.error) {
          res.status(400).json({
            success: false,
            error: result.error,
            imported: result.imported ?? 0,
            skipped: result.skipped ?? 0
          });
          return;
        }

        res.status(200).json({
          success: true,
          action,
          institutionId,
          imported: result?.imported ?? 0,
          skipped: result?.skipped ?? 0
        });
        return;
      }

      if (action === 'export_schedule') {
        const result = await syncExternal.exportSchedule({
          institutionRef,
          startDate: payload.startDate,
          endDate: payload.endDate,
          limit: payload.limit,
          includeDetails: payload.includeDetails,
          options
        });

        if (result?.error) {
          res.status(400).json({ success: false, error: result.error });
          return;
        }

        res.status(200).json({
          success: true,
          action,
          institutionId,
          ...result
        });
        return;
      }

      res.status(400).json({ success: false, error: 'unknown-action' });
    } catch (error) {
      console.error('Error in syncWithExternalSystem:', error);
      res.status(500).json({ success: false, error: 'internal-error', message: error.message });
    }
  });
});

// ==================== 7. COMPLIANCE DATA EXPORT ====================

exports.exportComplianceData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    institutionId,
    startDate,
    endDate,
    anonymize = false
  } = data || {};

  if (!institutionId || !startDate || !endDate) {
    throw new functions.https.HttpsError('invalid-argument', 'institutionId, startDate, and endDate are required');
  }

  try {
    const institutionRef = db.collection('institutions').doc(institutionId);

    const [institutionDoc, memberDoc] = await Promise.all([
      institutionRef.get(),
      institutionRef.collection('members').doc(context.auth.uid).get()
    ]);

    if (!institutionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Institution not found');
    }

    if (!memberDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Membership required');
    }

    const memberRole = memberDoc.data().role;
    if (!['admin', 'program_admin', 'chief_resident'].includes(memberRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Administrator role required');
    }

    const institution = institutionDoc.data();
    const protectedTimes = institution.settings?.protectedTimes || [];

    const [assignmentsSnap, residentsSnap, attendingsSnap] = await Promise.all([
      institutionRef.collection('assignments')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date')
        .orderBy('timeSlot')
        .get(),
      institutionRef.collection('residents').get(),
      institutionRef.collection('attendings').get()
    ]);

    const residents = {};
    residentsSnap.forEach((doc) => {
      residents[doc.id] = { id: doc.id, ...doc.data() };
    });

    const attendings = {};
    attendingsSnap.forEach((doc) => {
      attendings[doc.id] = { id: doc.id, ...doc.data() };
    });

    const aliasMap = {};
    let aliasCounter = 1;

    const rows = [];
    const flaggedAssignments = [];
    const residentSet = new Set();
    const attendingSet = new Set();

    assignmentsSnap.forEach((doc) => {
      const assignment = doc.data();
      const dateObj = parseISO(assignment.date);
      const resident = assignment.residentId
        ? residents[assignment.residentId]
        : null;
      const attending = assignment.attendingId
        ? attendings[assignment.attendingId]
        : null;

      if (assignment.residentId) {
        residentSet.add(assignment.residentId);
      }
      if (assignment.attendingId) {
        attendingSet.add(assignment.attendingId);
      }

      let residentLabel = resident?.name || assignment.residentId || null;
      let attendingLabel = attending?.name || assignment.attendingId || null;

      if (anonymize && resident) {
        if (!aliasMap[resident.id]) {
          aliasMap[resident.id] = `Resident-${String(aliasCounter).padStart(3, '0')}`;
          aliasCounter += 1;
        }
        residentLabel = aliasMap[resident.id];
      }

      if (anonymize && attending) {
        attendingLabel = `Attending-${attending.id.slice(0, 6)}`;
      }

      const residentOnVacation = resident ? isResidentOnVacation(resident, dateObj) : false;
      const protectedTimeViolated = resident
        ? hasProtectedTime(resident, dateObj, assignment.timeSlot, protectedTimes)
        : false;
      let rotationMismatch = false;

      if (resident) {
        const monthStr = format(dateObj, 'yyyy-MM');
        const rotation = resident.rotationAssignments?.find(ra => ra.month === monthStr);
        if (assignment.rotationId) {
          rotationMismatch = !rotation || rotation.rotationId !== assignment.rotationId;
        }
      }

      const compliance = {
        residentOnVacation,
        protectedTimeViolated,
        rotationMismatch
      };

      if (residentOnVacation || protectedTimeViolated || rotationMismatch) {
        flaggedAssignments.push({ assignmentId: doc.id, compliance });
      }

      rows.push({
        assignmentId: doc.id,
        date: assignment.date,
        timeSlot: assignment.timeSlot,
        institutionId,
        residentId: assignment.residentId || null,
        resident: residentLabel,
        attendingId: assignment.attendingId || null,
        attending: attendingLabel,
        siteId: assignment.siteId || null,
        rotationId: assignment.rotationId || null,
        type: assignment.type || 'clinical',
        compliance
      });
    });

    const summary = {
      totalAssignments: rows.length,
      flaggedAssignments: flaggedAssignments.length,
      residentCount: residentSet.size,
      attendingCount: attendingSet.size,
      period: { startDate, endDate }
    };

    await institutionRef.collection('auditLogs').add({
      action: 'export_compliance',
      data: { startDate, endDate, anonymize },
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      generatedAt: new Date().toISOString(),
      anonymized: anonymize,
      summary,
      rows,
      flaggedAssignments
    };
  } catch (error) {
    console.error('Error exporting compliance data:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    if (error?.code && typeof error.code === 'string') {
      throw new functions.https.HttpsError(error.code, error.message);
    }

    throw new functions.https.HttpsError('internal', error.message || 'Unknown error');
  }
});

// ==================== 8. CONFLICT RESOLUTION ====================

exports.resolveScheduleConflicts = functions.firestore
  .document('institutions/{institutionId}/assignments/{assignmentId}')
  .onWrite(async (change, context) => {
    const { institutionId, assignmentId } = context.params;
    const institutionRef = db.collection('institutions').doc(institutionId);
    const conflictDocRef = institutionRef.collection('conflicts').doc(assignmentId);

    if (!change.after.exists) {
      await conflictDocRef.delete().catch(() => null);
      return null;
    }

    const assignment = change.after.data();

    if (!assignment || assignment.virtual) {
      await conflictDocRef.delete().catch(() => null);
      return null;
    }

    try {
      const [institutionSnap, residentSnap, attendingSnap] = await Promise.all([
        institutionRef.get(),
        assignment.residentId
          ? institutionRef.collection('residents').doc(assignment.residentId).get()
          : null,
        assignment.attendingId
          ? institutionRef.collection('attendings').doc(assignment.attendingId).get()
          : null
      ]);

      const conflictReasons = [];
      const dateObj = parseISO(assignment.date);
      const protectedTimes = institutionSnap.data()?.settings?.protectedTimes || [];

      if (assignment.residentId) {
        const overlappingSnap = await institutionRef.collection('assignments')
          .where('date', '==', assignment.date)
          .where('timeSlot', '==', assignment.timeSlot)
          .where('residentId', '==', assignment.residentId)
          .get();

        const duplicates = overlappingSnap.docs.filter(doc => doc.id !== assignmentId);
        if (duplicates.length > 0) {
          conflictReasons.push('resident_double_booked');
        }
      }

      let residentData = null;
      if (residentSnap?.exists) {
        residentData = { id: residentSnap.id, ...residentSnap.data() };
        if (isResidentOnVacation(residentData, dateObj)) {
          conflictReasons.push('resident_on_vacation');
        }
        if (hasProtectedTime(residentData, dateObj, assignment.timeSlot, protectedTimes)) {
          conflictReasons.push('protected_time_violation');
        }
      }

      if (assignment.rotationId && residentData) {
        const monthStr = format(dateObj, 'yyyy-MM');
        const rotation = residentData.rotationAssignments?.find(ra => ra.month === monthStr);
        if (!rotation || rotation.rotationId !== assignment.rotationId) {
          conflictReasons.push('rotation_mismatch');
        }
      }

      if (assignment.attendingId && attendingSnap?.exists) {
        const normalizedAttending = normalizeAttending({ id: attendingSnap.id, ...attendingSnap.data() });
        const dayOfWeek = dateObj.getDay();
        const slots = buildSlotsForMoment(
          normalizedAttending,
          assignment.date,
          dayOfWeek,
          assignment.timeSlot
        );

        let slotCapacity = 0;
        if (assignment.clinicId) {
          const matchedSlot = slots.find(slot =>
            slot.assignmentClinicId === assignment.clinicId || slot.clinicId === assignment.clinicId
          );
          slotCapacity = matchedSlot ? matchedSlot.capacity : 0;
        }

        if (slotCapacity === 0) {
          slotCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0);
        }

        const loadSnap = await institutionRef.collection('assignments')
          .where('date', '==', assignment.date)
          .where('timeSlot', '==', assignment.timeSlot)
          .where('attendingId', '==', assignment.attendingId)
          .get();

        const load = loadSnap.docs.length;
        if (slotCapacity > 0 && load > slotCapacity) {
          conflictReasons.push('attending_capacity_exceeded');
        }
      }

      if (conflictReasons.length > 0) {
        await conflictDocRef.set({
          assignmentId,
          detectedAt: admin.firestore.FieldValue.serverTimestamp(),
          reasons: conflictReasons,
          resolved: false
        }, { merge: true });

        if (assignment.status !== 'conflict') {
          await change.after.ref.set({
            status: 'conflict',
            conflictReasons
          }, { merge: true });
        }
      } else {
        await conflictDocRef.delete().catch(() => null);
        if (assignment.status === 'conflict') {
          await change.after.ref.set({
            status: 'confirmed',
            conflictReasons: admin.firestore.FieldValue.delete()
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error resolving schedule conflicts:', error);
    }

    return null;
  });

// ==================== 9. BACKUP & RESTORE ====================

exports.dailyBackup = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      const institutionsSnap = await db.collection('institutions').get();

      for (const institutionDoc of institutionsSnap.docs) {
        const institutionId = institutionDoc.id;
        const institutionRef = db.collection('institutions').doc(institutionId);

        // Use extracted backup module
        await createInstitutionBackup({
          db,
          institutionId,
          institutionRef,
          userId: 'system'
        });
      }
    } catch (error) {
      console.error('Error creating daily backup:', error);
    }

    return null;
  });

exports.restoreFromBackup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    institutionId,
    backupId,
    clearExisting = false,
    targets
  } = data || {};

  if (!institutionId || !backupId) {
    throw new functions.https.HttpsError('invalid-argument', 'institutionId and backupId are required');
  }

  const targetCollections = Array.isArray(targets) && targets.length > 0
    ? targets
    : ['assignments', 'residents', 'attendings', 'rules'];

  try {
    const institutionRef = db.collection('institutions').doc(institutionId);
    const [memberDoc, backupDoc] = await Promise.all([
      institutionRef.collection('members').doc(context.auth.uid).get(),
      institutionRef.collection('backups').doc(backupId).get()
    ]);

    if (!memberDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Membership required');
    }

    const memberRole = memberDoc.data().role;
    if (!['admin', 'program_admin'].includes(memberRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Administrator role required');
    }

    if (!backupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Backup snapshot not found');
    }

    // Use extracted backup module
    const result = await restoreFromBackup({
      db,
      institutionRef,
      backupId,
      targetCollections,
      clearExisting,
      userId: context.auth.uid
    });

    return {
      success: true,
      restoredCounts: result.restoredCounts,
      backupId: result.backupId,
      institutionId
    };
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.chatAssistant = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to use the assistant.');
  }

  const { institutionId, message, history = [], directAction = null } = data || {};
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  const hasDirectAction = directAction && typeof directAction.name === 'string';

  if (!institutionId || (!trimmedMessage && !hasDirectAction)) {
    throw new functions.https.HttpsError('invalid-argument', 'Please provide an institutionId and either a message or a direct action.');
  }

  const usageAllowed = await recordUsage({
    firestore: db,
    institutionId,
    userId: context.auth.uid,
    limit: Number.parseInt(process.env.CHATBOT_RATE_LIMIT || '20', 10)
  });
  if (!usageAllowed) {
    throw new functions.https.HttpsError('resource-exhausted', 'Please wait a moment before sending another request.');
  }

  const institutionRef = db.collection('institutions').doc(institutionId);
  const [institutionSnap, memberSnap] = await Promise.all([
    institutionRef.get(),
    institutionRef.collection('members').doc(context.auth.uid).get()
  ]);

  if (!institutionSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Institution not found.');
  }
  if (!memberSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'You are not a member of this institution.');
  }

  const allowedRoles = ['admin', 'program_admin', 'chief_resident', 'scheduler'];
  if (!allowedRoles.includes(memberSnap.data().role)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to use the assistant.');
  }

  const sanitizedHistory = Array.isArray(history)
    ? history
      .map(entry => ({
        role: entry?.role === 'assistant' ? 'assistant' : 'user',
        content: String(entry?.content || '').trim()
      }))
      .filter(entry => entry.content.length)
      .slice(-10)
    : [];

  const contextObj = {
    firestore: db,
    institutionId,
    institutionRef,
    institution: institutionSnap.data(),
    userId: context.auth.uid,
    protectedTimes: institutionSnap.data().settings?.protectedTimes || [],
    sites: institutionSnap.data().settings?.sites || [],
    residentCache: new Map(),
    attendingCache: new Map()
  };

  const executeAction = async (actionName, actionArgs, source = 'gemini') => {
    try {
      const result = await handleAction(actionName, actionArgs, contextObj);
      await institutionRef.collection('auditLogs').add({
        action: 'chatbot_action',
        data: { action: actionName, args: actionArgs, source },
        userId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return {
        reply: result.message,
        type: 'action',
        action: actionName,
        data: { ...(result.data || {}), source }
      };
    } catch (err) {
      console.error('Chat assistant error', err);
      throw new functions.https.HttpsError('internal', err.message || 'Unable to complete that action.');
    }
  };

  if (hasDirectAction) {
    const actionName = String(directAction.name);
    const allowedActions = new Set(Object.values(ACTIONS));
    if (!allowedActions.has(actionName)) {
      throw new functions.https.HttpsError('invalid-argument', 'The requested direct action is not supported.');
    }
    const actionArgs = typeof directAction.args === 'object' && directAction.args !== null
      ? directAction.args
      : {};
    return executeAction(actionName, actionArgs, 'direct');
  }

  let geminiResult;
  try {
    geminiResult = await callGemini({ history: sanitizedHistory, message: trimmedMessage });
  } catch (err) {
    console.error('Gemini call failed', err);
    throw new functions.https.HttpsError('internal', 'The assistant was unable to process your request.');
  }

  if (!geminiResult || !geminiResult.type) {
    throw new functions.https.HttpsError('internal', 'I did not understand that request.');
  }

  if (geminiResult.type === 'text') {
    await institutionRef.collection('auditLogs').add({
      action: 'chatbot_reply',
      data: { reply: geminiResult.text },
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { reply: geminiResult.text, type: 'text' };
  }

  const actionName = geminiResult.name;
  const actionArgs = geminiResult.args || {};
  return executeAction(actionName, actionArgs, 'gemini');
});

// Export all functions
module.exports = {
  // Auto-scheduling
  autoSchedule: exports.autoSchedule,

  // Notifications
  notifyScheduleChange: exports.notifyScheduleChange,

  // Validation
  validateAssignment: exports.validateAssignment,

  // Scheduled operations
  weeklyScheduleGeneration: exports.weeklyScheduleGeneration,
  dailyReminders: exports.dailyReminders,

  // PDF generation
  generateSchedulePDF: exports.generateSchedulePDF,

  // Analytics
  calculateAnalytics: exports.calculateAnalytics,

  // External integrations
  syncWithExternalSystem: exports.syncWithExternalSystem,

  // Compliance reporting
  exportComplianceData: exports.exportComplianceData,

  // Conflict management
  resolveScheduleConflicts: exports.resolveScheduleConflicts,

  // Backup and restore
  dailyBackup: exports.dailyBackup,
  restoreFromBackup: exports.restoreFromBackup,

  // Chat assistant
  chatAssistant: exports.chatAssistant
};
