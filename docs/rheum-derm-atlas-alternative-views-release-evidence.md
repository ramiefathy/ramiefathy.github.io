# Rheum–Derm Atlas alternative views — release evidence

Date: 2026-07-13  
Base commit: `7bb6fa3cffe23f5f95aa2c119f8e37db25bc1841`  
Runtime: Node `22.12.0`

## Disposition

All five proposed alternative representations are **shipped as first-class Systems Explorer tabs**. None is hidden behind an experimental flag, disclosure, or secondary route.

| Representation | Disposition | Primary question | Accessible counterpart |
| --- | --- | --- | --- |
| Aligned mechanism lanes | Shipped | Which canonical pathways are shared or distinctive between two contexts? | Keyboard-addressable 108-mark comparison plus visible state/source table |
| Bipartite projection | Shipped | Which contexts or treatments connect to which pathways? | Roving-keyboard relationships, focused-edge isolation, inspector, full coordinate table |
| Difference lens | Shipped | Which fixed pathway coordinates are shared, unique, discordant, filtered, or unmapped? | Redundant symbols/patterns and visible 27-row state/source table |
| Tripartite parallel sets | Shipped | Which context → pathway → treatment or feature chains are supported? | Keyboard-addressable routes, component-source inspector, visible chain table |
| Orthogonal-slice coverage volume | Shipped | Where do context, pathway, and treatment records form a complete supported chain? | Three exact orthogonal slice orientations, keyboard grid, component-state inspector, visible slice table |

## Semantic evidence

- Every view consumes the existing v5 relation rows, evidence resolver, source registry, and versioned canonical ordering; it does not duplicate the atlas data.
- Direct, derived, explicit-zero, threshold-filtered, unknown/unmapped, and structurally-unavailable states retain separate labels and redundant visual forms.
- Coverage-volume state closure is deterministic across all `18 × 27 × 49 = 23,814` coordinates.
- At the default A–B evidence floor, the volume contains 61 derived chains, 67 threshold-filtered complete chains, and 23,686 incomplete/unknown coordinates. At A–D, two explicit-zero coordinates remain explicitly labeled rather than becoming unknown/unmapped or structurally unavailable.
- A structurally-unavailable component propagates to a structurally-unavailable composite coordinate; it is never converted to unknown/unmapped, threshold-filtered, or explicit zero.
- A threshold-filtered volume coordinate requires all three component relations to be positive or filtered and at least one to be filtered. A lone filtered component cannot convert an otherwise incomplete coordinate into a filtered chain.
- Coverage-volume inspectors expose all three component states, the composition rule, the worst evidence grade for a supported composition, and source IDs.
- Parallel-set routes expose component evidence and state that they do not encode synergy, combined efficacy, or quantitative downstream suppression.
- Edge and mark width is constant. Magnitude is explicitly not encoded.

## Accessibility and interaction evidence

- Seven representation tabs are always visible and use roving tab focus with Arrow, Home, and End navigation.
- Interactive SVGs expose a named `group`; individual marks expose named `button` roles. The SVG container does not flatten interactive descendants into an image.
- Marks support Tab entry, arrow traversal, Enter/Space activation, visible focus, and locked inspector output.
- Coverage slices use a keyboard-addressable grid. All views retain a visible structured table for precise and screen-reader-oriented traversal.
- Controls have persistent labels and minimum 44 px targets. Core information is not hover-only.
- The full-cohort bipartite overview preserves all 486 condition–pathway coordinates. Activating one of its 83 supported A–B links isolates the selected source, target, and edge without clearing the overview or filters.
- At 390 × 844 CSS px, all five representations remain reachable, the seven tabs remain legible in a two-column switcher, and no page-level horizontal overflow occurs. Wide scientific graphics and matrices scroll only inside locally bordered regions.
- Reduced-motion and print rules are defined for the alternative-view package.

## Visual review

The five views were reviewed interactively in the in-app browser at 1440 × 1000 and 390 × 844 CSS px in both light and dark themes. Review included representation switching, threshold and facet controls, keyboard selection, full-cohort bipartite isolation, all three coverage-slice orientations, inspector updates, local overflow, and browser diagnostics.

Measured token contrast for the new surfaces and semantic colors:

| Theme | Lowest measured ratio | Highest measured ratio |
| --- | ---: | ---: |
| Light | 4.76:1 | 13.81:1 |
| Dark | 5.84:1 | 16.36:1 |

The browser error/warning log was empty after the interaction pass. The anti-slop blocklist reported zero errors and zero warnings for the Explorer package; the complete atlas document passed the heading/landmark check.

## Automated evidence

| Gate | Result |
| --- | --- |
| Focused atlas browser suites | 21/21 passed |
| Unit/policy suite | 33 files; 212/212 tests passed |
| Full browser suite | 157 passed; 21 opt-in screenshot tests skipped |
| Production build | Passed; existing >600 kB chunk advisory remains |
| `git diff --check` | Passed |

The dedicated alternative-view browser suite covers first-class tab exposure, deployed asset loading, keyboard inspection, state/denominator closure, fixed-coordinate determinism across rerenders, explicit-zero/filtered/unknown volume strata, all orthogonal slice sizes, both parallel-set endpoint classes, full-cohort bipartite access, and 390 px containment.

## Residual risk

- This tranche establishes implementation and browser evidence, not a formal stratified human task-performance study. Promotion here means production-ready and evidence-preserving; comparative superiority over existing views remains unclaimed.
- The all-entity bipartite view is intentionally dense as an overview. Focused entity selection and locked-edge isolation are the precision paths; the full coordinate table remains authoritative.
- The coverage volume is a categorical set-intersection view. Its sparse isometric overview is not a quantitative 3D measurement; the orthogonal slices and table are the precise counterparts.
- The new views do not introduce relationship magnitude. A future magnitude audit may validly conclude that constant-width rendering should remain.
- The repository's existing large-chunk advisory, `punycode` deprecation notices, and known `xlsx` security debt predate this tranche and remain outside its scope.
