/**
 * Cloud Functions for Clinic Scheduler Pro
 * Comprehensive backend services for scheduling management
 * FIXED VERSION: Compatible with new rotation-based, multi-site data model
 */

// Use 1st gen API surface per Firebase guidance for Node.js 20 runtime
const functions = require('firebase-functions/v1');
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
const {
  TIME_SLOTS,
  normalizeAttending,
  makeSlotKey,
  makeGenericSlotKey,
  buildSlotsForMoment,
  getWeekKey
} = require('./lib/attending-utils.js');
const { callGemini } = require('./chatbot/gemini');
const { handleAction } = require('./chatbot/action-handlers');
const { recordUsage } = require('./chatbot/undo-store');

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
    } else if (functions.config().smtp?.user) {
      await mailTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html
      });
    } else {
      console.log('Email service not configured. Skipping email to:', to);
      return;
    }
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - allow functions to continue even if email fails
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
 * Check if resident is on vacation for a given date
 */
function isResidentOnVacation(resident, date) {
  if (!resident.vacationWeeks || resident.vacationWeeks.length === 0) {
    return false;
  }

  return resident.vacationWeeks.some(vw => {
    const vacationStart = parseISO(vw);
    const vacationEnd = addDays(vacationStart, 6);
    return isWithinInterval(date, { start: vacationStart, end: vacationEnd });
  });
}

/**
 * Check if resident has protected time
 */
function hasProtectedTime(resident, date, timeSlot, protectedTimes) {
  const dayOfWeek = date.getDay();
  const residentPGY = resident.pgyStatus || 'PGY-1';

  return protectedTimes.some(pt =>
    pt.dayOfWeek === dayOfWeek &&
    pt.timeSlot === timeSlot &&
    (pt.appliesTo === 'all' || pt.appliesTo === residentPGY)
  );
}

// Serialization helpers for backup/restore flows
function isDocumentReference(value) {
  return !!value && typeof value === 'object' && value.constructor?.name === 'DocumentReference';
}

function serializeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return { __datatype: 'timestamp', value: value.toMillis() };
  }

  if (value instanceof admin.firestore.GeoPoint) {
    return {
      __datatype: 'geopoint',
      latitude: value.latitude,
      longitude: value.longitude
    };
  }

  if (isDocumentReference(value)) {
    return {
      __datatype: 'document_reference',
      path: value.path
    };
  }

  if (Array.isArray(value)) {
    return value.map(item => serializeValue(item));
  }

  if (typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val);
    }
    return result;
  }

  return value;
}

function deserializeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => deserializeValue(item));
  }

  if (typeof value === 'object') {
    if (value.__datatype === 'timestamp') {
      return admin.firestore.Timestamp.fromMillis(value.value);
    }
    if (value.__datatype === 'geopoint') {
      return new admin.firestore.GeoPoint(value.latitude, value.longitude);
    }
    if (value.__datatype === 'document_reference') {
      return db.doc(value.path);
    }

    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deserializeValue(val);
    }
    return result;
  }

  return value;
}

function serializeDocument(doc) {
  return {
    id: doc.id,
    data: serializeValue(doc.data())
  };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function describeAssignmentType(type, options = {}) {
  const variant = options.variant || 'default';
  if (type === 'continuity') {
    return variant === 'short' ? 'Continuity' : 'Continuity Clinic';
  }
  if (type === 'protected') {
    return variant === 'short' ? 'Protected' : 'Protected Time';
  }
  return 'Clinical';
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
  const weekStart = startOfWeek(parseISO(newAssignment.date), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parseISO(newAssignment.date), { weekStartsOn: 0 });

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
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { institutionId, startDate, endDate, options = {} } = data;

  try {
    const institutionRef = db.collection('institutions').doc(institutionId);
    const institutionDoc = await institutionRef.get();
    if (!institutionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Institution not found');
    }

    const institution = institutionDoc.data();
    const protectedTimes = institution.settings?.protectedTimes || [];
    const sites = institution.settings?.sites || [];

    const memberDoc = await institutionRef
      .collection('members')
      .doc(context.auth.uid)
      .get();

    const allowedRoles = ['admin', 'program_admin', 'chief_resident', 'scheduler'];
    if (!memberDoc.exists || !allowedRoles.includes(memberDoc.data().role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

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
    const attendings = attendingsSnap.docs.map(doc => normalizeAttending({ id: doc.id, ...doc.data() }, sites));
    const residents = residentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const existingAssignments = existingAssignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);

    if (Number.isNaN(startDateObj) || Number.isNaN(endDateObj)) {
      throw new functions.https.HttpsError('invalid-argument', 'Start and end dates must be valid ISO strings');
    }

    if (endDateObj < startDateObj) {
      throw new functions.https.HttpsError('invalid-argument', 'End date must be on or after start date');
    }

    let maxPairingsPerWeek = 2;
    for (const rule of rules) {
      const configured = (rule?.config && rule.config.maxPairingsPerWeek) || rule?.maxPairingsPerWeek;
      const parsed = Number(configured);
      if (Number.isFinite(parsed) && parsed > 0) {
        maxPairingsPerWeek = parsed;
        break;
      }
    }

    const existingAssignmentsBySpecificSlot = new Map();
    const existingAssignmentsByGenericSlot = new Map();
    const assignmentsByResidentSlot = new Map();
    const residentWeekAssignmentCounts = new Map();
    const pairingCounts = new Map();

    const pushToMap = (map, key, value) => {
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(value);
    };

    existingAssignments.forEach(assignment => {
      if (!assignment.date || !assignment.timeSlot) {
        return;
      }

      const specificKey = makeSlotKey({
        date: assignment.date,
        timeSlot: assignment.timeSlot,
        attendingId: assignment.attendingId,
        clinicId: assignment.clinicId || 'noClinic'
      });
      pushToMap(existingAssignmentsBySpecificSlot, specificKey, assignment);

      const genericKey = makeGenericSlotKey({
        date: assignment.date,
        timeSlot: assignment.timeSlot,
        attendingId: assignment.attendingId
      });
      pushToMap(existingAssignmentsByGenericSlot, genericKey, assignment);

      if (assignment.residentId) {
        const residentSlotKey = `${assignment.residentId}|${assignment.date}|${assignment.timeSlot}`;
        pushToMap(assignmentsByResidentSlot, residentSlotKey, assignment);

        const weekKey = getWeekKey(assignment.date);
        const residentWeekKey = `${assignment.residentId}|${weekKey}`;
        residentWeekAssignmentCounts.set(
          residentWeekKey,
          (residentWeekAssignmentCounts.get(residentWeekKey) || 0) + 1
        );

        if (assignment.attendingId) {
          const pairingKey = `${assignment.residentId}|${weekKey}|${assignment.attendingId}`;
          pairingCounts.set(pairingKey, (pairingCounts.get(pairingKey) || 0) + 1);
        }
      }
    });

    const totalDays = differenceInDays(endDateObj, startDateObj) + 1;
    const newAssignments = [];
    const newAssignmentsBySlot = new Map();

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const currentDate = addDays(startDateObj, dayOffset);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay();
      const monthStr = format(currentDate, 'yyyy-MM');

      if (!options.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      for (const timeSlot of TIME_SLOTS) {
        for (const resident of residents) {
          if (!resident.continuityDay || !resident.continuityTime || !resident.continuitySiteId) {
            continue;
          }

          if (resident.continuityTime !== timeSlot) {
            continue;
          }

          const dayMap = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
          };

          const targetDay = dayMap[resident.continuityDay?.toLowerCase?.()];
          if (targetDay !== dayOfWeek) {
            continue;
          }

          if (isResidentOnVacation(resident, currentDate)) {
            continue;
          }

          if (hasProtectedTime(resident, currentDate, timeSlot, protectedTimes)) {
            continue;
          }

          const residentSlotKey = `${resident.id}|${dateStr}|${timeSlot}`;
          if (assignmentsByResidentSlot.has(residentSlotKey)) {
            continue;
          }

          const continuityAssignment = {
            date: dateStr,
            timeSlot,
            residentId: resident.id,
            attendingId: null,
            type: 'continuity',
            siteId: resident.continuitySiteId,
            createdBy: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          const compliance = checkDutyHourCompliance(
            [...existingAssignments, ...newAssignments],
            resident.id,
            continuityAssignment
          );

          if (compliance.compliant) {
            newAssignments.push(continuityAssignment);
            pushToMap(assignmentsByResidentSlot, residentSlotKey, continuityAssignment);

            const weekKey = getWeekKey(dateStr);
            const residentWeekKey = `${resident.id}|${weekKey}`;
            residentWeekAssignmentCounts.set(
              residentWeekKey,
              (residentWeekAssignmentCounts.get(residentWeekKey) || 0) + 1
            );
          }
        }

        const slots = [];
        attendings.forEach(attending => {
          const momentSlots = buildSlotsForMoment(attending, dateStr, dayOfWeek, timeSlot);
          if (momentSlots.length) {
            slots.push(...momentSlots);
          }
        });

        if (!slots.length) {
          continue;
        }

        for (const slot of slots) {
          const attending = attendings.find(a => a.id === slot.attendingId);
          if (!attending) {
            continue;
          }

          const specificKey = makeSlotKey({
            date: slot.date,
            timeSlot: slot.timeSlot,
            attendingId: slot.attendingId,
            clinicId: slot.assignmentClinicId || slot.clinicId || 'noClinic'
          });

          let existingForSlot = existingAssignmentsBySpecificSlot.get(specificKey) || [];
          if (!existingForSlot.length) {
            const genericKey = makeGenericSlotKey({
              date: slot.date,
              timeSlot: slot.timeSlot,
              attendingId: slot.attendingId
            });
            existingForSlot = existingAssignmentsByGenericSlot.get(genericKey) || [];
          }

          if (!options.overwrite && existingForSlot.length >= slot.capacity) {
            continue;
          }

          const newForSlot = newAssignmentsBySlot.get(slot.key) || [];
          const baselineExisting = options.overwrite ? 0 : existingForSlot.length;
          let capacityRemaining = slot.capacity - baselineExisting - newForSlot.length;
          if (capacityRemaining <= 0) {
            continue;
          }

          const candidates = [];

          for (const resident of residents) {
            if (isResidentOnVacation(resident, currentDate)) {
              continue;
            }

            if (hasProtectedTime(resident, currentDate, timeSlot, protectedTimes)) {
              continue;
            }

            const residentSlotKey = `${resident.id}|${dateStr}|${timeSlot}`;
            if (assignmentsByResidentSlot.has(residentSlotKey)) {
              continue;
            }

            const rotation = resident.rotationAssignments?.find(ra => ra.month === monthStr);
            if (!rotation) {
              continue;
            }

            const supportsRotation = Array.isArray(attending.rotationIds)
              ? attending.rotationIds.includes(rotation.rotationId)
              : false;

            const siteMatch = slot.siteId && rotation.primarySiteId
              ? slot.siteId === rotation.primarySiteId
              : false;

            if (!supportsRotation && !siteMatch) {
              continue;
            }

            const compliance = checkDutyHourCompliance(
              [...existingAssignments, ...newAssignments],
              resident.id,
              { date: dateStr, timeSlot }
            );
            if (!compliance.compliant) {
              continue;
            }

            const weekKey = getWeekKey(dateStr);
            const pairingKey = `${resident.id}|${weekKey}|${attending.id}`;
            if (pairingCounts.get(pairingKey) >= maxPairingsPerWeek) {
              continue;
            }

            const residentWeekKey = `${resident.id}|${weekKey}`;
            const weeklyCount = residentWeekAssignmentCounts.get(residentWeekKey) || 0;

            candidates.push({
              resident,
              supportsRotation,
              siteMatch,
              weeklyCount,
              pairingCount: pairingCounts.get(pairingKey) || 0
            });
          }

          if (!candidates.length) {
            continue;
          }

          candidates.sort((a, b) => {
            if (b.siteMatch !== a.siteMatch) return b.siteMatch - a.siteMatch;
            if (b.supportsRotation !== a.supportsRotation) return b.supportsRotation - a.supportsRotation;
            if (a.weeklyCount !== b.weeklyCount) return a.weeklyCount - b.weeklyCount;
            return a.pairingCount - b.pairingCount;
          });

          for (const candidate of candidates) {
            if (capacityRemaining <= 0) {
              break;
            }

            const resident = candidate.resident;

            const assignment = {
              date: dateStr,
              timeSlot,
              residentId: resident.id,
              attendingId: slot.attendingId,
              type: 'clinical',
              siteId: slot.siteId || '',
              clinicId: slot.clinicId,
              rotationId: resident.rotationAssignments?.find(ra => ra.month === monthStr)?.rotationId,
              createdBy: context.auth.uid,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            newAssignments.push(assignment);

            if (!newAssignmentsBySlot.has(slot.key)) {
              newAssignmentsBySlot.set(slot.key, []);
            }
            newAssignmentsBySlot.get(slot.key).push(assignment);

            const residentSlotKey = `${resident.id}|${dateStr}|${timeSlot}`;
            pushToMap(assignmentsByResidentSlot, residentSlotKey, assignment);

            const weekKey = getWeekKey(dateStr);
            const residentWeekKey = `${resident.id}|${weekKey}`;
            residentWeekAssignmentCounts.set(
              residentWeekKey,
              (residentWeekAssignmentCounts.get(residentWeekKey) || 0) + 1
            );

            const pairingKey = `${resident.id}|${weekKey}|${slot.attendingId}`;
            pairingCounts.set(pairingKey, (pairingCounts.get(pairingKey) || 0) + 1);

            capacityRemaining -= 1;
          }
        }
      }
    }

    const batch = db.batch();
    for (const assignment of newAssignments) {
      const docRef = institutionRef.collection('assignments').doc();
      batch.set(docRef, assignment);
    }

    await batch.commit();

    await institutionRef.collection('auditLogs').add({
      action: 'auto_schedule',
      data: {
        startDate,
        endDate,
        assignmentsCreated: newAssignments.length,
        options,
        maxPairingsPerWeek
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

      const userDetails = await getUserDetails(memberDoc.docs[0].id);

      if (!userDetails || !userDetails.email) {
        console.log('No email found for user');
        return null;
      }

      // Check if notifications are enabled
      if (!institution.settings?.notificationsEnabled) {
        console.log('Notifications disabled for institution');
        return null;
      }

      // Prepare email content
      const assignmentType = describeAssignmentType(assignment.type);

      const formattedChange = changeType.charAt(0).toUpperCase() + changeType.slice(1);
      const emailSubject = `Schedule ${formattedChange}: ${assignment.date} ${assignment.timeSlot}`;

      const emailHtmlParts = [
        `<h2>Schedule ${formattedChange}</h2>`,
        `<p>Dear ${resident.name || 'Resident'},</p>`,
        `<p>Your schedule has been ${changeType}:</p>`,
        '<ul>',
        `<li><strong>Date:</strong> ${assignment.date}</li>`,
        `<li><strong>Time:</strong> ${assignment.timeSlot}</li>`,
        `<li><strong>Type:</strong> ${assignmentType}</li>`
      ];

      if (attending) {
        emailHtmlParts.push(`<li><strong>Attending:</strong> ${attending.name}</li>`);
      }

      emailHtmlParts.push(`<li><strong>Site:</strong> ${siteName}</li>`);

      if (siteAddress) {
        emailHtmlParts.push(`<li><strong>Location:</strong> ${siteAddress}</li>`);
      }

      emailHtmlParts.push('</ul>');
      emailHtmlParts.push(
        '<p>Please log in to <a href="https://clinicscheduler.com">Clinic Scheduler Pro</a>',
        'to view your complete schedule.</p>'
      );
      emailHtmlParts.push('<hr>');
      emailHtmlParts.push(`<p><small>${institution.name}</small></p>`);

      const emailHtml = emailHtmlParts.join('\n');

      const emailTextLines = [
        `Schedule ${formattedChange}: ${assignment.date} ${assignment.timeSlot}`,
        `Type: ${assignmentType}`
      ];

      if (attending) {
        emailTextLines.push(`Attending: ${attending.name}`);
      }

      emailTextLines.push(`Site: ${siteName}`);

      if (siteAddress) {
        emailTextLines.push(`Location: ${siteAddress}`);
      }

      const emailText = emailTextLines.join('\n');

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
            const userDetails = await getUserDetails(memberDoc.docs[0].id);

            if (userDetails && userDetails.email) {
              const assignmentType = describeAssignmentType(assignment.type);

              const reminderHtmlParts = [
                '<h2>Schedule Reminder</h2>',
                `<p>Hi ${resident.name || 'Resident'},</p>`,
                '<p>This is a reminder about your assignment today:</p>',
                '<ul>',
                `<li><strong>Time:</strong> ${assignment.timeSlot}</li>`,
                `<li><strong>Type:</strong> ${assignmentType}</li>`
              ];

              if (attending) {
                reminderHtmlParts.push(`<li><strong>Attending:</strong> ${attending.name}</li>`);
              }

              reminderHtmlParts.push(`<li><strong>Site:</strong> ${siteName}</li>`);

              if (siteAddress) {
                reminderHtmlParts.push(`<li><strong>Location:</strong> ${siteAddress}</li>`);
              }

              reminderHtmlParts.push('</ul>');

              const reminderHtml = reminderHtmlParts.join('\n');
              const reminderText = `Reminder: ${assignment.timeSlot} ${assignmentType} at ${siteName}`;

              await sendEmail(
                userDetails.email,
                `Today's Schedule: ${assignment.timeSlot} - ${assignmentType}`,
                reminderHtml,
                reminderText
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

    // Add header
    doc.fontSize(20).text(institution.name, { align: 'center' });
    doc.fontSize(16).text('Schedule Report', { align: 'center' });
    doc.fontSize(12).text(`${startDate} to ${endDate}`, { align: 'center' });
    doc.moveDown();

    // Add resident filter if applicable
    if (residentId && residents[residentId]) {
      const residentInfo = `Resident: ${residents[residentId].name} (${residents[residentId].pgyStatus})`;
      doc.fontSize(14).text(residentInfo, { align: 'center' });
      doc.moveDown();
    }

    // Group assignments by date
    const assignmentsByDate = {};
    assignmentsSnap.forEach(assignmentDoc => {
      const assignment = assignmentDoc.data();
      const dateKey = assignment.date;
      if (!assignmentsByDate[dateKey]) {
        assignmentsByDate[dateKey] = [];
      }
      assignmentsByDate[dateKey].push(assignment);
    });

    // Add assignments to PDF
    Object.keys(assignmentsByDate).sort().forEach(date => {
      doc.fontSize(14).text(date, { underline: true });
      doc.moveDown(0.5);

      assignmentsByDate[date].forEach(assignment => {
        const resident = residents[assignment.residentId];
        const attending = assignment.attendingId ? attendings[assignment.attendingId] : null;
        const site = sites.find(s => s.id === assignment.siteId);
        const rotation = rotations.find(r => r.id === assignment.rotationId);

        const assignmentType = describeAssignmentType(assignment.type, { variant: 'short' });

        let text = `${assignment.timeSlot}: ${resident?.name || 'Unknown'}`;
        if (attending) {
          text += ` with ${attending.name}`;
        }
        text += ` at ${site?.name || 'Clinic'}`;
        text += ` (${assignmentType})`;
        if (rotation) {
          text += ` - ${rotation.name}`;
        }

        doc.fontSize(10).text(text, { indent: 20 });
      });

      doc.moveDown();
    });

    // Add statistics page
    doc.addPage();
    doc.fontSize(16).text('Statistics', { underline: true });
    doc.moveDown();

    const totalAssignments = assignmentsSnap.size;
    const uniqueResidents = new Set(assignmentsSnap.docs.map(d => d.data().residentId)).size;
    const uniqueAttendings = new Set(assignmentsSnap.docs.map(d => d.data().attendingId).filter(id => id)).size;
    const uniqueSites = new Set(assignmentsSnap.docs.map(d => d.data().siteId).filter(id => id)).size;

    // Count by type
    let clinicalCount = 0;
    let continuityCount = 0;
    let protectedCount = 0;

    assignmentsSnap.forEach(assignmentDoc => {
      const type = assignmentDoc.data().type;
      if (type === 'continuity') continuityCount++;
      else if (type === 'protected') protectedCount++;
      else clinicalCount++;
    });

    doc.fontSize(12)
      .text(`Total Assignments: ${totalAssignments}`)
      .text(`Clinical: ${clinicalCount}`)
      .text(`Continuity Clinics: ${continuityCount}`)
      .text(`Protected Time: ${protectedCount}`)
      .text(`Unique Residents: ${uniqueResidents}`)
      .text(`Unique Attendings: ${uniqueAttendings}`)
      .text(`Sites Used: ${uniqueSites}`);

    doc.end();

    // Wait for PDF generation to complete
    await new Promise(resolve => doc.on('end', resolve));

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

      const fetchDocsByIds = async (collectionRef, ids) => {
        const docs = [];
        const idChunks = chunkArray(ids, 10);
        for (const chunk of idChunks) {
          const snap = await collectionRef
            .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
            .get();
          docs.push(...snap.docs);
        }
        return docs;
      };

      if (action === 'import_residents') {
        if (!Array.isArray(payload.residents) || payload.residents.length === 0) {
          res.status(400).json({ success: false, error: 'missing-residents' });
          return;
        }

        const batch = db.batch();
        let imported = 0;
        let skipped = 0;

        payload.residents.forEach((resident) => {
          if (!resident) {
            skipped += 1;
            return;
          }

          const identifier = resident.id || resident.uid || resident.externalId;
          let docId = null;

          if (identifier && typeof identifier === 'string') {
            docId = identifier.trim();
          } else if (resident.email) {
            docId = resident.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          }

          const residentRef = docId
            ? institutionRef.collection('residents').doc(docId)
            : institutionRef.collection('residents').doc();

          const cleanName = resident.name?.trim();
          const cleanEmail = resident.email?.trim();

          if (!cleanName && !cleanEmail) {
            skipped += 1;
            return;
          }

          const residentPayload = {
            name: cleanName || cleanEmail || 'Unnamed Resident',
            email: cleanEmail || null,
            pgyStatus: resident.pgyStatus || 'PGY-1',
            rotationAssignments: Array.isArray(resident.rotationAssignments) ? resident.rotationAssignments : [],
            vacationWeeks: Array.isArray(resident.vacationWeeks) ? resident.vacationWeeks : [],
            protectedTimes: Array.isArray(resident.protectedTimes) ? resident.protectedTimes : [],
            continuityDay: resident.continuityDay || null,
            continuityTime: resident.continuityTime || null,
            continuitySiteId: resident.continuitySiteId || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          if (!resident.createdAt) {
            residentPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
          }

          batch.set(residentRef, residentPayload, { merge: true });
          imported += 1;
        });

        if (imported === 0) {
          res.status(400).json({ success: false, error: 'no-valid-residents', skipped });
          return;
        }

        await batch.commit();

        await institutionRef.collection('auditLogs').add({
          action: 'external_import_residents',
          data: { imported, skipped, source: options.source || 'webhook' },
          userId: 'external-system',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
          success: true,
          action,
          institutionId,
          imported,
          skipped
        });
        return;
      }

      if (action === 'export_schedule') {
        const startDate = payload.startDate;
        const endDate = payload.endDate;
        const limit = Math.min(payload.limit || 1000, 5000);
        const includeDetails = payload.includeDetails !== false;

        if (!startDate || !endDate) {
          res.status(400).json({ success: false, error: 'missing-date-range' });
          return;
        }

        const assignmentsQuery = institutionRef.collection('assignments')
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .orderBy('date')
          .orderBy('timeSlot')
          .limit(limit);

        const assignmentsSnap = await assignmentsQuery.get();

        const assignments = assignmentsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date,
            timeSlot: data.timeSlot,
            residentId: data.residentId || null,
            attendingId: data.attendingId || null,
            siteId: data.siteId || null,
            rotationId: data.rotationId || null,
            type: data.type || 'clinical',
            virtual: !!data.virtual,
            createdAt: data.createdAt?.toMillis?.() || null,
            updatedAt: data.updatedAt?.toMillis?.() || null
          };
        });

        const response = {
          success: true,
          action,
          institutionId,
          startDate,
          endDate,
          count: assignments.length,
          assignments
        };

        if (includeDetails && assignments.length > 0) {
          const residentIds = Array.from(
            new Set(assignments.map(a => a.residentId).filter(Boolean))
          );
          const attendingIds = Array.from(
            new Set(assignments.map(a => a.attendingId).filter(Boolean))
          );

          const residentDocs = residentIds.length > 0
            ? await fetchDocsByIds(institutionRef.collection('residents'), residentIds)
            : [];
          const attendingDocs = attendingIds.length > 0
            ? await fetchDocsByIds(institutionRef.collection('attendings'), attendingIds)
            : [];

          if (residentDocs.length > 0) {
            response.residents = {};
            residentDocs.forEach((doc) => {
              const data = doc.data();
              response.residents[doc.id] = {
                name: data.name || null,
                email: data.email || null,
                pgyStatus: data.pgyStatus || null
              };
            });
          }

          if (attendingDocs.length > 0) {
            response.attendings = {};
            attendingDocs.forEach((doc) => {
              const data = doc.data();
              response.attendings[doc.id] = {
                name: data.name || null,
                email: data.email || null
              };
            });
          }
        }

        await institutionRef.collection('auditLogs').add({
          action: 'external_export_schedule',
          data: {
            startDate,
            endDate,
            count: assignments.length,
            destination: options.destination || 'external-system'
          },
          userId: 'external-system',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json(response);
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
    throw new functions.https.HttpsError('internal', error.message);
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
          const matchedSlot = slots.find(slot => slot.assignmentClinicId === assignment.clinicId || slot.clinicId === assignment.clinicId);
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
      const now = new Date();

      for (const institutionDoc of institutionsSnap.docs) {
        const institutionId = institutionDoc.id;
        const institutionRef = db.collection('institutions').doc(institutionId);
        const backupId = format(now, 'yyyyMMddHHmmss');
        const backupRef = institutionRef.collection('backups').doc(backupId);

        const [assignmentsSnap, residentsSnap, attendingsSnap, rulesSnap] = await Promise.all([
          institutionRef.collection('assignments').get(),
          institutionRef.collection('residents').get(),
          institutionRef.collection('attendings').get(),
          institutionRef.collection('rules').get()
        ]);

        const summary = {
          assignments: assignmentsSnap.size,
          residents: residentsSnap.size,
          attendings: attendingsSnap.size,
          rules: rulesSnap.size
        };

        await backupRef.set({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'system',
          generatedAt: now.toISOString(),
          version: 1,
          summary
        });

        const payloadRef = backupRef.collection('payload');

        const writeChunks = async (name, snapshot) => {
          const docs = snapshot.docs.map(serializeDocument);
          if (docs.length === 0) {
            await payloadRef.doc(`${name}_0000`).set({
              items: [],
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return;
          }

          const chunks = chunkArray(docs, 100);
          for (let index = 0; index < chunks.length; index += 1) {
            const chunkId = `${name}_${String(index).padStart(4, '0')}`;
            await payloadRef.doc(chunkId).set({
              items: chunks[index],
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        };

        await writeChunks('assignments', assignmentsSnap);
        await writeChunks('residents', residentsSnap);
        await writeChunks('attendings', attendingsSnap);
        await writeChunks('rules', rulesSnap);

        await institutionRef.collection('auditLogs').add({
          action: 'daily_backup_created',
          data: { backupId, summary },
          userId: 'system',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
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

    const payloadSnap = await institutionRef
      .collection('backups')
      .doc(backupId)
      .collection('payload')
      .get();

    const collectItems = (name) => {
      return payloadSnap.docs
        .filter(doc => doc.id.startsWith(`${name}_`))
        .sort((a, b) => a.id.localeCompare(b.id))
        .flatMap(doc => doc.data().items || []);
    };

    const deleteCollection = async (collectionRef) => {
      const batchSize = 500;
      let snapshot = await collectionRef.limit(batchSize).get();
      while (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        snapshot = await collectionRef.limit(batchSize).get();
      }
    };

    const restoreCollection = async (collectionName, items) => {
      if (items.length === 0) {
        return;
      }

      const chunks = chunkArray(items, 400);
      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((item) => {
          const docRef = institutionRef.collection(collectionName).doc(item.id);
          batch.set(docRef, deserializeValue(item.data), { merge: true });
        });
        await batch.commit();
      }
    };

    const restoredCounts = {};

    for (const collectionName of targetCollections) {
      const items = collectItems(collectionName);

      if (clearExisting) {
        await deleteCollection(institutionRef.collection(collectionName));
      }

      await restoreCollection(collectionName, items);
      restoredCounts[collectionName] = items.length;
    }

    await institutionRef.collection('auditLogs').add({
      action: 'restore_from_backup',
      data: { backupId, targets: targetCollections, restoredCounts },
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      restoredCounts,
      backupId,
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

  const { institutionId, message, history = [] } = data || {};
  if (!institutionId || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Please provide both institutionId and message.');
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

  let geminiResult;
  try {
    geminiResult = await callGemini({ history: sanitizedHistory, message: String(message) });
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

  try {
    const result = await handleAction(actionName, actionArgs, contextObj);
    await institutionRef.collection('auditLogs').add({
      action: 'chatbot_action',
      data: { action: actionName, args: actionArgs },
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return {
      reply: result.message,
      type: 'action',
      action: actionName,
      data: result.data || {}
    };
  } catch (err) {
    console.error('Chat assistant error', err);
    throw new functions.https.HttpsError('internal', err.message || 'Unable to complete that action.');
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
