# Systems explorer package

This directory is the deployable boundary for the atlas's free-space systems explorer and fixed provenance triptych.

## Files

- `systems-explorer-shell.js` owns the explorer's HTML shell.
- `systems-explorer.css` owns explorer-specific layout and visual grammar.
- `systems-explorer.js` owns graph construction, projection, interaction, inspection, triptych rendering, and guided-story behavior.

The parent `index.html` still owns the canonical data tables, shared palette and typography tokens, shared DOM helpers, global condition state, and tab navigation. These files are classic scripts, not ES modules, because the explorer intentionally consumes that existing global lexical contract. This is a transitional boundary, documented rather than hidden.

## Runtime order

1. The parent document loads the explorer stylesheet.
2. `systems-explorer-shell.js` replaces `#systemsExplorerMount` with the explorer interface before the parent initialization script runs.
3. The parent script defines canonical data and shared helpers.
4. `systems-explorer.js` defines explorer behavior.
5. The parent initialization code populates and renders the explorer.

Changing that order can produce missing-element or missing-binding failures.

## Development contract

- Do not create a second copy of canonical condition, pathway, feature, treatment, evidence, or relationship data here.
- Preserve the five-state relational semantics: direct, derived, explicit zero, unknown, and structurally unavailable.
- Never convert an unknown or unavailable relationship into an absent or weak one for visual convenience.
- Keep evidence confidence visually distinct from relationship magnitude and from relation type.
- Verify both free-space and triptych modes at desktop and 390 px widths.
- Run `npx playwright test tests/rheum-derm-immune-atlas.spec.ts` from `site/` after changes.

The implementation and consultation roadmap lives in `docs/rheum-derm-atlas-explorer-and-navigation-plan.md`; the domain-neutral external-review brief lives in `docs/rheum-derm-atlas-explorer/CONSULTATION_BRIEF.md`.
