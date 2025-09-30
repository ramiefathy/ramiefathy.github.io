/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin and provides database and auth instances
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
admin.initializeApp();

// Export database and auth instances
const db = admin.firestore();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth
};