# Publication holds: surveillance and bounded correction review

## Source and software scope

This continuation starts at PR #186 head `093f50ec5ef186e926015611f6e5029b06dea38d`.
PR #175's integration is already present; older PR descriptions calling it
unintegrated are historical. No master merge or production release is performed.

The verifier previously requested only accepted primary abstracts. The two held
trial publications and their three correction notices were copied into receipts
without being re-fetched. Missing or newly corrected held publications could
therefore leave an accepted-abstract check looking more comprehensive than it was.

The connective-tissue request now contains 12 distinct PMIDs: seven accepted
abstracts, two held publications and three notices. The gate verifies exact titles
and DOIs, the complete recorded ErratumIn set, reciprocal ErratumFor links, notice
publication type, and newly returned warning states. Missing, duplicate, extra,
reassigned or warning-marked records fail. Receipt schema 3 counts accepted claims,
held publications and correction notices separately. Passing a link check does
not adjudicate a held trial, validate notice paraphrases, or give clinical approval.
The unchanged vasculitis packet retains its ten-publication denominator.

## Correction content examined

The March 2021 focuSSced correction (PMID 33667402) changes table 3's tocilizumab
SSc-ILD subgroup least-squares mean change in percent-predicted FVC to 0.1. This is
not the all-participant between-group treatment difference and does not establish
a positive primary skin endpoint. The workbench shows the notice-specific short
excerpt, locator and status independently of the parent's pending disposition.
Existing effect scores and the two trial-review holds remain unchanged.

The October 2020 focuSSced notice (PMID 33007286) and the AURORA 1 notice
(PMID 34062140) have verified indexed identities but their publisher content is
not reconciled in this pass. Neither parent trial becomes an accepted scoped
claim. An examined notice is not a retraction, a negative trial result, a complete
correction review, or permission to promote a treatment recommendation.

Primary locators:
- https://www.thelancet.com/journals/lanres/article/PIIS2213-2600(21)00107-7/fulltext
- https://pubmed.ncbi.nlm.nih.gov/33667402/
- https://pubmed.ncbi.nlm.nih.gov/33007286/
- https://pubmed.ncbi.nlm.nih.gov/34062140/
- https://pubmed.ncbi.nlm.nih.gov/32866440/
- https://pubmed.ncbi.nlm.nih.gov/33971155/

## Regressions and portability

Nine new Python test methods exercise missing held records, exact request counts,
wrong titles/DOIs, broken reciprocal links, new warnings, malformed metadata,
unsupported review states, missing examined-notice locators and duplicate ids.
The 31-test Python suite passes locally. The complete local unit suite passes
492 tests with no failures or pending cases. All 19 focused Chromium cases pass locally, including the three new desktop,
mobile and filtered-export cases. The production build passes. Hosted exact-head
receipts are recorded in the PR. Local browser testing used the same built preview
with build completed separately after the Windows server-start timeout; the
repository CI configuration and timeouts were not weakened.

Text checkouts now use LF, except upstream vendor releases and captured response
bytes, which remain binary-preserved. Artifact builders explicitly use UTF-8 and
LF rather than the host's default encoding. Existing golden hashes are retained.
These checks do not establish exhaustive source review of the clinical corpus,
clinical approval, live AI integration, or production privacy qualification.

## Visual follow-through

Screenshot inspection exposed a nested-height constraint that hid the remainder
of long correction explanations on mobile. The two-publication hold category now
expands to show its full content, with a browser assertion against nested clipping.
The SLS II reference also lacked author/year/journal fields in the legacy source
library; these are populated from PMID 27469583 rather than rendering `undefined`.
Source: https://pubmed.ncbi.nlm.nih.gov/27469583/ . This is bibliographic repair, not
an additional trial claim, outcome adjudication or whole-monograph review.
