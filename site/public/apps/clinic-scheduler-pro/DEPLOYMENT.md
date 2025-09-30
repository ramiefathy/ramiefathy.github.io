# Clinic Scheduler Pro - Deployment Guide

## Prerequisites

- Node.js 20.x or higher
- Firebase project with:
  - Authentication (Email/Password enabled)
  - Firestore Database
  - Cloud Functions (Node.js 20 runtime)
- npm or yarn package manager

## Environment Configuration

### Firebase Configuration

The Firebase configuration is embedded in `index.html`. Update these values for your project:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Required Environment Variables

For Cloud Functions in `/functions-backend/`:

- `GEMINI_API_KEY` - Google Gemini API key for chat assistant
- Firebase service account credentials (auto-provisioned in Firebase environment)

## Build Process

```bash
# Install dependencies
npm install

# Development build with hot reload
npm run dev

# Production build
npm run build
```

Build artifacts are output to `/assets/`:
- `main.js` - Main application bundle
- `main-animated.js` - Animated version
- `styles/index` - CSS bundle
- `chunks/` - Vendor and utility chunks

## Firestore Security Rules

Deploy the security rules from `firestore-rules.txt`:

```bash
firebase deploy --only firestore:rules
```

### Role-Based Access Control

The application uses a 5-tier RBAC system:

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all features |
| `program_admin` | Manage institution settings, members, schedules |
| `chief_resident` | Manage schedules, view settings |
| `scheduler` | Create and modify assignments |
| `member` | Read-only access |

### Critical Security Notes

1. **Member Subcollection Sync**: Security rules check `/institutions/{id}/members/{uid}` subcollection. The application maintains sync between the embedded `members[]` array and subcollection documents.

2. **Last Admin Protection**: The application prevents removing or demoting the last admin-level member from an institution.

3. **Batch Operations**: Invitation redemption uses Firestore batched writes for atomicity.

## Cloud Functions

Deploy Cloud Functions from `/functions-backend/`:

```bash
cd /functions-backend
firebase deploy --only functions
```

### Available Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `processScheduleRequest` | HTTPS Callable | AI-powered schedule generation |
| `sendNotification` | Firestore trigger | Email/push notifications |
| `generateReport` | HTTPS Callable | Export reports |
| `validateACGME` | HTTPS Callable | ACGME compliance validation |

## Data Model

### Collections Structure

```
/institutions/{institutionId}
  - name: string
  - members: array (embedded, for backward compatibility)
  - settings: object
  - createdBy: uid
  - createdAt: timestamp

/institutions/{institutionId}/members/{uid}
  - userId: string
  - email: string
  - name: string
  - role: string
  - joinedAt: timestamp
  - updatedAt: timestamp

/institutions/{institutionId}/attendings/{attendingId}
  - name: string
  - email: string
  - rotationIds: array
  - clinics: array
  - scheduleOverrides: array

/institutions/{institutionId}/residents/{residentId}
  - name: string
  - email: string
  - phone: string
  - pgyStatus: string
  - continuityDay: string
  - continuityTime: string
  - continuitySiteId: string
  - vacationWeeks: array

/institutions/{institutionId}/assignments/{assignmentId}
  - date: string (YYYY-MM-DD)
  - timeSlot: string (AM/PM)
  - residentId: string
  - attendingId: string
  - clinicId: string
  - siteId: string
  - rotationId: string
  - type: string (clinical/continuity/didactics/protected)
  - status: string (active/cancelled/pending)
  - notes: string
  - virtual: boolean
```

## ACGME Compliance

The application enforces ACGME duty hour limits:

- **Weekly Hours**: Maximum 80 hours/week (warning at 70h)
- **Consecutive Days**: Maximum 6 consecutive duty days (warning at 5)
- **Exclusions**: Virtual assignments (continuity clinics, protected times) are excluded from calculations

### Configuration

Limits are automatically loaded from institution settings (`institution.settings.acgme`):

```javascript
// Institution settings structure
{
  settings: {
    acgme: {
      maxWeeklyHours: 80,        // Default: 80
      weeklyHoursWarning: 70,    // Default: 70
      hoursPerHalfDay: 4,        // Default: 4
      maxConsecutiveDays: 6,     // Default: 6
      consecutiveDaysWarning: 5  // Default: 5
    }
  }
}
```

If no custom settings are configured, standard ACGME defaults are used.

## Static Hosting

The application can be hosted on any static file server:

1. Build the production bundle: `npm run build`
2. Deploy contents of the application directory
3. Ensure `index.html` is served for all routes (SPA)

### Firebase Hosting Configuration

```json
{
  "hosting": {
    "public": "site/public/apps/clinic-scheduler-pro",
    "ignore": ["node_modules/**", "src/**", "*.jsx"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

## Monitoring and Maintenance

### Audit Logging

All data modifications are logged to `/institutions/{id}/auditLog`:

- Member role changes
- Assignment modifications
- Settings updates
- Import/export operations

### Performance Considerations

- Bundle is split into vendor chunks for caching
- Firebase offline persistence is enabled
- Virtual assignments are generated client-side for performance

## Troubleshooting

### Common Issues

1. **"Not a member" error on login**
   - Member subcollection document may be missing
   - Application self-heals by creating missing documents

2. **Role changes not reflecting**
   - Both embedded array and subcollection must be in sync
   - Check Firestore rules allow the operation

3. **ACGME warnings incorrect**
   - Verify virtual assignments have `virtual: true` flag
   - Check assignment `type` field

### Debug Mode

Enable verbose logging:

```javascript
window.DEBUG_CLINIC_SCHEDULER = true;
```

## Version History

- **v2.1.0** - Comprehensive improvements (November 2025):
  - Handler-level permission guards on all write operations
  - Members subcollection reconciliation on institution load
  - ACGME settings now configurable per institution
  - Assignment status/notes display in calendar views
  - Removed unused PapaParse dependency
  - Utility modules extracted to `src/utils/`
  - Improved bundle splitting (vendor-charts, vendor-icons)
- **v2.0.0** - RBAC improvements, ACGME validation, bundle optimization
- **v1.0.0** - Initial release
