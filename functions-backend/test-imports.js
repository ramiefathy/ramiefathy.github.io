// Quick test to see what's available in firebase-functions
const functions = require('firebase-functions');

console.log('Available on functions object:');
console.log('functions.firestore:', typeof functions.firestore);
console.log('functions.firestore.document:', typeof functions.firestore?.document);
console.log('functions.https:', typeof functions.https);
console.log('functions.pubsub:', typeof functions.pubsub);

// Try the v1 API
if (functions.firestore) {
  console.log('\nFirestore methods:');
  console.log(Object.keys(functions.firestore));
}