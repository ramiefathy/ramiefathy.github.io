# Rheum–Derm Atlas P0 scientific-integrity remediation

## Scope

This change remediates the P0 findings from the systems-explorer audit. The default explorer contains only source-explicit pathway–phenotype links or mappings with a documented curator decision. Lexical, broad organ-domain, treatment-response, and generic canonical-adjacency inferences remain available only as separately labeled, opt-in exploratory layers.

## Scientific dispositions

- Rheumatoid nodules are classified as necrobiotic/palisading granulomatous rather than generically neutrophilic.
- Purpura is classified as vascular/purpuric injury rather than presumed ulceration.
- Hearing loss, atrophy, calcinosis, catastrophic APS, trigger-linked CAPS attacks, and syndromic neutrophilic overlaps have dedicated phenotype domains.
- The vasculitis umbrella is replaced by AAV, EGPA, GCA/LVV, and immune-complex small-vessel vasculitis contexts; subtype-specific pathways and treatments do not propagate across them.
- Rituximab pharmacologic effector mechanisms do not establish complement causality for individual dermatomyositis manifestations.
- IL-1 response does not imply eradication of the Schnitzler monoclonal gammopathy.
- Sjögren fatigue/pain is not presented as a simple positive rituximab-derived B-cell edge.
- APS thrombocytopenia is not derived from anticoagulation response; obstetric APS preserves complement/placental injury alongside coagulation.
- ACE-inhibitor efficacy in established scleroderma renal crisis does not validate an endothelin/NO causal edge.

## Fail-closed contract

A default pathway–phenotype link must include either an exact source span or a documented curator decision. Broad synonyms cannot establish an exact mapping through unrestricted substring matching. Default links may not retain supporting-medication triangulation. Rejected relationship mappings and any vasculitis treatment-effect rows lacking an explicit endotype scope remain in auditable quarantines with rejection reasons and complete source-row accounting. Canonical-background rules and exploratory mappings are off by default and require an explicit user action.

Evidence-layer changes are serialized so rapid control changes cannot interleave relational-contract rebuilds. Contract validation evaluates the recorded default configuration while continuing to verify that rejected links never enter either the reviewed or exploratory active sets.

## Verification and publication

The permanent pull-request workflow uses SHA-pinned actions without persistent checkout credentials. It runs the complete Vitest/policy suite, production build, and all five focused Atlas browser suites: scientific integrity, core explorer behavior, graph interaction/contrast, alternative representations, and mobile displays. Only after those gates pass does it create a deterministic archive containing the explicit 15-file source allowlist, with a manifest recording every path, byte size, and SHA-256 digest. Repository-wide CI provides the independent full-browser regression gate.
