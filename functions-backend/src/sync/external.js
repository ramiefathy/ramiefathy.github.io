/**
 * External System Integration
 * Functions for syncing data with external systems via webhooks
 */

const admin = require('firebase-admin');
const { chunkArray } = require('../utils/arrays');

/**
 * Fetch documents by IDs in chunks (Firestore limit: 10 per query)
 * @param {CollectionReference} collectionRef - Collection reference
 * @param {Array} ids - Array of document IDs
 * @returns {Promise<Array>} Array of document snapshots
 */
async function fetchDocsByIds(collectionRef, ids) {
  const docs = [];
  const idChunks = chunkArray(ids, 10);
  for (const chunk of idChunks) {
    const snap = await collectionRef
      .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
      .get();
    docs.push(...snap.docs);
  }
  return docs;
}

/**
 * Import residents from external system
 * @param {Object} params - Import parameters
 * @returns {Object} Import results
 */
async function importResidents(params) {
  const { db, institutionRef, residents, options } = params;

  if (!Array.isArray(residents) || residents.length === 0) {
    return { imported: 0, skipped: 0, error: 'missing-residents' };
  }

  const batch = db.batch();
  let imported = 0;
  let skipped = 0;

  residents.forEach((resident) => {
    if (!resident) {
      skipped += 1;
      return;
    }

    // Determine document ID from various possible identifiers
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
    return { imported: 0, skipped, error: 'no-valid-residents' };
  }

  await batch.commit();

  // Log audit trail
  await institutionRef.collection('auditLogs').add({
    action: 'external_import_residents',
    data: { imported, skipped, source: options?.source || 'webhook' },
    userId: 'external-system',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { imported, skipped };
}

/**
 * Export schedule data to external system
 * @param {Object} params - Export parameters
 * @returns {Object} Export results with assignments and optional details
 */
async function exportSchedule(params) {
  const { institutionRef, startDate, endDate, limit = 1000, includeDetails = true } = params;

  if (!startDate || !endDate) {
    return { error: 'missing-date-range' };
  }

  const maxLimit = Math.min(limit, 5000);

  // Fetch assignments in date range
  const assignmentsQuery = institutionRef.collection('assignments')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date')
    .orderBy('timeSlot')
    .limit(maxLimit);

  const assignmentsSnap = await assignmentsQuery.get();

  // Format assignments for export
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
    startDate,
    endDate,
    count: assignments.length,
    assignments
  };

  // Optionally include resident and attending details
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

  // Log audit trail
  await institutionRef.collection('auditLogs').add({
    action: 'external_export_schedule',
    data: {
      startDate,
      endDate,
      count: assignments.length,
      destination: params.options?.destination || 'external-system'
    },
    userId: 'external-system',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return response;
}

module.exports = {
  fetchDocsByIds,
  importResidents,
  exportSchedule
};