/* Independently sourced, bounded mechanism assertions. No automatic graph promotion. */
(function (root) {
  "use strict";
  const packet = {
  "schemaVersion": 1,
  "references": [
    {
      "id": "V01",
      "title": "Antineutrophil cytoplasmic autoantibodies specific for myeloperoxidase cause glomerulonephritis and vasculitis in mice",
      "year": 2002,
      "authors": "Xiao et al.",
      "doi": "10.1172/JCI15918",
      "pmid": "12370273",
      "url": "https://pubmed.ncbi.nlm.nih.gov/12370273/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_MECHANISM_REVIEW",
      "kind": "Primary experimental study",
      "journal": "J Clin Invest",
      "note": "Supports only the separately recorded study-scoped claim; no automatic clinical or graph validation."
    },
    {
      "id": "V02",
      "title": "The role of neutrophils in the induction of glomerulonephritis by anti-myeloperoxidase antibodies",
      "year": 2005,
      "authors": "Xiao et al.",
      "doi": "10.1016/S0002-9440(10)62951-3",
      "pmid": "15972950",
      "url": "https://pubmed.ncbi.nlm.nih.gov/15972950/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_MECHANISM_REVIEW",
      "kind": "Primary experimental study",
      "journal": "Am J Pathol",
      "note": "Supports only the separately recorded study-scoped claim; no automatic clinical or graph validation."
    },
    {
      "id": "V03",
      "title": "Alternative complement pathway in the pathogenesis of disease mediated by anti-neutrophil cytoplasmic autoantibodies",
      "year": 2007,
      "authors": "Xiao et al.",
      "doi": "10.2353/ajpath.2007.060573",
      "pmid": "17200182",
      "url": "https://pubmed.ncbi.nlm.nih.gov/17200182/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_MECHANISM_REVIEW",
      "kind": "Primary experimental study",
      "journal": "Am J Pathol",
      "note": "Supports only the separately recorded study-scoped claim; no automatic clinical or graph validation."
    },
    {
      "id": "V04",
      "title": "C5a receptor mediates neutrophil activation and ANCA-induced glomerulonephritis",
      "year": 2009,
      "authors": "Schreiber et al.",
      "doi": "10.1681/ASN.2008050497",
      "pmid": "19073822",
      "url": "https://pubmed.ncbi.nlm.nih.gov/19073822/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_MECHANISM_REVIEW",
      "kind": "Primary experimental study",
      "journal": "J Am Soc Nephrol",
      "note": "Supports only the separately recorded study-scoped claim; no automatic clinical or graph validation."
    },
    {
      "id": "V05",
      "title": "Plasma Proteomic Analysis Reveals the Potential Role of Lectin and Alternative Complement Pathways in IgA Vasculitis Pathogenesis",
      "year": 2023,
      "authors": "Demir et al.",
      "doi": "10.3390/diagnostics13101729",
      "pmid": "37238213",
      "url": "https://pubmed.ncbi.nlm.nih.gov/37238213/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_MECHANISM_REVIEW",
      "kind": "Primary observational study",
      "journal": "Diagnostics",
      "note": "Supports only the separately recorded study-scoped claim; no automatic clinical or graph validation."
    }
  ],
  "claims": [
    {
      "id": "vasculitis-v01",
      "condition": "aav",
      "claim": "Anti-MPO IgG induced pauci-immune necrotizing crescentic glomerulonephritis in the tested mouse model.",
      "quote": "anti-MPO IgG alone was able to cause pauci-immune glomerular necrosis and crescent formation",
      "locator": "Abstract, concluding results",
      "refs": [
        "V01"
      ],
      "studyDesign": "Mouse passive-transfer experiment",
      "limitations": "The causal result concerns an anti-MPO mouse model. It does not establish all PR3 phenotypes, human cutaneous manifestations, or drug efficacy.",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "id": "vasculitis-v02",
      "condition": "aav",
      "claim": "Experimental neutrophil depletion prevented anti-MPO IgG-induced glomerulonephritis in mice.",
      "quote": "mice that were depleted of circulating neutrophils with NIMP-R14 rat monoclonal antibodies were completely protected from anti-MPO IgG-induced NCGN.",
      "locator": "Abstract, results",
      "refs": [
        "V02"
      ],
      "studyDesign": "Mouse neutrophil-depletion experiment",
      "limitations": "Animal mechanism evidence is not a recommendation to induce neutropenia in patients, and is not a clinical efficacy estimate.",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "id": "vasculitis-v03",
      "condition": "aav",
      "claim": "C5 or factor B deficiency prevented anti-MPO IgG-induced disease in the tested mice, whereas C4 deficiency did not.",
      "quote": "C5-/- and factor B-/- mice developed no disease.",
      "locator": "Abstract, knockout experiment",
      "refs": [
        "V03"
      ],
      "studyDesign": "Mouse knockout experiment with human neutrophil experiments",
      "limitations": "This supports a complement mechanism in the experimental model, not avacopan efficacy or uniform causal effects across human organ manifestations.",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "id": "vasculitis-v04",
      "condition": "aav",
      "claim": "C5aR blockade prevented conditioned-serum priming of ANCA-induced neutrophil respiratory burst in the reported experiment.",
      "quote": "neutrophil C5aR blockade abrogated this priming",
      "locator": "Abstract, conditioned-serum experiment",
      "refs": [
        "V04"
      ],
      "studyDesign": "Neutrophil experiments and mouse marrow-transplant model",
      "limitations": "This is mechanistic evidence, not a randomized clinical treatment comparison. It neither rehabilitates a retracted efficacy result nor quantifies human treatment benefit.",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "id": "vasculitis-v05",
      "condition": "immune_complex_vasculitis",
      "claim": "Pediatric IgA vasculitis proteomic findings implicated lectin and alternative complement pathways.",
      "quote": "Our results clearly suggest the role of the lectin and alternate complement pathways in IgAV.",
      "locator": "Abstract, conclusion; full-text sections 2.1 and 3.1 for population",
      "refs": [
        "V05"
      ],
      "studyDesign": "Human observational pediatric plasma proteomics; 37 cases and 5 controls",
      "limitations": "Association and pathway enrichment are not causal proof. These children had no renal involvement at diagnosis or one-year follow-up; do not generalize this result to IgAV nephritis, cryoglobulinemia, or treatment efficacy.",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    }
  ],
  "scope": "Five narrow mechanistic assertions checked against primary publication abstracts; not whole-condition or whole-graph validation."
};
  function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  root.AtlasVasculitisEvidence = freeze(packet);
})(globalThis);
