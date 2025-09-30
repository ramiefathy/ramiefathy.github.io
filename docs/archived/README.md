# Archived Implementation Plans

This directory contains historical implementation plans and enhancement proposals. These documents represent:

1. **Completed Features** - Successfully delivered and now operational
2. **Future Features** - Planned but not yet started
3. **Superseded Plans** - Replaced by different implementations

## Status Legend

- ✅ **Completed** - Feature delivered and operational
- 🔄 **Superseded** - Replaced by newer implementation approach
- 📋 **Future** - Planned for future development
- 🚧 **Partial** - Some features implemented, others pending

## Archived Documents

| Document | Status | Date Archived | Current State |
|----------|--------|---------------|---------------|
| `dermatology-scribe-enhancement-plan.md` | 🔄 Superseded | Sept 2025 | Replaced by RAMIE (launched Jan 2025) |
| `modern-ui-redesign.md` | ✅ Completed | Sept 2025 | Dark navy UI implemented |
| `ui-enhancements-readme.md` | ✅ Completed | Sept 2025 | Theme system, shortcuts, command palette live |
| `biologic-monitoring-dashboard.md` | ✅ Completed | Sept 2025 | Dashboard operational at /apps/biologic-monitoring-dashboard/ |
| `mindmap-modernization-plan.md` | 🚧 Partial | Sept 2025 | Some enhancements complete, others ongoing |
| `load-test-plan.md` | 📋 Future | Sept 2025 | Pending production load testing |
| `skin-diary-implementation-plan.md` | 📋 Future | Sept 2025 | PWA concept for patient symptom tracking |
| `treatment-adherence-coach-implementation-plan.md` | 📋 Future | Sept 2025 | Patient coaching feature concept |

## Feature Evolution Timeline

### AI Scribe (2020-2025)

**Evolution Path:**
1. **DermaScribe** (2020) - Initial concept, jQuery-based
2. **aiScribe** (2021-2024) - First AI integration using early LLMs
3. **Enhanced Scribe Plans** (2024) - `dermatology-scribe-enhancement-plan.md` documented next generation features
4. **RAMIE** (Jan 2025) - Modern implementation with WebSocket backend, Gemini 2.0, dark navy UI

**Status:** ✅ Completed via RAMIE implementation
**Archive Reason:** Plan superseded by actual RAMIE launch which exceeded original specifications

### UI Modernization (2024-2025)

**Plans:**
- `modern-ui-redesign.md` - Comprehensive UI overhaul specification
- `ui-enhancements-readme.md` - Specific enhancement catalog

**Implementation:** January 2025 RAMIE launch
**Features Delivered:**
- Dark navy theme with OLED optimization
- Command palette (Ctrl+K)
- Keyboard shortcuts system
- Focus mode
- Accessibility improvements (WCAG 2.1)
- Export options (PDF, text, markdown)

**Status:** ✅ Completed
**Archive Reason:** All specified features implemented and operational

### Biologic Monitoring Dashboard

**Plan:** `biologic-monitoring-dashboard.md`
**Implementation:** September 2025
**Location:** `/apps/biologic-monitoring-dashboard/`

**Features Delivered:**
- Real-time monitoring interface
- Treatment tracking
- Lab value visualization
- Side effect reporting

**Status:** ✅ Completed
**Archive Reason:** Dashboard launched and in use

### Mind Map Modernization

**Plan:** `mindmap-modernization-plan.md`
**Implementation:** Ongoing (2024-2025)

**Completed:**
- D3.js rendering improvements
- Mobile responsiveness
- Search functionality
- Info panel redesign

**Pending:**
- Export to various formats
- Collaboration features
- Version comparison

**Status:** 🚧 Partial
**Archive Reason:** Partially complete; tracking moved to active issues

### Load Testing

**Plan:** `load-test-plan.md`
**Status:** 📋 Future
**Archive Reason:** Deferred until production usage warrants performance testing

### Future Feature Concepts

#### Skin Diary & Symptom Tracker

**Plan:** `skin-diary-implementation-plan.md`
**Concept:** PWA for patient-managed symptom tracking
**Status:** 📋 Future
**Archive Reason:** Approved concept, awaiting resources/prioritization

**Key Features:**
- Offline-first IndexedDB storage
- Photo tracking with metadata
- Pattern analysis
- Export for provider visits

#### Treatment Adherence Coach

**Plan:** `treatment-adherence-coach-implementation-plan.md`
**Concept:** AI-powered coaching system for treatment compliance
**Status:** 📋 Future
**Archive Reason:** Approved concept, awaiting resources

**Key Features:**
- Reminder system
- Progress tracking
- Educational content
- Provider communication

## Using Archived Plans

### For Historical Reference

Archived plans document the evolution of features and provide context for current implementations.

**Example:** Understanding why RAMIE is structured as a WebSocket service

→ See `dermatology-scribe-enhancement-plan.md` for original vision
→ See `ramie-implementation-status.md` (active docs) for delivered features

### For Future Implementation

Future-tagged plans can be referenced when resuming development.

**Process:**
1. Review archived plan for original concept
2. Update requirements based on current technology
3. Create new active implementation document
4. Reference archived plan in new document

### For Decision Making

Superseded plans explain why certain approaches were chosen over others.

**Example:** Why WebSocket vs polling for real-time transcription

→ See architecture decisions in `dermatology-scribe-enhancement-plan.md`

## Document Lifecycle

### When to Archive

Move a document to archived/ when:
- ✅ Feature is completed and stable
- 🔄 Plan is superseded by different implementation
- 📋 Future plan is deprioritized for >6 months

### When to Keep Active

Keep in main `/docs` when:
- Plan is currently being implemented
- Document is operational runbook
- Information is needed for day-to-day operations

## Accessing Active Documentation

Current operational docs remain in `/docs`:
- `ai-scribe-operational-runbook.md` - RAMIE service operations
- `ramie-implementation-status.md` - Current RAMIE state
- `regression-test-expansion.md` - Active test roadmap
- `20250925-production-readiness.md` - Launch checklist
- `release-governance-checklist.md` - Release procedures

**Full Index:** See `/docs/INDEX.md`

## Contributing

When archiving new documents:

1. **Update this README** with status and archive reason
2. **Update `/docs/INDEX.md`** to reflect new location
3. **Add link in active docs** if relevant
4. **Git commit message** should reference why archived

Example commit:
```
docs: archive biologic-monitoring-dashboard.md

Feature completed and launched Sept 2025. Dashboard now operational
at /apps/biologic-monitoring-dashboard/. See biologic-monitoring-handoff.md
for deployment details.
```

---

**Archive Established:** September 29, 2025
**Last Updated:** September 29, 2025
**Archive Maintainer:** Repository owner