/**
 * Email Service Configuration
 * Configures SendGrid or SMTP fallback for sending emails
 */

const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Email configuration from Firebase environment
const SENDGRID_API_KEY = functions.config().sendgrid?.key;
const EMAIL_FROM = functions.config().email?.from || 'noreply@clinicscheduler.com';

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Configure SMTP transporter for nodemailer (fallback)
const mailTransporter = nodemailer.createTransport({
  host: functions.config().smtp?.host || 'smtp.gmail.com',
  port: functions.config().smtp?.port || 587,
  secure: false,
  auth: {
    user: functions.config().smtp?.user,
    pass: functions.config().smtp?.pass
  }
});

/**
 * Send email notification using SendGrid or SMTP fallback
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @param {string} text - Plain text email body
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, html, text) {
  try {
    if (SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: EMAIL_FROM,
        subject,
        text,
        html
      });
    } else if (functions.config().smtp?.user) {
      await mailTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html
      });
    } else {
      console.log('Email service not configured. Skipping email to:', to);
      return;
    }
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - allow functions to continue even if email fails
  }
}

module.exports = {
  sendEmail,
  EMAIL_FROM,
  SENDGRID_API_KEY
};