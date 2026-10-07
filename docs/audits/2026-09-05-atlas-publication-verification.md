# Atlas context and trial-scope publication verification

## Published source and prior integration

This continuation begins at `23f64f6fc54ada0c9487437ea4a79756f1a3bf3f`.
That source already integrates PR #175's scientific-mapping controls into PR #186;
the old #186 description naming `02ca131` is a historical receipt, not the current
integration state. PR #184 remains an unmerged prerequisite. Neither master nor
the original #175 branch is changed by this continuation.

Commit `b3ca36715682c86a5f88c2d40782ff63eb30c12a` publishes 15 exact source files
for indication-preserving navigation, native keyboard controls, seven bounded
connective-tissue trial records, two unresolved publication-correction holds,
source validation, and regression coverage. Each source file matched its before
and after SHA-256 hashes before publication. Existing historical target scores,
raw candidate rows, five efficacy quarantines and the 659-entry correction ledger
are not replaced by the new source records.

## Recorded pre-final hosted run

Run 34003447720 passed 486 site unit tests, 58 mocked-provider backend tests,
22 source-gate tests plus 50 subtests, and 313 Chromium cases (no failures, skips,
or flaky results). Locked installation, npm audit (zero reported vulnerabilities),
production build and fresh PubMed checks for all seven connective-tissue and ten
vasculitis records passed. This run predates the three-file identity follow-up
below; it is not the final-head receipt.

The first attempt, run 34003060261, passed 312 browser cases and failed the existing
PDF-magic assertion. Two checkouts in the same working directory had left an LFS
pointer in place of an unchanged publication PDF. The verification job now runs
`git lfs checkout` and `git lfs fsck`, then checks sizes and SHA-256 hashes of all
13 tracked LFS PDF/audio/video objects before building. The PDF assertion was not
weakened or removed.

## Source-card identity follow-up

Visual inspection exposed two source-card IDs that did not match the actual Atlas
medication vocabulary. Commit `59e57ac993f089fa4fb5a1bfb6a6902745673ba9` uses
`ninted` for Nintedanib and `tociliz` for Tocilizumab. Installation now rejects an
unknown condition or medication before mutating references or claims. Three new
unit cases check every study/hold foreign key and rejection without mutation.
Browser assertions verify the rendered labels, RIM's failed primary endpoint,
SENSCIS sensitivity analysis and the unresolved correction holds.

Run 34004005246 verified the exact three-file reconstruction, the expanded unit
suite and the fresh seven-source excerpt gate before publishing this follow-up.
The complete normal PR CI and screenshots must be inspected at the final head;
its counts and hashes are recorded in the PR discussion after completion.

## Permanent source check and interpretation limits

The read-only `atlas-source-excerpts.yml` workflow runs on changes to either
reviewed source packet or its verifier, and supports explicit manual dispatch.
Each matrix job independently checks its packet, preserves a bounded timestamped
receipt and fails for unavailable, mismatched or warning-marked source records.
The synthetic source-gate tests also remain in ordinary CI. No background schedule
or automatic clinical publication is introduced.

A passing check means that the requested publication identities and literal short
abstract excerpts match the retrieved PubMed response. It does not prove semantic
entailment of every paraphrase, full-text review, evidence certainty, therapeutic
direction, approved indication or clinical safety. All seven new records remain
AI-assisted abstract-level assessments with no human approval and no automatic
graph promotion. AURORA 1 and focuSSced correction contents remain unadjudicated;
a correction notice is neither a retraction nor a negative trial result.

Full independent source adjudication of the remaining Field Guide, mindmap and
Atlas claims is still outstanding. Passing software tests cannot close that work.
Only branch source is published here; no master merge or production deployment is
requested. Existing repository automation may create a branch preview.
