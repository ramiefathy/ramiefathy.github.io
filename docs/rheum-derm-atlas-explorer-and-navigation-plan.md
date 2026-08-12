# Rheum–Derm Immune Atlas: navigation, export, and systems explorer plan

Status: proposed; explorer isolation foundation implemented on the associated branch.

## Outcome

Reorganize the atlas around user questions, repair report export, and evolve the systems explorer into an interpretable evidence-aware comparison instrument. The work should reduce cognitive load without deleting advanced content or collapsing distinct evidence states.

This document consolidates the earlier PDF/navigation proposal with the systems-explorer changes requested on 2026-07-13.

## What is happening now

The explorer has been separated into a deployed package:

```text
site/public/apps/rheum-derm-immune-atlas/explorer/
├── README.md
├── systems-explorer-shell.js
├── systems-explorer.css
└── systems-explorer.js
```

The main document retains canonical data, shared design tokens, shared helpers, global navigation, and initialization. This is a behavior-preserving transitional boundary. A domain-neutral GPT 5.6 Pro review brief is stored at `docs/rheum-derm-atlas-explorer/CONSULTATION_BRIEF.md`.

## Diagnosed problems

### PDF export

The current **Download PDF** control invokes `window.print()`. The print stylesheet then forces every `.view` to display and gives each view a page break. As a result, a user expecting the current view receives the entire application, including dense tables and visualizations that do not paginate naturally. The current build reproduced as approximately 45 pages with a print layout height of about 54,771 px.

### Navigation and density

Eleven peer-level tabs mix destinations, analytical modes, teaching utilities, and methods. Several tabs contain multiple equally prominent visualizations and long control rows. The user must already understand the data model to predict where a question belongs.

### Explorer-specific issues

- In light mode, `.tooltip` retains a dark background while its text inherits the light theme's dark `--text` token. The screenshot supplied on 2026-07-13 shows near-invisible title and metadata text.
- Hover previews and selected-node/edge details do not yet explain enough: identity, role, direction, relation type, context, magnitude, evidence state, provenance, connected relationships, and important limitations should be available in a deliberate hierarchy.
- In condition-focused mode, a disease/context node and plane mostly repeat the selected condition and connect it to most downstream nodes. This creates a visually dominant hub without adding much explanatory value.
- Compact view, filter, trace, isolate, and reset controls assume prior knowledge.
- The explorer lacks a collapsed-by-default how-to guide and worked visual example.
- Edge appearance does not currently encode a defensible estimate of mechanistic contribution, signal intensity, or intervention potency.

## Proposed top-level information architecture

Replace eleven peer tabs with six question-oriented destinations. Preserve deep links and provide redirects/aliases for old view identifiers during migration.

| Destination | User question | Local sections |
|---|---|---|
| **Overview** | Where should I start, and what does this atlas contain? | Start here; orientation; recent context |
| **Conditions** | What defines this condition and its subtypes? | Profile; features and subtypes; pathways; treatments; sources |
| **Compare** | What overlaps and what differs? | Pairwise; cohort; feature–pathway |
| **Treatments** | What does an intervention affect and where are the gaps? | Outcomes; mechanisms; coverage |
| **Pathways** | How are mechanisms wired and connected? | Catalog; receptor wiring; systems explorer |
| **Evidence** | Where did a claim come from and how can I export it? | Methods; source library; export |

The current **Teaching lab** becomes a persistent **Study mode** action rather than a primary content destination.

### Cross-view context bar

Add a compact context bar below top-level navigation:

- selected condition/context;
- optional comparator;
- evidence threshold;
- direct/derived inclusion state;
- clear/reset action.

Selection changes should propagate across relevant views, with an explicit label when a view does not use one of the filters.

### Content hierarchy inside a destination

- One primary visualization or reading task above the fold.
- A short sentence answering “what can I learn here?” beneath each local heading.
- Common controls visible; advanced controls inside a labeled disclosure.
- Details, caveats, and source rows progressively disclosed rather than repeated in full.
- Long source lists paginated or virtualized, with search and filters retained.
- Empty, unknown, explicit-zero, and structurally unavailable states explained locally wherever they appear.

## Export model

Replace the single print action with an **Export** menu:

1. **Current view PDF** — only the active destination and its current context.
2. **Condition brief** — profile, features/subtypes, top supported pathways, treatment summary, caveats, and references for the selected condition.
3. **Custom report** — user-selected sections and appendices, with a page estimate before generation.
4. **Full compendium** — intentionally produces the complete atlas and warns about length.
5. **Data export** — machine-readable rows and active filters, separate from PDF.

### Export implementation

- Introduce an explicit `exportMode` and print-root rather than forcing all `.view` elements visible.
- Clone or render only selected sections into the print root.
- Re-render canvases/SVGs at print dimensions before opening the print dialog.
- Repeat table headers; avoid splitting cards, legends, and evidence blocks; allow large tables to become landscape appendices.
- Add report title, selected context, evidence threshold, generation date, evidence cutoff, page number, and source appendix.
- Keep browser print as the delivery mechanism initially; the defect is report composition, not necessarily the lack of a server-side PDF engine.

## Systems explorer redesign

### 1. Light-theme tooltip repair

Define tooltip-specific semantic tokens for surface, text, muted text, border, focus, and shadow in both themes. The tooltip must not inherit a text token that was designed for the underlying page surface.

Acceptance criteria:

- normal text and title meet WCAG AA contrast in both themes;
- tooltip remains distinguishable from the canvas without a heavy glow;
- keyboard focus displays the same information as pointer hover;
- tooltip stays within the viewport at 390 px width and at 200% zoom;
- screenshot regression covers the supplied light-mode failure state.

### 2. Information hierarchy for nodes and edges

Use three levels rather than making the hover box carry everything.

| Level | Node content | Edge content |
|---|---|---|
| Hover/focus preview | Name; entity type; one-line role; degree/sharedness; evidence badge | Source → target; relation verb; direction; direct/derived state; magnitude if validated |
| Locked inspector | Definition; why it matters in current context; incoming/outgoing grouped relations; evidence grade; references; limitations | Mechanistic interpretation; context; sign; strength semantics; provenance; source rows; competing/unknown evidence |
| Evidence drawer | Full source metadata and related rows | Full relation record, derivation path, source excerpts/metadata, and audit fields |

Connected relationships should be grouped as **upstream**, **downstream**, **interventions**, **features**, and **cross-context**, with counts and searchable labels. Selecting an inspector relation should focus the corresponding node/edge without losing the current filter state.

### 3. Remove redundant context geometry

Condition-focused mode should treat the selected condition as page context, not as a high-degree node or dedicated plane. Show it in the context bar, title, inspector provenance, and optional subtle frame label.

Cross-condition analysis is different: condition entities can remain useful in an explicit bipartite/tripartite comparison representation. They should not be mixed by default into the causal cascade where their many edges obscure downstream topology.

For the triptych, test two alternatives:

- remove the center node and use a labeled central context band through which supported links are routed; or
- convert the condition into a facet header/filter and align direct condition relationships as anchored rows.

Do not remove context provenance from the relational data; remove only redundant geometry.

### 4. Explain controls and interpretation

- Add concise tooltips to representation tabs, evidence and density filters, relation-family filter, label policy, trace, isolate, reset, and view presets.
- Use visible labels for controls that are ambiguous without hover; tooltips supplement rather than replace labels.
- Add a collapsed-by-default **How to read this explorer** disclosure before the workspace.
- The guide should include one compact worked diagram showing a mechanism node, a directed edge, an intervention node, direct versus derived line styles, and the difference between unknown and explicit zero.
- Include a one-sentence explanation of each axis/layer and a “Try this” sequence: select context → choose evidence threshold → select node → inspect incoming/outgoing relations → trace supported chain.
- Persist dismissal/open state locally, but provide an always-visible Help action.

### 5. Encode connection strength without conflating constructs

The requested edge emphasis is useful only when the underlying field has a defined denominator and provenance. “Role in development/severity,” molecular potency, clinical effect, and evidence confidence are different constructs and must not share one undifferentiated weight.

Proposed visual grammar after data audit:

| Construct | Preferred channel | Notes |
|---|---|---|
| Relation family | restrained hue | Pathogenesis, pharmacology, phenotype, contextual association |
| Direction/sign | arrowhead or terminal bar | Activation/association versus inhibition |
| Direct vs derived | solid versus patterned stroke | Preserve current provenance distinction |
| Validated magnitude within one construct | stroke width in 3–4 discrete bins | Never compare unlike scales; display definition in tooltip |
| Evidence confidence | opacity plus explicit grade/badge | Do not use opacity for magnitude simultaneously |
| Unknown/unavailable | omission plus ledger/legend count | Never render as a thin or weak edge |
| Selection/focus | outline or local luminance change | Temporary interaction state, not data |

Before implementation, add a relation schema with separate nullable fields such as `pathogenicContribution`, `molecularPotency`, `clinicalEffect`, `evidenceGrade`, `direction`, `provenance`, `scaleDefinition`, and `context`. If no defensible magnitude exists, render a constant-width edge and say **magnitude not encoded**.

For combinations, show union, overlap, and untouched pathways from declared target models. Do not add magnitudes, imply synergy, or infer combined efficacy unless a source directly supports that estimate.

### 6. Additional representations to evaluate

Prioritize sophisticated but interpretable alternatives, each answering a distinct question:

- **Aligned mechanism lanes:** contexts as rows, mechanisms as fixed columns, interventions/features as selectable overlays. Best for stable overlap comparison.
- **Bipartite projection:** contexts ↔ mechanisms or interventions ↔ mechanisms, with the third class in the inspector. Best for pairwise exploration.
- **Tripartite parallel sets:** contexts → mechanisms → interventions/features, with edge bundling and a selected-context focus. Best for supported chains.
- **Small-multiple fingerprints:** one compact, fixed-coordinate map per context or intervention. Best for rapid visual comparison without 3D occlusion.
- **Coverage volume:** three orthogonal categorical axes with slice controls, not free rotation. Best for three-class relationships if sparse cells and unknown states are explicit.
- **Difference lens:** two selected entities share fixed coordinates; common relations remain neutral, unique relations use two restrained comparison colors. Best for “overlap versus difference.”

3D should be retained only where depth expresses a stable semantic axis and view presets make that axis recoverable. A 2D orthographic or small-multiple view should remain available for precise comparison and accessibility.

## Implementation sequence

### Phase 0 — isolation foundation (implemented in this branch)

- Extract explorer shell, styles, and behavior into a deployed folder.
- Keep canonical data and shared state in the parent document.
- Add a browser regression that verifies all assets are served and both representations initialize.
- Add package documentation and a domain-neutral GPT 5.6 Pro consultation brief.

### Phase 1 — PDF defect and low-risk clarity fixes

- Replace direct `window.print()` action with the export menu and current-view print root.
- Add print regression coverage for selected-view composition and full-compendium opt-in.
- Fix tooltip theme tokens and viewport positioning.
- Add control labels/tooltips and the collapsed how-to guide.

### Phase 2 — navigation shell

- Introduce the six destination model and local section navigation.
- Add the persistent context bar and legacy view aliases.
- Move Study mode out of primary navigation.
- Add orientation copy, breadcrumbs/local headings, and focus management.

### Phase 3 — explorer semantic cleanup

- Remove redundant condition geometry from condition-focused mode.
- Expand node and edge inspection using the three-level hierarchy.
- Add relation grouping, source drawer, and keyboard-equivalent selection.
- Separate visual states for relation family, direction, provenance, evidence, and focus.

### Phase 4 — magnitude and coverage

- Audit every candidate relationship-weight field for definition, scale, denominator, context, and provenance.
- Add nullable, typed magnitude fields only where supported.
- Implement discrete width encoding and a scale-aware legend.
- Add combination coverage as union/overlap/unaffected, preserving unknowns and prohibiting unsupported synergy claims.

### Phase 5 — alternative representations and expert review

- Run the isolated package and consultation brief through GPT 5.6 Pro.
- Prototype the top two suggested representations with the same data slice.
- Test task completion for overlap, difference, untouched pathways, and source tracing.
- Retain only representations that outperform the existing explorer on comprehension, speed, or provenance visibility.

## Verification and release gates

### Functional

- Every top-level destination and local section is keyboard reachable and deep-linkable.
- Existing condition synchronization continues across relevant views.
- Free-space, triptych, export, source inspection, and Study mode operate without runtime errors.
- Current-view PDF contains only selected content; full compendium is an explicit choice.

### Evidence integrity

- Direct, derived, explicit zero, unknown, and structurally unavailable remain distinct in data, visuals, exports, and accessible text.
- Magnitude, evidence confidence, and direction are independently represented.
- Combination displays do not imply additive efficacy or synergy without direct support.
- Every derived edge exposes its derivation path.

### Visual and accessibility

- Light and dark theme screenshot coverage at desktop and 390 px.
- WCAG AA text contrast for tooltips, inspectors, controls, and legends.
- No page-level horizontal overflow at 390 px; locally scrollable matrices remain labeled.
- Keyboard focus, pointer hover, and locked selection expose equivalent core information.
- Reduced-motion mode disables nonessential animated tours/transitions.

### Performance

- Explorer assets are cacheable and do not block non-explorer views unnecessarily in the later navigation architecture.
- Interaction remains responsive for the largest supported graph; define a measured node/edge budget before adding representations.
- No duplicate canonical dataset is shipped in the explorer package.

## Explicit non-goals

- Inventing quantitative pathway, severity, potency, or combination values.
- Treating missing data as zero.
- Replacing the source ledger with a visually persuasive but unauditable graph.
- Adding decorative 3D, glow, gradients, glass surfaces, or motion without an explanatory function.
- Completing all phases in the isolation refactor.

## Decision log

- **2026-07-13:** Preserve the current explorer behavior while extracting a deployable package first. This minimizes review scope and gives external consultation a tractable source boundary.
- **2026-07-13:** Treat the tooltip failure as a theme-token defect to be fixed with dedicated visual regression coverage in Phase 1.
- **2026-07-13:** Treat condition context as metadata/facet in condition-focused mode; retain the option of explicit condition entities only in comparison-specific representations.
- **2026-07-13:** Require separate fields and encodings for magnitude, evidence confidence, direction, and provenance before varying edge width or color.
