# Atlas source recovery: browser integration findings

The initial hosted suite on `981bd63ca24a9a9d4a58eeb80614230e4f676e16`
passed 280 browser tests and failed two legacy count expectations; no tests were
skipped. All ten newly added source-workbench browser cases passed. The later
`8d5d952904874c191411bc998ee578134ecd4b58` refinement adds source-summary and
identity validation plus immutability of cached validated candidate arrays.

## Quarantine accounting, not restored unsafe records

The old grade-distribution test expected 143 active effects. The corrected source
contains 138 active effects and five auditable quarantined records, retaining the
original 143-record denominator. No quarantined effect should enter a benefit view
merely to satisfy an old snapshot.

The coverage-volume fixture consequently changes at grade B from 61 derived /
67 filtered / 23,686 unknown to 57 derived / 66 filtered / 23,691 unknown, with the
same 23,814 coordinate denominator. At grade D it contains 123 derived,
23,690 unknown, and one explicit-zero coordinate. The surviving zero is
`caps:tnfi_ada:pathway:neutrophil`; the archived Schnitzler/TNF-inhibitor zero is
not retained as supported evidence. These counts were reproduced by executing the
actual pure relation/volume functions over the source-gated dataset in a Node VM.
The added browser regression independently exercises the live initialization,
asserts the exact five excluded condition/drug pairs, and verifies that none enters
active effects or condition-treatment relations. These are implementation
invariants, not clinical validation of the retained effect or inferred coordinates.

## Visual inspection

Desktop/mobile workbench captures from the first hosted run were inspected.
Opening an expanded DermatoTarget source record could horizontally scroll the
table and hide its gene column on desktop. A scoped fixed-column/wrapping layout
now keeps the gene context visible; the mobile table retains deliberate horizontal
scrolling inside its wrapper. Export controls use the application theme, visible
keyboard focus, and a minimum 44-pixel height. A browser regression checks the
expanded desktop record's gene visibility and control size.

Final exact-head test counts, run URL, source-manifest checks, and screenshot
receipts are recorded in PR #186 after inspecting the completed hosted run.
This file does not predeclare pending tests successful. PR #185 received a separate
advisory review at `0be79e58d62122a6da830a2e637450150be1bfd3`; it was not edited
or merged. PR #175 remains a separate, unintegrated scientific-mapping workstream.
