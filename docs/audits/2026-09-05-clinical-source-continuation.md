# Clinical-source corrections and Atlas evidence workbenches

## Decision and baseline

This continuation recovers the unpublished 659-record correction ledger against source commit `fe42b9d2ae5695f853d0f360ac60f665bed1e5f4` (PR #184). Every recorded original field matched before replay. It adds inspectable evidence interfaces and reproducible source cross-checks. **It does not complete exhaustive clinical validation of all 60 Field Guide monographs, every mindmap claim, or every Atlas mapping.** No whole-monograph validation badge is awarded. No patient data or live AI provider was used.

The earlier implementation-safety PR #184, scientific-mapping PR #175, and portfolio governance PR #177 are separate workstreams. This branch depends on #184 but does not merge, overwrite, or declare #175 effective. In particular, the existing graph's lexical/domain/therapy-derived inference still needs #175 integration and review. Explicit uncertainty labeling is not a substitute for that remediation.

## Delivered content corrections

The complete itemized ledger is `site/public/clinical-source-review/corrections.json`. It preserves original and revised values, source path/pointer, source identifiers, rationale, disposition, and value hashes. `review-status.json` binds the corrected source files to their current byte hashes. The 659 records include 287 bibliographic-field edits and 372 other edits; these numbers are **not unique clinical-error counts or validation-completion counts**.

Targeted Field Guide changes affect 17 of 60 monographs: prednisone, hydroxychloroquine, azathioprine, IVIG, belimumab, bosentan, spesolimab, apremilast, bimekizumab, oral ruxolitinib, anakinra, rilonacept, lenalidomide, IV epoprostenol, selexipag, topical nitroglycerin, and captopril for scleroderma renal crisis. The ledger records formulation/indication differences, contraindication qualifications, and bounded monitoring corrections. The remaining claims in these entries and the other 43 monographs remain unadjudicated.

The recovered mindmap corrections include MF/Sézary TNMB staging, pregnancy-first acne routing, severe-drug-eruption red-flag gates, vasculitis workup, angioedema distinctions, selected bullous-disease regimens and outcome interpretation, psoriasis regimens, pruritus classification, and corresponding legacy nodes. The independent TNMB stage-group regression traverses all 96 complete T/N/M/B combinations and separately rejects incomplete assessment. Passing this test verifies the implemented stage-group decision logic, not a clinical diagnosis or every supporting statement in the map.

Primary-source locators are recorded next to each correction. Sources such as PMID identifiers are identifiers, not proof that every attached claim was fully adjudicated. Some records are explicitly `REVISED_SOURCE_GAP`, including withdrawal of unsupported language without replacement biological claims.

## Rheum–Derm Immune Atlas

A synchronous source-review gate now runs immediately after the data literal, before lookup tables, quizzes, charts, graphs, or derived runtime relations. It retains 138 active clinical-effect records and archives five quarantined records, preserving all 143 original records for audit. Archived numerical benefit values are not recoded as proven zero efficacy. Retraction-marked sources are excluded even if a quarantine flag is accidentally omitted. Malformed source identities fail before partial data mutation.

The Sources tab includes a searchable workbench for active synthesis, quarantined effects, and 239 static derived manifestation mappings. Each record exposes its status, caveats, source locator, and context. Filtered exports retain heterogeneous fields, nested review metadata, and explicit `clinically_validated: false`. Spreadsheet-formula strings are neutralized. The persistent boundary is visible across app tabs.

Avacopan's mechanism is distinct from its pivotal clinical efficacy evidence. FDA's April 27, 2026 action was a **proposal** to withdraw approval, not a completed U.S. withdrawal. The later MHRA review and ADVOCATE retraction are separately cited. No abrupt medication discontinuation is instructed. The August 27, 2026 FDA brepocitinib approval applies to adult dermatomyositis, not all JAK inhibitors, pediatric disease, or an antibody-defined lung endotype.

## DermatoTarget Atlas

The original 600 target–disease score rows and 54,468 raw drug-candidate rows are preserved. The new cross-check is separate from those historical outputs. Source requests and responses are shipped under `data/source-evidence/` and checked by `scripts/build-atlas-evidence.py`.

The builder independently resolves exact human GRCh38 gene identity, reconciles each old EFO disease identifier to a current ontology cross-reference and exact name/synonym, disables ontology propagation, verifies that the requested target set is complete, rejects duplicate/out-of-scope returned targets, and checks response counts and all capture checksums. The capture records Open Targets data release 26.06 and Ensembl release 116.

| Current cross-check disposition | Pairs |
|---|---:|
| Direct association returned | 581 |
| Not returned by this exact query | 14 |
| Identity unresolved/conflicting | 5 |
| Total historical pair denominator | 600 |

Four PDE4C pairs have conflicting historical Ensembl IDs. One record contains `ENSG00000283128` in the symbol field without an independently resolved matching gene symbol. These are held rather than silently remapped. Missing historical IDs may only be populated in the **separate** snapshot after an exact source identity check; historical inputs remain unchanged.

**Not returned is not evidence of absence. Association score is not causal certainty, therapeutic direction, clinical efficacy, or drug approval.** The cross-check does not reconstruct the original composite scores, null model, literature grading, or drug-candidate evidence. Missing original request-level provenance remains a barrier to validating those historical analyses.

The Source cross-check tab supports gene/disease/status filtering, source request/response inspection, version/date labels, and filtered export with uncertainty preserved. Gene details link to the exact gene–disease cross-check. Invalid disease routes no longer silently show a different disease. Malformed paths produce a recovery link rather than an uncaught exception.

Drug candidates are deduplicated only when the entire logical record, including target, indication, both stages, and report count, is identical. Counts are never added. Gene details default to the selected indication; other indications require explicit opt-in and retain their own labels. Drug-wide stage is distinguished from indication-specific candidate stage. The virtualized table adds exact-indication filtering and raw-versus-distinct counts. Failed lazy loads are surfaced locally and failed promises are not cached indefinitely.

## Verification

The current full unit suite and production build were executed locally; exact counts and final hosted CI results are recorded in the PR discussion, not predeclared here. The new browser suite tests source counts, holds, missing-data handling, candidate indication context, malformed routes, quarantine timing, exports, and desktop/mobile presentation. Local Chromium can start, but local URL navigation is denied by administrator policy; hosted Chromium is required for navigation tests.

To reproduce on a clean checkout:

```sh
npm --prefix site ci
python3 scripts/build-atlas-evidence.py --check
python3 scripts/build-clinical-review-status.py --check
npm --prefix site test
npm run site:build
cd site
npx playwright install --with-deps chromium
PHASE7_SCREENSHOTS=1 VISUAL_AUDIT=1 npx playwright test --reporter=line,json
```

Run unit/source checks before the production assembler, which materializes the immutable Clinical Trials payload into the public source directory. That generated payload is not part of this source correction. Browser assertions verify software behavior, not comprehensive medical accuracy or production clinical suitability. Live provider, patient data, device capture, and cross-browser hardware behavior are outside these receipts.

## Completion still required

Claim-level source adjudication remains necessary across the monographs, modern/legacy mindmaps, antibody marks, pathways, treatment effects, and derived links. Integrate and retest #175 rather than treating a disclaimer as scientific mapping remediation. For DermatoTarget, recover original analytic request records and code or perform a separately specified new analysis before declaring historical scores, evidence direction, or candidate recommendations validated.
