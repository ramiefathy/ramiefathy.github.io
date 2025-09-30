# Documentation Index

**Last Updated:** September 29, 2025

This index provides quick access to all documentation in this repository.

## 📋 Active Operational Documentation

Current procedures and runbooks for production systems.

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [AI Scribe Operational Runbook](ai-scribe-operational-runbook.md) | RAMIE WebSocket service operations | Sept 2025 |
| [Production Readiness Checklist](20250925-production-readiness.md) | Pre-launch governance | Sept 2025 |
| [Release Governance Checklist](release-governance-checklist.md) | Deployment procedures | Sept 2025 |
| [Regression Test Expansion](regression-test-expansion.md) | Test strategy roadmap | Sept 2025 |
| [Dependency Audit](dependency-audit-2025-09-29.md) | Dependency consolidation report | Sept 2025 |

## 📊 Implementation Status

Current state of features and applications.

| Document | Status | Notes |
|----------|--------|-------|
| [RAMIE Implementation Status](ramie-implementation-status.md) | ✅ Operational | AI Scribe launched Jan 2025 |
| [Biologic Monitoring Handoff](biologic-monitoring-handoff.md) | ✅ Complete | Dashboard operational |
| [UI Implementation Summary](ui-implementation-summary.md) | ✅ Complete | Dark UI, shortcuts, themes live |

## 🗂️ Archived Plans & Historical Docs

**Location:** `/docs/archived/`

Completed implementation plans, superseded approaches, and future concepts.

[**→ Browse Archived Documentation**](archived/README.md)

### Quick Links to Archived Plans

- [Dermatology Scribe Enhancement Plan](archived/dermatology-scribe-enhancement-plan.md) - 🔄 Superseded by RAMIE
- [Modern UI Redesign](archived/modern-ui-redesign.md) - ✅ Completed Jan 2025
- [Biologic Monitoring Dashboard](archived/biologic-monitoring-dashboard.md) - ✅ Launched Sept 2025
- [Skin Diary Implementation Plan](archived/skin-diary-implementation-plan.md) - 📋 Future PWA concept
- [Treatment Adherence Coach](archived/treatment-adherence-coach-implementation-plan.md) - 📋 Future feature

## 🏗️ Application-Specific Documentation

Documentation living with applications:

### Clinic Scheduler Pro
- [README](../site/public/apps/clinic-scheduler-pro/README.md) - User guide
- [Firebase Setup](../site/public/apps/clinic-scheduler-pro/firebase-setup.md) - Technical setup

### Dermatopathology Navigator
- [Project Handoff](../site/public/apps/dermatopathology-modern/PROJECT-HANDOFF-DOCUMENT.md)
- [Project Status](../site/public/apps/dermatopathology-modern/PROJECT-STATUS.md)
- [Implementation Summary](../site/public/apps/dermatopathology-modern/IMPLEMENTATION-SUMMARY.md)

### Mind Maps
- See individual map directories in `/site/public/apps/MindMaps/`

## 🔧 Technical Documentation

### Repository Structure
- [CLAUDE.md](../CLAUDE.md) - Repository guidelines for Claude Code
- [AGENTS.md](../AGENTS.md) - Contributor onboarding guide
- [README.md](../README.md) - Project overview

### Migration & Cleanup
- [Apps Migration Status](../apps/README.md) - /apps consolidation progress
- [Legacy Archive](../legacy/README.md) - Archived historical content

### Build & Deployment
- [Dependency Audit](dependency-audit-2025-09-29.md) - Package.json structure
- [Migration Script](../scripts/migrate-apps-to-site.sh) - App consolidation tool

## 📑 Document Categories

### By Type

**Runbooks & Operations**
- AI Scribe Operational Runbook
- Production Readiness Checklist
- Release Governance Checklist

**Implementation Plans** (Active)
- Regression Test Expansion

**Implementation Plans** (Archived)
- See `/docs/archived/`

**Status Reports**
- RAMIE Implementation Status
- Biologic Monitoring Handoff
- UI Implementation Summary

**Technical Reports**
- Dependency Audit

### By System

**RAMIE (AI Scribe)**
- Operational Runbook ✅
- Implementation Status ✅
- Enhancement Plan (archived) ✅

**Clinic Scheduler Pro**
- Firebase Setup ✅
- App README ✅

**Biologic Monitoring**
- Handoff Document ✅
- Implementation Plan (archived) ✅

**UI/UX**
- Implementation Summary ✅
- Enhancement Plans (archived) ✅

## 🔍 Finding Documentation

### By Task

**"I need to deploy RAMIE"**
→ [AI Scribe Operational Runbook](ai-scribe-operational-runbook.md)

**"I need to set up clinic scheduler"**
→ [Clinic Scheduler README](../site/public/apps/clinic-scheduler-pro/README.md)
→ [Firebase Setup Guide](../site/public/apps/clinic-scheduler-pro/firebase-setup.md)

**"I need to understand why RAMIE was built this way"**
→ [RAMIE Implementation Status](ramie-implementation-status.md)
→ [Dermatology Scribe Enhancement Plan](archived/dermatology-scribe-enhancement-plan.md) (original vision)

**"I need to add tests"**
→ [Regression Test Expansion](regression-test-expansion.md)

**"I need to understand dependencies"**
→ [Dependency Audit](dependency-audit-2025-09-29.md)

**"I'm planning a new feature"**
→ Check [archived plans](archived/README.md) for similar concepts
→ Review [CLAUDE.md](../CLAUDE.md) for repo guidelines

### By Audience

**For Operations/DevOps:**
- AI Scribe Operational Runbook
- Production Readiness Checklist
- Release Governance Checklist

**For Developers:**
- CLAUDE.md (repo structure, coding standards)
- AGENTS.md (contributor guide)
- Regression Test Expansion
- Dependency Audit

**For Product/Planning:**
- Implementation Status docs
- Archived feature plans
- UI Implementation Summary

**For Users:**
- Application-specific READMEs
- Setup guides

## 📝 Documentation Standards

### Active Documentation Guidelines

**Location:** `/docs` (root level)

**Criteria for Active Status:**
- Operational runbooks currently in use
- Release/governance procedures
- Current implementation status
- Active development roadmaps

**Naming Convention:**
- Descriptive names: `ai-scribe-operational-runbook.md`
- Date prefixes for point-in-time docs: `20250925-production-readiness.md`
- Status indicators in filename: `ramie-implementation-status.md`

### Archived Documentation Guidelines

**Location:** `/docs/archived/`

**Move to Archive When:**
- ✅ Feature is complete and stable
- 🔄 Plan is superseded by different approach
- 📋 Future plan deprioritized for >6 months

**Process:**
1. Move document to `docs/archived/`
2. Update `docs/archived/README.md` with status
3. Update this INDEX.md
4. Add link in related active docs if relevant

### Application Documentation Guidelines

**Location:** Within app directory (e.g., `/site/public/apps/{app}/`)

**Purpose:**
- Setup instructions
- User guides
- Technical architecture
- API documentation

**Examples:**
- `README.md` - Primary documentation
- `firebase-setup.md` - Technical configuration
- `PROJECT-HANDOFF-DOCUMENT.md` - Handoff notes

## 🔄 Maintenance

This index is updated when:
- New operational documentation is created
- Implementation plans are completed or archived
- Major features launch
- Documentation structure changes

**Responsibility:** Repository maintainer

**Review Cadence:** Monthly or after major releases

---

**Need Help?**
- 📖 Start with [README.md](../README.md) for project overview
- 🤖 Check [CLAUDE.md](../CLAUDE.md) for development guidelines
- 👥 Review [AGENTS.md](../AGENTS.md) for contribution process
- 📧 Contact repository maintainer for clarifications