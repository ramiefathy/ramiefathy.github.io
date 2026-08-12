# Site/App Test Inventory (Canonical)

This document is the **single source of truth** for which user-facing pages/apps are considered part of the deployed site surface and therefore **must** be covered by automated checks (Playwright E2E and/or Vitest policy tests).

## Why this exists
- Prevents drift between:
  - Astro routes in `site/src/pages/**`
  - Legacy static HTML apps shipped from `site/public/apps/**`
  - What our test suite actually covers in `site/tests/**` and `site/src/security/**`
- Makes “what we ship” explicit and reviewable during PRs.

## When to update
Update this inventory **whenever** you:
- Add/remove/rename an Astro route under `site/src/pages/**`
- Add/remove/rename a shipped legacy HTML app under `site/public/apps/**` (excluding `site/public/apps/vendor/**`)
- Change canonical URLs for externally hosted apps (e.g., Clinisched, Skinoculars)

## Canonical machine-readable inventory
The JSON below is what tests parse and enforce. Treat it as the contract.

```json
{
  "astroRoutes": [
    "/",
    "/about",
    "/apps",
    "/research",
    "/research/dermoscopy-llm-dashboard",
    "/blog",
    "/contact",
    "/legacy"
  ],
  "specialRoutes": {
    "notFound": "/404"
  },
  "mindmapTopics": {
    "sourceDir": "site/src/data/mindmaps",
    "routePrefix": "/apps/mindmaps/",
    "derivation": "Derived from directories under mindmapTopics.sourceDir at test runtime (no hardcoded topic list here)."
  },
  "legacyHtmlApps": [
    {
      "label": "Legacy apps index",
      "route": "/apps/legacy/index.html",
      "file": "site/public/apps/legacy/index.html",
      "category": "legacy-index",
      "requiresDownloads": false
    },
    {
      "label": "MindMaps (CTCL)",
      "route": "/apps/MindMaps/CTCL/CTCLMindMaps.html",
      "file": "site/public/apps/MindMaps/CTCL/CTCLMindMaps.html",
      "category": "mindmaps-legacy",
      "requiresDownloads": false
    },
    {
      "label": "MindMaps (Psoriasis)",
      "route": "/apps/MindMaps/Psoriasis/PsoriasisMindMaps.html",
      "file": "site/public/apps/MindMaps/Psoriasis/PsoriasisMindMaps.html",
      "category": "mindmaps-legacy",
      "requiresDownloads": false
    },
    {
      "label": "MindMaps (Alopecia)",
      "route": "/apps/MindMaps/Alopecia/AlopeciaMindMaps.html",
      "file": "site/public/apps/MindMaps/Alopecia/AlopeciaMindMaps.html",
      "category": "mindmaps-legacy",
      "requiresDownloads": false
    },
    {
      "label": "PDF Studio",
      "route": "/apps/pdf-studio.html",
      "file": "site/public/apps/pdf-studio.html",
      "category": "pdf-tools",
      "requiresDownloads": true
    },
    {
      "label": "PDF Merger (legacy redirect)",
      "route": "/apps/PDF%20Merger.html",
      "file": "site/public/apps/PDF Merger.html",
      "category": "pdf-tools",
      "requiresDownloads": true,
      "redirectTo": "/apps/pdf-studio.html?tool=assemble"
    },
    {
      "label": "PDF Splitter (legacy redirect)",
      "route": "/apps/PDF%20Splitter.html",
      "file": "site/public/apps/PDF Splitter.html",
      "category": "pdf-tools",
      "requiresDownloads": true,
      "redirectTo": "/apps/pdf-studio.html?tool=extract"
    },
    {
      "label": "Text Extractor (legacy redirect)",
      "route": "/apps/textExtractor.html",
      "file": "site/public/apps/textExtractor.html",
      "category": "pdf-tools",
      "requiresDownloads": true,
      "redirectTo": "/apps/pdf-studio.html?tool=textextract"
    },
    {
      "label": "WoundCare Webpages",
      "route": "/apps/WoundCareWebpages.html",
      "file": "site/public/apps/WoundCareWebpages.html",
      "category": "woundcare",
      "requiresDownloads": false
    },
    {
      "label": "Biologic Monitoring Dashboard",
      "route": "/apps/biologic-monitoring-dashboard/index.html",
      "file": "site/public/apps/biologic-monitoring-dashboard/index.html",
      "category": "dashboard",
      "requiresDownloads": true
    },
    {
      "label": "DermatoTarget Atlas",
      "route": "/apps/dermatotarget-atlas/",
      "file": "site/public/apps/dermatotarget-atlas/index.html",
      "category": "research-dashboard",
      "requiresDownloads": true
    },
    {
      "label": "Rheum–Derm Immune Atlas",
      "route": "/apps/rheum-derm-immune-atlas/",
      "file": "site/public/apps/rheum-derm-immune-atlas/index.html",
      "category": "clinical-reference",
      "requiresDownloads": true
    },
    {
      "label": "Dermatopathology Differentials (legacy)",
      "route": "/apps/dermatopathology-differentials.html",
      "file": "site/public/apps/dermatopathology-differentials.html",
      "category": "dermpath-legacy",
      "requiresDownloads": true
    },
    {
      "label": "Dermatopathology Navigator (archived prototype redirect)",
      "route": "/apps/dermatopathology-modern/index.html",
      "file": "site/public/apps/dermatopathology-modern/index.html",
      "category": "dermpath-modern",
      "requiresDownloads": false,
      "redirectTo": "/apps/dermatopathology-modern/index-fixed.html"
    },
    {
      "label": "Dermatopathology Navigator (index-fixed)",
      "route": "/apps/dermatopathology-modern/index-fixed.html",
      "file": "site/public/apps/dermatopathology-modern/index-fixed.html",
      "category": "dermpath-modern",
      "requiresDownloads": false
    },
    {
      "label": "Dermatopathology Navigator (dedup visualization)",
      "route": "/apps/dermatopathology-modern/deduplication-visualization.html",
      "file": "site/public/apps/dermatopathology-modern/deduplication-visualization.html",
      "category": "dermpath-modern",
      "requiresDownloads": false
    },
    {
      "label": "Dermatopathology Navigator (test-fixes)",
      "route": "/apps/dermatopathology-modern/test-fixes.html",
      "file": "site/public/apps/dermatopathology-modern/test-fixes.html",
      "category": "dermpath-modern",
      "requiresDownloads": false
    },
    {
      "label": "Dermatology Scribe (RAMIE)",
      "route": "/apps/dermatology-scribe/index.html",
      "file": "site/public/apps/dermatology-scribe/index.html",
      "category": "scribe",
      "requiresDownloads": true
    },
    {
      "label": "Dermatology Scribe (UI enhancements test)",
      "route": "/apps/dermatology-scribe/test-ui-enhancements.html",
      "file": "site/public/apps/dermatology-scribe/test-ui-enhancements.html",
      "category": "scribe",
      "requiresDownloads": false
    }
  ],
  "externalApps": [
    {
      "slug": "scheduler-pro",
      "canonicalUrl": "https://clinisched.ramiefathy.com/",
      "surfacesToCheck": [
        "site/src/data/apps.json",
        "site/src/pages/apps/index.astro",
        "apps/index.html",
        "apps/Scheduler.html"
      ]
    },
    {
      "slug": "skinoculars",
      "canonicalUrl": "https://skinoculars.ramiefathy.com/",
      "surfacesToCheck": [
        "site/src/data/apps.json",
        "site/src/pages/apps/index.astro"
      ]
    },
    {
      "slug": "margin-war-reference-v2",
      "canonicalUrl": "https://margin-war.ramiefathy.com/",
      "surfacesToCheck": [
        "site/src/data/apps.json",
        "site/src/pages/apps/index.astro"
      ]
    },
    {
      "slug": "ksa-sovereign-credit-analytics",
      "canonicalUrl": "https://ksa-credit.ramiefathy.com/",
      "surfacesToCheck": [
        "site/src/data/apps.json",
        "site/src/pages/apps/index.astro",
        "docs/ksa-credit-subdomain.md"
      ]
    }
  ],
  "excludedOnPurpose": [
    "site/public/apps/vendor/** (vendored libraries + upstream test/demo pages, not part of our product surface)",
    "root-level ./apps/** duplicates that are not shipped by Astro (non-canonical; keep for historical archive only)"
  ],
  "unlistedStaticPages": [
    {
      "label": "Taskboard (unlisted)",
      "route": "/tasks",
      "file": "site/public/tasks/index.html",
      "category": "internal-unlisted",
      "requiresDownloads": false
    },
    {
      "label": "MCQ benchmark dashboard (unlisted)",
      "route": "/study/mcq-benchmark-dashboard/",
      "file": "site/public/study/mcq-benchmark-dashboard/index.html",
      "category": "research-unlisted",
      "requiresDownloads": false
    },
    {
      "label": "MCQ evaluation dashboard (unlisted)",
      "route": "/mcq-eval/",
      "file": "site/public/mcq-eval/index.html",
      "category": "research-unlisted",
      "requiresDownloads": false
    },
    {
      "label": "Neutrophilic dermatoses lecture video (unlisted)",
      "route": "/lectures/neutrophilic-dermatoses-2026-05-07/",
      "file": "site/public/lectures/neutrophilic-dermatoses-2026-05-07/index.html",
      "category": "lecture-unlisted",
      "requiresDownloads": true
    },
    {
      "label": "Learning Machines lecture (unlisted)",
      "route": "/lectures/learning-machines-2026-06-03/",
      "file": "site/public/lectures/learning-machines-2026-06-03/index.html",
      "category": "lecture-unlisted",
      "requiresDownloads": false
    },
    {
      "label": "dermie VC prep (unlisted)",
      "route": "/apps/dermie-vc-prep-rf-20260514-x7q9m2/",
      "file": "site/public/apps/dermie-vc-prep-rf-20260514-x7q9m2/index.html",
      "category": "internal-unlisted",
      "requiresDownloads": false
    }
  ],
  "unlistedAstroRoutes": [
    {
      "label": "Egypt AI opportunity portfolio (unlisted)",
      "route": "/strategy/egypt-ai-portfolio",
      "file": "site/src/pages/strategy/egypt-ai-portfolio.astro",
      "category": "strategy-unlisted",
      "requiresDownloads": true,
      "allowedLinkFiles": [
        "site/src/components/EgyptPortfolioDashboard.jsx"
      ]
    },
    {
      "label": "Egypt AI portfolio podcast series (unlisted)",
      "route": "/strategy/egypt-ai-portfolio/podcast",
      "file": "site/src/pages/strategy/egypt-ai-portfolio/podcast.astro",
      "category": "strategy-unlisted",
      "requiresDownloads": true,
      "allowedLinkFiles": [
        "site/src/components/EgyptPortfolioDashboard.jsx"
      ]
    }
  ]
}
```
