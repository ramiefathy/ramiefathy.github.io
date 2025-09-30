/**
 * Firestore Serialization Utilities
 * Functions for serializing and deserializing Firestore data types
 * Used for backup/restore and JSON export operations
 */

const admin = require('firebase-admin');
const { db } = require('../config/firebase');

/**
 * Check if value is a Firestore DocumentReference
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isDocumentReference(value) {
  return !!value && typeof value === 'object' && value.constructor?.name === 'DocumentReference';
}

/**
 * Serialize a Firestore value to JSON-compatible format
 * Handles Timestamps, GeoPoints, DocumentReferences, Arrays, and Objects
 * @param {*} value - Value to serialize
 * @returns {*} Serialized value
 */
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

/**
 * Deserialize a JSON value back to Firestore types
 * Reverses the serialization process
 * @param {*} value - Serialized value
 * @returns {*} Deserialized Firestore value
 */
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

/**
 * Serialize an entire Firestore document
 * @param {DocumentSnapshot} doc - Firestore document snapshot
 * @returns {Object} Serialized document with id and data
 */
function serializeDocument(doc) {
  return {
    id: doc.id,
    data: serializeValue(doc.data())
  };
}

module.exports = {
  isDocumentReference,
  serializeValue,
  deserializeValue,
  serializeDocument
};