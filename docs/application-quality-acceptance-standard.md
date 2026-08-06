# Application Quality and Acceptance Standard

**Effective date:** 2026-08-06  
**Scope:** Every application-like surface registered in `site/src/data/apps.json`, including public, external, authenticated, unlisted, private, research, educational, utility, and archived routes.

This document is a release gate, not a roadmap. An application may remain available with a visible `research prototype`, `review due`, `educational beta`, `private`, or `historical archive` label when it has not met the requirements for a stronger classification. It must not be represented as having passed a gate that has not been executed and evidenced.

The machine-readable profile for each application is in `site/src/data/app-acceptance-profiles.json`.

## 1. Universal release rules

A release is acceptable only when all applicable blocking criteria pass on the exact proposed head and the built artifact is traceable to that head.

### 1.1 Source and artifact integrity

- The source branch, commit SHA, build command, runtime version, and dependency lockfile are recorded.
- Generated artifacts are reproducible from reviewable source or are accompanied by an immutable, checksummed release manifest.
- No application depends on an expired signed URL, mutable third-party asset, hidden local file, or unrecorded manual transformation.
- All public routes in the registry resolve to a source file or a separately verified external deployment.
- Test/demo fixtures do not masquerade as production content.

### 1.2 Functional correctness

- The primary user workflow completes from a clean browser state.
- Required inputs cannot be silently defaulted.
- Invalid, missing, nonfinite, unsupported, contradictory, or stale state fails visibly and safely.
- Save, recovery, reset, import, export, deep-link, back/forward, empty-state, and error paths are tested where supported.
- Browser console errors, uncaught exceptions, failed required requests, and unhandled promise rejections are release blockers.

### 1.3 Accessibility and responsive behavior

- Keyboard-only operation reaches every required control and workflow.
- Focus order and focus restoration are deterministic.
- Names, roles, states, validation messages, and live regions are exposed to assistive technology.
- Color is not the sole information channel.
- Reduced-motion preferences are honored.
- No document-level horizontal overflow occurs at 390 × 844, 768 × 1024, 1440 × 1000, or the application’s supported XR viewport.
- Automated accessibility checks have no critical or serious unresolved findings; manual screen-reader review is required for critical clinical or operational workflows.

### 1.4 Privacy and security

- The catalog and application itself state whether an account is required and whether data leaves the browser.
- Protected health information is prohibited unless the exact deployment is explicitly approved for it.
- API keys, access tokens, and secrets are not committed, embedded in client bundles, logged, placed in query strings in production, or persisted beyond the documented scope.
- Authentication is not authorization; tenant and role boundaries are tested independently.
- `noindex`, an unlisted URL, or an opaque slug is never treated as access control.
- Exports, backups, logs, analytics, and crash reports follow the same data classification as the application.

### 1.5 Clinical and scientific integrity

- The application classification is visible: clinical workflow, clinical reference, research only, education only, nonclinical utility, private, or archive.
- Consequential claims have source-level provenance and a review date appropriate to the risk.
- Unknown, absent, negative, filtered, inferred, derived, and source-explicit states are not conflated.
- Research observations are not presented as clinical validation, causality, bioequivalence, or deployment safety.
- Repeated observations are not represented as independent cases.
- Class-level claims are not applied to an individual drug, indication, population, jurisdiction, or dose without support.
- Out-of-date content remains visibly `review due` or `archive` until re-reviewed.

### 1.6 Performance and resilience

- Initial content, interaction readiness, and largest assets remain within an application-specific budget.
- Large datasets and documents are progressively loaded or partitioned.
- Cancellation, retry, offline behavior, context loss, and partial failure are defined where relevant.
- Production smoke checks verify substantive behavior, not merely HTTP 200.

### 1.7 Evidence required for approval

Each approval packet must identify:

1. exact head SHA and tree;
2. changed-file inventory;
3. commands and environments used;
4. unit, integration, browser, accessibility, responsive, visual, security, and domain-specific results;
5. artifact identifiers and checksums where generated;
6. unresolved limitations and their visible user-facing boundary;
7. reviewer comments and disposition;
8. production or hosted exact-head verification when a deployment changes.

## 2. RAMIE research prototype

RAMIE remains intentionally feature-rich: transcription, image and document handling, multimodal consultation support, differential generation, management drafting, structured note creation, session recovery, and export may remain available.

It may ship only as a **Research prototype** unless a separately approved clinical deployment meets a substantially higher validation and compliance standard.

### Blocking acceptance criteria

- `Research prototype` appears above the primary workflow and cannot be dismissed permanently.
- The public demo states that it is not approved for PHI.
- The configured WebSocket destination and model-processing boundary are visible before audio, image, or transcript transmission.
- Text-only/local drafting remains available when backend-only features are unavailable, unless the implementation explicitly cannot support it.
- Microphone denial, insecure `ws://` on HTTPS, connection refusal, invalid token, expired token/close code 4008, interrupted stream, malformed response, and backend timeout produce specific recoverable errors.
- Production authentication does not use raw shared secrets or query-string tokens.
- Note statements are traceable to transcript/user evidence or visibly marked as model inference.
- Contradictions, missing information, and unsupported claims are surfaced before final export.
- Differential and management suggestions are visually separated from source-derived documentation.
- A clinician must accept/edit/reject generated sections before a final artifact is labeled complete.
- Dermatology terminology, negation, medication/dose, body-site, laterality, omission, fabrication, and edit-distance evaluation sets are versioned and reported.
- Backend origin restrictions, rate limits, token lifetime, logging policy, retention, deletion, and tenant boundaries are tested.

### Required browser scenarios

- clean first load without backend;
- configured backend with successful authentication;
- text session;
- audio session;
- image/document session;
- note review and export;
- interrupted connection and recovery;
- saved-session migration;
- mobile and keyboard-only workflow;
- public-demo boundary and no-PHI warning.

## 3. SkinScores

### Blocking acceptance criteria

- Every instrument has a canonical name, version, original source, license/copyright status, intended population, validated setting, required units, missing-data rule, interpretation, limitations, and review owner/date.
- Every calculator passes independently checked reference vectors from an authoritative source.
- Missing inputs, zero values, unitless values, invalid enums, nonfinite values, and out-of-range values are distinguished correctly.
- No clinician-editable input uses a clinically meaningful silent default.
- Formula components and input contributions can be inspected.
- Longitudinal episodes preserve instrument version and source data.
- Patient-reported outcomes cannot enter a clinician record without review.
- Anonymous and account-backed modes have explicit retention and deletion behavior.
- Firestore rules deny cross-user/cross-tenant access.
- Offline calculation and reload behavior are tested for instruments advertised as offline-capable.
- PDF, CSV, note text, and machine-readable exports retain version, units, timestamp, and missing-data state.

## 4. Clinisched

### Blocking acceptance criteria

- Hard constraints cannot be violated by manual or automatic scheduling.
- Soft preferences and objective weights are distinct and inspectable.
- Every generated assignment explains applicable constraints, preferences, conflicts avoided, and alternatives.
- Institution, role, and membership boundaries are enforced in UI, Firestore rules, and Cloud Functions.
- Draft, validation, approval, publication, amendment, rollback, author, approver, and immutable diff are implemented for published schedules.
- ACGME and institution-specific rules use configurable slot hours and do not double count protected/default/virtual slots.
- Fairness reports cover undesirable shifts, sites, weekends/evenings, continuity opportunities, preference satisfaction, and exceptions.
- Swap/change requests rerun all applicable constraints before approval.
- Emulator E2E covers admin, chief resident, resident, removed member, and cross-tenant attacker roles.
- Backup and restore drill succeeds using a current verified backup.
- Production smoke verifies sign-in, read, authorized write, unauthorized denial, schedule validation, and export.

## 5. Rheum–Derm Immune Atlas

### Blocking acceptance criteria

- Direct, derived, explicit-zero, filtered, unknown, and rejected relationship states remain separate.
- Lexical, organ-domain, treatment-response, canonical-background, or other inferred edges are opt-in and labeled.
- Every visible relationship exposes its source trail or explicit curation record.
- Denominators show scanned, mapped, filtered, unknown, and visible entities where relevant.
- Treatment overlap is categorical unless a validated quantitative model is explicitly provided.
- Tissue, cell type, endotype, disease phase, assay, population, directionality, evidence conflict, and review status are represented or explicitly unknown.
- Shareable URLs preserve selected condition, treatment, pathway, view, filters, and evidence floor.
- Visible-subset export includes entities, relationships, states, sources, version, and interpretive boundaries.
- Complete mobile containment, keyboard operation, reduced-motion behavior, contrast, grayscale encodings, and screen-reader alternatives pass.
- The public data product includes schema, dictionary, stable identifiers, version, changelog, and reproducible build.

## 6. Rheum–Derm Clinical Trials Dashboard

### Blocking acceptance criteria

- The source of truth is a normalized, reviewable study/program dataset rather than opaque generated HTML alone.
- Each record has registry identifier, study class, phase, status, sponsor, condition/subtype, intervention/target, comparator, enrollment, endpoints, dates, results availability, publication links, provenance, and last registry check.
- Interventional trials, observational studies, long-term extensions, regulatory approvals, development programs, and mechanistic studies remain distinct.
- Registration, reported results, publication interpretation, and regulatory status are not conflated.
- Scheduled registry/publication refreshes create deterministic diffs and an adjudication queue.
- Artifact generation is reproducible and checksummed.
- A non-JavaScript or decompression-failure fallback exposes a searchable table and data download.
- Saved views and exports preserve filters, denominators, source dates, and version.
- Broken, duplicate, withdrawn, superseded, or changed records are handled explicitly.

## 7. Biologic Monitoring Dashboard

### Blocking acceptance criteria

- Data validation runs before rendering and blocks malformed records.
- Treatment indications, caution conditions, contraindications, and off-label contexts are structurally separate.
- Agent × indication × population × jurisdiction × dose differences are represented; class-level text is used only when equivalent.
- Each baseline task, interval, hold criterion, warning, contraindication, and vaccination statement has assertion-level provenance.
- Sources are classified as label-required, guideline-recommended, institution-specific, or common practice.
- Label revision date, dataset version, last reviewer, review status, review due date, broken-link status, and changelog are visible.
- Stale content cannot display a reassuring current label.
- Known IL-17/IBD treatment-versus-caution contradiction is rejected by tests.
- Context-aware checklists ask only for variables that can alter recommendations.
- Exports omit patient identifiers by default and include version and sources.

## 8. Dermoscopy LLM Evaluation Dashboard

### Blocking acceptance criteria

- `100 unique images` and `10,200 repeated model × prompt evaluations` are both visible wherever the principal denominator is discussed.
- Repeated observations are never called independent cases or trials without qualification.
- Comparative inference uses image-level pairing, clustered bootstrap, or an appropriate hierarchical model; descriptive binomial intervals are labeled descriptive.
- Model provider, exact model identifier/snapshot, date, prompts, settings, preprocessing, failed-call handling, cost method, and code version are documented.
- Paired effect estimates, uncertainty, multiplicity handling, discordant cases, and per-diagnosis confusion matrices are available for confirmatory comparisons.
- Calibration, abstention/selective prediction, sensitivity at specificity, error severity, cost, and latency are reported where supported.
- Skin tone, image source, device, and acquisition subgroup limitations are explicit.
- A dermatologist comparator is mentioned only when actually measured under the documented study protocol.
- Reproducible aggregate data, prompts, analysis code, and release manifest are published.

## 9. DermatoTarget Atlas

### Blocking acceptance criteria

- Input source snapshots, request provenance, ontology mappings, scoring configuration, code version, and run manifest are preserved.
- Every composite score decomposes exactly into documented components and penalties.
- Weight changes and evidence ablations expose rank sensitivity.
- Successful targets, failed/negative controls, and biologically implausible controls are evaluated.
- Publication intensity, druggability, target-family, and correlated-source biases are disclosed.
- High rank is never presented as causality or expected efficacy.
- Target dossiers expose genetics, tissue/cell context, disease specificity, pathways, existing drugs, safety liabilities, trials, literature, conflicts, and missing evidence.
- Data, schema, dictionary, identifiers, and code are versioned and exportable.

## 10. Dermatology Mind Maps

### Blocking acceptance criteria

- Every manifest, tab, node, diagram, comparison, and citation passes schema validation.
- Topic-level review status is visible.
- Consequential assertions have source identifiers and evidence type.
- Global search spans all topics, synonyms, tags, diagrams, and comparisons.
- Deep links survive renamed/removed nodes through migration or clear fallback.
- Comparison mode emphasizes discriminating positives, negatives, workup, red flags, treatment, and pitfalls.
- Case-based pathways do not reveal the answer before the learner commits.
- Exports preserve topic, selected view, node path, citations, and content version.
- Education-only boundary remains visible.

## 11. Dermatopathology Navigator

### Blocking acceptance criteria

- Content follows a formal schema for compartment, architecture, epidermal and dermal changes, cells, inflammation, atypia, organisms/deposits, positive and negative findings, differential, discriminators, stains, IHC, molecular studies, correlation, pitfalls, and sources.
- Every image includes source, creator, license, stain, magnification, diagnosis, and acquisition caveats.
- Unknown-case mode stages low power, higher power, stains, differential, and final diagnosis without answer leakage.
- Spaced repetition is tied to explicit objectives and missed discriminators.
- Report-phrase output remains educational and requires user review.
- Runtime Babel/CDN compilation is absent from production.
- Test-fix and deduplication pages are excluded from the public product surface.
- A non-WebGL and screen-reader-accessible representation is available.

## 12. Skinoculars

### Blocking acceptance criteria

- Every disease profile labels each visual change as schematic, qualitative, measured, or validated.
- Quantitative-looking transform factors are not presented as biological measurements without supporting validation.
- Profile metadata includes sources, affected structures, direction, magnitude status, reviewer, date, and simplifications.
- Normal-to-disease guided tours explain each change.
- Clinical, dermoscopic, histologic, and 3D correlations use licensed media with provenance.
- Keyboard, touch, reduced-motion, low-GPU, context-loss, mobile, and XR paths pass.
- A semantic 2D/text alternative describes the currently visible structures and disease changes.
- WebGL context loss recovers without data loss or an unrecoverable blank canvas.

## 13. JeopaGen

### Blocking acceptance criteria

- Every generated clue/response stores source document, page/slide/sheet/section, supporting excerpt, and synthesis status.
- Human approval is required before an item reaches final export.
- Item review covers support, single-best-answer integrity, ambiguity, difficulty, distractor quality, duplication, clue leakage, and audience fit.
- Accepted, edited, rejected, and regenerated outcomes are measured.
- API keys remain session-scoped and are never included in exports or repository assets.
- PHI is explicitly prohibited.
- HTML, PowerPoint, macro-enabled, CSV/TXT answer key, recovery, undo/redo, and keyboard game workflows pass.
- The website publication source is immutable and durable; expired signed URLs are prohibited.
- Release manifest, source commit, file inventory, and checksums match the deployed artifact.

## 14. PDF Studio

### Blocking acceptance criteria

- Automated no-network tests prove document content is not uploaded.
- Runtime libraries are self-hosted and constrained by a restrictive CSP.
- The interface does not call visual covering, flattening, or masking `secure redaction` unless underlying content removal is verified.
- Organizer, extraction, assembly, image packet, stamping, metadata, OCR, compression, and text extraction workflows have valid and malformed corpus tests.
- Encrypted, annotated, form-containing, rotated, scanned, mixed-size, corrupted, and very large files have explicit outcomes.
- Generated PDFs reopen in at least two independent parsers and preserve expected page count, order, dimensions, text, and metadata behavior.
- Workers, progress, cancellation, memory warning, retry, and recovery are tested.
- Offline installation and reload pass for advertised local workflows.

## 15. KSA Sovereign Credit Analytics

### Blocking acceptance criteria

- Unauthorized and incognito access is denied before application assets or data are served.
- Application-level user identity, roles, and audit logs supplement perimeter access when multiple users are supported.
- Every market value displays vendor, instrument identifier, timestamp, staleness, currency, method, and redistribution boundary.
- Curve, interpolation, basis, peer, FX, oil, fiscal, scenario, and missing-data methods are versioned.
- Exports contain source manifest, timestamp, assumptions, and calculation version.
- Secrets, licensed data, Postgres volumes, and backups remain outside the public repository.
- Tunnel/origin failure is fail-closed.
- Encrypted backup and restore drill succeeds.

## 16. MCQ research dashboards

### Blocking acceptance criteria

- Automated judge identity, version, prompt, rubric, failure rate, and known bias are visible.
- Automated scores are not labeled human validation.
- A blinded clinician/educator adjudication sample calibrates material defect rates.
- Item provenance and content-license status are available.
- Uncertainty, paired model comparisons, and multiplicity correction are reported.
- Defects are classified into factual error, unsupported key, ambiguity, distractor failure, clue leakage, formatting, and unsafe content.
- Aggregate content loads before item-level payload; multi-megabyte data is partitioned and fetched on demand.
- Judge disagreements and representative examples are inspectable.

## 17. Private and unlisted applications

Taskboard, Table Ledger, Egypt strategy, Dermie VC materials, and comparable surfaces must not rely on `noindex`, omission from the catalog, or an opaque route for confidentiality.

### Blocking acceptance criteria

- Sensitive surfaces move to a separate authenticated deployment before sensitive use or distribution.
- Public builds contain no secrets, private financial assumptions intended to remain confidential, licensed data, or private account data.
- Authorization and tenant rules are tested.
- Confidentiality classification and version are visible.
- Backup, restore, account removal, and audit retention are defined.
- Table Ledger no longer gates the professional website deployment once its separate release workflow exists.

## 18. WoundCare and legacy applications

### Blocking acceptance criteria

- The historical date and archive label are visible before the content.
- Archived clinical content states that it is not current guidance.
- Archived tools are absent from the active application catalog.
- No archived route implies active support, current review, or clinical suitability.
- A current replacement is linked where one exists.
- Any revival starts from current source review and a new governed data model rather than cosmetic modernization of old content.

## 19. Approval states

An application may carry only one of the following user-facing states:

- **Clinical workflow** — applicable high-risk gates passed for the exact release.
- **Reviewed evidence/reference** — content review and provenance gates passed and remain current.
- **Production service** — operational security, correctness, recovery, and production smoke passed.
- **Qualified release** — nonclinical functionality, accessibility, release integrity, and domain gates passed.
- **Research prototype/workbench/companion** — functionality may be extensive, but clinical validation is not claimed.
- **Educational beta/prototype** — educational boundary is explicit and content review may be incomplete.
- **Review due** — content remains accessible only with a prominent stale-content warning.
- **Private/internal** — authenticated distribution and private-data rules apply.
- **Historical archive** — not current, not actively supported, and not clinical guidance.

Passing a lower state does not imply eligibility for a higher state.
