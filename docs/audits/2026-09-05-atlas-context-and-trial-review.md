# Atlas continuation: indication-preserving navigation and primary-trial scope

## Baseline and changes

This continuation starts at PR #186 `23f64f6fc54ada0c9487437ea4a79756f1a3bf3f`,
which already contains the explicit integration of PR #175. The earlier #186 body
still named `02ca131`; its integration and test receipts must not be treated as
current. No original PR #175 branch or master changes are required by this patch.

The disease explorer's ranked-target callback omitted the disease query. For
example, PDE4D selected under atopic dermatitis opened under psoriasis, because
the unqualified gene route chooses its highest-scoring disease. All ranked links
and row callbacks now retain the selected indication. Invalid explicit disease
routes fail rather than selecting an unrelated default; an unqualified disease
route still provides the documented default. Gene links and the back control
are native keyboard-operable elements, and modifier-click is not hijacked by a
row callback. Sort buttons expose aria-sort and preserve focus when headers are
rebuilt. Comparators leave absent values last and treat two absent values equally.

## Seven additional primary-abstract scope records

The source workbench now includes seven new records separate from efficacy scores,
with population, regimen/comparator, endpoint, result, short verbatim excerpt,
primary-outcome status and limits. Six existing reference identities are reused;
SLS II adds one. These are AI-assisted **abstract-level** adjudications, not full-text
reviews, human clinical approval, indication determinations or class-wide efficacy.
All automatic graph-promotion and clinical-validation flags remain false.

| Record | Primary publication | Scope that must remain attached |
|---|---|---|
| TULIP-2 | PMID 31851795; DOI 10.1056/NEJMoa1912196 | BICLA primary versus distinct secondary outcomes; earlier trial differed. |
| BLISS-LN | PMID 32937045; DOI 10.1056/NEJMoa2001180 | Add-on renal outcomes, not monotherapy or cutaneous efficacy. |
| ProDERM | PMID 36198179; DOI 10.1056/NEJMoa2117912 | Composite minimal-improvement response; thromboembolic events are not automatically distinct patients. |
| RIM | PMID 23124935; DOI 10.1002/art.37754 | Failed randomized comparison; pooled improvement is not a placebo-adjusted effect. |
| SENSCIS | PMID 31112379; DOI 10.1056/NEJMoa1903076 | FVC decline, not skin improvement; missing-data sensitivity remains visible. |
| DESIRES | PMID 38279402; DOI 10.1016/S2665-9913(21)00107-7 | Small, short-duration skin-primary trial, not every-organ efficacy. |
| SLS II | PMID 27469583; DOI 10.1016/S2213-2600(16)30152-7 | Superiority hypothesis not confirmed; nonsignificance does not prove equivalence. |

The primary publications can be resolved through their exact PubMed identifiers.
`python scripts/verify-vasculitis-source-excerpts.py --packet connective-tissue
--receipt <path>` retrieves the seven PubMed records and checks identity, literal
short excerpt and indexed warning state. `--packet vasculitis` retains the existing
ten-record check. Offline XML replay is expressly labeled offline; neither mode
proves every paraphrase from string matching alone. The interpretations were
examined against the primary abstracts; no full abstracts are republished.

## Explicit holds discovered during source review

The live PubMed response for the candidate review returned correction markers for
AURORA 1 (33971155 → correction 34062140) and focuSSced (32866440 → corrections
33007286 and 33667402). Their correction contents have **not** been reconciled.
They therefore do not enter the seven accepted abstract-scope records. A separate
publication-holds category and source-linked warnings on implicated synthesis
records keep the unresolved status visible and carry it into exports. A correction
is not a retraction, a negative study, or a reason to independently change treatment.
The holds concern source-review acceptance; existing effect scores are unchanged.
The strict gate still rejects warning-marked source records; it has not been relaxed.

## Verification and limitations

Local source-tree suite: 486 tests passed. The source-gate suite passed 22 tests
and 50 subtests. All seven exact excerpts matched the retrieved XML in separately
labeled offline replay. Production build passed. Local Chromium navigation was
blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`); actual
browser verification must use hosted CI, including seven new browser cases.
The build materializes the immutable Clinical Trials artifact over its source
stub, so source-policy tests were run on restored exact source, not concurrently
with that build step. The immutable payload is not part of this patch.

Final hosted test counts and live-retrieval receipts are recorded against the
published commit after inspecting results, not predeclared here. The 659-edit
ledger and original clinical-effect/manifestation denominators are unchanged.
Complete source adjudication across all 60 monographs, mindmaps and mappings
remains incomplete. This patch does not merge or authorize production release.
