# Legacy Content Archive - September 2025

This document catalogs historical research reports and prototype applications archived from the ramiefathy.github.io repository.

## Archive Summary

**Archive Date:** September 29, 2025
**Total Size:** 15 MB
**Archive File:** legacy-archive-2025-09-29.zip
**GitHub Release:** [v1.0.0-legacy](https://github.com/ramiefathy/ramiefathy.github.io/releases/tag/v1.0.0-legacy)

## Contents

### Reports (14 MB)

Jupyter notebook exports and R analysis reports from 2019-2020 research:

| File | Size | Date | Description |
|------|------|------|-------------|
| 20191028_CTCL.nb2.html | 11 MB | Oct 2019 | Cutaneous T-Cell Lymphoma Jupyter notebook analysis |
| 20191121_WoundCareWebpages.html | 880 KB | Nov 2019 | Original wound care application (v1) |
| 20191121_WoundCareWebpages2.html | 899 KB | Nov 2019 | Wound care application (v2) |
| 20200102_r_dermatology_analysis_RAF.html | 818 KB | Jan 2020 | R statistical analysis of dermatology data |
| 20200625_AAD-Modules-Analysis_RAF.html | 76 KB | Jun 2020 | AAD modules review and analysis |

### Historical Applications (1 MB)

Prototype applications and discontinued projects:

- **SecretSurgicalAgent.html** (535 KB) - Early prototype application
- **BetaEvolve.html** (65 KB) - Beta evolution tracker prototype
- **DermaScribe.html** - Original dermatology scribe prototype (superseded by RAMIE)
- **aiScribe.html** - AI scribe version 1 (superseded by RAMIE)
- **codegen_project_2025-05-25/** (388 KB) - Incomplete code generation project with React frontend

## Rationale for Archiving

This content was archived to:

1. **Reduce repository size** - Removing 15 MB (11% of total repository)
2. **Improve performance** - Faster clones and checkouts
3. **Maintain history** - Content remains accessible via GitHub releases
4. **Focus active development** - Keep working directory focused on current projects

## Accessing Archived Content

### Via GitHub Releases

1. Visit [ramiefathy.github.io releases](https://github.com/ramiefathy/ramiefathy.github.io/releases)
2. Download `legacy-archive-2025-09-29.zip` from v1.0.0-legacy release
3. Extract to view reports and applications

### Via Git History

Content remains in git history before commit ca04921:

```bash
# View legacy folder at last commit before archival
git checkout ca04921^ -- legacy/

# Or browse historical versions on GitHub
# Navigate to: https://github.com/ramiefathy/ramiefathy.github.io/tree/ca04921^/legacy
```

## Restoration Instructions

If legacy content needs to be restored:

```bash
# Download archive
curl -L -o legacy-archive.zip https://github.com/ramiefathy/ramiefathy.github.io/releases/download/v1.0.0-legacy/legacy-archive-2025-09-29.zip

# Extract
unzip legacy-archive.zip

# Commit back to repository if needed
git add legacy/
git commit -m "restore: legacy content from archive"
```

## Historical Significance

### CTCL Notebook (11 MB)

The largest file in this archive represents foundational research in cutaneous T-cell lymphoma visualization and analysis from late 2019. This work influenced subsequent mind map development and interactive medical visualization approaches used in current production applications.

### Wound Care Applications

The wound care webpage prototypes (v1 and v2) from November 2019 demonstrate early approaches to medical web application development. These evolved into the current WoundCareWebpages.html production application in /apps.

### Scribe Evolution

DermaScribe.html and aiScribe.html represent the evolution of AI-powered clinical documentation:
- **DermaScribe** (2020) - Initial concept
- **aiScribe** (2021-2024) - First AI integration
- **RAMIE** (2025) - Modern production system with WebSocket backend

### Code Generation Project

The incomplete codegen_project_2025-05-25 demonstrates exploratory work in automated code generation for medical applications using Material-UI and React. While not completed, concepts informed current development practices.

## Preservation Notice

This archive preserves research outputs and prototypes for:
- Historical reference
- Methodology documentation
- Code archaeology
- Intellectual property documentation

All content remains under the repository's MIT license.

---

**Archive Maintainer:** Dr. Ramie Fathy
**Archive Date:** September 29, 2025
**Archive Version:** 1.0.0