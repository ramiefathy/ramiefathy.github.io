/**
 * Tests for Backup and Restore Functions
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const assert = require('assert');
const sinon = require('sinon');
const admin = require('firebase-admin');
const {
  createInstitutionBackup,
  restoreFromBackup
} = require('../../src/backup/backup');

describe('Backup Module', () => {
  let mockDb;
  let mockInstitutionRef;
  let mockBackupRef;
  let mockPayloadRef;
  let serverTimestampStub;

  beforeEach(() => {
    // Stub serverTimestamp
    serverTimestampStub = sinon.stub(admin.firestore.FieldValue, 'serverTimestamp').returns('TIMESTAMP');

    // Mock Firestore database
    mockDb = {
      batch: sinon.stub().returns({
        set: sinon.stub().returnsThis(),
        delete: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      })
    };

    // Mock payload reference
    mockPayloadRef = {
      doc: sinon.stub().callsFake((id) => ({
        set: sinon.stub().resolves(),
        id
      }))
    };

    // Mock backup reference
    mockBackupRef = {
      set: sinon.stub().resolves(),
      collection: sinon.stub().withArgs('payload').returns(mockPayloadRef)
    };

    // Mock institution reference
    mockInstitutionRef = {
      collection: sinon.stub().callsFake((name) => {
        if (name === 'backups') {
          return {
            doc: sinon.stub().returns(mockBackupRef)
          };
        }
        if (name === 'auditLogs') {
          return {
            add: sinon.stub().resolves({ id: 'audit123' })
          };
        }
        return {
          get: sinon.stub().resolves({ docs: [], size: 0, empty: true }),
          doc: sinon.stub().callsFake((id) => ({
            set: sinon.stub().resolves()
          })),
          limit: sinon.stub().returnsThis()
        };
      })
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createInstitutionBackup', () => {
    it('should create backup with empty collections', async () => {
      // Mock empty collections
      mockInstitutionRef.collection.withArgs('assignments').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('residents').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('attendings').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('rules').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });

      const result = await createInstitutionBackup({
        db: mockDb,
        institutionId: 'inst1',
        institutionRef: mockInstitutionRef,
        userId: 'user123'
      });

      assert.ok(result.backupId);
      assert.strictEqual(result.institutionId, 'inst1');
      assert.deepStrictEqual(result.summary, {
        assignments: 0,
        residents: 0,
        attendings: 0,
        rules: 0
      });

      // Verify backup metadata was written
      assert.ok(mockBackupRef.set.calledOnce);
      const metadataCall = mockBackupRef.set.firstCall.args[0];
      assert.strictEqual(metadataCall.createdBy, 'user123');
      assert.strictEqual(metadataCall.version, 1);
    });

    it('should create backup with data in collections', async () => {
      // Mock collections with data
      const mockAssignments = [
        { id: 'assign1', data: () => ({ date: '2025-10-15', residentId: 'res1' }) },
        { id: 'assign2', data: () => ({ date: '2025-10-16', residentId: 'res2' }) }
      ];
      const mockResidents = [
        { id: 'res1', data: () => ({ name: 'Resident 1' }) }
      ];

      mockInstitutionRef.collection.withArgs('assignments').returns({
        get: sinon.stub().resolves({ docs: mockAssignments, size: 2 })
      });
      mockInstitutionRef.collection.withArgs('residents').returns({
        get: sinon.stub().resolves({ docs: mockResidents, size: 1 })
      });
      mockInstitutionRef.collection.withArgs('attendings').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('rules').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });

      const result = await createInstitutionBackup({
        db: mockDb,
        institutionId: 'inst1',
        institutionRef: mockInstitutionRef,
        userId: 'system'
      });

      assert.deepStrictEqual(result.summary, {
        assignments: 2,
        residents: 1,
        attendings: 0,
        rules: 0
      });

      // Verify chunks were written
      assert.ok(mockPayloadRef.doc.called);
      const chunkCalls = mockPayloadRef.doc.getCalls().map(call => call.args[0]);
      assert.ok(chunkCalls.some(id => id.startsWith('assignments_')));
      assert.ok(chunkCalls.some(id => id.startsWith('residents_')));
    });

    it('should chunk large collections into multiple documents', async () => {
      // Create 250 assignments (should create 3 chunks of 100)
      const assignments = Array.from({ length: 250 }, (_, i) => ({
        id: `assign${i}`,
        data: () => ({ date: '2025-10-15', residentId: `res${i}` })
      }));

      mockInstitutionRef.collection.withArgs('assignments').returns({
        get: sinon.stub().resolves({ docs: assignments, size: 250 })
      });
      mockInstitutionRef.collection.withArgs('residents').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('attendings').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('rules').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });

      await createInstitutionBackup({
        db: mockDb,
        institutionId: 'inst1',
        institutionRef: mockInstitutionRef,
        userId: 'system'
      });

      // Verify 3 assignment chunks were created (250 items / 100 per chunk = 3 chunks)
      const assignmentChunks = mockPayloadRef.doc.getCalls()
        .map(call => call.args[0])
        .filter(id => id.startsWith('assignments_'));

      assert.strictEqual(assignmentChunks.length, 3);
      assert.ok(assignmentChunks.includes('assignments_0000'));
      assert.ok(assignmentChunks.includes('assignments_0001'));
      assert.ok(assignmentChunks.includes('assignments_0002'));
    });

    it('should create audit log for backup', async () => {
      mockInstitutionRef.collection.withArgs('assignments').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('residents').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('attendings').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('rules').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });

      const mockAuditLogs = {
        add: sinon.stub().resolves({ id: 'audit123' })
      };
      mockInstitutionRef.collection.withArgs('auditLogs').returns(mockAuditLogs);

      await createInstitutionBackup({
        db: mockDb,
        institutionId: 'inst1',
        institutionRef: mockInstitutionRef,
        userId: 'admin-user'
      });

      // Verify audit log was created
      assert.ok(mockAuditLogs.add.calledOnce);
      const auditData = mockAuditLogs.add.firstCall.args[0];
      assert.strictEqual(auditData.action, 'daily_backup_created');
      assert.strictEqual(auditData.userId, 'admin-user');
      assert.ok(auditData.data.backupId);
      assert.ok(auditData.data.summary);
    });

    it('should use system as default userId', async () => {
      mockInstitutionRef.collection.withArgs('assignments').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('residents').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('attendings').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('rules').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });

      await createInstitutionBackup({
        db: mockDb,
        institutionId: 'inst1',
        institutionRef: mockInstitutionRef
        // No userId provided
      });

      // Verify default userId is 'system'
      const metadataCall = mockBackupRef.set.firstCall.args[0];
      assert.strictEqual(metadataCall.createdBy, 'system');
    });

    it('should handle empty collections by creating empty chunk documents', async () => {
      mockInstitutionRef.collection.withArgs('assignments').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('residents').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('attendings').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });
      mockInstitutionRef.collection.withArgs('rules').returns({
        get: sinon.stub().resolves({ docs: [], size: 0 })
      });

      await createInstitutionBackup({
        db: mockDb,
        institutionId: 'inst1',
        institutionRef: mockInstitutionRef,
        userId: 'system'
      });

      // Verify empty chunks were created for all collections
      const chunkIds = mockPayloadRef.doc.getCalls().map(call => call.args[0]);
      assert.ok(chunkIds.some(id => id === 'assignments_0000'));
      assert.ok(chunkIds.some(id => id === 'residents_0000'));
      assert.ok(chunkIds.some(id => id === 'attendings_0000'));
      assert.ok(chunkIds.some(id => id === 'rules_0000'));
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore data from backup without clearing existing', async () => {
      // Mock backup payload
      const mockPayloadDocs = [
        {
          id: 'assignments_0000',
          data: () => ({
            items: [
              { id: 'assign1', data: { date: '2025-10-15', residentId: 'res1' } },
              { id: 'assign2', data: { date: '2025-10-16', residentId: 'res2' } }
            ]
          })
        },
        {
          id: 'residents_0000',
          data: () => ({
            items: [
              { id: 'res1', data: { name: 'Resident 1' } }
            ]
          })
        }
      ];

      const mockBackupCollection = {
        doc: sinon.stub().callsFake((backupId) => ({
          collection: sinon.stub().withArgs('payload').returns({
            get: sinon.stub().resolves({ docs: mockPayloadDocs })
          })
        }))
      };

      mockInstitutionRef.collection.withArgs('backups').returns(mockBackupCollection);

      const mockBatch = {
        set: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      };
      mockDb.batch = sinon.stub().returns(mockBatch);

      const result = await restoreFromBackup({
        db: mockDb,
        institutionRef: mockInstitutionRef,
        backupId: 'backup123',
        targetCollections: ['assignments', 'residents'],
        clearExisting: false,
        userId: 'admin'
      });

      assert.deepStrictEqual(result.restoredCounts, {
        assignments: 2,
        residents: 1
      });

      // Verify batch operations were used
      assert.ok(mockBatch.set.called);
      assert.ok(mockBatch.commit.called);
    });

    it('should clear existing data when clearExisting is true', async () => {
      const mockPayloadDocs = [
        {
          id: 'assignments_0000',
          data: () => ({
            items: [
              { id: 'assign1', data: { date: '2025-10-15' } }
            ]
          })
        }
      ];

      const mockBackupCollection = {
        doc: sinon.stub().callsFake(() => ({
          collection: sinon.stub().withArgs('payload').returns({
            get: sinon.stub().resolves({ docs: mockPayloadDocs })
          })
        }))
      };

      mockInstitutionRef.collection.withArgs('backups').returns(mockBackupCollection);

      // Mock existing data to be deleted
      const mockExistingDocs = [
        { ref: { id: 'old1' } },
        { ref: { id: 'old2' } }
      ];

      const mockAssignmentsCollection = {
        limit: sinon.stub().returnsThis(),
        get: sinon.stub()
          .onFirstCall().resolves({ docs: mockExistingDocs, empty: false })
          .onSecondCall().resolves({ docs: [], empty: true }),
        doc: sinon.stub().callsFake((id) => ({ set: sinon.stub().resolves() }))
      };

      mockInstitutionRef.collection.withArgs('assignments').returns(mockAssignmentsCollection);

      const mockBatch = {
        delete: sinon.stub().returnsThis(),
        set: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      };
      mockDb.batch = sinon.stub().returns(mockBatch);

      await restoreFromBackup({
        db: mockDb,
        institutionRef: mockInstitutionRef,
        backupId: 'backup123',
        targetCollections: ['assignments'],
        clearExisting: true,
        userId: 'admin'
      });

      // Verify delete operations were called
      assert.ok(mockBatch.delete.called);
      assert.strictEqual(mockBatch.delete.callCount, 2); // 2 existing docs
    });

    it('should handle multiple chunks for a collection', async () => {
      const mockPayloadDocs = [
        {
          id: 'assignments_0000',
          data: () => ({
            items: [
              { id: 'assign1', data: { date: '2025-10-15' } },
              { id: 'assign2', data: { date: '2025-10-16' } }
            ]
          })
        },
        {
          id: 'assignments_0001',
          data: () => ({
            items: [
              { id: 'assign3', data: { date: '2025-10-17' } }
            ]
          })
        }
      ];

      const mockBackupCollection = {
        doc: sinon.stub().callsFake(() => ({
          collection: sinon.stub().withArgs('payload').returns({
            get: sinon.stub().resolves({ docs: mockPayloadDocs })
          })
        }))
      };

      mockInstitutionRef.collection.withArgs('backups').returns(mockBackupCollection);

      const mockBatch = {
        set: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      };
      mockDb.batch = sinon.stub().returns(mockBatch);

      const result = await restoreFromBackup({
        db: mockDb,
        institutionRef: mockInstitutionRef,
        backupId: 'backup123',
        targetCollections: ['assignments'],
        clearExisting: false,
        userId: 'admin'
      });

      // Verify all 3 items from both chunks were restored
      assert.strictEqual(result.restoredCounts.assignments, 3);
    });

    it('should restore only specified target collections', async () => {
      const mockPayloadDocs = [
        {
          id: 'assignments_0000',
          data: () => ({
            items: [
              { id: 'assign1', data: { date: '2025-10-15' } }
            ]
          })
        },
        {
          id: 'residents_0000',
          data: () => ({
            items: [
              { id: 'res1', data: { name: 'Resident 1' } }
            ]
          })
        },
        {
          id: 'attendings_0000',
          data: () => ({
            items: [
              { id: 'att1', data: { name: 'Attending 1' } }
            ]
          })
        }
      ];

      const mockBackupCollection = {
        doc: sinon.stub().callsFake(() => ({
          collection: sinon.stub().withArgs('payload').returns({
            get: sinon.stub().resolves({ docs: mockPayloadDocs })
          })
        }))
      };

      mockInstitutionRef.collection.withArgs('backups').returns(mockBackupCollection);

      const mockBatch = {
        set: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      };
      mockDb.batch = sinon.stub().returns(mockBatch);

      const result = await restoreFromBackup({
        db: mockDb,
        institutionRef: mockInstitutionRef,
        backupId: 'backup123',
        targetCollections: ['assignments', 'residents'], // Only restore these two
        clearExisting: false,
        userId: 'admin'
      });

      // Verify only specified collections were restored
      assert.ok(result.restoredCounts.assignments !== undefined);
      assert.ok(result.restoredCounts.residents !== undefined);
      assert.ok(result.restoredCounts.attendings === undefined);
    });

    it('should create audit log for restore', async () => {
      const mockPayloadDocs = [
        {
          id: 'assignments_0000',
          data: () => ({ items: [] })
        }
      ];

      const mockBackupCollection = {
        doc: sinon.stub().callsFake(() => ({
          collection: sinon.stub().withArgs('payload').returns({
            get: sinon.stub().resolves({ docs: mockPayloadDocs })
          })
        }))
      };

      mockInstitutionRef.collection.withArgs('backups').returns(mockBackupCollection);

      const mockAuditLogs = {
        add: sinon.stub().resolves({ id: 'audit456' })
      };
      mockInstitutionRef.collection.withArgs('auditLogs').returns(mockAuditLogs);

      const mockBatch = {
        set: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      };
      mockDb.batch = sinon.stub().returns(mockBatch);

      await restoreFromBackup({
        db: mockDb,
        institutionRef: mockInstitutionRef,
        backupId: 'backup123',
        targetCollections: ['assignments'],
        clearExisting: false,
        userId: 'restore-user'
      });

      // Verify audit log was created
      assert.ok(mockAuditLogs.add.calledOnce);
      const auditData = mockAuditLogs.add.firstCall.args[0];
      assert.strictEqual(auditData.action, 'restore_from_backup');
      assert.strictEqual(auditData.userId, 'restore-user');
      assert.strictEqual(auditData.data.backupId, 'backup123');
      assert.deepStrictEqual(auditData.data.targets, ['assignments']);
    });

    it('should skip restore for collections with no items', async () => {
      const mockPayloadDocs = [
        {
          id: 'assignments_0000',
          data: () => ({ items: [] }) // Empty collection
        }
      ];

      const mockBackupCollection = {
        doc: sinon.stub().callsFake(() => ({
          collection: sinon.stub().withArgs('payload').returns({
            get: sinon.stub().resolves({ docs: mockPayloadDocs })
          })
        }))
      };

      mockInstitutionRef.collection.withArgs('backups').returns(mockBackupCollection);

      const mockBatch = {
        set: sinon.stub().returnsThis(),
        commit: sinon.stub().resolves()
      };
      mockDb.batch = sinon.stub().returns(mockBatch);

      const result = await restoreFromBackup({
        db: mockDb,
        institutionRef: mockInstitutionRef,
        backupId: 'backup123',
        targetCollections: ['assignments'],
        clearExisting: false,
        userId: 'admin'
      });

      // Verify no batch operations for empty collection
      assert.strictEqual(result.restoredCounts.assignments, 0);
      assert.strictEqual(mockBatch.set.callCount, 0);
    });
  });
});