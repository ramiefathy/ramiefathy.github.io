# Systems explorer package

This directory is the deployable boundary for the atlas's seven first-class systems-explorer representations.

## Files

- `systems-explorer-shell.js` owns the explorer's HTML shell.
- `systems-explorer.css` owns explorer-specific layout and visual grammar.
- `systems-explorer.js` owns graph construction, projection, interaction, inspection, triptych rendering, and guided-story behavior.
- `alternative-views.js` owns aligned mechanism lanes, the bipartite projection, the difference lens, tripartite parallel sets, the sparse coverage volume, and their structured table counterparts.
- `alternative-views.css` owns the shared alternative-view grammar, responsive layouts, focus states, orthogonal-slice matrix, and print behavior.
- `p0-scientific-remediation.js` owns the P0 scientific-integrity, evidence-quarantine, and opt-in layer controls described below.

The parent `index.html` still owns the canonical data tables, shared palette and typography tokens, shared DOM helpers, global condition state, and tab navigation. These files are classic scripts, not ES modules, because the explorer intentionally consumes that existing global lexical contract. This is a transitional boundary, documented rather than hidden.

## Runtime order

1. The parent document loads both explorer stylesheets.
2. `systems-explorer-shell.js` replaces `#systemsExplorerMount` with the explorer interface before the parent initialization script runs.
3. The parent script defines canonical data and shared helpers.
4. `systems-explorer.js` and then `alternative-views.js` define explorer behavior.
5. `p0-scientific-remediation.js` remediates canonical data and installs the evidence-layer controls.
6. The parent initialization code populates and renders the explorer and all first-class representations.

Changing that order can produce missing-element or missing-binding failures.

## Development contract

- Do not create a second copy of canonical condition, pathway, feature, treatment, evidence, or relationship data here.
- Preserve the five-state relational semantics: direct, derived, explicit zero, unknown, and structurally unavailable.
- Never convert an unknown or unavailable relationship into an absent or weak one for visual convenience.
- Keep evidence confidence visually distinct from relationship magnitude and from relation type.
- Keep all seven representation tabs visible; do not gate the five comparison views behind an experimental flag or disclosure.
- Every alternative view must retain a visible structured table, keyboard interaction, deterministic ordering, and an explicit denominator or chain count.
- Verify every representation in both themes at desktop and 390 px widths.
- Run `npx playwright test tests/rheum-derm-immune-atlas.spec.ts tests/rheum-derm-atlas-alternative-views.spec.ts` from `site/` after changes.

The implementation and consultation roadmap lives in `docs/rheum-derm-atlas-explorer-and-navigation-plan.md`; the domain-neutral external-review brief lives in `docs/rheum-derm-atlas-explorer/CONSULTATION_BRIEF.md`.


## P0 scientific-integrity layer

`p0-scientific-remediation.js` executes after the explorer renderers and before atlas initialization. It splits vasculitis endotypes, repairs phenotype classification, enforces exact-span/curator-confirmed default links, quarantines generated hypotheses, and adds explicit opt-in controls for exploratory mappings and canonical-background rules. See `docs/rheum-derm-atlas-p0-remediation.md`.


## P1/P2 governed relationship and interface layer

`p1-p2-governance.js` loads after the P0 remediation layer and before parent initialization. It owns the orthogonal seven-dimension relationship contract, polyhierarchical phenotype tags, mandatory endotype/tissue/applicability scope, curation and conflicting-evidence support, task-oriented navigation, provenance-first defaults, epistemic denominators, grouped search and label disclosure, expanded provenance inspection, reproducible URL state, visible-subset export, and non-drag/touch/assistive-technology alternatives. `p2-interface.css` owns the corresponding responsive interface grammar.

The default experience is the two-dimensional provenance triptych. The free-space 3D graph is an optional projection; distance, angle, proximity, and node size do not encode biological magnitude or causal strength.
