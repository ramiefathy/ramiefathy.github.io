const { Timestamp, FieldValue } = require('firebase-admin/firestore');

const MAX_STACK_DEPTH = Number.parseInt(process.env.CHATBOT_UNDO_LIMIT || '25', 10);

const stackDocRef = (firestore, institutionId, userId) =>
  firestore.collection('institutions').doc(institutionId)
    .collection('chatbotUndoStacks').doc(userId);

async function pushUndoRecord({ firestore, institutionId, userId, record }) {
  const docRef = stackDocRef(firestore, institutionId, userId);
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const actions = snap.exists ? snap.data().actions || [] : [];
    actions.push({ ...record, timestamp: Timestamp.now() });
    if (actions.length > MAX_STACK_DEPTH) {
      actions.splice(0, actions.length - MAX_STACK_DEPTH);
    }
    tx.set(docRef, { actions }, { merge: true });
  });
}

async function popUndoRecords({ firestore, institutionId, userId, count = 1 }) {
  const docRef = stackDocRef(firestore, institutionId, userId);
  const requested = Math.max(1, Math.min(Number.parseInt(count, 10) || 1, MAX_STACK_DEPTH));
  let popped = [];

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      tx.set(docRef, { actions: [] }, { merge: true });
      return;
    }

    const actions = Array.isArray(snap.data().actions) ? [...snap.data().actions] : [];
    if (!actions.length) {
      tx.set(docRef, { actions: [] }, { merge: true });
      return;
    }

    const actual = Math.min(requested, actions.length);
    const remaining = actions.slice(0, actions.length - actual);
    popped = actions.slice(actions.length - actual).reverse();
    tx.set(docRef, { actions: remaining }, { merge: true });
  });

  return popped;
}

async function popUndoRecord({ firestore, institutionId, userId }) {
  const [record] = await popUndoRecords({ firestore, institutionId, userId, count: 1 });
  return record || null;
}

async function recordUsage({ firestore, institutionId, userId, limit = 20 }) {
  const usageRef = firestore.collection('institutions').doc(institutionId)
    .collection('chatbotUsage').doc(userId);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const threshold = now - windowMs;

  let allowed = true;
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef);
    let history = snap.exists ? snap.data().history || [] : [];
    history = history.filter(entry => entry >= threshold);
    if (history.length >= limit) {
      allowed = false;
      return;
    }
    history.push(now);
    tx.set(usageRef, {
      history,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  return allowed;
}

module.exports = {
  pushUndoRecord,
  popUndoRecord,
  popUndoRecords,
  recordUsage,
  MAX_STACK_DEPTH
};
