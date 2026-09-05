# Atlas scientific-integration continuation

## Exact inputs and scope

Integration starts from PR #186 `02ca13167576e48d54a82c9a0811703b71ae06be`
(which already includes #184) and the actual PR #175 head
`a0a9394a4a073a92f4b57d6b83cb692241d7bce0`, not its older PR-body receipt.
Only Atlas source and regression changes are integrated. Old screenshot receipts,
duplicate dedicated workflows and unrelated cross-branch reversions are not
republished as new results. The repository's complete CI runs every browser spec.
Neither master nor the original #175 branch is changed by this integration.

## Corrections found while combining the implementations

1. The P1/P2 governance module read `window.DATA`, although the application declares
   a global lexical `const DATA`. It therefore returned without initializing. It
   now uses the P0 data contract and awaits actual application initialization.
2. One AAV steroid-effect source row was cloned into four vasculitis contexts.
   It is now confined to AAV, preserving the original source row and caveats.
   Five archived efficacy records remain quarantined before all graph construction.
   The final accounting is 138 active + 5 quarantined = 143 distinct source records.
3. Embedded-synthesis text matches were labeled source-explicit, while hardcoded
   editorial rules were treated as curator confirmations. Default labels now say
   **Synthesis-explicit**, not independently source-validated. Editorial mappings
   are optional hypotheses, not human attestations. The 239 original mappings
   partition into 80 default synthesis matches, 143 exploratory hypotheses and
   16 rejected mappings; no whole-mapping clinical validation is asserted.
4. Normalization split scalar scope strings into characters, overlooked recorded
   explicit-zero state and treated a reference's presence as supporting consensus.
   Scalar scope is preserved, evidence states are independent, and consensus is
   unassessed unless an actual conflict is registered. Original data are not mutated
   by normalization, avoiding recursive scope corruption on refresh.
5. The provenance inspector selected arbitrary records by text similarity, and
   interpolated untrusted source text into HTML. Selection now requires an exact
   relationship ID; provenance and source text are escaped.
6. Filtered exports did not consistently apply the selected condition and used
   denominators from a different eligible set. One eligibility contract now drives
   JSON/CSV exports and denominator partitions. Exports explicitly describe a
   filtered evidence set, not the exact set of pixels visible on the canvas.
7. Clipboard promises reused an event target after the event lifetime and could
   report false success. The button is captured before awaiting; missing or denied
   clipboard access reports that nothing was copied.
8. Non-drag camera buttons synthesized pointer events without owning an active
   pointer. They now call an explicit camera API rather than triggering invalid
   pointer capture. Two-dimensional views retain exact relationship selection,
   provenance inspection and filtered export controls outside the hidden 3D panel.
9. IgA vasculitis was described as universally classical-pathway driven, and GCA
   was overgeneralized to every large-vessel vasculitis. Wording now separates the
   observational IgAV evidence and limits the GCA context to GCA.

## Five independently examined, bounded primary-source assertions

`explorer/vasculitis-evidence.js` contains five separate assertions. Each has an
exact short abstract excerpt, DOI, PMID, study design, scope limitation and
AI-assisted review status. They are NOT human clinical sign-offs and are NOT
promoted automatically into causal graph edges or efficacy scores.

| Claim | Primary source | Bounded result and non-extrapolation |
|---|---|---|
| V01 | Xiao 2002, PMID 12370273, DOI 10.1172/JCI15918 | Anti-MPO transfer caused glomerulonephritis in mice; not all human PR3/skin phenotypes. |
| V02 | Xiao 2005, PMID 15972950, DOI 10.1016/S0002-9440(10)62951-3 | Neutrophil depletion protected mice; not a recommendation to induce neutropenia. |
| V03 | Xiao 2007, PMID 17200182, DOI 10.2353/ajpath.2007.060573 | C5/factor B knockout protected the tested mice; not clinical avacopan efficacy. |
| V04 | Schreiber 2009, PMID 19073822, DOI 10.1681/ASN.2008050497 | C5aR blockade prevented conditioned-serum neutrophil priming; not a human efficacy trial. |
| V05 | Demir 2023, PMID 37238213, DOI 10.3390/diagnostics13101729 | Pediatric plasma proteomics implicated lectin/alternative pathways. The cohort had no renal involvement at diagnosis or one-year follow-up; no nephritis or treatment extrapolation. |

`python scripts/verify-vasculitis-source-excerpts.py --receipt <path>` verifies
publication titles, DOIs, literal abstract excerpts and returned retraction
markers against a fresh batched PubMed response. Only whitespace normalization
is allowed. A passing excerpt check proves neither entailment nor clinical
certainty; the bounded interpretations above were separately reviewed against the
primary papers. Full abstracts are not redistributed in the receipt.

## Evidence and validation boundaries

The original 659-entry correction ledger remains unchanged. Its current-file
receipt is regenerated after integration; this does not create new monograph
validation passes. Historical raw manifestation records are retained separately
from the filtered graph so the source workbench still exposes all 239 records.
The 600-pair DermatoTarget cross-check and historical rankings are unchanged.

New tests exercise actual lexical-script initialization, quarantine and partition
accounting, scope preservation, unknown/zero separation, selection, source-text
escaping, clipboard failure and success, camera controls and study boundaries.
JSDOM tests stub drawing/layout and are not browser acceptance. Hosted Chromium
includes the old suites plus integrated source, URL, mobile and control cases.
Final exact-head test receipts are recorded in the PR after inspection; this
source document does not predeclare pending CI as passed.

Exhaustive source adjudication of every monograph, mindmap and Atlas assertion
remains incomplete. Active records remain synthesis claims, not a clinically
validated treatment recommender. Institutional authorization, human clinical
sign-off and production acceptance are not implied by passing software tests.
