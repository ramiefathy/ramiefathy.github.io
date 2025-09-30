# Cloud Functions for Clinic Scheduler Pro

## Overview

This directory contains all Cloud Functions for the Clinic Scheduler Pro application. These functions provide backend services including auto-scheduling, notifications, PDF generation, analytics, and more.

## Architecture

**Modular Structure** (Refactored September 2025)

The codebase uses a modular architecture with separate files for configuration, utilities, and business logic:

```
functions-backend/
├── src/
│   ├── config/              # Configuration modules
│   │   ├── firebase.js      # Firebase Admin initialization
│   │   └── email.js         # Email service (SendGrid/SMTP)
│   └── utils/               # Utility functions
│       ├── validators.js    # Validation helpers (ACGME, vacations)
│       ├── serialization.js # Firestore serialization for backup
│       ├── arrays.js        # Array utilities (chunking, batching)
│       └── user.js          # User management helpers
├── lib/                     # External utilities
│   └── attending-utils.js   # Attending-specific helpers
├── chatbot/                 # Chatbot integration
│   ├── gemini.js            # Gemini API client
│   ├── action-handlers.js   # Intent handlers
│   └── undo-store.js        # Undo functionality
├── index.js                 # Main Cloud Functions exports (13 functions)
└── REFACTOR-ANALYSIS.md     # Detailed refactoring documentation
```

**Benefits:**
- **Testability**: Isolated modules can be unit tested independently
- **Maintainability**: Smaller files (< 500 lines each) are easier to navigate
- **Reusability**: Utility functions can be imported across multiple functions
- **Collaboration**: Reduced merge conflicts with modular code

See [REFACTOR-ANALYSIS.md](./REFACTOR-ANALYSIS.md) for detailed architecture documentation.

## Functions List

### 1. **autoSchedule**
- Type: HTTPS Callable
- Purpose: Automatically generate schedule assignments based on rules and constraints
- Features:
  - ACGME duty hour compliance checking
  - Continuity clinic preservation
  - Fair distribution algorithm
  - Conflict prevention

### 2. **notifyScheduleChange**
- Type: Firestore Trigger
- Purpose: Send email notifications when assignments are created, updated, or deleted
- Triggers on: `institutions/{institutionId}/assignments/{assignmentId}`

### 3. **validateAssignment**
- Type: Firestore Trigger
- Purpose: Validate new assignments for compliance and conflicts
- Features:
  - Duty hour validation
  - Double-booking prevention
  - Attending capacity enforcement

### 4. **weeklyScheduleGeneration**
- Type: Scheduled Function
- Schedule: Every Sunday at 23:00 EST
- Purpose: Automatically generate next week's schedule for institutions with auto-scheduling enabled

### 5. **dailyReminders**
- Type: Scheduled Function
- Schedule: Every day at 07:00 EST
- Purpose: Send daily schedule reminders to residents

### 6. **generateSchedulePDF**
- Type: HTTPS Callable
- Purpose: Generate PDF reports of schedules
- Returns: Base64 encoded PDF

### 7. **calculateAnalytics**
- Type: HTTPS Callable
- Purpose: Calculate scheduling analytics and fairness metrics
- Features:
  - Duty hour analysis
  - Distribution fairness score
  - Coverage percentages

### 8. **syncWithExternalSystem**
- Type: HTTPS Request (Webhook)
- Purpose: Integration endpoint for external systems
- Actions:
  - Import residents
  - Export schedules
  - Calendar sync

### 9. **exportComplianceData**
- Type: HTTPS Callable
- Purpose: Export data for compliance reporting
- Features:
  - Data anonymization option
  - Audit trail included

### 10. **resolveScheduleConflicts**
- Type: Firestore Trigger
- Purpose: Automatically resolve scheduling conflicts from simultaneous edits

### 11. **dailyBackup**
- Type: Scheduled Function
- Schedule: Every day at 02:00 EST
- Purpose: Create daily backups of institution data

### 12. **restoreFromBackup**
- Type: HTTPS Callable
- Purpose: Restore institution data from a backup

### 13. **chatAssistant**
- Type: HTTPS Callable
- Purpose: Natural language chatbot for schedule management
- Features:
  - Gemini AI integration
  - Intent detection and action handling
  - Undo functionality
  - Context-aware responses

## Setup

### Installation
```bash
npm install
```

### Configuration
Set the following environment variables using Firebase Functions config:

```bash
# Email configuration (optional - for SendGrid)
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set email.from="noreply@yourdomain.com"

# SMTP configuration (optional - fallback for email)
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-app-password"

# Webhook secret (for external integrations)
firebase functions:config:set webhook.secret="your-webhook-secret"
```

### Local Testing

1. Start the Firebase emulators:
```bash
firebase emulators:start --only functions,firestore,auth
```

2. Run tests:
```bash
npm test
```

3. Run linting:
```bash
npm run lint
```

## Deployment

### Deploy all functions:
```bash
firebase deploy --only functions
```

### Deploy specific function:
```bash
firebase deploy --only functions:autoSchedule
```

## Environment Variables

The functions use Firebase config for sensitive data:
- `sendgrid.key` - SendGrid API key for email
- `email.from` - From email address
- `smtp.*` - SMTP configuration for email fallback
- `webhook.secret` - Secret for webhook validation

## Security

- All callable functions require authentication
- Admin functions verify user roles
- Webhook endpoints validate secret tokens
- Audit logs track all operations

## Monitoring

View function logs:
```bash
firebase functions:log
```

View specific function logs:
```bash
firebase functions:log --only autoSchedule
```

## Cost Optimization

Functions are optimized for the free tier:
- Efficient batching of operations
- Minimal external API calls
- Smart caching strategies
- Automatic cleanup of old data

## Error Handling

All functions include:
- Try-catch blocks for error handling
- Detailed error logging
- Graceful degradation
- User-friendly error messages

## Testing

Run the test suite:
```bash
npm test
```

Run specific tests:
```bash
npm test -- --grep "autoSchedule"
```

## Support

For issues or questions:
1. Check function logs for errors
2. Verify Firebase configuration
3. Ensure all services are enabled
4. Check quota usage in Firebase Console

## Maintenance Scripts

- `node scripts/backfill-members.js [--dry-run] [--project <projectId>]` — create missing `/members/{uid}` subcollection documents from the legacy `members` array. Run with `--dry-run` first and supply credentials via Application Default Credentials or a service account.
