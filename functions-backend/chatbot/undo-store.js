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

async function popUndoRecord({ firestore, institutionId, userId }) {
  const docRef = stackDocRef(firestore, institutionId, userId);
  let record = null;
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      tx.set(docRef, { actions: [] }, { merge: true });
      return;
    }
    const actions = snap.data().actions || [];
    record = actions.pop() || null;
    tx.set(docRef, { actions }, { merge: true });
  });
  return record;
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
  recordUsage,
  MAX_STACK_DEPTH
};
