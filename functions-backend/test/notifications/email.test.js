/**
 * Tests for Email Notification Templates
 */

const { describe, it } = require('mocha');
const assert = require('assert');
const {
  buildAssignmentChangeEmail,
  buildDailyReminderEmail
} = require('../../src/notifications/email');

describe('Email Notifications', () => {
  describe('buildAssignmentChangeEmail', () => {
    it('should build email for assignment creation', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Smith' },
        attending: { name: 'Dr. Jones' },
        siteName: 'Main Hospital',
        siteAddress: '123 Medical St',
        institutionName: 'University Hospital'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.strictEqual(result.subject, 'Schedule Created: 2025-10-15 AM');
      assert.ok(result.html.includes('Schedule Created'));
      assert.ok(result.html.includes('Dr. Smith'));
      assert.ok(result.html.includes('Dr. Jones'));
      assert.ok(result.html.includes('Main Hospital'));
      assert.ok(result.html.includes('123 Medical St'));
      assert.ok(result.html.includes('Clinical'));
      assert.ok(result.text.includes('Clinical'));
    });

    it('should build email for assignment update', () => {
      const params = {
        changeType: 'updated',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'PM',
          type: 'continuity'
        },
        resident: { name: 'Dr. Johnson' },
        attending: { name: 'Dr. Lee' },
        siteName: 'Clinic A',
        institutionName: 'Medical Center'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.strictEqual(result.subject, 'Schedule Updated: 2025-10-15 PM');
      assert.ok(result.html.includes('Schedule Updated'));
      assert.ok(result.html.includes('Continuity Clinic'));
    });

    it('should build email for assignment deletion', () => {
      const params = {
        changeType: 'deleted',
        assignment: {
          date: '2025-10-20',
          timeSlot: 'AM',
          type: 'protected'
        },
        resident: { name: 'Dr. Williams' },
        siteName: 'Clinic B',
        institutionName: 'Healthcare Network'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.strictEqual(result.subject, 'Schedule Deleted: 2025-10-20 AM');
      assert.ok(result.html.includes('Schedule Deleted'));
      assert.ok(result.html.includes('Protected Time'));
    });

    it('should handle missing attending', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'continuity'
        },
        resident: { name: 'Dr. Brown' },
        attending: null, // No attending
        siteName: 'Main Hospital',
        institutionName: 'University Hospital'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.ok(result.html);
      assert.ok(result.text);
      // Should not include attending in email
      assert.ok(!result.html.includes('<strong>Attending:</strong>'));
      assert.ok(!result.text.includes('Attending:'));
    });

    it('should handle missing siteAddress', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Davis' },
        attending: { name: 'Dr. Wilson' },
        siteName: 'Remote Clinic',
        siteAddress: null, // No address
        institutionName: 'Medical Group'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.ok(result.html.includes('Remote Clinic'));
      // Should not include location in email
      assert.ok(!result.html.includes('<strong>Location:</strong>'));
      assert.ok(!result.text.includes('Location:'));
    });

    it('should handle missing resident name', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: {}, // No name
        attending: { name: 'Dr. Martinez' },
        siteName: 'Main Hospital',
        institutionName: 'University Hospital'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.ok(result.html.includes('Dear Resident,'));
    });

    it('should include institution name in HTML footer', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Taylor' },
        attending: { name: 'Dr. Anderson' },
        siteName: 'Main Hospital',
        institutionName: 'Stanford Medical Center'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.ok(result.html.includes('Stanford Medical Center'));
    });

    it('should include link to Clinic Scheduler Pro', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Garcia' },
        attending: { name: 'Dr. Rodriguez' },
        siteName: 'Main Hospital',
        institutionName: 'Medical Center'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.ok(result.html.includes('clinicscheduler.com'));
      assert.ok(result.html.includes('Clinic Scheduler Pro'));
    });

    it('should capitalize change type in subject and body', () => {
      const params = {
        changeType: 'created',
        assignment: {
          date: '2025-10-15',
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Test' },
        siteName: 'Test Hospital',
        institutionName: 'Test Center'
      };

      const result = buildAssignmentChangeEmail(params);

      assert.ok(result.subject.includes('Created'));
      assert.ok(result.html.includes('<h2>Schedule Created</h2>'));
    });
  });

  describe('buildDailyReminderEmail', () => {
    it('should build reminder email with all fields', () => {
      const params = {
        assignment: {
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Kim' },
        attending: { name: 'Dr. Chen' },
        siteName: 'North Campus',
        siteAddress: '456 Health Ave'
      };

      const result = buildDailyReminderEmail(params);

      assert.strictEqual(result.subject, "Today's Schedule: AM - Clinical");
      assert.ok(result.html.includes('Schedule Reminder'));
      assert.ok(result.html.includes('Dr. Kim'));
      assert.ok(result.html.includes('Dr. Chen'));
      assert.ok(result.html.includes('North Campus'));
      assert.ok(result.html.includes('456 Health Ave'));
      assert.ok(result.text.includes('AM Clinical at North Campus'));
    });

    it('should handle continuity clinic type', () => {
      const params = {
        assignment: {
          timeSlot: 'PM',
          type: 'continuity'
        },
        resident: { name: 'Dr. Park' },
        siteName: 'Continuity Clinic'
      };

      const result = buildDailyReminderEmail(params);

      assert.strictEqual(result.subject, "Today's Schedule: PM - Continuity Clinic");
      assert.ok(result.html.includes('Continuity Clinic'));
    });

    it('should handle protected time type', () => {
      const params = {
        assignment: {
          timeSlot: 'AM',
          type: 'protected'
        },
        resident: { name: 'Dr. Singh' },
        siteName: 'Research Center'
      };

      const result = buildDailyReminderEmail(params);

      assert.strictEqual(result.subject, "Today's Schedule: AM - Protected Time");
      assert.ok(result.html.includes('Protected Time'));
    });

    it('should handle missing attending in reminder', () => {
      const params = {
        assignment: {
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Patel' },
        attending: null,
        siteName: 'South Campus'
      };

      const result = buildDailyReminderEmail(params);

      assert.ok(result.html);
      assert.ok(result.text);
      assert.ok(!result.html.includes('<strong>Attending:</strong>'));
    });

    it('should handle missing siteAddress in reminder', () => {
      const params = {
        assignment: {
          timeSlot: 'PM',
          type: 'protected'
        },
        resident: { name: 'Dr. Nguyen' },
        attending: { name: 'Dr. Lopez' },
        siteName: 'Research Lab'
      };

      const result = buildDailyReminderEmail(params);

      assert.ok(result.html.includes('Research Lab'));
      assert.ok(!result.html.includes('<strong>Location:</strong>'));
    });

    it('should handle missing resident name in reminder', () => {
      const params = {
        assignment: {
          timeSlot: 'AM',
          type: 'clinical'
        },
        resident: {},
        attending: { name: 'Dr. Wright' },
        siteName: 'Main Hospital'
      };

      const result = buildDailyReminderEmail(params);

      assert.ok(result.html.includes('Hi Resident,'));
    });

    it('should create both HTML and text versions', () => {
      const params = {
        assignment: {
          timeSlot: 'PM',
          type: 'clinical'
        },
        resident: { name: 'Dr. Lee' },
        attending: { name: 'Dr. Wang' },
        siteName: 'East Clinic',
        siteAddress: '789 Medical Dr'
      };

      const result = buildDailyReminderEmail(params);

      assert.ok(result.subject);
      assert.ok(result.html);
      assert.ok(result.text);
      assert.ok(result.html.length > result.text.length); // HTML should be longer
    });
  });
});