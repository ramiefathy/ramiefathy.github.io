# Clinic Scheduler Pro - Rigorous Implementation Plan

> **Status:** Active
> **Last Updated:** 2025-11-26
> **Blocking Issues:** Phase 1 (RBAC) must complete before Firestore rules deployment

---

## Critical Findings Summary

### Blocking Issues (Must Fix Before Any Feature Work)

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| **Member subcollection not synced** | CRITICAL | `FirebaseService` | App breaks under new rules |
| **usePermissions not applied** | HIGH | All write surfaces | Unauthorized writes possible |
| **ACGME counts virtual assignments** | HIGH | `ConflictDetection` | False positive blocks |
| **2MB chunk size warning** | MEDIUM | Build output | Performance degradation |

---

## Phase 0: Environment Prep

### Objective
Establish baseline and verify development environment.

### Tasks

- [ ] **0.1** Verify Node.js version matches package.json engines
  ```bash
  node --version  # Should be 20.x
  npm --version
  ```

- [ ] **0.2** Clean install dependencies
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

- [ ] **0.3** Run baseline build and capture output
  ```bash
  npm run build 2>&1 | tee build-baseline.log
  ```

- [ ] **0.4** Document current bundle sizes
  | File | Size | Gzip |
  |------|------|------|
  | main.js | ? KB | ? KB |
  | main-animated.js | ? KB | ? KB |
  | chunks/index-*.js | ? KB | ? KB |

- [ ] **0.5** Run app locally and verify login flow works

### Acceptance Criteria
- [ ] `npm run build` succeeds without errors
- [ ] App loads at localhost:5173
- [ ] Login/signup flow works
- [ ] Institution creation works
- [ ] Build output documented in this file

### Duration: 1 hour

---

## Phase 1: RBAC Correctness (CRITICAL)

### Objective
Ensure member subcollection documents stay in sync with the embedded `members[]` array so Firestore rules work correctly.

### Problem Analysis

**Current State:**
```
/institutions/{id}
  └── members: [{userId, name, email, role, joinedAt}, ...]  ← Frontend reads/writes THIS

/institutions/{id}/members/{userId}
  └── {userId, name, email, role, joinedAt}                  ← Firestore rules check THIS
```

**Issue:** Four operations update the embedded array but NOT the subcollection:
1. `redeemInviteCode()` - Adds to array only
2. `updateMemberRole()` - Updates array only
3. `removeMember()` - Removes from array only
4. `createInstitution()` - Creates BOTH (correct)

### Tasks

- [ ] **1.1** Add helper method `syncMemberSubcollection()`
  ```javascript
  // In FirebaseService class
  async syncMemberSubcollection(institutionId, memberData, action = 'upsert') {
      const memberRef = window.firebase.firestore.doc(
          this.db, 'institutions', institutionId, 'members', memberData.userId
      );

      if (action === 'delete') {
          await window.firebase.firestore.deleteDoc(memberRef);
      } else {
          await window.firebase.firestore.setDoc(memberRef, {
              userId: memberData.userId,
              name: memberData.name,
              email: memberData.email,
              role: memberData.role,
              joinedAt: memberData.joinedAt || window.firebase.firestore.serverTimestamp(),
              updatedAt: window.firebase.firestore.serverTimestamp()
          }, { merge: true });
      }
  }
  ```

- [ ] **1.2** Update `redeemInviteCode()` to sync subcollection
  ```javascript
  // After adding to embedded array (around line 2202)
  await this.syncMemberSubcollection(inviteData.institutionId, {
      userId: this.currentUser.uid,
      name: userProfile.displayName || this.currentUser.email,
      email: this.currentUser.email,
      role: inviteData.role || 'member',
      joinedAt: window.firebase.firestore.serverTimestamp()
  });
  ```

- [ ] **1.3** Update `updateMemberRole()` to sync subcollection
  ```javascript
  // After updating embedded array (around line 2070)
  const memberToUpdate = members.find(m => m.userId === memberId);
  if (memberToUpdate) {
      await this.syncMemberSubcollection(this.currentInstitution, {
          ...memberToUpdate,
          role: newRole
      });
  }
  ```

- [ ] **1.4** Update `removeMember()` to delete subcollection doc
  ```javascript
  // After updating embedded array (around line 2110)
  await this.syncMemberSubcollection(this.currentInstitution, { userId: memberId }, 'delete');
  ```

- [ ] **1.5** Add sign-in remediation to heal missing subcollection docs
  ```javascript
  // In loadInstitution() after membership check succeeds
  async healMemberSubcollection(institutionId) {
      const institutionDoc = await window.firebase.firestore.getDoc(
          window.firebase.firestore.doc(this.db, 'institutions', institutionId)
      );
      const institutionData = institutionDoc.data();
      const embeddedMember = institutionData.members?.find(m => m.userId === this.currentUser.uid);

      if (embeddedMember) {
          const subcollectionDoc = await window.firebase.firestore.getDoc(
              window.firebase.firestore.doc(this.db, 'institutions', institutionId, 'members', this.currentUser.uid)
          );

          if (!subcollectionDoc.exists()) {
              console.log('Healing missing member subcollection doc');
              await this.syncMemberSubcollection(institutionId, embeddedMember);
          }
      }
  }
  ```

- [ ] **1.6** Create emulator test script
  ```javascript
  // test/rbac.test.js
  describe('RBAC Member Sync', () => {
      test('redeemInviteCode creates subcollection doc', async () => { ... });
      test('updateMemberRole syncs subcollection', async () => { ... });
      test('removeMember deletes subcollection doc', async () => { ... });
      test('scheduler role can write assignments', async () => { ... });
      test('member role cannot write assignments', async () => { ... });
  });
  ```

### Acceptance Criteria
- [ ] After `redeemInviteCode()`, subcollection doc exists with correct role
- [ ] After `updateMemberRole()`, subcollection doc has updated role
- [ ] After `removeMember()`, subcollection doc is deleted
- [ ] Existing users without subcollection docs get healed on sign-in
- [ ] Emulator tests pass for all 5 roles

### Duration: 4-6 hours

### Dependencies: None (must be first)

---

## Phase 2: UI Permission Enforcement

### Objective
Apply `usePermissions` hook to all write surfaces and disable/guard handlers for unauthorized roles.

### Current State Analysis

| Component | Write Operations | Permission Applied? |
|-----------|------------------|---------------------|
| `AttendingsList` | add, edit, delete | NO |
| `ResidentsList` | add, edit, delete | NO |
| `ScheduleCalendar` | create, edit, delete assignments | NO |
| `RulesList` | add, edit, delete | NO |
| `SettingsView` | update settings | NO |
| `MembersManagement` | add, update role, remove | YES (isAdmin only) |
| `BackupRestore` | import, restore | NO |
| `AutoScheduler` | run auto-schedule | NO |
| `ChatAssistantPanel` | execute actions | NO |

### Tasks

- [ ] **2.1** Create permission-aware wrapper component
  ```javascript
  const PermissionGuard = ({ permission, children, fallback = null }) => {
      const { canSchedule, isAdmin } = usePermissions();

      const hasPermission = permission === 'schedule' ? canSchedule :
                           permission === 'admin' ? isAdmin : false;

      return hasPermission ? children : fallback;
  };
  ```

- [ ] **2.2** Update `AttendingsList` component
  ```javascript
  const AttendingsList = () => {
      const { canSchedule } = usePermissions();

      // Disable add button
      {canSchedule && <Button onClick={handleAdd}>Add Attending</Button>}

      // Disable edit/delete in list
      {canSchedule && <Button onClick={() => handleEdit(attending)}>Edit</Button>}
      {canSchedule && <Button onClick={() => handleDelete(attending.id)}>Delete</Button>}
  };
  ```

- [ ] **2.3** Update `ResidentsList` component (same pattern)

- [ ] **2.4** Update `ScheduleCalendar` component
  ```javascript
  const ScheduleCalendar = () => {
      const { canSchedule } = usePermissions();

      const handleSlotClick = (date, timeSlot) => {
          if (!canSchedule) {
              toast.info('You do not have permission to create assignments');
              return;
          }
          // ... existing logic
      };

      const handleAssignmentEdit = (assignment) => {
          if (!canSchedule) {
              toast.info('You do not have permission to edit assignments');
              return;
          }
          // ... existing logic
      };
  };
  ```

- [ ] **2.5** Update `RulesList` component (same pattern)

- [ ] **2.6** Update `SettingsView` component
  ```javascript
  const SettingsView = () => {
      const { isAdmin } = usePermissions();

      // Disable all form submissions for non-admins
      const handleSaveSettings = async () => {
          if (!isAdmin) {
              toast.error('Only administrators can modify settings');
              return;
          }
          // ... existing logic
      };
  };
  ```

- [ ] **2.7** Update `BackupRestore` component
  ```javascript
  const BackupRestore = () => {
      const { isAdmin } = usePermissions();

      // Hide import UI for non-admins
      {isAdmin && <ImportSection />}

      // Disable restore for non-admins
      const handleRestore = async () => {
          if (!isAdmin) {
              toast.error('Only administrators can restore backups');
              return;
          }
          // ... existing logic
      };
  };
  ```

- [ ] **2.8** Update `AutoScheduler` component
  ```javascript
  const AutoScheduler = () => {
      const { canSchedule } = usePermissions();

      if (!canSchedule) {
          return (
              <Card>
                  <p>You do not have permission to run auto-scheduler.</p>
                  <p>Contact your program administrator.</p>
              </Card>
          );
      }
      // ... existing UI
  };
  ```

- [ ] **2.9** Update `ChatAssistantPanel` component
  ```javascript
  const ChatAssistantPanel = () => {
      const { canSchedule } = usePermissions();

      const handleSendMessage = async (message) => {
          // Check if message implies a write action
          const writeActions = ['add', 'create', 'delete', 'remove', 'update', 'move', 'assign'];
          const isWriteAction = writeActions.some(action =>
              message.toLowerCase().includes(action)
          );

          if (isWriteAction && !canSchedule) {
              toast.error('You do not have permission to modify the schedule');
              return;
          }
          // ... existing logic
      };
  };
  ```

- [ ] **2.10** Add visual indicator for read-only users
  ```javascript
  // In App component or navigation
  const { isMember, userRole } = usePermissions();

  {isMember && (
      <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm">
          Read-only access. Contact your administrator for scheduling permissions.
      </div>
  )}
  ```

### Acceptance Criteria
- [ ] Member role cannot add/edit/delete attendings
- [ ] Member role cannot add/edit/delete residents
- [ ] Member role cannot create/edit/delete assignments
- [ ] Member role cannot modify rules
- [ ] Member role cannot modify settings
- [ ] Member role cannot import/restore data
- [ ] Member role cannot run auto-scheduler
- [ ] Member role sees read-only banner
- [ ] Scheduler role CAN do all above except settings/members
- [ ] Admin roles have full access
- [ ] Toast messages explain permission denial

### Duration: 4-6 hours

### Dependencies: Phase 1 complete

---

## Phase 3: ACGME Validation Robustness

### Objective
Fix false positives in ACGME checks by excluding virtual/protected assignments and making hours configurable.

### Problem Analysis

**Current Bug:**
```javascript
// checkWeeklyHours() counts ALL assignments including:
// - virtual: true (display-only continuity/protected)
// - type: 'protected' (didactics, conferences)
// - type: 'continuity' (continuity clinic markers)

// This causes false "exceeds 80 hours" errors
```

### Tasks

- [ ] **3.1** Update `checkWeeklyHours()` to exclude virtual/protected
  ```javascript
  checkWeeklyHours: (assignments, residentId, newAssignmentDate, options = {}) => {
      const HOURS_PER_HALF_DAY = options.hoursPerSlot || 4;
      const MAX_WEEKLY_HOURS = options.maxWeeklyHours || 80;

      const assignmentDate = normalizeDate(newAssignmentDate);
      const weekStart = getStartOfWeekSunday(assignmentDate);
      const weekEnd = getEndOfWeekSaturday(assignmentDate);

      // Filter to countable assignments only
      const countableAssignments = assignments.filter(a => {
          if (a.residentId !== residentId) return false;
          if (a.virtual === true) return false;  // Exclude virtual
          if (a.type === 'protected') return false;  // Exclude protected time
          const aDate = normalizeDate(a.date);
          return aDate >= weekStart && aDate <= weekEnd;
      });

      const currentHours = countableAssignments.length * HOURS_PER_HALF_DAY;
      const projectedHours = currentHours + HOURS_PER_HALF_DAY;

      // ... rest of logic
  },
  ```

- [ ] **3.2** Update `checkConsecutiveDays()` to exclude virtual/protected
  ```javascript
  checkConsecutiveDays: (assignments, residentId, newAssignmentDate, options = {}) => {
      const MAX_CONSECUTIVE_DAYS = options.maxConsecutiveDays || 6;
      const assignmentDate = normalizeDate(newAssignmentDate);

      // Get all dates with REAL assignments only
      const residentDates = new Set(
          assignments
              .filter(a => {
                  if (a.residentId !== residentId) return false;
                  if (a.virtual === true) return false;
                  if (a.type === 'protected') return false;
                  return true;
              })
              .map(a => a.date)
      );

      // ... rest of logic
  },
  ```

- [ ] **3.3** Add configurable options to `checkAllConflicts()`
  ```javascript
  checkAllConflicts: ({
      assignments,
      newAssignment,
      attendings,
      residents,
      institution,
      excludeId = null,
      acgmeOptions = {}  // New parameter
  }) => {
      // ... existing checks ...

      // ACGME checks with options
      const acgmeConfig = {
          hoursPerSlot: institution?.settings?.acgme?.hoursPerSlot || 4,
          maxWeeklyHours: institution?.settings?.acgme?.maxWeeklyHours || 80,
          maxConsecutiveDays: institution?.settings?.acgme?.maxConsecutiveDays || 6,
          ...acgmeOptions
      };

      const weeklyHoursConflicts = ConflictDetection.checkWeeklyHours(
          flatAssignments,
          resident.id,
          newAssignment.date,
          acgmeConfig
      );

      // ... rest
  }
  ```

- [ ] **3.4** Ensure checks run on update without double-counting
  ```javascript
  // When editing existing assignment, exclude it from count
  checkWeeklyHours: (assignments, residentId, newAssignmentDate, options = {}) => {
      const excludeId = options.excludeId;  // ID of assignment being edited

      const countableAssignments = assignments.filter(a => {
          if (excludeId && a.id === excludeId) return false;  // Don't count self
          // ... rest of filters
      });
  }
  ```

- [ ] **3.5** Add ACGME settings to institution settings UI
  ```javascript
  // In SettingsView, add ACGME configuration tab
  <div>
      <h3>ACGME Compliance Settings</h3>
      <label>Hours per half-day slot</label>
      <input type="number" value={settings.acgme?.hoursPerSlot || 4} />

      <label>Max weekly hours</label>
      <input type="number" value={settings.acgme?.maxWeeklyHours || 80} />

      <label>Max consecutive duty days</label>
      <input type="number" value={settings.acgme?.maxConsecutiveDays || 6} />
  </div>
  ```

### Acceptance Criteria
- [ ] Virtual assignments (`virtual: true`) not counted in ACGME checks
- [ ] Protected time assignments (`type: 'protected'`) not counted
- [ ] Continuity markers not counted
- [ ] Editing an assignment doesn't double-count it
- [ ] Hours per slot configurable via settings
- [ ] Max weekly hours configurable via settings
- [ ] Max consecutive days configurable via settings
- [ ] Default values match ACGME standards (80h, 6 days)

### Duration: 3-4 hours

### Dependencies: None (can parallel with Phase 2)

---

## Phase 4: Data Model Parity

### Objective
Ensure all frontend forms and payloads include required fields that backend expects.

### Gap Analysis

| Field | Backend Expects | Frontend Provides | Status |
|-------|-----------------|-------------------|--------|
| `assignment.status` | 'confirmed'/'pending'/'conflict' | Missing | ADD |
| `assignment.type` | 'clinical'/'continuity'/'protected' | Partial | FIX |
| `assignment.notes` | string | Missing in some paths | FIX |
| `assignment.siteId` | string | Missing | ADD |
| `assignment.clinicId` | string | Present | OK |
| `attending.specialty` | string | Missing | ADD |
| `resident.specialty` | string (optional) | Missing | ADD |

### Tasks

- [ ] **4.1** Update assignment creation to include all fields
  ```javascript
  // In AssignmentForm or wherever assignments are created
  const createAssignment = async (formData) => {
      const assignment = {
          date: formData.date,
          timeSlot: formData.timeSlot,
          residentId: formData.residentId,
          attendingId: formData.attendingId,
          clinicId: formData.clinicId || null,
          siteId: formData.siteId || null,  // ADD
          status: 'confirmed',  // ADD - default status
          type: formData.type || 'clinical',  // ADD - default type
          notes: formData.notes || '',  // ADD
          virtual: false  // Explicit for real assignments
      };

      return await firebaseService.addAssignment(assignment);
  };
  ```

- [ ] **4.2** Add `siteId` to AssignmentForm
  ```javascript
  // In AssignmentForm state
  const [formData, setFormData] = useState({
      // ... existing fields
      siteId: assignment.siteId || '',
      status: assignment.status || 'confirmed',
      type: assignment.type || 'clinical',
      notes: assignment.notes || ''
  });

  // In form UI
  <select
      value={formData.siteId}
      onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
  >
      <option value="">Select Site</option>
      {sites.map(site => (
          <option key={site.id} value={site.id}>{site.name}</option>
      ))}
  </select>
  ```

- [ ] **4.3** Add `specialty` to AttendingForm
  ```javascript
  // In AttendingForm state
  const [formData, setFormData] = useState({
      // ... existing fields
      specialty: attending.specialty || ''
  });

  // In form UI
  <input
      type="text"
      value={formData.specialty}
      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
      placeholder="e.g., Dermatology, Internal Medicine"
  />
  ```

- [ ] **4.4** Add `specialty` to ResidentForm (optional)
  ```javascript
  // Optional field for fellowship tracking
  <input
      type="text"
      value={formData.specialty}
      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
      placeholder="Primary specialty (optional)"
  />
  ```

- [ ] **4.5** Ensure chatbot action payloads include all fields
  ```javascript
  // When chatbot creates assignment via action handler
  // Verify the action payload structure matches
  ```

- [ ] **4.6** Add status dropdown to AssignmentForm for editing
  ```javascript
  <select
      value={formData.status}
      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
  >
      <option value="confirmed">Confirmed</option>
      <option value="pending">Pending</option>
  </select>
  ```

### Acceptance Criteria
- [ ] New assignments have `status`, `type`, `siteId`, `notes` fields
- [ ] Edited assignments preserve all fields
- [ ] Attending form includes specialty field
- [ ] Resident form includes optional specialty field
- [ ] No undefined fields in Firestore writes
- [ ] Backend callable functions receive expected payloads

### Duration: 2-3 hours

### Dependencies: None (can parallel)

---

## Phase 5: Modularization

### Objective
Split monolithic `main.jsx` (7,800+ lines) into maintainable modules.

### Target Structure
```
src/
├── main.jsx                 # Entry point (~100 lines)
├── index.css               # Styles (unchanged)
├── firebase.js             # Firebase init (unchanged)
├── context/
│   └── AppContext.jsx      # AppProvider, useApp
├── hooks/
│   └── usePermissions.js   # Permissions hook
├── services/
│   └── FirebaseService.js  # FirebaseService class
├── utils/
│   ├── constants.js        # TIME_SLOTS, ROLE_HIERARCHY, etc.
│   ├── date.js             # normalizeDate, getStartOfWeek, etc.
│   ├── validation.js       # ValidationUtils
│   ├── conflict.js         # ConflictDetection
│   └── export.js           # ExportUtils
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Icon.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── Toast.jsx
│   └── forms/
│       ├── AttendingForm.jsx
│       ├── ResidentForm.jsx
│       ├── RuleForm.jsx
│       └── AssignmentForm.jsx
└── views/
    ├── App.jsx
    ├── LoginPage.jsx
    ├── Dashboard.jsx
    ├── ScheduleCalendar.jsx
    ├── AttendingsList.jsx
    ├── ResidentsList.jsx
    ├── RulesList.jsx
    ├── SettingsView.jsx
    ├── MembersManagement.jsx
    ├── BackupRestore.jsx
    ├── AutoScheduler.jsx
    └── ChatAssistantPanel.jsx
```

### Tasks

- [ ] **5.1** Create directory structure
  ```bash
  mkdir -p src/{context,hooks,services,utils,components/{ui,forms},views}
  ```

- [ ] **5.2** Extract constants (~50 lines)
  ```javascript
  // src/utils/constants.js
  export const TIME_SLOTS = ['AM', 'PM'];
  export const ROLE_HIERARCHY = ['admin', 'program_admin', 'chief_resident', 'scheduler', 'member'];
  export const DAYS_OF_WEEK = ['Sunday', 'Monday', ...];
  ```

- [ ] **5.3** Extract date utilities (~100 lines)
  ```javascript
  // src/utils/date.js
  export const normalizeDate = (value) => { ... };
  export const getStartOfWeekSunday = (value) => { ... };
  export const getEndOfWeekSaturday = (value) => { ... };
  export const getStartOfMonth = (value) => { ... };
  export const getEndOfMonth = (value) => { ... };
  ```

- [ ] **5.4** Extract ConflictDetection (~200 lines)
  ```javascript
  // src/utils/conflict.js
  export const ConflictDetection = { ... };
  ```

- [ ] **5.5** Extract ValidationUtils (~50 lines)
  ```javascript
  // src/utils/validation.js
  export const ValidationUtils = { ... };
  ```

- [ ] **5.6** Extract ExportUtils (~150 lines)
  ```javascript
  // src/utils/export.js
  export const ExportUtils = { ... };
  ```

- [ ] **5.7** Extract FirebaseService (~600 lines)
  ```javascript
  // src/services/FirebaseService.js
  export class FirebaseService { ... }
  export const firebaseService = new FirebaseService();
  ```

- [ ] **5.8** Extract AppContext (~100 lines)
  ```javascript
  // src/context/AppContext.jsx
  export const AppContext = createContext();
  export const AppProvider = ({ children }) => { ... };
  export const useApp = () => useContext(AppContext);
  ```

- [ ] **5.9** Extract usePermissions hook (~50 lines)
  ```javascript
  // src/hooks/usePermissions.js
  export const Permissions = { ... };
  export const usePermissions = () => { ... };
  ```

- [ ] **5.10** Extract UI components (~300 lines total)
  - Button, Card, Modal, Icon, LoadingSpinner, Toast

- [ ] **5.11** Extract form components (~1,000 lines total)
  - AttendingForm, ResidentForm, RuleForm, AssignmentForm

- [ ] **5.12** Extract view components (~4,500 lines total)
  - App, LoginPage, Dashboard, ScheduleCalendar, etc.

- [ ] **5.13** Update main.jsx as entry point
  ```javascript
  // src/main.jsx
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import { AppProvider } from './context/AppContext';
  import { ToastProvider } from './components/ui/Toast';
  import { ErrorBoundary } from './components/ErrorBoundary';
  import App from './views/App';
  import './index.css';

  // Set up globals for CDN compatibility
  window.React = React;
  window.ReactDOM = ReactDOM;

  ReactDOM.createRoot(document.getElementById('root')).render(
      <ErrorBoundary>
          <ToastProvider>
              <AppProvider>
                  <App />
              </AppProvider>
          </ToastProvider>
      </ErrorBoundary>
  );
  ```

- [ ] **5.14** Update imports throughout codebase

- [ ] **5.15** Run build and fix any issues

### Acceptance Criteria
- [ ] No file exceeds 500 lines
- [ ] All imports resolve correctly
- [ ] `npm run build` succeeds
- [ ] App functionality unchanged
- [ ] No circular dependencies
- [ ] Each module has single responsibility

### Duration: 8-12 hours

### Dependencies: Phases 1-4 complete (to avoid merge conflicts)

---

## Phase 6: Testing

### Objective
Add comprehensive test suite for critical functionality.

### Setup Tasks

- [ ] **6.1** Install test dependencies
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
  ```

- [ ] **6.2** Configure Vitest
  ```javascript
  // vitest.config.js
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
      plugins: [react()],
      test: {
          environment: 'jsdom',
          globals: true,
          setupFiles: './src/test/setup.js',
          coverage: {
              provider: 'v8',
              reporter: ['text', 'json', 'html'],
              exclude: ['node_modules/', 'src/test/']
          }
      }
  });
  ```

- [ ] **6.3** Create test setup file
  ```javascript
  // src/test/setup.js
  import '@testing-library/jest-dom';
  import { vi } from 'vitest';

  // Mock Firebase
  vi.mock('firebase/app', () => ({ ... }));
  vi.mock('firebase/auth', () => ({ ... }));
  vi.mock('firebase/firestore', () => ({ ... }));
  ```

### Test Files

- [ ] **6.4** ConflictDetection tests
  ```javascript
  // src/test/utils/conflict.test.js
  describe('ConflictDetection', () => {
      describe('checkDoubleBooking', () => {
          test('detects resident double booking', () => { ... });
          test('detects attending double booking', () => { ... });
          test('ignores excluded assignment ID', () => { ... });
      });

      describe('checkWeeklyHours (ACGME)', () => {
          test('allows under 80 hours', () => { ... });
          test('warns at 70+ hours', () => { ... });
          test('errors over 80 hours', () => { ... });
          test('excludes virtual assignments', () => { ... });
          test('excludes protected time', () => { ... });
          test('uses configurable hours per slot', () => { ... });
      });

      describe('checkConsecutiveDays (ACGME)', () => {
          test('allows up to 6 consecutive days', () => { ... });
          test('warns at 5 consecutive days', () => { ... });
          test('errors at 7+ consecutive days', () => { ... });
          test('excludes virtual assignments', () => { ... });
      });

      describe('checkVacationConflict', () => { ... });
      describe('checkProtectedTime', () => { ... });
  });
  ```

- [ ] **6.5** Permissions tests
  ```javascript
  // src/test/hooks/usePermissions.test.js
  describe('Permissions', () => {
      test('admin has all permissions', () => { ... });
      test('program_admin has admin permissions', () => { ... });
      test('chief_resident has admin permissions', () => { ... });
      test('scheduler can schedule but not admin', () => { ... });
      test('member has no write permissions', () => { ... });
  });
  ```

- [ ] **6.6** Validation tests
  ```javascript
  // src/test/utils/validation.test.js
  describe('ValidationUtils', () => {
      test('validateEmail accepts valid emails', () => { ... });
      test('validateEmail rejects invalid emails', () => { ... });
      test('validatePGYLevel accepts valid levels', () => { ... });
  });
  ```

- [ ] **6.7** Export utils tests
  ```javascript
  // src/test/utils/export.test.js
  describe('ExportUtils', () => {
      test('assignmentsToCSV generates valid CSV', () => { ... });
      test('parseImportedJSON validates schema', () => { ... });
  });
  ```

- [ ] **6.8** Component smoke tests
  ```javascript
  // src/test/components/smoke.test.jsx
  describe('Component Smoke Tests', () => {
      test('Button renders without crash', () => { ... });
      test('Modal renders when open', () => { ... });
      test('AttendingForm renders with data', () => { ... });
  });
  ```

- [ ] **6.9** Add test script to package.json
  ```json
  {
      "scripts": {
          "test": "vitest",
          "test:coverage": "vitest run --coverage",
          "test:watch": "vitest --watch"
      }
  }
  ```

- [ ] **6.10** Add testing section to README.md

### Acceptance Criteria
- [ ] `npm run test` passes all tests
- [ ] ConflictDetection has 100% coverage
- [ ] Permissions has 100% coverage
- [ ] ValidationUtils has 100% coverage
- [ ] All ACGME edge cases covered
- [ ] Coverage report generated

### Duration: 6-8 hours

### Dependencies: Phase 5 complete (for modular imports)

---

## Phase 7: Bundle/Performance

### Objective
Reduce bundle size below 500KB per chunk and eliminate build warning.

### Current State
```
assets/chunks/index-*.js  2,079 kB │ gzip: 460 kB
⚠️ Some chunks are larger than 500 kB after minification
```

### Tasks

- [ ] **7.1** Add bundle analyzer
  ```bash
  npm install -D rollup-plugin-visualizer
  ```
  ```javascript
  // vite.config.js
  import { visualizer } from 'rollup-plugin-visualizer';

  export default defineConfig({
      plugins: [
          react(),
          visualizer({ open: true, gzipSize: true })
      ]
  });
  ```

- [ ] **7.2** Analyze current bundle composition
  Run build and examine stats.html

- [ ] **7.3** Configure manual chunks
  ```javascript
  // vite.config.js
  export default defineConfig({
      build: {
          rollupOptions: {
              output: {
                  manualChunks: {
                      'vendor-react': ['react', 'react-dom'],
                      'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
                      'vendor-ui': ['framer-motion', 'lucide-react'],
                      'vendor-charts': ['recharts'],
                      'vendor-utils': ['date-fns', 'papaparse']
                  }
              }
          },
          chunkSizeWarningLimit: 500
      }
  });
  ```

- [ ] **7.4** Lazy load heavy views
  ```javascript
  // src/views/App.jsx
  import { lazy, Suspense } from 'react';

  const ChatAssistantPanel = lazy(() => import('./ChatAssistantPanel'));
  const AutoScheduler = lazy(() => import('./AutoScheduler'));
  const BackupRestore = lazy(() => import('./BackupRestore'));

  // Usage
  <Suspense fallback={<LoadingSpinner />}>
      {view === 'chat' && <ChatAssistantPanel />}
  </Suspense>
  ```

- [ ] **7.5** Tree-shake date-fns
  ```javascript
  // Before (bad)
  import * as dateFns from 'date-fns';

  // After (good)
  import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';
  ```

- [ ] **7.6** Optimize Recharts imports
  ```javascript
  // Before
  import { BarChart, Bar, XAxis, YAxis, ... } from 'recharts';

  // After - only import what's used
  import { BarChart } from 'recharts/lib/chart/BarChart';
  import { Bar } from 'recharts/lib/cartesian/Bar';
  ```

- [ ] **7.7** Verify build output
  ```bash
  npm run build
  # All chunks should be < 500KB
  ```

### Acceptance Criteria
- [ ] No chunk exceeds 500KB
- [ ] Build completes without size warning
- [ ] Bundle analyzer report generated
- [ ] Lazy loading works for heavy components
- [ ] No runtime errors after optimization

### Duration: 4-6 hours

### Dependencies: Phase 5 complete (modularization enables splitting)

---

## Phase 8: CSV Import Decision

### Objective
Either implement validated CSV import or remove unused PapaParse dependency.

### Options Analysis

| Option | Effort | Value | Recommendation |
|--------|--------|-------|----------------|
| Implement CSV import | 8-12h | High (bulk onboarding) | RECOMMENDED |
| Remove PapaParse | 1h | N/A | Only if time-constrained |

### Tasks (If Implementing)

- [ ] **8.1** Create CSV import UI
  ```javascript
  // src/views/ImportWizard.jsx
  const ImportWizard = ({ entityType, onComplete }) => {
      const [file, setFile] = useState(null);
      const [preview, setPreview] = useState([]);
      const [mapping, setMapping] = useState({});
      const [errors, setErrors] = useState([]);

      // ... wizard steps
  };
  ```

- [ ] **8.2** Implement column mapping interface
  ```javascript
  // Allow user to map CSV columns to entity fields
  <ColumnMapper
      csvHeaders={headers}
      entityFields={['name', 'email', 'pgyStatus', ...]}
      mapping={mapping}
      onChange={setMapping}
  />
  ```

- [ ] **8.3** Add validation before import
  ```javascript
  const validateRows = (rows, entityType) => {
      const errors = [];
      rows.forEach((row, index) => {
          if (entityType === 'residents') {
              if (!row.name) errors.push(`Row ${index + 1}: Name required`);
              if (row.email && !isValidEmail(row.email)) {
                  errors.push(`Row ${index + 1}: Invalid email`);
              }
          }
          // ... more validation
      });
      return errors;
  };
  ```

- [ ] **8.4** Implement batch import with progress
  ```javascript
  const importRows = async (rows, entityType) => {
      const batchSize = 50;
      let imported = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          await Promise.all(batch.map(row =>
              firebaseService[`add${entityType}`](row)
          ));
          imported += batch.length;
          setProgress(imported / rows.length * 100);
      }
  };
  ```

- [ ] **8.5** Add sample CSV templates for download
  ```javascript
  const downloadTemplate = (entityType) => {
      const templates = {
          residents: 'name,email,pgyStatus,continuityDay,continuityTime\n',
          attendings: 'name,email,specialty,rotationIds\n',
          assignments: 'date,timeSlot,residentId,attendingId,siteId\n'
      };
      // ... download logic
  };
  ```

### Tasks (If Removing)

- [ ] **8.1** Remove PapaParse from package.json
- [ ] **8.2** Remove import statements
- [ ] **8.3** Remove CSV export that uses it (or rewrite with simple logic)
- [ ] **8.4** Update documentation

### Acceptance Criteria (If Implementing)
- [ ] Can upload CSV file
- [ ] Preview shows first 10 rows
- [ ] Column mapping works
- [ ] Validation catches errors before import
- [ ] Progress bar shows during import
- [ ] Sample templates downloadable
- [ ] Supports: residents, attendings, assignments

### Duration: 8-12 hours (implement) or 1 hour (remove)

### Dependencies: Phase 5 complete

---

## Phase 9: UX/a11y Polish

### Objective
Ensure basic accessibility and usability standards are met.

### Tasks

- [ ] **9.1** Add ARIA labels to modals
  ```javascript
  <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
  >
      <h2 id="modal-title">{title}</h2>
      <p id="modal-description">{description}</p>
  </div>
  ```

- [ ] **9.2** Implement focus trap in modals
  ```javascript
  // Use focus-trap-react or implement manually
  import { FocusTrap } from 'focus-trap-react';

  <FocusTrap active={isOpen}>
      <Modal>{children}</Modal>
  </FocusTrap>
  ```

- [ ] **9.3** Add keyboard navigation basics
  ```javascript
  // Escape to close modal
  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  ```

- [ ] **9.4** Ensure non-blocking toasts
  ```javascript
  // Toast should not block interaction
  // Auto-dismiss after 5 seconds
  // Include close button
  ```

- [ ] **9.5** Add skip link for keyboard users
  ```javascript
  // At top of App
  <a href="#main-content" className="sr-only focus:not-sr-only">
      Skip to main content
  </a>
  ```

- [ ] **9.6** Verify form labels
  ```javascript
  // Every input must have associated label
  <label htmlFor="resident-name">Name</label>
  <input id="resident-name" ... />
  ```

- [ ] **9.7** Add visible focus indicators
  ```css
  /* In index.css */
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
      outline: 2px solid #14b8a6;
      outline-offset: 2px;
  }
  ```

- [ ] **9.8** Test with screen reader (VoiceOver/NVDA)

### Acceptance Criteria
- [ ] All modals have proper ARIA attributes
- [ ] Focus trapped in open modals
- [ ] Escape closes modals
- [ ] Tab navigation works logically
- [ ] All form fields have labels
- [ ] Focus indicators visible
- [ ] Skip link present
- [ ] No accessibility errors in axe DevTools

### Duration: 4-6 hours

### Dependencies: Phase 5 complete

---

## Phase 10: Deployment Readiness

### Objective
Document everything needed for production deployment.

### Tasks

- [ ] **10.1** Create `DEPLOYMENT.md`
  ```markdown
  # Deployment Guide

  ## Prerequisites
  - Node.js 20.x
  - Firebase CLI
  - Access to Firebase Console

  ## Environment Variables
  (None required for frontend - Firebase config is embedded)

  ## Build & Deploy Frontend
  npm run build
  firebase deploy --only hosting

  ## Deploy Firestore Rules
  firebase deploy --only firestore:rules

  ## Deploy Cloud Functions
  cd functions-backend
  npm run deploy
  ```

- [ ] **10.2** Document Firebase configuration
  ```markdown
  ## Firebase Project: autoclinicscheduler

  ### Required Services
  - Authentication (Email/Password)
  - Firestore Database
  - Cloud Functions
  - Hosting (optional)

  ### Security Rules
  Source: /firestore.rules (root)
  App copy: /site/public/apps/clinic-scheduler-pro/firestore-rules.txt
  ```

- [ ] **10.3** Document callable functions expected
  ```markdown
  ## Cloud Functions Required

  | Function | Purpose |
  |----------|---------|
  | `autoSchedule` | Auto-generate assignments |
  | `chatAssistant` | AI scheduling assistant |
  | `calculateAnalytics` | Dashboard metrics |
  | `generateSchedulePDF` | Export to PDF |
  ```

- [ ] **10.4** Document secrets handling
  ```markdown
  ## Secrets

  The following are NOT secrets (public Firebase config):
  - apiKey
  - authDomain
  - projectId

  The following ARE secrets (backend only):
  - Gemini API key
  - SendGrid API key
  - Session secrets
  ```

- [ ] **10.5** Create deployment checklist
  ```markdown
  ## Pre-Deployment Checklist

  - [ ] All tests pass (`npm run test`)
  - [ ] Build succeeds (`npm run build`)
  - [ ] No console errors in browser
  - [ ] Login flow works
  - [ ] RBAC enforced (member can't write)
  - [ ] ACGME checks work correctly
  - [ ] Firestore rules tested in emulator
  ```

- [ ] **10.6** Update README.md with deployment section

### Acceptance Criteria
- [ ] DEPLOYMENT.md complete
- [ ] All environment variables documented
- [ ] All callable functions documented
- [ ] Secrets handling clear
- [ ] Deployment checklist usable

### Duration: 2-3 hours

### Dependencies: All phases complete

---

## Summary: Execution Order

```
Week 1:
├── Phase 0: Environment Prep (1h)
├── Phase 1: RBAC Correctness (4-6h) ← CRITICAL BLOCKER
└── Phase 2: UI Permission Enforcement (4-6h)

Week 2:
├── Phase 3: ACGME Validation (3-4h) [parallel]
├── Phase 4: Data Model Parity (2-3h) [parallel]
└── Phase 5: Modularization (8-12h)

Week 3:
├── Phase 6: Testing (6-8h)
├── Phase 7: Bundle/Performance (4-6h)
└── Phase 8: CSV Import (8-12h or 1h)

Week 4:
├── Phase 9: UX/a11y Polish (4-6h)
└── Phase 10: Deployment Readiness (2-3h)

Total: ~50-70 hours
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| RBAC breaks existing users | High | Critical | Phase 1 healing, test in emulator |
| Modularization introduces bugs | Medium | High | Incremental extraction, tests |
| Bundle optimization breaks app | Low | High | Test each change, rollback plan |
| Time overrun on CSV import | Medium | Low | Can defer, remove PapaParse |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Build size (main chunk) | 2MB | < 500KB |
| Test coverage | 0% | > 80% |
| a11y violations (axe) | Unknown | 0 critical |
| RBAC test pass rate | N/A | 100% |
| Lighthouse performance | Unknown | > 80 |
