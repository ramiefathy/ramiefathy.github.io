# Application audit and clinical-reference safety remediation

Audit date: September 4, 2026 (America/New_York; execution receipts extend into September 5 UTC).
Base: `2cdeb783c925192ae9d2314a7cc43e20ee52c64b`, `master`.
Work branch: `audit/clinical-apps-20260904`.

## Decision and limits

This is a risk-prioritized implementation audit and targeted source check, **not certification that every medical statement or application is clinically validated**. Passing browser tests establishes the tested behaviors, not medical accuracy, production privacy compliance, or suitability for prescribing. The changes preserve the original monitoring dataset date (2025-09-23) and add a separately scoped safety-revision date. Nine of 23 monitoring entries receive targeted corrections; the other entries are explicitly not newly label-validated.

The complete existing site unit and Chromium suites were executed on the unmodified application source. Review then focused on clinical references, scientific denominators, cross-encounter state, failed AI generation, exports, and dependency security. External application code and production credentials were not changed. Existing PRs #175 (Atlas scientific mapping) and #177 (portfolio governance) were identified but not merged, overwritten, or assumed effective on master. Their overlapping files need normal integration review.

## Findings and remediation

### P1: Generated failure text and cross-encounter contamination

Gemini failures could previously be returned as ordinary strings and then treated as a completed note. Incomplete streams could appear complete; delayed suggestion work could outlive an encounter reset. The provider adapter now raises a generic, nonclinical exception for blocked, empty, malformed, truncated, or failed generation. A completed stream requires a normal provider stop. Partial chunks are provisional, never persisted as completed output. The frontend restores the preceding completed note/analysis after failure, malformed completion, or disconnection.

Suggestion tasks are canceled and awaited on reset/replacement/disconnect. Results additionally check both session identity and its generation counter, including the error path, before modifying or sending encounter state. Duration uses a monotonic clock, including a valid zero start time. JWT decoding requires expiration, issue time, and subject. Malformed WebSocket JSON envelopes and transcript values receive a safe error without terminating the connection. Provider errors, raw client messages, and URL query credentials are not echoed into logs or clinical output.

These checks do not evaluate the medical quality of model output. Authentication provisioning, production transport, live audio, provider availability, real PHI handling, and retention policies still require deployment-specific validation.

### P1: Clinically consequential monitoring-reference errors

| Entry | Targeted correction |
|---|---|
| TNF inhibitors | Complete HBV screening panel; remove unsupported class-wide numeric hold thresholds and mandatory 4/12-week schedule; distinguish infliximab dose-specific heart-failure contraindication from other agents' precautions; identify the cited monitoring review as historical (2010), not 2025. |
| IL-17 inhibitors | Remove Crohn disease from uses. Distinguish brodalumab Crohn contraindication/boxed warning/REMS from class precautions. Add bimekizumab baseline and periodic liver testing and agent-specific IBD safety context. |
| IL-23 inhibitors | Replace uniform 16-week testing with agent/indication-specific liver-monitoring windows: guselkumab at least 16 weeks, risankizumab induction at least 12 weeks, mirikizumab at least 24 weeks for the relevant IBD regimens. Do not imply every class member treats every listed condition. |
| Abrocitinib | Correct manufacturer label reference, CBC thresholds, CBC after initiation/dose increase, four-week lipid check, first-three-month antiplatelet contraindication with low-dose aspirin exception, and dose-adjustment versus contraindication distinctions. |
| Apremilast | Remove atopic dermatitis from uses, distinguish hypersensitivity contraindication from depression precautions, and do not require weight loss to exceed an invented universal threshold before assessment. |
| Hydroxychloroquine | Reflect the AAO 2025 revision: baseline fundus/OCT/FAF, annual OCT and wide-pattern FAF, possible first-five-year deferral only without significant risk factors; avoid automatic drug discontinuation for unconfirmed screening abnormalities. |
| Azathioprine | Remove universal pregnancy contraindication; preserve indication-specific label and specialist considerations. Distinguish febuxostat noncombination from specialist-managed allopurinol dose adjustment. TPMT/NUDT15 does not replace CBC surveillance. |
| Isotretinoin | Separate approved future iPLEDGE changes from current operation: FDA delayed implementation to November 15, 2026. All pretreatment pregnancy testing is in a medical setting. Remove universal laboratory/hold thresholds not justified for every formulation/patient; pancreatitis symptoms require action irrespective of a triglyceride cutoff. |
| IVIG | Restore boxed thrombosis/renal-risk framing, specify the anti-IgA plus hypersensitivity-history distinction and product-specific contraindications, and remove a universal three-month live-vaccine interval in favor of product/dose-specific CDC guidance. |

Every modified entry names the bounded review scope and sources. The class-level index is an educational navigation aid, not a substitute for an individual product/indication/age/jurisdiction label. Warnings, local monitoring practice, and absolute contraindications must not be conflated.

### P1: Silent carryover of monitoring checkmarks

Persistent drug-level checklist marks had no patient/encounter identity yet were exportable as a clinical-note checklist. They are now memory-only, old persisted marks are purged and never restored, and an explicit clear control supports switching contexts. Reload clears marks. Exports explicitly identify temporary, unverified marks and retain all baseline tasks, schedule notes, hold/adjustment criteria, contraindications, cautions, interactions, dosing context, original dataset date, review limits, and source URLs. Copy success is announced only after successful clipboard completion. Table view retains full safety detail rather than a shortened caution field.

### P1: Unvalidated data and misleading statistical precision

Monitoring data is validated before application initialization. Empty/malformed data, invalid enums/identifiers/timing fields, duplicate tasks, or unsafe/missing source URLs produce an accessible blocking error and disabled exports, rather than plausible partial clinical content. The validator is structural; it cannot establish source truth.

The dermoscopy dashboard now labels **100 unique images and 10,200 repeated model/arm evaluations**, not independent patients. It validates complete binary image-level vectors and agreement with aggregate counts before showing metrics. Pooled binomial confidence intervals over reused images are withheld; single-model/single-arm image-level Wilson intervals remain. This does not create patient-level independence, external validation, or current-model evidence. Cluster-aware analyses of the original study are outside this repair.

### P1/P2: Dependency and shared-interface integrity

The baseline npm audit reported six vulnerabilities (four high, two moderate). Supported in-range security resolution yields zero reported vulnerabilities in the recorded audit. The unsupported npm SheetJS dependency was removed; the served vendor module was upgraded to the official 0.20.3 distribution with upstream license and SHA-256 provenance. An actual workbook round-trip and provenance checks guard the vendored asset, which npm audit alone cannot assess. Audit results are time-specific and do not prove absence of vulnerabilities.

The shared shell no longer fabricates a fresh-load Saved/Updated-now status. It reports Ready until an app explicitly confirms persistence. Its reset-looking action is accurately labeled Reload and no longer deletes unrelated apps' storage. Help handles keyboard focus containment/restoration. Monitoring favorites and recent lists survive storage denial without crashing. Text highlighting and CSV exports escape content safely. The catalog no longer makes a false portfolio-wide no-account/no-tracking claim.

## Portfolio coverage

| Surface | What was actually covered | Remaining boundary |
|---|---|---|
| Biologic monitoring | All 23 entries structurally validated; nine targeted source corrections; state, export, storage, touch, table, and failure-path tests | Full independent monograph/interaction verification remains necessary. |
| RAMIE/AI scribe | Provider protocol, generation completion, encounter isolation, WebSocket auth/input, client provisional state, existing UI suites | Live provider/microphone/camera and deployed auth/PHI controls not exercised. |
| Dermoscopy LLM dashboard | Count reconciliation, malformed-data rejection, repeated-measures framing, aggregate interval suppression, existing tabs/selection/accessibility | Not a reanalysis of original sampling or patient clustering. |
| Rheum–Derm Therapeutics Field Guide | Existing 60-monograph structural, navigation, mobile and full-site browser tests | No claim that all 60 clinical monographs were newly source-validated. |
| Rheum–Derm Immune Atlas | Existing core, alternative-view, graph, contrast and mobile browser suites | Scientific mapping remediation remains the distinct open #175 workstream. |
| Rheum–Derm Clinical Trials | Exact assembled artifact and archive hashes, existing 214-row, provenance/quarantine and mobile browser tests | No refreshed registry census; immutable source artifacts preserved. |
| DermatoTarget Atlas | Existing data load, disease-context navigation and publication-asset/browser checks | Target scores are research outputs, not newly validated treatment recommendations. |
| Modern/legacy mindmaps | Existing schemas, all 16 topic-route rendering, diagram geometry, interactions, mobile and import-resilience tests | Full medical review of every node/algorithm remains outside the targeted source checks. |
| Dermatopathology Navigator/differentials | Existing canonical redirects, favorites, findings, PDF export, visualization and runtime suites | Educational differential content is not diagnostically certified. |
| WoundCare archive | Existing archival framing and navigation tests, shared-shell behavior | Historical content is not converted into current wound-care guidance. |
| PDF Studio/legacy PDF redirects | Existing organizer, extraction, image-packet, stamp, metadata, OCR-adapter, compression and redirect tests; spreadsheet vendor round-trip | Browser mocks do not establish clinical-document privacy certification or every real OCR workload. |
| Homepage, catalog, contact, research, strategy and utility pages | Existing route inventory, hydration, navigation, keyboard, mobile, SEO, download/static asset and D&D behavior tests | External service operations and unpublished inputs not exercised. |
| Skinoculars, AtlasSkin 3D, Clinisched, SkinScores, MARGIN and other external/private app entries | Repository catalog/URL wiring and available existing tests only | Their separate repositories/deployments are not audited by testing this site. |

## Verification receipts and reproducibility

Baseline GitHub Actions run: https://github.com/ramiefathy/ramiefathy.github.io/actions/runs/33935084640

- Unit/policy: **220 passed in 34 files**.
- Chromium: **230 passed; 21 opt-in tests skipped**.
- Production build and immutable trial-artifact checks passed.
- Dependency audit failed with six reported vulnerabilities, despite the functional tests passing.

Dependency resolution run: https://github.com/ramiefathy/ramiefathy.github.io/actions/runs/33936194476

- Committed dependency receipt: `c23470e1284dfb9fb20733635342c47001e5d494`.
- Artifact `9960253634` contains exact resolved dependencies and the zero-vulnerability audit.
- Official SheetJS source/version/archive and module hashes are recorded in `site/public/apps/vendor/xlsx.provenance.json`.

Local expanded checks: **283 unit/policy tests in 36 files**; **29 backend tests** using a temporary provider import stub and mocked provider responses. These are protocol/logic tests, not live Gemini calls. The production build succeeds on the resolved packages. The local environment blocks network access and Chromium navigation; browser verification is therefore executed by GitHub Actions, not claimed as local visual testing.

Fourteen new Chromium cases cover clinical warnings, checklist reset, clipboard failures and content, malformed data, storage denial, touch handling, safety detail in table view, truthful shell state/focus, failed scribe streaming, and research denominator failures. Final exact-head CI receipts and screenshot inspection are recorded in the pull request; do not infer they passed solely because they are listed here.

Permanent CI now uses `npm ci`, runs dependency auditing, and preserves unit/browser JSON reports and browser attachments. Vite 8's JSX transformation is configured explicitly for Vitest to avoid inheriting Astro's JSX-preserve setting. Run unit tests before the existing build assembler, which materializes its immutable dashboard payload into the public source directory; generated payload changes are not source remediation.

```sh
npm --prefix site ci
npm --prefix site test
npm --prefix site audit
npm run site:build
npm run site:test:e2e
cd services/ai-scribe
pip install -r requirements.txt
python -m pytest tests -q
```

## Primary sources for targeted corrections

Source pages were checked during this audit. Dates in sources and implementation dates are not interchangeable. These are targeted support for the corrections above, not a representation that every linked document was re-reviewed in full.

- FDA iPLEDGE implementation update: https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/ipledge-risk-evaluation-and-mitigation-strategy-rems
- Isotretinoin DailyMed label: https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=28948c32-a598-4bb5-bdb5-efbd87214d98
- CIBINQO prescribing information: https://labeling.pfizer.com/ShowLabeling.aspx?id=16652
- SILIQ manufacturer safety: https://www.siliq.com/hcp
- BIMZELX manufacturer safety: https://www.bimzelxhcp.com/
- TREMFYA manufacturer: https://www.tremfyahcp.com/
- SKYRIZI prescribing information: https://www.rxabbvie.com/pdf/skyrizi_pi.pdf
- OMVOH manufacturer: https://omvoh.lilly.com/hcp/
- OTEZLA manufacturer: https://www.otezlapro.com/resource-center/
- AAO 2025 hydroxychloroquine screening revision, published online November 14, 2025: https://pubmed.ncbi.nlm.nih.gov/41232611/
- ACR azathioprine information: https://rheumatology.org/patients/azathioprine-imuran
- CDC HBV screening: https://www.cdc.gov/hepatitis-b/hcp/diagnosis-testing/index.html
- Infliximab dose-specific contraindication: https://www.infliximab.com/hcp/dosing-and-administration/
- HUMIRA safety: https://www.humirapro.com/global-safety
- Historical monitoring review (2010): https://pmc.ncbi.nlm.nih.gov/articles/PMC2945861/
- PRIVIGEN safety: https://www.privigen.com/important-safety-information
- CDC antibody-product/vaccine timing, Table 3-6: https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html
- Official SheetJS installation/distribution: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
- Vite Oxc/JSX configuration: https://vite.dev/config/shared-options#oxc

## Residual work and release interpretation

Do not promote these tools to autonomous clinical decision systems on the basis of this PR. Priorities remain complete current-label review of the remaining medication entries and field-guide monographs; separate Atlas mapping review/integration; privacy/security assessment of real backend deployments and third-party integrations; and corresponding audits in external application repositories. Future data changes should preserve source/date/version scope and regression tests rather than silently refreshing a global review date.
