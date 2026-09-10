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

## Ten independently examined, bounded primary-source assertions

`explorer/vasculitis-evidence.js` contains ten separate assertions. Each has an
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

Five additional randomized comparisons preserve the actual trial, indication,
population, regimen, comparator and endpoint as separate fields in the workbench
and CSV. They are not regulatory-status assertions and do not promote graph edges.

| Claim | Primary trial and PubMed identifier | Interpretation boundary |
|---|---|---|
| V06 | RAVE, 20647199 | GPA/MPA remission induction; noninferiority, not universal superiority or EGPA evidence. |
| V07 | MIRRA, 28514601 | Add-on therapy in relapsing/refractory EGPA; incomplete response remains visible. |
| V08 | MANDARA, 38393328 | Active-comparator noninferiority with its prespecified margin; not superiority or equivalence. |
| V09 | GiACTA, 28745999 | Four arms retain their prednisone taper schedules; remission is not a visual-loss endpoint. |
| V10 | PEXIVAS, 32053298 | Reduced versus standard steroid regimens; not steroids versus no treatment or a skin-benefit score. |

`python scripts/verify-vasculitis-source-excerpts.py --receipt <path>` verifies
publication titles, DOIs, literal abstract excerpts and returned publication-warning
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

## Browser-integration follow-up

Run 33997985813 at f2d9abc818dc99d9b7054dc448ccddcd59705947 passed 301
browser cases and failed three. The camera-button group was covered by the canvas
help overlay; controls now occupy normal document flow with 44-pixel targets.
Canvas focus is visible after programmatic focus as well as keyboard navigation.
The precise mobile navigator belongs to the optional 3D view; its test now asserts
the intended 2D default before explicitly selecting 3D. An absent camera URL
parameter preserves the responsive front-view preset rather than forcing an
isometric reset. The original captured pan/pinch touch-action contract is retained.
New tests use normal pointer clicks with an occlusion assertion, not forced clicks.

The source-excerpt gate now rejects empty packets, duplicate identities, missing
or unexpected returned articles, ambiguous or dangling references, incomplete trial
context, overlong/empty quotes and unauthorized approval flags. Missing abstracts,
wrong titles/DOIs and publication-warning markers block a pass. The synthetic
Python suite exercises these cases in permanent CI (36 test methods after the
2026-09-07 follow-up). Offline replay is labeled
separately from live retrieval. A passing gate verifies identity and excerpt
presence, never automatically verifies the full paraphrased claim. New hosted
results must be inspected before replacing the prior-head receipts in PR #186.

## 2026-09-07 follow-up

Review of PR #186 found placeholder content, one patient-safety-relevant
indication error and several provenance inconsistencies. All were fixed on the
branch with a failing test written first for each item.

Clinical content (mind maps; every edit is a hash-bound ledger record, C0660–C0714):

1. Mogamulizumab was described as "FDA-approved first-line" in the Sézary
   tooltips (`subtypes-overall`, `subtypes-immuno`, legacy `CTCL/js/data.js`) and
   listed beside first-line ECP in the treatment-by-stage swimlane. All now state
   the labeled indication: relapsed or refractory MF/SS after at least one prior
   systemic therapy; ECP-based therapy remains the preferred first line for SS.
   The legacy file's tooltip constants are used again, so each tooltip text exists
   once (the rendered object is unchanged apart from the correction).
2. `ctcl/treatment-stage.json` IIB/III/IV/SS first-line nodes carried one shared
   sentence. Distinct NCCN/EORTC-consistent content was restored (skin-directed
   plus systemic therapy, local RT/TSEBT, ECP-based multimodality, single-agent
   chemotherapy, HDAC inhibitors, allogeneic HSCT, low-dose alemtuzumab), keeping
   mogamulizumab and brentuximab vedotin at their labeled later-line positions.
3. Psoriasis biologic comparison: onset, efficacy, latent-TB and pregnancy cells
   were identical across TNF/IL-17/IL-23; each class now has its own accurate cell
   (certolizumab appears only in the TNF cell).
4. Pigmented-lesion triage: the start node routed both answers to `risk`; the
   "No" branch now reaches the low-concern assessment, which still escalates
   uncertain or suspicious findings.
5. HS staging: Hurley I/II/III terminals restored with stage-appropriate
   treatment (topical clindamycin/tetracyclines/intralesional steroid; clindamycin
   plus rifampin, adalimumab ≥12 y, secukinumab, bimekizumab, deroofing; wide
   excision with ertapenem bridging for severe flares); Hurley stays a static
   structural descriptor with IHS4/activity guiding escalation.
6. Pruritus by cause: eczema, cholestatic, uremic and neuropathic cells restored
   with labeled age limits, drug spacing, renal dosing and monitoring.
7. MF vs SS vs CD30+: `blood.ss` states the 2022 ISCL/USCLC/EORTC absolute B2
   criteria and names the superseded 2007 thresholds.
8. Audit-process phrases ("not established by the sources supplied here",
   "has been removed", "(source summary)", …) were rewritten as clinical prose or
   clean bibliographic citations; a policy test in `site/src/security/` bans them.
9. Twenty-one `\[n\]` markers in the psoriasis mind maps pointed at a bibliography
   that is not shipped; they were stripped and a policy test asserts zero markers.

Ledger mechanics: `scripts/build-clinical-review-status.py` derives the record
count from the sequential ids; `clinical-correction-replay.test.js` replays every
record into the current file (pointer resolution with supersession by identical,
ancestor or descendant pointers, `/additions` appends, `after: null` deletions,
embedded `DATA`/`JAK_ROUTES` JSON in the atlas, leaf-string presence for other
script targets) and pins the ledger by count and SHA-256.

Immune atlas explorer:

10. After `splitVasculitisEndotypes` moves the immune-complex row to R53 + V05,
    the row is graded C / importance 3 per `meta.rubric` (mechanistic review plus
    one small observational study), not the inherited guideline-level B / 5.
11. `alternative-views.js` and `systems-explorer.js` decide "direct" from the P0
    `relationOrigin` (`linkIsSourceExplicit`) rather than the pre-P0 label
    "Directly named", so parallel-set chain origins and domain direct counts
    agree with the P1 `provenance.directness`. The volume-lens counts asserted in
    `atlas-quarantine-accounting.spec.ts` were recomputed in the JSDOM harness and
    are unchanged.
12. `CURATED_DECISIONS`: six keys never matched (the AAV "ANCA / neutrophil" row
    resolves to `autoantibody`, the RA granulomatous row to `ifng`; the AAV
    complement and GCA IL-6 rows have no links and were deleted). A runtime test
    proves every remaining key resolves. Endotype-specific rejection reasons are
    evaluated before the generic scope check; the umbrella "Ulcers" link is carried
    into the immune-complex endotype under its declared "Skin ulcers" label. The
    239 mappings now partition into 80 default / 144 exploratory / 15 rejected.
    Dead branches removed; README and test titles no longer describe
    "curator-confirmed" links, which never existed as reviewer attestations.
16. The source workbench computes the quarantined-record and ledger-record counts
    from `DATA.sourceReview` and the generated receipt instead of literals.

Tooling and other surfaces:

13. The PubMed gate treats retracted/corrected republication, update and partial
    retraction links and the "Corrected and Republished Article" type as review
    states, sends optional `NCBI_EMAIL`/`NCBI_API_KEY`, and produces the hold rows
    in one pass (36 test methods).
15. DermatoTarget: other-indication toggle wording, evidence-view unknown-disease
    alert, "historical"/"candidate" wording, no double escaping, unsortable
    identity column, recorded atopic-dermatitis resolution (MONDO_0004980 via the
    `atopic/` capture), and `build-atlas-evidence.py --check` in CI. `sort_keys`
    was not added because it changes the committed snapshot bytes.

Verification boundary: the remote sandbox cannot download a Playwright browser,
so the Chromium suites were not executed there; Vitest, the Python suite and both
`--check` builders pass. Hosted CI remains the acceptance record.

