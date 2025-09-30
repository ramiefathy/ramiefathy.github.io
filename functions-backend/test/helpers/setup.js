/**
 * Test Setup and Helpers
 * Common utilities for testing Cloud Functions
 */

const admin = require('firebase-admin');
const test = require('firebase-functions-test');

// Initialize test environment
const testEnv = test();

// Mock Firestore
const mockFirestore = {
  collection: (path) => ({
    doc: (id) => ({
      get: () => Promise.resolve({
        exists: true,
        id,
        data: () => ({})
      }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    get: () => Promise.resolve({ docs: [], empty: true, size: 0 }),
    where: () => mockFirestore.collection(path),
    orderBy: () => mockFirestore.collection(path),
    limit: () => mockFirestore.collection(path)
  })
};

// Helper to create mock context for callable functions
function mockCallableContext(uid = 'test-user-123', email = 'test@example.com') {
  return {
    auth: {
      uid,
      token: {
        email,
        email_verified: true
      }
    }
  };
}

// Helper to create mock Firestore timestamp
function mockTimestamp(date = new Date()) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000
  };
}

// Helper to create mock document snapshot
function mockDocSnapshot(id, data, exists = true) {
  return {
    id,
    exists,
    data: () => data,
    ref: {
      id,
      path: `collection/${id}`,
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }
  };
}

// Helper to create mock query snapshot
function mockQuerySnapshot(docs = []) {
  return {
    docs: docs.map(doc => mockDocSnapshot(doc.id, doc.data)),
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback) => docs.forEach(callback)
  };
}

module.exports = {
  testEnv,
  mockFirestore,
  mockCallableContext,
  mockTimestamp,
  mockDocSnapshot,
  mockQuerySnapshot,
  admin
};