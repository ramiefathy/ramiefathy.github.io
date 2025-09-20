# Firebase Setup Guide for Clinic Scheduler Pro

## Firebase Console Configuration

### 1. Enable Required Services
In your Firebase project, enable the following services:
- **Authentication** (Email/Password provider)
- **Cloud Firestore**
- **Hosting** (optional, for deployment)

### 2. Firestore Database Setup

#### Create Database
1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Choose "Start in production mode" (we'll set proper rules next)
4. Select your preferred location

#### Security Rules
Copy the contents of `firestore-rules.txt` to Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules from firestore-rules.txt
  }
}
```

### 3. Authentication Setup

1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Enable "Email/Password" provider
4. Optional: Enable "Google" provider for social login

### 4. Firestore Indexes

The following composite indexes will be created automatically when needed:
- `institutions/{institutionId}/assignments`: date + timeSlot
- `institutions/{institutionId}/auditLogs`: timestamp + action

### 5. Free Tier Limits

The application is designed to work within Firebase's free tier:
- **Firestore**: 50,000 reads, 20,000 writes, 20,000 deletes per day
- **Authentication**: Unlimited for email/password
- **Storage**: 1GB stored, 10GB/month download
- **Hosting**: 10GB hosted, 360MB/day bandwidth

## Application Features

### Core Functionality
✅ **Authentication System**
- Email/password login and signup
- Password reset functionality
- Persistent sessions

✅ **Real-time Data Sync**
- Live updates across all connected clients
- Automatic conflict resolution
- Offline persistence

✅ **Institution Management**
- Multi-tenant architecture
- Role-based access control
- Institution settings

✅ **Schedule Management**
- Drag-and-drop assignments
- Real-time validation
- Batch operations

✅ **Data Management**
- Attendings CRUD operations
- Residents CRUD operations
- Rules management
- Audit logging

✅ **Settings**
- Institution preferences
- Work days configuration
- Auto-scheduling settings

## Testing the Application

### 1. Create an Account
1. Open the application
2. Click "Sign Up"
3. Enter email and password
4. Create your institution

### 2. Add Initial Data
1. Navigate to "Attendings" and add physicians
2. Navigate to "Residents" and add residents
3. Navigate to "Rules" and configure scheduling rules

### 3. Create Assignments
1. Go to "Schedule" view
2. Click on a time slot or drag-drop to create assignments
3. Watch real-time updates

### 4. Test Real-time Sync
1. Open the app in multiple browser tabs
2. Make changes in one tab
3. Observe instant updates in other tabs

## Troubleshooting

### Common Issues

**Authentication Errors**
- Ensure email/password provider is enabled
- Check Firebase config in index.html
- Verify API keys are correct

**Firestore Permission Errors**
- Check security rules are properly deployed
- Ensure user is authenticated
- Verify institution membership

**Real-time Updates Not Working**
- Check browser console for WebSocket errors
- Verify Firestore is enabled
- Check network connectivity

**Data Not Persisting**
- Enable offline persistence in Firebase settings
- Check IndexedDB in browser DevTools
- Clear browser cache if needed

## Production Deployment

### 1. Update Firebase Config
Replace the Firebase config in `index.html` with your production project config.

### 2. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Set up Custom Domain (optional)
1. Go to Firebase Hosting
2. Add custom domain
3. Update DNS records

### 4. Monitor Usage
- Set up budget alerts in Google Cloud Console
- Monitor Firestore usage in Firebase Console
- Review authentication metrics

## Support

For issues or questions:
1. Check browser console for errors
2. Review Firestore rules for permission issues
3. Verify all Firebase services are enabled
4. Check quota usage in Firebase Console