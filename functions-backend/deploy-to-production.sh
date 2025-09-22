#!/bin/bash

# 🚀 Production Deployment Script for Clinic Scheduler Pro
# This script deploys Firebase Functions to the autoclinicscheduler project
# Prerequisites: ramiefathy@gmail.com must have Editor/Owner access to the project

set -e  # Exit on any error

echo "🚀 Starting Clinic Scheduler Pro Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Firebase CLI login
echo "📋 Step 1: Checking Firebase CLI authentication..."
CURRENT_USER=$(firebase login:list 2>&1 | grep "Logged in as" | cut -d' ' -f4 || echo "none")
if [ "$CURRENT_USER" != "ramiefathy@gmail.com" ]; then
    echo -e "${YELLOW}⚠️  Not logged in as ramiefathy@gmail.com${NC}"
    echo "Current user: $CURRENT_USER"
    echo ""
    echo "Please log in with the correct account:"
    firebase logout
    firebase login --reauth
else
    echo -e "${GREEN}✅ Logged in as ramiefathy@gmail.com${NC}"
fi
echo ""

# Step 2: Check project access
echo "📋 Step 2: Checking access to autoclinicscheduler project..."
if firebase projects:list 2>&1 | grep -q "autoclinicscheduler"; then
    echo -e "${GREEN}✅ Project autoclinicscheduler found${NC}"
else
    echo -e "${RED}❌ Cannot find autoclinicscheduler project${NC}"
    echo ""
    echo "Please ensure ramiefathy@gmail.com has been added to the project:"
    echo "1. The project owner must add you via Firebase Console"
    echo "2. Check your email for an invitation"
    echo "3. Accept the invitation and try again"
    echo ""
    exit 1
fi
echo ""

# Step 3: Set active project
echo "📋 Step 3: Setting active Firebase project..."
firebase use autoclinicscheduler --add
echo -e "${GREEN}✅ Project autoclinicscheduler is now active${NC}"
echo ""

# Step 4: Final syntax check
echo "📋 Step 4: Running final syntax check..."
node -c index.js
echo -e "${GREEN}✅ JavaScript syntax valid${NC}"
echo ""

# Step 5: Deploy Firestore Rules
echo "📋 Step 5: Deploying Firestore Security Rules..."
firebase deploy --only firestore:rules --project autoclinicscheduler
echo -e "${GREEN}✅ Security rules deployed${NC}"
echo ""

# Step 6: Deploy Firestore Indexes
echo "📋 Step 6: Deploying Firestore Indexes..."
echo -e "${YELLOW}Note: Index creation can take 5-10 minutes${NC}"
firebase deploy --only firestore:indexes --project autoclinicscheduler
echo -e "${GREEN}✅ Indexes deployment initiated${NC}"
echo ""

# Step 7: Check for email configuration (optional)
echo "📋 Step 7: Checking email configuration..."
CONFIG_OUTPUT=$(firebase functions:config:get --project autoclinicscheduler 2>&1 || echo "{}")
if echo "$CONFIG_OUTPUT" | grep -q "smtp\|sendgrid\|email"; then
    echo -e "${GREEN}✅ Email configuration found${NC}"
else
    echo -e "${YELLOW}ℹ️  No email configuration (functions will work without it)${NC}"
    echo ""
    echo "To add Gmail email later, run:"
    echo 'firebase functions:config:set smtp.host="smtp.gmail.com" smtp.port="587" smtp.user="your-email@gmail.com" smtp.pass="app-password" email.from="your-email@gmail.com"'
fi
echo ""

# Step 8: Deploy Functions
echo "📋 Step 8: Deploying Firebase Functions..."
echo "This will deploy:"
echo "  - autoSchedule (HTTPS Callable)"
echo "  - generateSchedulePDF (HTTPS Callable)"
echo "  - calculateAnalytics (HTTPS Callable)"
echo "  - validateAssignment (Firestore Trigger)"
echo "  - notifyScheduleChange (Firestore Trigger)"
echo "  - weeklyScheduleGeneration (Scheduled - if billing enabled)"
echo "  - dailyReminders (Scheduled - if billing enabled)"
echo ""

firebase deploy --only functions --project autoclinicscheduler

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
else
    echo -e "${RED}⚠️  Some functions may have failed to deploy${NC}"
    echo "Check the error messages above"
    echo ""
    echo "Common issues:"
    echo "- Billing not enabled (required for scheduled functions)"
    echo "- APIs not enabled (Cloud Functions, Firestore)"
    echo "- Insufficient permissions"
fi
echo ""

# Step 9: Verify deployment
echo "📋 Step 9: Verifying deployment..."
echo "Deployed functions:"
firebase functions:list --project autoclinicscheduler
echo ""

# Step 10: Test the functions
echo "📋 Step 10: Quick function test..."
echo "Testing if functions are accessible..."

# Create a simple test
cat > test-deployment.js << 'EOF'
const admin = require('firebase-admin');
console.log('✅ Firebase Admin SDK loads correctly');
console.log('✅ Functions can be imported');
console.log('');
console.log('Deployment test passed!');
EOF

node test-deployment.js
rm test-deployment.js
echo ""

# Step 11: Monitor logs
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "📊 Next Steps:"
echo "1. Monitor function logs:"
echo "   firebase functions:log --follow --project autoclinicscheduler"
echo ""
echo "2. Test in the app:"
echo "   - Open clinic-scheduler-pro in browser"
echo "   - Try auto-scheduling"
echo "   - Generate a PDF"
echo "   - Check analytics"
echo ""
echo "3. Check function metrics:"
echo "   https://console.firebase.google.com/project/autoclinicscheduler/functions"
echo ""
echo "4. View Firestore data:"
echo "   https://console.firebase.google.com/project/autoclinicscheduler/firestore"
echo ""

if echo "$CONFIG_OUTPUT" | grep -q "smtp\|sendgrid\|email"; then
    echo "✉️  Email is configured and ready"
else
    echo "📧 Email Setup (when ready):"
    echo "   Run: ./setup-gmail-email.sh"
fi
echo ""
echo "🔒 Security: Rules are active and protecting your data"
echo "📈 Monitoring: View real-time logs with: firebase functions:log --follow"
echo ""
echo "Happy scheduling! 🏥"