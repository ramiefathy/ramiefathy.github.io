#!/usr/bin/env node
/**
 * Backfill `/institutions/{id}/members/{uid}` documents from the legacy
 * `members` array stored on the institution root document.
 *
 * Usage:
 *   node scripts/backfill-members.js [--project <gcpProject>] [--dry-run]
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);
let dryRun = false;
let projectId;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--dry-run') {
    dryRun = true;
  } else if (arg === '--project') {
    projectId = args[i + 1];
    i += 1;
  }
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId
  });
}

const db = admin.firestore();

async function backfill() {
  const institutionsSnap = await db.collection('institutions').get();
  const summary = [];

  for (const doc of institutionsSnap.docs) {
    const data = doc.data();
    const legacyMembers = Array.isArray(data.members) ? data.members : [];
    if (legacyMembers.length === 0) {
      continue;
    }

    const subcollectionSnap = await doc.ref.collection('members').get();
    const existing = new Set(subcollectionSnap.docs.map((memberDoc) => memberDoc.id));

    const writes = [];
    legacyMembers.forEach((member) => {
      const userId = member?.userId;
      if (!userId) {
        return;
      }
      if (existing.has(userId)) {
        return;
      }

      const payload = {
        userId,
        name: member?.name || null,
        email: member?.email || null,
        role: member?.role || 'member',
        joinedAt: member?.joinedAt || admin.firestore.FieldValue.serverTimestamp(),
        backfilledAt: admin.firestore.FieldValue.serverTimestamp()
      };
      writes.push({ userId, payload });
    });

    if (writes.length > 0) {
      summary.push({ institutionId: doc.id, writes: writes.length });
      if (!dryRun) {
        const batch = db.batch();
        writes.forEach(({ userId, payload }) => {
          const memberRef = doc.ref.collection('members').doc(userId);
          batch.set(memberRef, payload, { merge: true });
        });
        await batch.commit();
      }
    }
  }

  return summary;
}

backfill()
  .then((summary) => {
    if (summary.length === 0) {
      console.log('No legacy memberships needed backfill.');
    } else {
      console.log(`Processed ${summary.length} institutions.`);
      summary.forEach(({ institutionId, writes }) => {
        console.log(` - ${institutionId}: ${writes} memberships ${dryRun ? 'would be' : 'were'} backfilled.`);
      });
    }
    if (dryRun) {
      console.log('\nDry run complete. Re-run without --dry-run to apply changes.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
