/**
 * User Utilities
 * Helper functions for user management and formatting
 */

const { auth } = require('../config/firebase');

/**
 * Get user details by ID from Firebase Auth
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User details or null if not found
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
 * Get human-readable description of assignment type
 * @param {string} type - Assignment type (continuity, protected, clinical)
 * @param {Object} options - Options for formatting
 * @param {string} options.variant - Variant (short, default)
 * @returns {string} Human-readable assignment type
 */
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

module.exports = {
  getUserDetails,
  describeAssignmentType
};