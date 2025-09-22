#!/usr/bin/env node

/**
 * Test script for Firebase Functions
 * Run this to verify configuration and syntax
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Testing Firebase Functions Configuration\n');

// Check if index.js exists
if (!fs.existsSync('index.js')) {
  console.log('❌ index.js not found');
  process.exit(1);
}

console.log('✅ index.js found\n');

// Test JavaScript syntax
console.log('Testing JavaScript syntax...');
try {
  execSync('node -c index.js', { stdio: 'pipe' });
  console.log('✅ JavaScript syntax is valid\n');
} catch (error) {
  console.log('❌ JavaScript syntax error:');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  process.exit(1);
}

// Read the file and check for required function exports
const fileContent = fs.readFileSync('index.js', 'utf8');

const requiredFunctions = [
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

console.log('Checking function exports:');
let allFunctionsPresent = true;

requiredFunctions.forEach(fnName => {
  // Check if function is exported
  const exportPattern = new RegExp(`exports\\.${fnName}\\s*=`, 'g');
  if (fileContent.match(exportPattern)) {
    console.log(`✅ ${fnName} - Found and exported`);
  } else {
    console.log(`❌ ${fnName} - Not found or not exported`);
    allFunctionsPresent = false;
  }
});

// Check dependencies
console.log('\n📦 Checking dependencies:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'firebase-functions',
  'firebase-admin',
  'cors',
  'date-fns',
  'pdfkit',
  '@sendgrid/mail',
  'nodemailer'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} - Listed in package.json`);
  } else {
    console.log(`❌ ${dep} - Not in package.json`);
  }
});

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('\n✅ node_modules directory exists (dependencies installed)');
} else {
  console.log('\n⚠️  node_modules not found - run "npm install"');
}

// Count function types in the code
const httpsCallableCount = (fileContent.match(/functions\.https\.onCall/g) || []).length;
const firestoreTriggerCount = (fileContent.match(/functions\.firestore/g) || []).length;
const pubsubScheduleCount = (fileContent.match(/functions\.pubsub\.schedule/g) || []).length;

console.log('\n📊 Function Statistics:');
console.log(`HTTPS Callable functions: ${httpsCallableCount}`);
console.log(`Firestore trigger functions: ${firestoreTriggerCount}`);
console.log(`Scheduled (Pub/Sub) functions: ${pubsubScheduleCount}`);
const httpsRequestCount = (fileContent.match(/functions\.https\.onRequest/g) || []).length;
console.log(`HTTPS request handlers: ${httpsRequestCount}`);
console.log(`Total functions exported: ${requiredFunctions.filter(fn =>
  fileContent.includes(`exports.${fn}`)).length}`);

// Check for environment variable usage
const usesConfig = fileContent.includes('functions.config()');
console.log('\n🔧 Configuration:');
if (usesConfig) {
  console.log('✅ Uses Firebase environment config');
  console.log('   Required configs:');

  if (fileContent.includes('sendgrid.key')) {
    console.log('   - sendgrid.key (for SendGrid email)');
  }
  if (fileContent.includes('smtp.host')) {
    console.log('   - smtp.* (for SMTP email)');
  }
  if (fileContent.includes('webhook.secret')) {
    console.log('   - webhook.secret (for webhooks)');
  }
  if (fileContent.includes('email.from')) {
    console.log('   - email.from (sender email)');
  }
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFunctionsPresent) {
  console.log('✅ All functions are properly defined!');
  console.log('\n📌 Next steps for deployment:');
  console.log('1. Configure environment variables:');
  console.log('   firebase functions:config:set sendgrid.key="YOUR_KEY"');
  console.log('   firebase functions:config:set email.from="noreply@domain.com"');
  console.log('\n2. Deploy functions:');
  console.log('   firebase deploy --only functions');
  console.log('\n3. Monitor deployment:');
  console.log('   firebase functions:log --follow');
  process.exit(0);
} else {
  console.log('❌ Some functions are missing or misconfigured.');
  console.log('Please review the errors above.');
  process.exit(1);
}
