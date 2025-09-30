/**
 * Tests for Serialization Utilities
 */

const { describe, it } = require('mocha');
const assert = require('assert');
const admin = require('firebase-admin');
const {
  isDocumentReference,
  serializeValue,
  deserializeValue,
  serializeDocument
} = require('../../src/utils/serialization');

describe('Serialization Utilities', () => {
  describe('isDocumentReference', () => {
    it('should return true for DocumentReference objects', () => {
      // Mock DocumentReference
      const mockDocRef = {
        constructor: { name: 'DocumentReference' }
      };

      const result = isDocumentReference(mockDocRef);

      assert.strictEqual(result, true);
    });

    it('should return false for null', () => {
      const result = isDocumentReference(null);
      assert.strictEqual(result, false);
    });

    it('should return false for undefined', () => {
      const result = isDocumentReference(undefined);
      assert.strictEqual(result, false);
    });

    it('should return false for plain objects', () => {
      const result = isDocumentReference({ foo: 'bar' });
      assert.strictEqual(result, false);
    });

    it('should return false for strings', () => {
      const result = isDocumentReference('test');
      assert.strictEqual(result, false);
    });
  });

  describe('serializeValue', () => {
    it('should return null for null', () => {
      const result = serializeValue(null);
      assert.strictEqual(result, null);
    });

    it('should return undefined for undefined', () => {
      const result = serializeValue(undefined);
      assert.strictEqual(result, undefined);
    });

    it('should serialize Firestore Timestamps', () => {
      const timestamp = admin.firestore.Timestamp.fromMillis(1609459200000); // 2021-01-01
      const result = serializeValue(timestamp);

      assert.deepStrictEqual(result, {
        __datatype: 'timestamp',
        value: 1609459200000
      });
    });

    it('should serialize Firestore GeoPoints', () => {
      const geopoint = new admin.firestore.GeoPoint(37.7749, -122.4194); // SF coordinates
      const result = serializeValue(geopoint);

      assert.deepStrictEqual(result, {
        __datatype: 'geopoint',
        latitude: 37.7749,
        longitude: -122.4194
      });
    });

    it('should serialize DocumentReferences', () => {
      const mockDocRef = {
        constructor: { name: 'DocumentReference' },
        path: 'institutions/inst1'
      };

      const result = serializeValue(mockDocRef);

      assert.deepStrictEqual(result, {
        __datatype: 'document_reference',
        path: 'institutions/inst1'
      });
    });

    it('should serialize arrays recursively', () => {
      const timestamp = admin.firestore.Timestamp.fromMillis(1609459200000);
      const input = [1, 'test', timestamp, null];

      const result = serializeValue(input);

      assert.deepStrictEqual(result, [
        1,
        'test',
        { __datatype: 'timestamp', value: 1609459200000 },
        null
      ]);
    });

    it('should serialize objects recursively', () => {
      const timestamp = admin.firestore.Timestamp.fromMillis(1609459200000);
      const input = {
        id: 'test-id',
        name: 'Test',
        createdAt: timestamp,
        count: 42
      };

      const result = serializeValue(input);

      assert.deepStrictEqual(result, {
        id: 'test-id',
        name: 'Test',
        createdAt: { __datatype: 'timestamp', value: 1609459200000 },
        count: 42
      });
    });

    it('should serialize nested structures', () => {
      const timestamp = admin.firestore.Timestamp.fromMillis(1609459200000);
      const geopoint = new admin.firestore.GeoPoint(37.7749, -122.4194);

      const input = {
        user: {
          name: 'John',
          location: geopoint,
          timestamps: [timestamp, timestamp]
        },
        metadata: {
          count: 5
        }
      };

      const result = serializeValue(input);

      assert.deepStrictEqual(result, {
        user: {
          name: 'John',
          location: {
            __datatype: 'geopoint',
            latitude: 37.7749,
            longitude: -122.4194
          },
          timestamps: [
            { __datatype: 'timestamp', value: 1609459200000 },
            { __datatype: 'timestamp', value: 1609459200000 }
          ]
        },
        metadata: {
          count: 5
        }
      });
    });

    it('should pass through primitive values', () => {
      assert.strictEqual(serializeValue('test'), 'test');
      assert.strictEqual(serializeValue(42), 42);
      assert.strictEqual(serializeValue(true), true);
      assert.strictEqual(serializeValue(false), false);
    });
  });

  describe('deserializeValue', () => {
    it('should return null for null', () => {
      const result = deserializeValue(null);
      assert.strictEqual(result, null);
    });

    it('should return undefined for undefined', () => {
      const result = deserializeValue(undefined);
      assert.strictEqual(result, undefined);
    });

    it('should deserialize timestamp objects', () => {
      const input = {
        __datatype: 'timestamp',
        value: 1609459200000
      };

      const result = deserializeValue(input);

      assert.ok(result instanceof admin.firestore.Timestamp);
      assert.strictEqual(result.toMillis(), 1609459200000);
    });

    it('should deserialize geopoint objects', () => {
      const input = {
        __datatype: 'geopoint',
        latitude: 37.7749,
        longitude: -122.4194
      };

      const result = deserializeValue(input);

      assert.ok(result instanceof admin.firestore.GeoPoint);
      assert.strictEqual(result.latitude, 37.7749);
      assert.strictEqual(result.longitude, -122.4194);
    });

    it('should deserialize arrays recursively', () => {
      const input = [
        1,
        'test',
        { __datatype: 'timestamp', value: 1609459200000 },
        null
      ];

      const result = deserializeValue(input);

      assert.strictEqual(result[0], 1);
      assert.strictEqual(result[1], 'test');
      assert.ok(result[2] instanceof admin.firestore.Timestamp);
      assert.strictEqual(result[3], null);
    });

    it('should deserialize objects recursively', () => {
      const input = {
        id: 'test-id',
        name: 'Test',
        createdAt: { __datatype: 'timestamp', value: 1609459200000 },
        count: 42
      };

      const result = deserializeValue(input);

      assert.strictEqual(result.id, 'test-id');
      assert.strictEqual(result.name, 'Test');
      assert.ok(result.createdAt instanceof admin.firestore.Timestamp);
      assert.strictEqual(result.count, 42);
    });

    it('should deserialize nested structures', () => {
      const input = {
        user: {
          name: 'John',
          location: {
            __datatype: 'geopoint',
            latitude: 37.7749,
            longitude: -122.4194
          },
          timestamps: [
            { __datatype: 'timestamp', value: 1609459200000 },
            { __datatype: 'timestamp', value: 1609459200000 }
          ]
        },
        metadata: {
          count: 5
        }
      };

      const result = deserializeValue(input);

      assert.strictEqual(result.user.name, 'John');
      assert.ok(result.user.location instanceof admin.firestore.GeoPoint);
      assert.ok(result.user.timestamps[0] instanceof admin.firestore.Timestamp);
      assert.ok(result.user.timestamps[1] instanceof admin.firestore.Timestamp);
      assert.strictEqual(result.metadata.count, 5);
    });

    it('should pass through primitive values', () => {
      assert.strictEqual(deserializeValue('test'), 'test');
      assert.strictEqual(deserializeValue(42), 42);
      assert.strictEqual(deserializeValue(true), true);
      assert.strictEqual(deserializeValue(false), false);
    });

    it('should round-trip serialize and deserialize', () => {
      const timestamp = admin.firestore.Timestamp.fromMillis(1609459200000);
      const geopoint = new admin.firestore.GeoPoint(37.7749, -122.4194);

      const original = {
        name: 'Test',
        location: geopoint,
        createdAt: timestamp,
        tags: ['a', 'b', 'c'],
        count: 42
      };

      const serialized = serializeValue(original);
      const deserialized = deserializeValue(serialized);

      assert.strictEqual(deserialized.name, 'Test');
      assert.ok(deserialized.location instanceof admin.firestore.GeoPoint);
      assert.strictEqual(deserialized.location.latitude, 37.7749);
      assert.ok(deserialized.createdAt instanceof admin.firestore.Timestamp);
      assert.strictEqual(deserialized.createdAt.toMillis(), 1609459200000);
      assert.deepStrictEqual(deserialized.tags, ['a', 'b', 'c']);
      assert.strictEqual(deserialized.count, 42);
    });
  });

  describe('serializeDocument', () => {
    it('should serialize document with id and data', () => {
      const mockDoc = {
        id: 'doc123',
        data: () => ({
          name: 'Test Document',
          count: 5,
          createdAt: admin.firestore.Timestamp.fromMillis(1609459200000)
        })
      };

      const result = serializeDocument(mockDoc);

      assert.strictEqual(result.id, 'doc123');
      assert.strictEqual(result.data.name, 'Test Document');
      assert.strictEqual(result.data.count, 5);
      assert.deepStrictEqual(result.data.createdAt, {
        __datatype: 'timestamp',
        value: 1609459200000
      });
    });

    it('should handle documents with complex nested data', () => {
      const timestamp = admin.firestore.Timestamp.fromMillis(1609459200000);
      const geopoint = new admin.firestore.GeoPoint(37.7749, -122.4194);

      const mockDoc = {
        id: 'complex-doc',
        data: () => ({
          user: {
            name: 'Jane',
            location: geopoint
          },
          history: [
            { event: 'created', timestamp },
            { event: 'updated', timestamp }
          ],
          metadata: {
            version: 2,
            active: true
          }
        })
      };

      const result = serializeDocument(mockDoc);

      assert.strictEqual(result.id, 'complex-doc');
      assert.strictEqual(result.data.user.name, 'Jane');
      assert.deepStrictEqual(result.data.user.location, {
        __datatype: 'geopoint',
        latitude: 37.7749,
        longitude: -122.4194
      });
      assert.strictEqual(result.data.history.length, 2);
      assert.deepStrictEqual(result.data.history[0].timestamp, {
        __datatype: 'timestamp',
        value: 1609459200000
      });
      assert.strictEqual(result.data.metadata.version, 2);
      assert.strictEqual(result.data.metadata.active, true);
    });

    it('should handle empty document data', () => {
      const mockDoc = {
        id: 'empty-doc',
        data: () => ({})
      };

      const result = serializeDocument(mockDoc);

      assert.strictEqual(result.id, 'empty-doc');
      assert.deepStrictEqual(result.data, {});
    });
  });
});