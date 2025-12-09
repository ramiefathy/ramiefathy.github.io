/**
 * Backup and Restore Functions
 * Core logic for creating and restoring Firestore backups
 */

const { format } = require('date-fns');
const admin = require('firebase-admin');
const { serializeDocument, deserializeValue } = require('../utils/serialization');
const { chunkArray } = require('../utils/arrays');

/**
 * Create a backup for an institution
 * @param {Object} params - Backup parameters
 * @returns {Object} Backup summary
 */
async function createInstitutionBackup(params) {
  const { institutionId, institutionRef, userId = 'system' } = params;

  const now = new Date();
  const backupId = format(now, 'yyyyMMddHHmmss');
  const backupRef = institutionRef.collection('backups').doc(backupId);

  // Fetch all collections in parallel
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

  // Create backup metadata
  await backupRef.set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: userId,
    generatedAt: now.toISOString(),
    version: 1,
    summary
  });

  const payloadRef = backupRef.collection('payload');

  /**
   * Write collection data in chunks to payload subcollection
   * @param {string} name - Collection name
   * @param {QuerySnapshot} snapshot - Collection snapshot
   */
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

  // Write all collections to backup
  await writeChunks('assignments', assignmentsSnap);
  await writeChunks('residents', residentsSnap);
  await writeChunks('attendings', attendingsSnap);
  await writeChunks('rules', rulesSnap);

  // Log audit trail
  await institutionRef.collection('auditLogs').add({
    action: 'daily_backup_created',
    data: { backupId, summary },
    userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { backupId, summary, institutionId };
}

/**
 * Restore data from a backup
 * @param {Object} params - Restore parameters
 * @returns {Object} Restore results
 */
async function restoreFromBackup(params) {
  const {
    db,
    institutionRef,
    backupId,
    targetCollections,
    clearExisting,
    userId
  } = params;

  // Get backup payload
  const payloadSnap = await institutionRef
    .collection('backups')
    .doc(backupId)
    .collection('payload')
    .get();

  /**
   * Collect all items for a collection from chunked backup
   * @param {string} name - Collection name
   * @returns {Array} Collection items
   */
  const collectItems = (name) => {
    return payloadSnap.docs
      .filter(doc => doc.id.startsWith(`${name}_`))
      .sort((a, b) => a.id.localeCompare(b.id))
      .flatMap(doc => doc.data().items || []);
  };

  /**
   * Delete all documents in a collection
   * @param {CollectionReference} collectionRef - Collection to delete
   */
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

  /**
   * Restore a collection from backup items
   * @param {string} collectionName - Collection name
   * @param {Array} items - Items to restore
   */
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

  // Restore each target collection
  for (const collectionName of targetCollections) {
    const items = collectItems(collectionName);

    if (clearExisting) {
      await deleteCollection(institutionRef.collection(collectionName));
    }

    await restoreCollection(collectionName, items);
    restoredCounts[collectionName] = items.length;
  }

  // Log audit trail
  await institutionRef.collection('auditLogs').add({
    action: 'restore_from_backup',
    data: { backupId, targets: targetCollections, restoredCounts },
    userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { restoredCounts };
}

module.exports = {
  createInstitutionBackup,
  restoreFromBackup
};
