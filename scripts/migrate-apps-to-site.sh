#!/bin/bash
set -e

# Migration Script: Consolidate /apps to /site/public/apps
# Purpose: Eliminate 2.5 MB duplication between parallel app directories
# Author: Dr. Ramie Fathy (via Claude Code)
# Date: 2025-09-29

echo "========================================================"
echo "  Apps Directory Migration Script"
echo "  Consolidating /apps → /site/public/apps"
echo "========================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verify we're in repository root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from repository root${NC}"
  exit 1
fi

# Verify site/public/apps exists
if [ ! -d "site/public/apps" ]; then
  echo -e "${RED}❌ Error: site/public/apps directory not found!${NC}"
  exit 1
fi

# Verify apps directory exists
if [ ! -d "apps" ]; then
  echo -e "${YELLOW}⚠️  apps/ directory not found. May have already been migrated.${NC}"
  exit 0
fi

echo -e "${GREEN}✓${NC} Repository structure verified"
echo ""

# Create backup
echo "📦 Creating backup of /apps directory..."
BACKUP_FILE="apps-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" apps/
echo -e "${GREEN}✓${NC} Backup created: $BACKUP_FILE"
echo ""

# Compare directories
echo "🔍 Analyzing differences between /apps and /site/public/apps..."
echo ""

# Files only in /apps (not in site/public/apps)
UNIQUE_FILES=$(diff -rq apps/ site/public/apps/ 2>/dev/null | grep "Only in apps" || echo "")

if [ -n "$UNIQUE_FILES" ]; then
  echo -e "${YELLOW}Files found only in /apps:${NC}"
  echo "$UNIQUE_FILES"
  echo ""
  echo "These files will be copied to site/public/apps..."

  # Copy unique files
  rsync -av --ignore-existing apps/ site/public/apps/
  echo -e "${GREEN}✓${NC} Unique files copied"
else
  echo -e "${GREEN}✓${NC} No unique files found - /apps is fully redundant"
fi
echo ""

# Check for modified files (different content)
echo "🔍 Checking for files with different content..."
DIFF_FILES=$(diff -rq apps/ site/public/apps/ 2>/dev/null | grep "differ" || echo "")

if [ -n "$DIFF_FILES" ]; then
  echo -e "${YELLOW}⚠️  Files with different content:${NC}"
  echo "$DIFF_FILES"
  echo ""
  echo -e "${RED}ATTENTION: These files have diverged!${NC}"
  echo "Manual review required before proceeding."
  echo ""
  echo "Options:"
  echo "  1. Use 'diff -u apps/FILE site/public/apps/FILE' to review differences"
  echo "  2. Choose which version to keep"
  echo "  3. Re-run this script after resolving conflicts"
  echo ""
  exit 1
else
  echo -e "${GREEN}✓${NC} No content differences found"
fi
echo ""

# Show size savings
APPS_SIZE=$(du -sh apps/ | awk '{print $1}')
echo "💾 Current /apps directory size: $APPS_SIZE"
echo ""

# Confirmation prompt
echo -e "${YELLOW}Ready to remove /apps directory.${NC}"
echo "This will:"
echo "  • Delete the /apps directory from git tracking"
echo "  • Use site/public/apps as the single source of truth"
echo "  • Update package.json build scripts"
echo "  • Save approximately 2.5 MB in repository"
echo ""
read -p "Proceed with migration? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Migration cancelled by user${NC}"
  exit 0
fi

echo ""
echo "🚀 Proceeding with migration..."
echo ""

# Stage site/public/apps changes (if any)
git add site/public/apps/

# Remove apps directory from git
echo "📝 Removing /apps from git..."
git rm -r apps/
echo -e "${GREEN}✓${NC} /apps removed from git tracking"
echo ""

# Update package.json scripts
echo "📝 Updating package.json build scripts..."

# Update clinic:scheduler:build script
if grep -q "apps/clinic-scheduler-pro" package.json; then
  # macOS-compatible sed
  sed -i '' 's|apps/clinic-scheduler-pro/src/main|site/public/apps/clinic-scheduler-pro/src/main|g' package.json
  sed -i '' 's|apps/clinic-scheduler-pro/assets/main|site/public/apps/clinic-scheduler-pro/assets/main|g' package.json

  # Remove the cp commands that copy from apps/ to site/public/apps/
  # (no longer needed since we're building directly in site/public/apps/)

  echo -e "${GREEN}✓${NC} package.json updated"
  git add package.json
else
  echo -e "${YELLOW}⚠️  No apps/clinic-scheduler-pro references found in package.json${NC}"
fi
echo ""

# Update apps/package.json if it exists in site/public/apps
if [ -f "site/public/apps/package.json" ]; then
  echo "📝 Handling site/public/apps/package.json..."
  # This should be removed - playwright will be in site/package.json
  git rm site/public/apps/package.json 2>/dev/null || true
fi

echo ""
echo "========================================================"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo "========================================================"
echo ""
echo "Summary:"
echo "  • Backup saved: $BACKUP_FILE"
echo "  • /apps directory removed from git"
echo "  • Single source of truth: site/public/apps/"
echo "  • Repository size reduced by ~$APPS_SIZE"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test build: npm run clinic:scheduler:build"
echo "  3. Commit changes: git commit -m 'refactor: consolidate apps to site/public/apps'"
echo ""
echo "Rollback (if needed):"
echo "  • Extract backup: tar -xzf $BACKUP_FILE"
echo "  • Git reset: git reset --hard HEAD"
echo ""