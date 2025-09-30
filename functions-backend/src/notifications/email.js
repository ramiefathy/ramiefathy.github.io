/**
 * Email Notification Templates
 * Functions for building and sending email notifications
 */

const { sendEmail } = require('../config/email');
const { getUserDetails, describeAssignmentType } = require('../utils/user');

/**
 * Build assignment change notification email
 * @param {Object} params - Email parameters
 * @returns {Object} Email content { subject, html, text }
 */
function buildAssignmentChangeEmail(params) {
  const { changeType, assignment, resident, attending, siteName, siteAddress, institutionName } = params;

  const assignmentType = describeAssignmentType(assignment.type);
  const formattedChange = changeType.charAt(0).toUpperCase() + changeType.slice(1);

  const subject = `Schedule ${formattedChange}: ${assignment.date} ${assignment.timeSlot}`;

  const htmlParts = [
    `<h2>Schedule ${formattedChange}</h2>`,
    `<p>Dear ${resident.name || 'Resident'},</p>`,
    `<p>Your schedule has been ${changeType}:</p>`,
    '<ul>',
    `<li><strong>Date:</strong> ${assignment.date}</li>`,
    `<li><strong>Time:</strong> ${assignment.timeSlot}</li>`,
    `<li><strong>Type:</strong> ${assignmentType}</li>`
  ];

  if (attending) {
    htmlParts.push(`<li><strong>Attending:</strong> ${attending.name}</li>`);
  }

  htmlParts.push(`<li><strong>Site:</strong> ${siteName}</li>`);

  if (siteAddress) {
    htmlParts.push(`<li><strong>Location:</strong> ${siteAddress}</li>`);
  }

  htmlParts.push('</ul>');
  htmlParts.push(
    '<p>Please log in to <a href="https://clinicscheduler.com">Clinic Scheduler Pro</a>',
    'to view your complete schedule.</p>'
  );
  htmlParts.push('<hr>');
  htmlParts.push(`<p><small>${institutionName}</small></p>`);

  const html = htmlParts.join('\n');

  const textLines = [
    `Schedule ${formattedChange}: ${assignment.date} ${assignment.timeSlot}`,
    `Type: ${assignmentType}`
  ];

  if (attending) {
    textLines.push(`Attending: ${attending.name}`);
  }

  textLines.push(`Site: ${siteName}`);

  if (siteAddress) {
    textLines.push(`Location: ${siteAddress}`);
  }

  const text = textLines.join('\n');

  return { subject, html, text };
}

/**
 * Build daily reminder email
 * @param {Object} params - Email parameters
 * @returns {Object} Email content { subject, html, text }
 */
function buildDailyReminderEmail(params) {
  const { assignment, resident, attending, siteName, siteAddress } = params;

  const assignmentType = describeAssignmentType(assignment.type);

  const subject = `Today's Schedule: ${assignment.timeSlot} - ${assignmentType}`;

  const htmlParts = [
    '<h2>Schedule Reminder</h2>',
    `<p>Hi ${resident.name || 'Resident'},</p>`,
    '<p>This is a reminder about your assignment today:</p>',
    '<ul>',
    `<li><strong>Time:</strong> ${assignment.timeSlot}</li>`,
    `<li><strong>Type:</strong> ${assignmentType}</li>`
  ];

  if (attending) {
    htmlParts.push(`<li><strong>Attending:</strong> ${attending.name}</li>`);
  }

  htmlParts.push(`<li><strong>Site:</strong> ${siteName}</li>`);

  if (siteAddress) {
    htmlParts.push(`<li><strong>Location:</strong> ${siteAddress}</li>`);
  }

  htmlParts.push('</ul>');

  const html = htmlParts.join('\n');
  const text = `Reminder: ${assignment.timeSlot} ${assignmentType} at ${siteName}`;

  return { subject, html, text };
}

/**
 * Send assignment change notification
 * @param {Object} params - Notification parameters
 */
async function sendAssignmentChangeNotification(params) {
  const {
    changeType,
    assignment,
    resident,
    attending,
    siteName,
    siteAddress,
    institutionName,
    residentMemberId
  } = params;

  const userDetails = await getUserDetails(residentMemberId);

  if (!userDetails || !userDetails.email) {
    console.log('No email found for user');
    return;
  }

  const emailContent = buildAssignmentChangeEmail({
    changeType,
    assignment,
    resident,
    attending,
    siteName,
    siteAddress,
    institutionName
  });

  await sendEmail(
    userDetails.email,
    emailContent.subject,
    emailContent.html,
    emailContent.text
  );
}

/**
 * Send daily reminder notification
 * @param {Object} params - Reminder parameters
 */
async function sendDailyReminderNotification(params) {
  const { assignment, resident, attending, siteName, siteAddress, residentMemberId } = params;

  const userDetails = await getUserDetails(residentMemberId);

  if (!userDetails || !userDetails.email) {
    return;
  }

  const emailContent = buildDailyReminderEmail({
    assignment,
    resident,
    attending,
    siteName,
    siteAddress
  });

  await sendEmail(
    userDetails.email,
    emailContent.subject,
    emailContent.html,
    emailContent.text
  );
}

module.exports = {
  buildAssignmentChangeEmail,
  buildDailyReminderEmail,
  sendAssignmentChangeNotification,
  sendDailyReminderNotification
};