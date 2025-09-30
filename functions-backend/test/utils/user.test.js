/**
 * Tests for User Utilities
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const assert = require('assert');
const sinon = require('sinon');
const { getUserDetails, describeAssignmentType } = require('../../src/utils/user');
const { auth } = require('../../src/config/firebase');

describe('User Utilities', () => {
  describe('describeAssignmentType', () => {
    it('should return "Continuity Clinic" for continuity type (default variant)', () => {
      const result = describeAssignmentType('continuity');
      assert.strictEqual(result, 'Continuity Clinic');
    });

    it('should return "Continuity" for continuity type (short variant)', () => {
      const result = describeAssignmentType('continuity', { variant: 'short' });
      assert.strictEqual(result, 'Continuity');
    });

    it('should return "Protected Time" for protected type (default variant)', () => {
      const result = describeAssignmentType('protected');
      assert.strictEqual(result, 'Protected Time');
    });

    it('should return "Protected" for protected type (short variant)', () => {
      const result = describeAssignmentType('protected', { variant: 'short' });
      assert.strictEqual(result, 'Protected');
    });

    it('should return "Clinical" for clinical type (default variant)', () => {
      const result = describeAssignmentType('clinical');
      assert.strictEqual(result, 'Clinical');
    });

    it('should return "Clinical" for clinical type (short variant)', () => {
      const result = describeAssignmentType('clinical', { variant: 'short' });
      assert.strictEqual(result, 'Clinical');
    });

    it('should return "Clinical" for unknown types', () => {
      const result = describeAssignmentType('unknown-type');
      assert.strictEqual(result, 'Clinical');
    });

    it('should return "Clinical" for empty string', () => {
      const result = describeAssignmentType('');
      assert.strictEqual(result, 'Clinical');
    });

    it('should return "Clinical" for null', () => {
      const result = describeAssignmentType(null);
      assert.strictEqual(result, 'Clinical');
    });

    it('should handle missing options parameter', () => {
      const result = describeAssignmentType('continuity');
      assert.strictEqual(result, 'Continuity Clinic');
    });

    it('should handle empty options object', () => {
      const result = describeAssignmentType('continuity', {});
      assert.strictEqual(result, 'Continuity Clinic');
    });
  });

  describe('getUserDetails', () => {
    let authStub;

    beforeEach(() => {
      authStub = sinon.stub(auth, 'getUser');
    });

    afterEach(() => {
      authStub.restore();
    });

    it('should return user details with email and displayName', async () => {
      authStub.resolves({
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const result = await getUserDetails('user123');

      assert.deepStrictEqual(result, {
        email: 'test@example.com',
        displayName: 'Test User',
        uid: 'user123'
      });
    });

    it('should use email username as displayName if displayName is missing', async () => {
      authStub.resolves({
        uid: 'user123',
        email: 'john.doe@example.com',
        displayName: null
      });

      const result = await getUserDetails('user123');

      assert.deepStrictEqual(result, {
        email: 'john.doe@example.com',
        displayName: 'john.doe',
        uid: 'user123'
      });
    });

    it('should handle user with displayName but special email', async () => {
      authStub.resolves({
        uid: 'user456',
        email: 'user+test@example.com',
        displayName: 'Jane Smith'
      });

      const result = await getUserDetails('user456');

      assert.deepStrictEqual(result, {
        email: 'user+test@example.com',
        displayName: 'Jane Smith',
        uid: 'user456'
      });
    });

    it('should return null if user is not found', async () => {
      authStub.rejects(new Error('User not found'));

      const result = await getUserDetails('nonexistent');

      assert.strictEqual(result, null);
    });

    it('should return null on authentication error', async () => {
      authStub.rejects(new Error('Permission denied'));

      const result = await getUserDetails('user123');

      assert.strictEqual(result, null);
    });

    it('should handle empty displayName string', async () => {
      authStub.resolves({
        uid: 'user789',
        email: 'empty@example.com',
        displayName: ''
      });

      const result = await getUserDetails('user789');

      assert.deepStrictEqual(result, {
        email: 'empty@example.com',
        displayName: 'empty',
        uid: 'user789'
      });
    });

    it('should call auth.getUser with correct userId', async () => {
      authStub.resolves({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test'
      });

      await getUserDetails('test-uid');

      assert.ok(authStub.calledOnce);
      assert.ok(authStub.calledWith('test-uid'));
    });

    it('should handle users with undefined displayName', async () => {
      authStub.resolves({
        uid: 'user999',
        email: 'undef@example.com'
        // displayName is undefined
      });

      const result = await getUserDetails('user999');

      assert.deepStrictEqual(result, {
        email: 'undef@example.com',
        displayName: 'undef',
        uid: 'user999'
      });
    });
  });
});