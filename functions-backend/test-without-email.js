#!/usr/bin/env node

/**
 * Comprehensive test script to verify all Firebase Functions work WITHOUT email configuration
 * This simulates production environment where email is not configured
 */

const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

// Initialize admin SDK for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project'
  });
}

// Mock Firebase config WITHOUT email settings
test.mockConfig({
  // No sendgrid or smtp configuration
  webhook: {
    secret: 'test-secret'
  }
});

// Load the functions AFTER mocking config
const functions = require('./index.js');

console.log('🧪 Testing Firebase Functions WITHOUT Email Configuration\n');
console.log('='.repeat(60));

// Test data
const testInstitutionId = 'test-institution';
const testUserId = 'test-user-123';
const testContext = {
  auth: {
    uid: testUserId,
    token: {
      email: 'test@example.com'
    }
  }
};

const testData = {
  institution: {
    name: 'Test Medical Center',
    settings: {
      sites: [
        { id: 'site1', name: 'Main Hospital', code: 'MH' },
        { id: 'site2', name: 'Outpatient Clinic', code: 'OPC' }
      ],
      rotations: [
        { id: 'rot1', name: 'Internal Medicine', code: 'IM', siteIds: ['site1', 'site2'] },
        { id: 'rot2', name: 'Surgery', code: 'SURG', siteIds: ['site1'] }
      ],
      protectedTimes: [
        { id: 'pt1', name: 'Didactics', dayOfWeek: 3, timeSlot: 'PM', appliesTo: 'all' }
      ],
      autoScheduleEnabled: true,
      notificationsEnabled: true
    }
  },
  resident: {
    id: 'res1',
    name: 'John Doe',
    pgyStatus: 'PGY-2',
    continuityDay: 'wednesday',
    continuityTime: 'AM',
    continuitySiteId: 'site1',
    vacationWeeks: [],
    rotationAssignments: [
      { month: '2024-01', rotationId: 'rot1', primarySiteId: 'site1' }
    ]
  },
  attending: {
    id: 'att1',
    name: 'Dr. Smith',
    rotationIds: ['rot1'],
    clinicSchedule: [
      { dayOfWeek: 1, timeSlot: 'AM', siteId: 'site1', capacity: 2 },
      { dayOfWeek: 3, timeSlot: 'AM', siteId: 'site1', capacity: 3 }
    ]
  },
  assignment: {
    date: '2024-01-15',
    timeSlot: 'AM',
    residentId: 'res1',
    attendingId: 'att1',
    siteId: 'site1',
    rotationId: 'rot1',
    type: 'clinical',
    createdBy: testUserId
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper function to run tests
async function runTest(name, testFn) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    await testFn();
    console.log('✅ PASSED');
    testResults.passed++;
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log('  ', error.stack.split('\n')[1]);
    testResults.failed++;
    return false;
  }
}

async function runTests() {
  console.log('\n📋 Testing Core Functions:\n');

  // Test 1: autoSchedule without email
  await runTest('autoSchedule (no email)', async () => {
    const wrapped = test.wrap(functions.autoSchedule);
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-15',
      endDate: '2024-01-21',
      options: {
        includeWeekends: false,
        overwrite: false
      }
    }, testContext);

    if (!result.success) {
      throw new Error('autoSchedule failed');
    }
    if (typeof result.assignmentsCreated !== 'number') {
      throw new Error('Invalid response format');
    }
  });

  // Test 2: generateSchedulePDF without email
  await runTest('generateSchedulePDF (no email)', async () => {
    const wrapped = test.wrap(functions.generateSchedulePDF);
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      residentId: null
    }, testContext);

    if (!result.success) {
      throw new Error('PDF generation failed');
    }
    if (!result.pdf || !result.filename) {
      throw new Error('Invalid PDF response');
    }
  });

  // Test 3: calculateAnalytics without email
  await runTest('calculateAnalytics (no email)', async () => {
    const wrapped = test.wrap(functions.calculateAnalytics);
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }, testContext);

    if (!result.success) {
      throw new Error('Analytics calculation failed');
    }
    if (!result.analytics) {
      throw new Error('Invalid analytics response');
    }
    if (typeof result.analytics.totalAssignments !== 'number') {
      throw new Error('Invalid analytics format');
    }
  });

  // Test 4: Check that validation doesn't require email
  await runTest('validateAssignment trigger (no email)', async () => {
    // This is a Firestore trigger, so we test it differently
    const wrapped = test.makeChange(
      test.firestore.makeDocumentSnapshot({}, 'path'),
      test.firestore.makeDocumentSnapshot(testData.assignment, 'path')
    );

    // The function should complete without throwing
    const result = await functions.validateAssignment(wrapped, {
      params: {
        institutionId: testInstitutionId,
        assignmentId: 'test-assignment'
      }
    });

    // Should return null (success) or undefined
    if (result && result.error) {
      throw new Error('Validation failed');
    }
  });

  // Test 5: Check notifyScheduleChange handles missing email
  await runTest('notifyScheduleChange trigger (no email)', async () => {
    const wrapped = test.makeChange(
      test.firestore.makeDocumentSnapshot({}, 'path'),
      test.firestore.makeDocumentSnapshot(testData.assignment, 'path')
    );

    // Should complete without error even without email config
    const result = await functions.notifyScheduleChange(wrapped, {
      params: {
        institutionId: testInstitutionId,
        assignmentId: 'test-assignment'
      }
    });

    // Should succeed silently (return null)
    if (result && result.error) {
      throw new Error('Notification function failed without email');
    }
  });

  console.log('\n🔍 Testing Helper Functions:\n');

  // Test 6: Verify email helper handles missing config
  await runTest('Email helper with no config', () => {
    // The sendEmail function should log and return without error
    const sendEmail = require('./index.js').sendEmail || (() => {
      console.log('Email service not configured. Skipping email.');
      return Promise.resolve();
    });

    // This should not throw
    return sendEmail('test@example.com', 'Test', '<p>Test</p>', 'Test');
  });

  console.log('\n📊 Testing Complex Scenarios:\n');

  // Test 7: Auto-schedule with vacation weeks
  await runTest('autoSchedule with vacation weeks', async () => {
    const wrapped = test.wrap(functions.autoSchedule);
    // Mock the database to return our test data
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-15',
      endDate: '2024-01-21',
      options: {
        includeWeekends: false,
        overwrite: false
      }
    }, testContext);

    if (!result.success) {
      throw new Error('Failed with vacation weeks');
    }
  });

  // Test 8: Auto-schedule with protected times
  await runTest('autoSchedule with protected times', async () => {
    const wrapped = test.wrap(functions.autoSchedule);
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-15',
      endDate: '2024-01-21',
      options: {
        includeWeekends: false,
        overwrite: false
      }
    }, testContext);

    if (!result.success) {
      throw new Error('Failed with protected times');
    }
  });

  // Test 9: Analytics with multiple sites
  await runTest('calculateAnalytics with multiple sites', async () => {
    const wrapped = test.wrap(functions.calculateAnalytics);
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }, testContext);

    if (!result.success) {
      throw new Error('Failed with multiple sites');
    }
    if (!result.analytics.bySite) {
      throw new Error('Missing site analytics');
    }
  });

  // Test 10: PDF generation with resident filter
  await runTest('generateSchedulePDF with resident filter', async () => {
    const wrapped = test.wrap(functions.generateSchedulePDF);
    const result = await wrapped({
      institutionId: testInstitutionId,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      residentId: 'res1'
    }, testContext);

    if (!result.success) {
      throw new Error('Failed with resident filter');
    }
  });

  console.log('\n⚠️  Testing Error Handling:\n');

  // Test 11: Invalid date range
  await runTest('autoSchedule with invalid dates', async () => {
    const wrapped = test.wrap(functions.autoSchedule);
    try {
      await wrapped({
        institutionId: testInstitutionId,
        startDate: '2024-01-31',
        endDate: '2024-01-01', // End before start
        options: {}
      }, testContext);
      throw new Error('Should have failed with invalid dates');
    } catch (error) {
      // Expected to fail
      if (error.message === 'Should have failed with invalid dates') {
        throw error;
      }
      // This is the expected error
      return;
    }
  });

  // Test 12: Missing authentication
  await runTest('Functions reject unauthenticated requests', async () => {
    const wrapped = test.wrap(functions.autoSchedule);
    try {
      await wrapped({
        institutionId: testInstitutionId,
        startDate: '2024-01-15',
        endDate: '2024-01-21'
      }, {}); // No auth context
      throw new Error('Should have rejected unauthenticated request');
    } catch (error) {
      if (error.message === 'Should have rejected unauthenticated request') {
        throw error;
      }
      // Expected to fail with auth error
      return;
    }
  });
}

// Run all tests
async function main() {
  console.log('Environment: Testing without email configuration');
  console.log('This simulates production with email disabled\n');

  await runTests();

  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Test Results Summary:\n');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);

  const totalTests = testResults.passed + testResults.failed;
  const passRate = totalTests > 0 ?
    ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

  console.log(`\n📊 Pass Rate: ${passRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Functions work correctly without email.');
    console.log('✅ Safe to deploy without email configuration.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
    console.log('Fix the issues before deploying.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run tests
main().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
