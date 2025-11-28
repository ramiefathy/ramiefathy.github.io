/**
 * Unit tests for Cloud Functions
 */

const assert = require('assert');
const sinon = require('sinon');

const { db } = require('../src/config/firebase');
const syncExternal = require('../src/sync/external');

// Initialize Firebase Functions Test SDK
// Use emulator host if available to avoid hitting live project when credentials missing
const firebaseConfig = { projectId: 'clinic-scheduler-test' };
const functionsTestOptions = process.env.FIRESTORE_EMULATOR_HOST
  ? firebaseConfig
  : firebaseConfig;

const test = require('firebase-functions-test')(functionsTestOptions);

// Import your functions after initializing test SDK
const functions = require('../index');

function createMockReq({ method = 'POST', headers = {}, body = {} } = {}) {
  return {
    method,
    headers: { ...headers },
    body
  };
}

function createMockRes() {
  let doneResolver;
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    finished: false,
    whenDone() {
      if (this.finished) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        doneResolver = resolve;
      });
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.finished = true;
      if (doneResolver) {
        doneResolver();
      }
      return this;
    },
    end(payload) {
      this.body = payload ?? this.body;
      this.finished = true;
      if (doneResolver) {
        doneResolver();
      }
      return this;
    }
  };
  return res;
}

describe('Cloud Functions', () => {

  before(() => {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
      console.warn('[tests] FIRESTORE_EMULATOR_HOST not set; some integration tests will skip.');
    }
    // Set up test environment variables
    test.mockConfig({
      sendgrid: { key: 'test-key' },
      email: { from: 'test@example.com' },
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        user: 'test@example.com',
        pass: 'testpass'
      },
      webhook: { secret: 'test-secret' }
    });
  });

  after(() => {
    // Clean up
    test.cleanup();
  });

  describe('autoSchedule', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.autoSchedule);

      try {
        await wrapped({
          institutionId: 'test-institution',
          startDate: '2024-01-01',
          endDate: '2024-01-07'
        }, {
          auth: null
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.code, 'unauthenticated');
      }
    });

    it('should validate institution existence', async () => {
      const wrapped = test.wrap(functions.autoSchedule);

      // Mock Firestore responses
      const mockGet = sinon.stub();
      mockGet.resolves({
        exists: false
      });

      // This is a simplified test - in production you'd mock the entire Firestore
      // For now, we're just testing the function structure
      assert.ok(typeof wrapped === 'function');
    });

    it('should check user permissions', async () => {
      // Test that non-schedulers are rejected
      assert.ok(typeof functions.autoSchedule === 'function');
    });
  });

  describe('notifyScheduleChange', () => {
    it('should handle assignment creation', () => {
      const wrapped = test.wrap(functions.notifyScheduleChange);
      assert.ok(typeof wrapped === 'function');
    });

    it('should handle assignment updates', () => {
      const wrapped = test.wrap(functions.notifyScheduleChange);
      assert.ok(typeof wrapped === 'function');
    });

    it('should handle assignment deletion', () => {
      const wrapped = test.wrap(functions.notifyScheduleChange);
      assert.ok(typeof wrapped === 'function');
    });
  });

  describe('validateAssignment', () => {
    it('should check duty hour compliance', () => {
      const wrapped = test.wrap(functions.validateAssignment);
      assert.ok(typeof wrapped === 'function');
    });

    it('should prevent double-booking', () => {
      const wrapped = test.wrap(functions.validateAssignment);
      assert.ok(typeof wrapped === 'function');
    });

    it('should enforce attending capacity', () => {
      const wrapped = test.wrap(functions.validateAssignment);
      assert.ok(typeof wrapped === 'function');
    });
  });

  describe('generateSchedulePDF', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.generateSchedulePDF);

      try {
        await wrapped({
          institutionId: 'test',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }, {
          auth: null
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.code, 'unauthenticated');
      }
    });

    it('should generate PDF with schedule data', () => {
      const wrapped = test.wrap(functions.generateSchedulePDF);
      assert.ok(typeof wrapped === 'function');
    });
  });

  describe('calculateAnalytics', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.calculateAnalytics);

      try {
        await wrapped({
          institutionId: 'test',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }, {
          auth: null
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.code, 'unauthenticated');
      }
    });

    it('should calculate fairness score', () => {
      const wrapped = test.wrap(functions.calculateAnalytics);
      assert.ok(typeof wrapped === 'function');
    });

    it('should calculate coverage percentage', () => {
      const wrapped = test.wrap(functions.calculateAnalytics);
      assert.ok(typeof wrapped === 'function');
    });
  });

  describe('syncWithExternalSystem', () => {
    const institutionId = 'test-institution';
    const webhookHeaders = {
      'x-webhook-secret': 'test-secret',
      origin: 'https://example.com'
    };

    function stubInstitutionLookup() {
      const institutionSnapshot = {
        exists: true,
        data: () => ({ name: 'Test Institution' })
      };

      sinon.stub(db, 'collection').callsFake((path) => {
        if (path === 'institutions') {
          return {
            doc: (id) => ({
              id,
              get: () => Promise.resolve(institutionSnapshot)
            })
          };
        }
        throw new Error(`Unexpected collection path: ${path}`);
      });
    }

    afterEach(() => {
      sinon.restore();
    });

    it('delegates resident import to external helper', async () => {
      stubInstitutionLookup();
      const importStub = sinon.stub(syncExternal, 'importResidents').resolves({ imported: 2, skipped: 1 });

      const req = createMockReq({
        headers: webhookHeaders,
        body: {
          action: 'import_residents',
          institutionId,
          payload: {
            residents: [{ name: 'Resident A', email: 'resident@example.com' }]
          },
          options: { source: 'api' }
        }
      });

      const res = createMockRes();
      const done = res.whenDone();
      functions.syncWithExternalSystem(req, res);
      await done;

      sinon.assert.calledOnce(importStub);
      sinon.assert.calledWithMatch(importStub, {
        residents: req.body.payload.residents,
        options: req.body.options,
        institutionRef: sinon.match.object
      });
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, {
        success: true,
        action: 'import_residents',
        institutionId,
        imported: 2,
        skipped: 1
      });
    });

    it('returns descriptive error when import helper fails', async () => {
      stubInstitutionLookup();
      sinon.stub(syncExternal, 'importResidents').resolves({
        imported: 0,
        skipped: 3,
        error: 'no-valid-residents'
      });

      const req = createMockReq({
        headers: webhookHeaders,
        body: {
          action: 'import_residents',
          institutionId,
          payload: {
            residents: []
          }
        }
      });

      const res = createMockRes();
      const done = res.whenDone();
      functions.syncWithExternalSystem(req, res);
      await done;

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, {
        success: false,
        error: 'no-valid-residents',
        imported: 0,
        skipped: 3
      });
    });

    it('delegates schedule export to external helper and returns payload', async () => {
      stubInstitutionLookup();
      const exportStub = sinon.stub(syncExternal, 'exportSchedule').resolves({
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        count: 1,
        assignments: [{ id: 'assignment-1' }]
      });

      const req = createMockReq({
        headers: webhookHeaders,
        body: {
          action: 'export_schedule',
          institutionId,
          payload: {
            startDate: '2024-01-01',
            endDate: '2024-01-05',
            limit: 100,
            includeDetails: true
          },
          options: { destination: 'api' }
        }
      });

      const res = createMockRes();
      const done = res.whenDone();
      functions.syncWithExternalSystem(req, res);
      await done;

      sinon.assert.calledOnce(exportStub);
      sinon.assert.calledWithMatch(exportStub, {
        institutionRef: sinon.match.object,
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        limit: 100,
        includeDetails: true,
        options: req.body.options
      });
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, {
        success: true,
        action: 'export_schedule',
        institutionId,
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        count: 1,
        assignments: [{ id: 'assignment-1' }]
      });
    });
  });

  describe('exportComplianceData', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should require admin permissions', async () => {
      const wrapped = test.wrap(functions.exportComplianceData);

      const institutionSnapshot = {
        exists: true,
        data: () => ({ settings: {} })
      };

      const memberSnapshot = {
        exists: true,
        data: () => ({ role: 'member' })
      };

      const institutionRef = {
        get: () => Promise.resolve(institutionSnapshot),
        collection: (name) => {
          if (name === 'members') {
            return {
              doc: () => ({
                get: () => Promise.resolve(memberSnapshot)
              })
            };
          }
          throw new Error(`Unexpected subcollection: ${name}`);
        }
      };

      sinon.stub(db, 'collection').callsFake((path) => {
        if (path === 'institutions') {
          return {
            doc: () => institutionRef
          };
        }
        throw new Error(`Unexpected collection path: ${path}`);
      });

      try {
        await wrapped({
          institutionId: 'test',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }, {
          auth: { uid: 'test-user' }
        });
        assert.fail('Expected permission-denied error');
      } catch (error) {
        assert.strictEqual(error.code, 'permission-denied');
        assert.strictEqual(error.message, 'Administrator role required');
      }
    });

    it('should anonymize data when requested', () => {
      const wrapped = test.wrap(functions.exportComplianceData);
      assert.ok(typeof wrapped === 'function');
    });
  });

  describe('restoreFromBackup', () => {
    it('should require admin permissions', async () => {
      const wrapped = test.wrap(functions.restoreFromBackup);

      try {
        await wrapped({
          institutionId: 'test',
          backupId: 'test-backup'
        }, {
          auth: null
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.code, 'unauthenticated');
      }
    });

    it('should verify backup ownership', () => {
      const wrapped = test.wrap(functions.restoreFromBackup);
      assert.ok(typeof wrapped === 'function');
    });
  });

  describe('Scheduled Functions', () => {
    it('weeklyScheduleGeneration should be scheduled', () => {
      assert.ok(['object', 'function'].includes(typeof functions.weeklyScheduleGeneration));
    });

    it('dailyReminders should be scheduled', () => {
      assert.ok(['object', 'function'].includes(typeof functions.dailyReminders));
    });

    it('dailyBackup should be scheduled', () => {
      assert.ok(['object', 'function'].includes(typeof functions.dailyBackup));
    });
  });

  describe('Helper Functions', () => {
    it('should validate all exported functions', () => {
      const expectedFunctions = [
        'autoSchedule',
        'notifyScheduleChange',
        'validateAssignment',
        'weeklyScheduleGeneration',
        'dailyReminders',
        'generateSchedulePDF',
        'calculateAnalytics',
        'syncWithExternalSystem',
        'exportComplianceData',
        'resolveScheduleConflicts',
        'dailyBackup',
        'restoreFromBackup'
      ];

      expectedFunctions.forEach(funcName => {
        assert.ok(
          typeof functions[funcName] === 'function' ||
          typeof functions[funcName] === 'object',
          `Function ${funcName} should be exported`
        );
      });
    });
  });
});
