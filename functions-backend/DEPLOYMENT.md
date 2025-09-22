# Firebase Functions Deployment Guide

## Prerequisites

1. **Firebase CLI installed**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project initialized**:
   ```bash
   firebase init functions
   ```

3. **Firebase authentication**:
   ```bash
   firebase login
   ```

## Configuration Steps

### 1. Set Environment Variables

Configure the following environment variables for your Firebase functions:

#### Email Configuration (Choose ONE option):

**Option A: SendGrid (Recommended for production)**
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set email.from="noreply@yourdomain.com"
```

**Option B: SMTP (Gmail example)**
```bash
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-app-specific-password"
firebase functions:config:set email.from="your-email@gmail.com"
```

> **Note**: For Gmail, you need to generate an app-specific password:
> 1. Go to Google Account settings
> 2. Enable 2-factor authentication
> 3. Generate app-specific password for "Mail"

#### Webhook Configuration (Optional)
```bash
firebase functions:config:set webhook.secret="YOUR_SECURE_WEBHOOK_SECRET"
```

### 2. Verify Configuration

Check your configuration:
```bash
firebase functions:config:get
```

### 3. Local Development Environment

For local testing, download the configuration:
```bash
firebase functions:config:get > .runtimeconfig.json
```

Add `.runtimeconfig.json` to `.gitignore` to keep secrets safe.

## Deployment

### Deploy All Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Functions
```bash
# Deploy only the auto-scheduling function
firebase deploy --only functions:autoSchedule

# Deploy multiple specific functions
firebase deploy --only functions:autoSchedule,functions:generateSchedulePDF
```

### Deploy with Project Selection
```bash
firebase deploy --only functions --project your-project-id
```

## Testing

### 1. Use Firebase Emulator Suite

Start the emulators:
```bash
firebase emulators:start --only functions,firestore,auth
```

### 2. Test Individual Functions

**Test autoSchedule function**:
```javascript
// In your app or test script
const functions = firebase.functions();
const autoSchedule = functions.httpsCallable('autoSchedule');

autoSchedule({
  institutionId: 'test-institution',
  startDate: '2024-01-22',
  endDate: '2024-01-28',
  options: {
    includeWeekends: false,
    overwrite: false
  }
}).then(result => {
  console.log('Assignments created:', result.data.assignmentsCreated);
});
```

## Monitoring

### View Function Logs
```bash
# All logs
firebase functions:log

# Last 50 entries
firebase functions:log --limit 50

# Specific function logs
firebase functions:log --only autoSchedule

# Follow logs in real-time
firebase functions:log --follow
```

### Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Functions → Logs

## Cost Optimization

The functions are designed to minimize costs:

- **Batching**: Operations are batched to reduce database calls
- **Efficient queries**: Using proper indexes and limits
- **Scheduled functions**: Run during off-peak hours
- **Email throttling**: Prevents excessive email sending

### Estimated Monthly Costs (Free Tier)
- **Function invocations**: 125,000 free/month
- **GB-seconds**: 40,000 free/month
- **Firestore reads**: 50,000 free/day
- **Firestore writes**: 20,000 free/day

Our functions should stay within free tier for small-medium institutions.

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Ensure Firestore security rules allow function access
   - Check function has proper authentication

2. **Email not sending**
   - Verify email configuration with `firebase functions:config:get`
   - Check function logs for email errors
   - Ensure SendGrid API key or SMTP credentials are valid

3. **PDF generation fails**
   - Increase function memory if needed:
     ```javascript
     exports.generateSchedulePDF = functions
       .runWith({ memory: '1GB', timeoutSeconds: 120 })
       .https.onCall(...)
     ```

4. **Scheduled functions not running**
   - Verify Cloud Scheduler API is enabled
   - Check timezone settings in function definition
   - Ensure billing is enabled (required for scheduled functions)

### Enable Required APIs

Some functions require specific Google Cloud APIs:

```bash
# Enable Cloud Scheduler API (for scheduled functions)
gcloud services enable cloudscheduler.googleapis.com

# Enable Cloud Build API (for deployments)
gcloud services enable cloudbuild.googleapis.com

# List enabled APIs
gcloud services list --enabled
```

## Security Best Practices

1. **Never commit secrets**: Keep `.runtimeconfig.json` out of version control
2. **Use least privilege**: Grant minimal necessary permissions
3. **Validate inputs**: All functions validate and sanitize inputs
4. **Rate limiting**: Consider adding rate limiting for public functions
5. **Monitor usage**: Set up budget alerts in Google Cloud Console

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Email service tested and working
- [ ] Firestore indexes created for queries
- [ ] Security rules updated and tested
- [ ] Functions tested in emulator
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Cost alerts configured

## Support

For issues or questions:
1. Check function logs first
2. Review this documentation
3. Check Firebase Status: https://status.firebase.google.com
4. Firebase Support: https://firebase.google.com/support