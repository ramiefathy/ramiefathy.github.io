# Legacy Content Archive

**Historical research reports and prototype applications have been archived to reduce repository size.**

## Quick Access

📦 **Download Archive:** [legacy-archive-2025-09-29.zip](https://github.com/ramiefathy/ramiefathy.github.io/releases/tag/v1.0.0-legacy) (7.5 MB compressed)

📋 **Archive Contents:** See [ARCHIVE-MANIFEST.md](https://github.com/ramiefathy/ramiefathy.github.io/releases/download/v1.0.0-legacy/ARCHIVE-MANIFEST.md)

## Archive Summary

**Archive Date:** September 29, 2025
**Original Size:** 15 MB
**Compressed Size:** 7.5 MB
**Files Archived:** 48 files (reports, prototypes, historical apps)

### What Was Archived

#### Research Reports (14 MB)
- 20191028_CTCL.nb2.html (11 MB) - CTCL Jupyter notebook analysis
- 20200102_r_dermatology_analysis_RAF.html (818 KB) - R statistical analysis
- Wound care application prototypes (1.7 MB)
- AAD modules analysis (76 KB)

#### Historical Applications (1 MB)
- DermaScribe.html, aiScribe.html - Early scribe prototypes (superseded by RAMIE)
- SecretSurgicalAgent.html, BetaEvolve.html - Research prototypes
- codegen_project_2025-05-25/ - Incomplete React code generation project

## Why Archive?

- **Repository Performance:** Reduce clone time and working directory size
- **Development Focus:** Keep active development uncluttered
- **Historical Preservation:** Content remains accessible via releases
- **Git Efficiency:** Smaller diffs and faster operations

## Accessing Archived Content

### Download from GitHub Releases

```bash
# Download archive
curl -L -o legacy-archive.zip \
  https://github.com/ramiefathy/ramiefathy.github.io/releases/download/v1.0.0-legacy/legacy-archive-2025-09-29.zip

# Extract
unzip legacy-archive.zip
```

### Browse in Git History

Content remains in git history before the archive commit:

```bash
# View legacy folder at last commit before archival
git show ca04921^:legacy/

# Checkout legacy content temporarily
git checkout ca04921^ -- legacy/

# Or browse on GitHub
# https://github.com/ramiefathy/ramiefathy.github.io/tree/ca04921^/legacy
```

## Restoration

If you need to restore legacy content to the working directory:

```bash
# Download and extract archive
curl -L https://github.com/ramiefathy/ramiefathy.github.io/releases/download/v1.0.0-legacy/legacy-archive-2025-09-29.zip -o legacy.zip
unzip legacy.zip

# Or restore from git history
git checkout ca04921^ -- legacy/
git reset HEAD legacy/  # Unstage if you don't want to commit
```

## Historical Significance

### Research Evolution
- **CTCL Analysis (2019):** Foundational research influencing current mind map applications
- **R Analysis (2020):** Statistical methods now integrated into data visualization tools
- **Scribe Prototypes (2020-2024):** Evolution path to modern RAMIE system

### Code Archaeology
These artifacts document the evolution of:
- AI-powered clinical documentation (DermaScribe → aiScribe → RAMIE)
- Interactive medical visualizations (early prototypes → production mind maps)
- Web application architecture (jQuery → React → Astro/React hybrid)

---

**Questions?** See full manifest in archive or [contact the maintainer](https://ramiefathy.github.io/about/)

**License:** All archived content remains under the repository's MIT license