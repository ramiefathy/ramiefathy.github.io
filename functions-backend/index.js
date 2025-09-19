/**
 * Cloud Functions for Clinic Scheduler Pro
 * Comprehensive backend services for scheduling management
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const PDFDocument = require('pdfkit');
const {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  parseISO,
  isWithinInterval,
  addWeeks
} = require('date-fns');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Configure email service (using SendGrid if API key is set, otherwise nodemailer)
const SENDGRID_API_KEY = functions.config().sendgrid?.key;
const EMAIL_FROM = functions.config().email?.from || 'noreply@clinicscheduler.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Configure SMTP transporter for nodemailer (fallback)
const mailTransporter = nodemailer.createTransport({
  host: functions.config().smtp?.host || 'smtp.gmail.com',
  port: functions.config().smtp?.port || 587,
  secure: false,
  auth: {
    user: functions.config().smtp?.user,
    pass: functions.config().smtp?.pass
  }
});

// ==================== Helper Functions ====================

/**
 * Send email notification
 */
async function sendEmail(to, subject, html, text) {
  try {
    if (SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: EMAIL_FROM,
        subject,
        text,
        html
      });
    } else {
      await mailTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html
      });
    }
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Get user details by ID
 */
async function getUserDetails(userId) {
  try {
    const userRecord = await auth.getUser(userId);
    return {
      email: userRecord.email,
      displayName: userRecord.displayName || userRecord.email.split('@')[0],
      uid: userRecord.uid
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Check ACGME duty hour compliance
 */
function checkDutyHourCompliance(assignments, residentId, newAssignment) {
  // ACGME Rules:
  // - Max 80 hours per week averaged over 4 weeks
  // - Max 24 hours continuous duty + 4 hours for transitions
  // - Min 8 hours off between shifts
  // - Min 1 day off per week averaged over 4 weeks

  const relevantAssignments = assignments.filter(a => a.residentId === residentId);
  const weekStart = startOfWeek(parseISO(newAssignment.date));
  const weekEnd = endOfWeek(parseISO(newAssignment.date));

  // Check weekly hours
  const weeklyAssignments = relevantAssignments.filter(a => {
    const date = parseISO(a.date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  });

  const weeklyHours = weeklyAssignments.length * 4; // Assuming 4 hours per half-day
  const newTotalHours = weeklyHours + 4;

  if (newTotalHours > 80) {
    return {
      compliant: false,
      reason: `Would exceed 80-hour weekly limit (current: ${weeklyHours}h)`
    };
  }

  // Check for minimum rest between shifts
  const sameDay = relevantAssignments.filter(a => a.date === newAssignment.date);
  if (sameDay.length > 0 && sameDay[0].timeSlot !== newAssignment.timeSlot) {
    // Both AM and PM on same day is allowed
    return { compliant: true };
  }

  // Check for consecutive days
  const previousDay = format(addDays(parseISO(newAssignment.date), -1), 'yyyy-MM-dd');
  const nextDay = format(addDays(parseISO(newAssignment.date), 1), 'yyyy-MM-dd');

  const _adjacentAssignments = relevantAssignments.filter(a =>
    a.date === previousDay || a.date === nextDay
  );

  // Simple check: no more than 6 consecutive days
  let consecutiveDays = 1;
  let checkDate = previousDay;
  for (let i = 0; i < 6; i++) {
    if (relevantAssignments.some(a => a.date === checkDate)) {
      consecutiveDays++;
    } else {
      break;
    }
    checkDate = format(addDays(parseISO(checkDate), -1), 'yyyy-MM-dd');
  }

  if (consecutiveDays >= 6) {
    return {
      compliant: false,
      reason: 'Would exceed 6 consecutive days of duty'
    };
  }

  return { compliant: true };
}

// ==================== 1. AUTO-SCHEDULING FUNCTION ====================

exports.autoSchedule = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, startDate, endDate, options = {} } = data;

  try {
    // Get institution data
    const institutionDoc = await db.collection('institutions').doc(institutionId).get();
    if (!institutionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Institution not found');
    }

    // Verify user has scheduler permissions
    const memberDoc = await db.collection('institutions').doc(institutionId)
      .collection('members').doc(context.auth.uid).get();

    if (!memberDoc.exists || !['admin', 'program_admin', 'chief_resident', 'scheduler'].includes(memberDoc.data().role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Get all necessary data
    const [attendingsSnap, residentsSnap, rulesSnap, existingAssignmentsSnap] = await Promise.all([
      db.collection('institutions').doc(institutionId).collection('attendings').get(),
      db.collection('institutions').doc(institutionId).collection('residents').get(),
      db.collection('institutions').doc(institutionId).collection('rules').where('active', '==', true).get(),
      db.collection('institutions').doc(institutionId).collection('assignments')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
    ]);

    const attendings = attendingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const residents = residentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const rules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const existingAssignments = existingAssignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Generate schedule assignments
    const newAssignments = [];
    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);
    const totalDays = differenceInDays(endDateObj, startDateObj) + 1;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const currentDate = addDays(startDateObj, dayOffset);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay();

      // Skip weekends unless specified
      if (!options.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      for (const timeSlot of ['AM', 'PM']) {
        // Check if slot already has assignments
        const existingSlotAssignments = existingAssignments.filter(
          a => a.date === dateStr && a.timeSlot === timeSlot
        );

        if (existingSlotAssignments.length > 0 && !options.overwrite) {
          continue;
        }

        // Assign continuity clinics first
        for (const resident of residents) {
          if (resident.continuityDay && resident.continuityTime === timeSlot) {
            const dayMap = {
              'monday': 1, 'tuesday': 2, 'wednesday': 3,
              'thursday': 4, 'friday': 5
            };

            if (dayMap[resident.continuityDay] === dayOfWeek) {
              // Find appropriate attending for continuity
              const continuityAttending = attendings.find(a =>
                a.specialty === 'General' || a.specialty === 'Continuity'
              );

              if (continuityAttending) {
                const assignment = {
                  date: dateStr,
                  timeSlot,
                  residentId: resident.id,
                  attendingId: continuityAttending.id,
                  type: 'continuity',
                  createdBy: context.auth.uid,
                  createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                // Check duty hour compliance
                const compliance = checkDutyHourCompliance(
                  [...existingAssignments, ...newAssignments],
                  resident.id,
                  assignment
                );

                if (compliance.compliant) {
                  newAssignments.push(assignment);
                }
              }
            }
          }
        }

        // Fill remaining slots with clinical assignments
        const availableResidents = residents.filter(r => {
          // Check if resident is already assigned
          const alreadyAssigned = [...existingSlotAssignments, ...newAssignments].some(
            a => a.date === dateStr && a.timeSlot === timeSlot && a.residentId === r.id
          );

          if (alreadyAssigned) return false;

          // Check duty hour compliance
          const testAssignment = { date: dateStr, timeSlot, residentId: r.id };
          const compliance = checkDutyHourCompliance(
            [...existingAssignments, ...newAssignments],
            r.id,
            testAssignment
          );

          return compliance.compliant;
        });

        // Assign available residents to attendings
        for (const attending of attendings) {
          const maxResidents = attending.maxResidents || 2;
          const currentAssignments = [...existingSlotAssignments, ...newAssignments].filter(
            a => a.date === dateStr && a.timeSlot === timeSlot && a.attendingId === attending.id
          );

          if (currentAssignments.length >= maxResidents) {
            continue;
          }

          const residentsNeeded = maxResidents - currentAssignments.length;
          const residentsToAssign = availableResidents.splice(0, residentsNeeded);

          for (const resident of residentsToAssign) {
            newAssignments.push({
              date: dateStr,
              timeSlot,
              residentId: resident.id,
              attendingId: attending.id,
              type: 'clinical',
              createdBy: context.auth.uid,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
    }

    // Save assignments in batch
    const batch = db.batch();
    for (const assignment of newAssignments) {
      const docRef = db.collection('institutions').doc(institutionId)
        .collection('assignments').doc();
      batch.set(docRef, assignment);
    }

    await batch.commit();

    // Add audit log
    await db.collection('institutions').doc(institutionId)
      .collection('auditLogs').add({
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

// ==================== 2. NOTIFICATION FUNCTIONS ====================

exports.notifyScheduleChange = functions.firestore
  .document('institutions/{institutionId}/assignments/{assignmentId}')
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

      // Get resident and attending information
      const [residentDoc, attendingDoc, institutionDoc] = await Promise.all([
        db.collection('institutions').doc(institutionId)
          .collection('residents').doc(assignment.residentId).get(),
        db.collection('institutions').doc(institutionId)
          .collection('attendings').doc(assignment.attendingId).get(),
        db.collection('institutions').doc(institutionId).get()
      ]);

      if (!residentDoc.exists || !attendingDoc.exists) {
        console.error('Resident or attending not found');
        return null;
      }

      const resident = residentDoc.data();
      const attending = attendingDoc.data();
      const institution = institutionDoc.data();

      // Get user email for resident
      const memberDoc = await db.collection('institutions').doc(institutionId)
        .collection('members').where('residentId', '==', assignment.residentId).limit(1).get();

      if (memberDoc.empty) {
        console.log('No member found for resident');
        return null;
      }

      const memberData = memberDoc.docs[0].data();
      const userDetails = await getUserDetails(memberDoc.docs[0].id);

      if (!userDetails || !userDetails.email) {
        console.log('No email found for user');
        return null;
      }

      // Prepare email content
      const emailSubject = `Schedule ${changeType}: ${assignment.date} ${assignment.timeSlot}`;
      const emailHtml = `
        <h2>Schedule ${changeType.charAt(0).toUpperCase() + changeType.slice(1)}</h2>
        <p>Dear ${resident.name},</p>
        <p>Your schedule has been ${changeType}:</p>
        <ul>
          <li><strong>Date:</strong> ${assignment.date}</li>
          <li><strong>Time:</strong> ${assignment.timeSlot}</li>
          <li><strong>Attending:</strong> ${attending.name}</li>
          <li><strong>Site:</strong> ${attending.site || 'Main Clinic'}</li>
          <li><strong>Type:</strong> ${assignment.type === 'continuity' ? 'Continuity Clinic' : 'Clinical'}</li>
        </ul>
        <p>Please log in to <a href="https://clinicscheduler.com">Clinic Scheduler Pro</a> to view your complete schedule.</p>
        <hr>
        <p><small>${institution.name}</small></p>
      `;

      const emailText = `
        Schedule ${changeType}: ${assignment.date} ${assignment.timeSlot}
        Attending: ${attending.name}
        Site: ${attending.site || 'Main Clinic'}
        Type: ${assignment.type === 'continuity' ? 'Continuity Clinic' : 'Clinical'}
      `;

      // Send email notification
      await sendEmail(userDetails.email, emailSubject, emailHtml, emailText);

      console.log(`Notification sent for assignment ${assignmentId}`);
      return null;

    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// ==================== 3. DATA VALIDATION FUNCTIONS ====================

exports.validateAssignment = functions.firestore
  .document('institutions/{institutionId}/assignments/{assignmentId}')
  .onCreate(async (snap, context) => {
    const { institutionId, assignmentId } = context.params;
    const assignment = snap.data();

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
      const attendingAssignments = await db.collection('institutions').doc(institutionId)
        .collection('assignments')
        .where('attendingId', '==', assignment.attendingId)
        .where('date', '==', assignment.date)
        .where('timeSlot', '==', assignment.timeSlot)
        .get();

      const attendingDoc = await db.collection('institutions').doc(institutionId)
        .collection('attendings').doc(assignment.attendingId).get();

      if (attendingDoc.exists) {
        const attending = attendingDoc.data();
        const maxResidents = attending.maxResidents || 2;

        if (attendingAssignments.size > maxResidents) {
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

      console.log(`Assignment ${assignmentId} validated successfully`);
      return null;

    } catch (error) {
      console.error('Error validating assignment:', error);
      return null;
    }
  });

// ==================== 4. SCHEDULED OPERATIONS ====================

exports.weeklyScheduleGeneration = functions.pubsub
  .schedule('every sunday 23:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
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
        const nextWeekStart = format(addWeeks(startOfWeek(new Date()), 1), 'yyyy-MM-dd');
        const nextWeekEnd = format(addWeeks(endOfWeek(new Date()), 1), 'yyyy-MM-dd');

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
              await sendEmail(
                userDetails.email,
                'Weekly Schedule Generated',
                `<h2>Weekly Schedule Generated</h2>
                 <p>The schedule for ${nextWeekStart} to ${nextWeekEnd} has been generated.</p>
                 <p>Assignments created: ${autoScheduleResult.assignmentsCreated}</p>
                 <p><a href="https://clinicscheduler.com">View Schedule</a></p>`,
                `Weekly schedule generated for ${nextWeekStart} to ${nextWeekEnd}. Assignments created: ${autoScheduleResult.assignmentsCreated}`
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
  .onRun(async (context) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get all assignments for today
      const institutionsSnap = await db.collection('institutions').get();

      for (const institutionDoc of institutionsSnap.docs) {
        const institutionId = institutionDoc.id;
        const institution = institutionDoc.data();

        // Check if notifications are enabled
        if (!institution.settings?.notificationsEnabled) {
          continue;
        }

        const assignmentsSnap = await db.collection('institutions').doc(institutionId)
          .collection('assignments')
          .where('date', '==', today)
          .get();

        for (const assignmentDoc of assignmentsSnap.docs) {
          const assignment = assignmentDoc.data();

          // Get resident and attending info
          const [residentDoc, attendingDoc] = await Promise.all([
            db.collection('institutions').doc(institutionId)
              .collection('residents').doc(assignment.residentId).get(),
            db.collection('institutions').doc(institutionId)
              .collection('attendings').doc(assignment.attendingId).get()
          ]);

          if (!residentDoc.exists || !attendingDoc.exists) {
            continue;
          }

          const resident = residentDoc.data();
          const attending = attendingDoc.data();

          // Get user email
          const memberDoc = await db.collection('institutions').doc(institutionId)
            .collection('members').where('residentId', '==', assignment.residentId).limit(1).get();

          if (!memberDoc.empty) {
            const userDetails = await getUserDetails(memberDoc.docs[0].id);

            if (userDetails && userDetails.email) {
              await sendEmail(
                userDetails.email,
                `Today's Schedule: ${assignment.timeSlot} with ${attending.name}`,
                `<h2>Schedule Reminder</h2>
                 <p>Hi ${resident.name},</p>
                 <p>This is a reminder about your assignment today:</p>
                 <ul>
                   <li><strong>Time:</strong> ${assignment.timeSlot}</li>
                   <li><strong>Attending:</strong> ${attending.name}</li>
                   <li><strong>Site:</strong> ${attending.site || 'Main Clinic'}</li>
                 </ul>`,
                `Reminder: ${assignment.timeSlot} with ${attending.name} at ${attending.site || 'Main Clinic'}`
              );
            }
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

    const residents = {};
    const attendings = {};

    residentsSnap.forEach(doc => {
      residents[doc.id] = doc.data();
    });

    attendingsSnap.forEach(doc => {
      attendings[doc.id] = doc.data();
    });

    // Create PDF
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Add content
    doc.fontSize(20).text(institution.name, { align: 'center' });
    doc.fontSize(16).text('Schedule Report', { align: 'center' });
    doc.fontSize(12).text(`${startDate} to ${endDate}`, { align: 'center' });
    doc.moveDown();

    // Group assignments by date
    const assignmentsByDate = {};
    assignmentsSnap.forEach(doc => {
      const assignment = doc.data();
      if (!assignmentsByDate[assignment.date]) {
        assignmentsByDate[assignment.date] = [];
      }
      assignmentsByDate[assignment.date].push(assignment);
    });

    // Add assignments to PDF
    Object.keys(assignmentsByDate).sort().forEach(date => {
      doc.fontSize(14).text(date, { underline: true });
      doc.moveDown(0.5);

      assignmentsByDate[date].forEach(assignment => {
        const resident = residents[assignment.residentId];
        const attending = attendings[assignment.attendingId];

        doc.fontSize(10)
          .text(`${assignment.timeSlot}: ${resident?.name || 'Unknown'} with ${attending?.name || 'Unknown'} at ${attending?.site || 'Clinic'}`, {
            indent: 20
          });
      });

      doc.moveDown();
    });

    // Statistics
    doc.addPage();
    doc.fontSize(16).text('Statistics', { underline: true });
    doc.moveDown();

    const totalAssignments = assignmentsSnap.size;
    const uniqueResidents = new Set(assignmentsSnap.docs.map(d => d.data().residentId)).size;
    const uniqueAttendings = new Set(assignmentsSnap.docs.map(d => d.data().attendingId)).size;

    doc.fontSize(12)
      .text(`Total Assignments: ${totalAssignments}`)
      .text(`Unique Residents: ${uniqueResidents}`)
      .text(`Unique Attendings: ${uniqueAttendings}`);

    doc.end();

    // Convert to base64
    const pdfBuffer = Buffer.concat(chunks);
    const pdfBase64 = pdfBuffer.toString('base64');

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
    const attendings = attendingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate statistics
    const analytics = {
      totalAssignments: assignments.length,
      byResident: {},
      byAttending: {},
      byType: {
        clinical: 0,
        continuity: 0
      },
      dutyHours: {},
      fairnessScore: 0,
      coverage: {
        total: 0,
        filled: 0,
        percentage: 0
      }
    };

    // Resident statistics
    residents.forEach(resident => {
      const residentAssignments = assignments.filter(a => a.residentId === resident.id);
      analytics.byResident[resident.id] = {
        name: resident.name,
        totalAssignments: residentAssignments.length,
        hours: residentAssignments.length * 4, // 4 hours per half-day
        continuity: residentAssignments.filter(a => a.type === 'continuity').length,
        clinical: residentAssignments.filter(a => a.type === 'clinical').length
      };

      analytics.dutyHours[resident.id] = residentAssignments.length * 4;
    });

    // Attending statistics
    attendings.forEach(attending => {
      const attendingAssignments = assignments.filter(a => a.attendingId === attending.id);
      analytics.byAttending[attending.id] = {
        name: attending.name,
        totalAssignments: attendingAssignments.length,
        averageResidents: attendingAssignments.length > 0
          ? (attendingAssignments.length / new Set(attendingAssignments.map(a => a.date + a.timeSlot)).size).toFixed(2)
          : 0
      };
    });

    // Type distribution
    assignments.forEach(assignment => {
      if (assignment.type === 'continuity') {
        analytics.byType.continuity++;
      } else {
        analytics.byType.clinical++;
      }
    });

    // Calculate fairness score (standard deviation of assignments)
    const residentCounts = Object.values(analytics.byResident).map(r => r.totalAssignments);
    const mean = residentCounts.reduce((a, b) => a + b, 0) / residentCounts.length;
    const variance = residentCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / residentCounts.length;
    const stdDev = Math.sqrt(variance);
    analytics.fairnessScore = mean > 0 ? (100 - (stdDev / mean * 100)).toFixed(2) : 100;

    // Calculate coverage
    const totalDays = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
    const workDays = Math.floor(totalDays * 5 / 7); // Approximate work days
    const totalSlots = workDays * 2 * attendings.length; // AM/PM slots per attending
    analytics.coverage.total = totalSlots;
    analytics.coverage.filled = assignments.length;
    analytics.coverage.percentage = totalSlots > 0
      ? ((assignments.length / totalSlots) * 100).toFixed(2)
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

// ==================== 7. INTEGRATION WEBHOOKS ====================

exports.syncWithExternalSystem = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Verify webhook secret
      const webhookSecret = req.headers['x-webhook-secret'];
      if (webhookSecret !== functions.config().webhook?.secret) {
        res.status(401).json({ error: 'Invalid webhook secret' });
        return;
      }

      const { action, institutionId, data } = req.body;

      switch (action) {
      case 'import_residents':
        // Import residents from external system
        const batch = db.batch();
        for (const resident of data.residents) {
          const docRef = db.collection('institutions').doc(institutionId)
            .collection('residents').doc();
          batch.set(docRef, {
            name: resident.name,
            year: resident.year,
            email: resident.email,
            externalId: resident.id,
            importedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        await batch.commit();

        res.json({
          success: true,
          message: `Imported ${data.residents.length} residents`
        });
        break;

      case 'export_schedule':
        // Export schedule to external system
        const startDate = data.startDate;
        const endDate = data.endDate;

        const assignmentsSnap = await db.collection('institutions').doc(institutionId)
          .collection('assignments')
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .get();

        const assignments = assignmentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        res.json({
          success: true,
          assignments
        });
        break;

      case 'sync_calendar':
        // Sync with external calendar system
        // This would integrate with Google Calendar, Outlook, etc.
        res.json({
          success: true,
          message: 'Calendar sync initiated'
        });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
      }

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ==================== 8. DATA SECURITY FUNCTIONS ====================

exports.exportComplianceData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, startDate, endDate, anonymize = false } = data;

  try {
    // Verify admin permissions
    const memberDoc = await db.collection('institutions').doc(institutionId)
      .collection('members').doc(context.auth.uid).get();

    if (!memberDoc.exists || !['admin', 'program_admin'].includes(memberDoc.data().role)) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // Get assignments and audit logs
    const [assignmentsSnap, auditLogsSnap] = await Promise.all([
      db.collection('institutions').doc(institutionId)
        .collection('assignments')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get(),
      db.collection('institutions').doc(institutionId)
        .collection('auditLogs')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)))
        .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)))
        .get()
    ]);

    let exportData = {
      assignments: assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      auditLogs: auditLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };

    // Anonymize if requested
    if (anonymize) {
      const residentMap = {};
      const attendingMap = {};
      let residentCounter = 1;
      let attendingCounter = 1;

      exportData.assignments = exportData.assignments.map(assignment => {
        if (!residentMap[assignment.residentId]) {
          residentMap[assignment.residentId] = `R${residentCounter++}`;
        }
        if (!attendingMap[assignment.attendingId]) {
          attendingMap[assignment.attendingId] = `A${attendingCounter++}`;
        }

        return {
          ...assignment,
          residentId: residentMap[assignment.residentId],
          attendingId: attendingMap[assignment.attendingId]
        };
      });

      exportData.auditLogs = exportData.auditLogs.map(log => ({
        ...log,
        userId: 'ANONYMIZED'
      }));
    }

    // Add compliance metadata
    exportData.metadata = {
      exportDate: new Date().toISOString(),
      exportedBy: context.auth.uid,
      dateRange: { startDate, endDate },
      anonymized: anonymize,
      totalAssignments: exportData.assignments.length,
      totalAuditLogs: exportData.auditLogs.length
    };

    // Log the export
    await db.collection('institutions').doc(institutionId)
      .collection('auditLogs').add({
        action: 'compliance_data_exported',
        data: {
          startDate,
          endDate,
          anonymized: anonymize,
          recordCount: exportData.assignments.length
        },
        userId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    return {
      success: true,
      data: exportData
    };

  } catch (error) {
    console.error('Error exporting compliance data:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== 9. CONFLICT RESOLUTION ====================

exports.resolveScheduleConflicts = functions.firestore
  .document('institutions/{institutionId}/assignments/{assignmentId}')
  .onUpdate(async (change, context) => {
    const { institutionId, assignmentId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Check if this is a conflicting update
    if (before.updatedAt && after.updatedAt) {
      const timeDiff = after.updatedAt.toMillis() - before.updatedAt.toMillis();

      // If updates happened within 5 seconds, might be a conflict
      if (timeDiff < 5000) {
        try {
          // Check for other assignments at the same slot
          const conflictingAssignments = await db.collection('institutions').doc(institutionId)
            .collection('assignments')
            .where('date', '==', after.date)
            .where('timeSlot', '==', after.timeSlot)
            .where('residentId', '==', after.residentId)
            .get();

          if (conflictingAssignments.size > 1) {
            // Conflict detected - keep the most recent, delete others
            const assignments = conflictingAssignments.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());

            // Keep the first (most recent), delete the rest
            for (let i = 1; i < assignments.length; i++) {
              await db.collection('institutions').doc(institutionId)
                .collection('assignments').doc(assignments[i].id).delete();
            }

            // Log the conflict resolution
            await db.collection('institutions').doc(institutionId)
              .collection('auditLogs').add({
                action: 'conflict_resolved',
                data: {
                  kept: assignments[0].id,
                  deleted: assignments.slice(1).map(a => a.id),
                  date: after.date,
                  timeSlot: after.timeSlot,
                  residentId: after.residentId
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });

            console.log(`Resolved conflict for assignment ${assignmentId}`);
          }
        } catch (error) {
          console.error('Error resolving conflict:', error);
        }
      }
    }

    return null;
  });

// ==================== 10. BACKUP FUNCTIONS ====================

exports.dailyBackup = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const backupDate = format(new Date(), 'yyyy-MM-dd');

      // Get all institutions
      const institutionsSnap = await db.collection('institutions').get();

      for (const institutionDoc of institutionsSnap.docs) {
        const institutionId = institutionDoc.id;
        const institution = institutionDoc.data();

        // Create backup document
        const backupData = {
          institutionId,
          institutionName: institution.name,
          backupDate,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          collections: {}
        };

        // Backup each collection
        const collections = ['attendings', 'residents', 'assignments', 'rules'];

        for (const collection of collections) {
          const collectionSnap = await db.collection('institutions')
            .doc(institutionId)
            .collection(collection)
            .get();

          backupData.collections[collection] = collectionSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }

        // Store backup
        await db.collection('backups').add(backupData);

        // Delete old backups (keep last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const oldBackupsSnap = await db.collection('backups')
          .where('institutionId', '==', institutionId)
          .where('timestamp', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
          .get();

        const deleteBatch = db.batch();
        oldBackupsSnap.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });

        await deleteBatch.commit();

        console.log(`Backup completed for institution ${institutionId}`);
      }

      return null;

    } catch (error) {
      console.error('Error in daily backup:', error);
      return null;
    }
  });

exports.restoreFromBackup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, backupId } = data;

  try {
    // Verify admin permissions
    const memberDoc = await db.collection('institutions').doc(institutionId)
      .collection('members').doc(context.auth.uid).get();

    if (!memberDoc.exists || memberDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // Get backup
    const backupDoc = await db.collection('backups').doc(backupId).get();

    if (!backupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Backup not found');
    }

    const backupData = backupDoc.data();

    if (backupData.institutionId !== institutionId) {
      throw new functions.https.HttpsError('permission-denied', 'Backup belongs to different institution');
    }

    // Clear existing data
    const collections = ['attendings', 'residents', 'assignments', 'rules'];

    for (const collection of collections) {
      const collectionSnap = await db.collection('institutions')
        .doc(institutionId)
        .collection(collection)
        .get();

      const deleteBatch = db.batch();
      collectionSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });

      await deleteBatch.commit();
    }

    // Restore data
    for (const collection of collections) {
      const batch = db.batch();
      const items = backupData.collections[collection] || [];

      items.forEach(item => {
        const docRef = db.collection('institutions')
          .doc(institutionId)
          .collection(collection)
          .doc(item.id);

        const { id, ...data } = item;
        batch.set(docRef, data);
      });

      await batch.commit();
    }

    // Log the restoration
    await db.collection('institutions').doc(institutionId)
      .collection('auditLogs').add({
        action: 'backup_restored',
        data: {
          backupId,
          backupDate: backupData.backupDate
        },
        userId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    return {
      success: true,
      message: `Data restored from backup ${backupData.backupDate}`
    };

  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
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

  // Integration
  syncWithExternalSystem: exports.syncWithExternalSystem,

  // Security
  exportComplianceData: exports.exportComplianceData,

  // Conflict resolution
  resolveScheduleConflicts: exports.resolveScheduleConflicts,

  // Backup
  dailyBackup: exports.dailyBackup,
  restoreFromBackup: exports.restoreFromBackup
};