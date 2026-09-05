/* Independently sourced, bounded study assertions. No automatic graph promotion. */
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
    },
    {
      "id": "V06",
      "title": "Rituximab versus cyclophosphamide for ANCA-associated vasculitis",
      "year": 2010,
      "authors": "Stone et al.",
      "doi": "10.1056/NEJMoa0909905",
      "pmid": "20647199",
      "url": "https://pubmed.ncbi.nlm.nih.gov/20647199/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_TRIAL_REVIEW",
      "kind": "Primary randomized trial",
      "journal": "N Engl J Med",
      "note": "Study-specific result, not whole-condition validation or current regulatory-status verification."
    },
    {
      "id": "V07",
      "title": "Mepolizumab or Placebo for Eosinophilic Granulomatosis with Polyangiitis",
      "year": 2017,
      "authors": "Wechsler et al.",
      "doi": "10.1056/NEJMoa1702079",
      "pmid": "28514601",
      "url": "https://pubmed.ncbi.nlm.nih.gov/28514601/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_TRIAL_REVIEW",
      "kind": "Primary randomized trial",
      "journal": "N Engl J Med",
      "note": "Study-specific result, not whole-condition validation or current regulatory-status verification."
    },
    {
      "id": "V08",
      "title": "Benralizumab versus Mepolizumab for Eosinophilic Granulomatosis with Polyangiitis",
      "year": 2024,
      "authors": "Wechsler et al.",
      "doi": "10.1056/NEJMoa2311155",
      "pmid": "38393328",
      "url": "https://pubmed.ncbi.nlm.nih.gov/38393328/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_TRIAL_REVIEW",
      "kind": "Primary randomized trial",
      "journal": "N Engl J Med",
      "note": "Study-specific result, not whole-condition validation or current regulatory-status verification."
    },
    {
      "id": "V09",
      "title": "Trial of Tocilizumab in Giant-Cell Arteritis",
      "year": 2017,
      "authors": "Stone et al.",
      "doi": "10.1056/NEJMoa1613849",
      "pmid": "28745999",
      "url": "https://pubmed.ncbi.nlm.nih.gov/28745999/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_TRIAL_REVIEW",
      "kind": "Primary randomized trial",
      "journal": "N Engl J Med",
      "note": "Study-specific result, not whole-condition validation or current regulatory-status verification."
    },
    {
      "id": "V10",
      "title": "Plasma Exchange and Glucocorticoids in Severe ANCA-Associated Vasculitis",
      "year": 2020,
      "authors": "Walsh et al.",
      "doi": "10.1056/NEJMoa1803537",
      "pmid": "32053298",
      "url": "https://pubmed.ncbi.nlm.nih.gov/32053298/",
      "type": "Primary study",
      "evidenceStatus": "SCOPED_TRIAL_REVIEW",
      "kind": "Primary randomized trial",
      "journal": "N Engl J Med",
      "note": "Study-specific result, not whole-condition validation or current regulatory-status verification."
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
    },
    {
      "trial": "RAVE",
      "condition": "aav",
      "studyDesign": "Randomized double-blind noninferiority trial",
      "claim": "Rituximab was noninferior to daily cyclophosphamide for remission induction in the studied ANCA-positive GPA/MPA population.",
      "quote": "Rituximab therapy was not inferior to daily cyclophosphamide treatment for induction of remission",
      "population": "197 ANCA-positive participants with GPA (reported as Wegener granulomatosis) or microscopic polyangiitis.",
      "comparison": "Rituximab 375 mg/m² weekly for four weeks versus oral cyclophosphamide 2 mg/kg/day, with glucocorticoid tapering.",
      "endpoint": "Disease remission without prednisone at month 6.",
      "result": "Primary endpoint: 64% versus 53%; the noninferiority criterion was met.",
      "limitations": "Do not transfer this comparison to EGPA or immune-complex vasculitis, claim general superiority, or assign a skin-specific effect from the overall remission endpoint.",
      "id": "vasculitis-v06",
      "refs": [
        "V06"
      ],
      "locator": "Abstract: Methods, Results and Conclusions",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "trial": "MIRRA",
      "condition": "egpa",
      "studyDesign": "Randomized double-blind placebo-controlled phase 3 trial",
      "claim": "Add-on mepolizumab increased accrued remission and remission at both weeks 36 and 48 in relapsing or refractory EGPA.",
      "quote": "Mepolizumab treatment led to significantly more accrued weeks of remission than placebo",
      "population": "136 participants with relapsing or refractory EGPA on stable prednisone or prednisolone.",
      "comparison": "Mepolizumab 300 mg subcutaneously every four weeks versus placebo, both with standard care, for 52 weeks.",
      "endpoint": "Accrued weeks of remission and remission at both weeks 36 and 48.",
      "result": "At least 24 accrued remission weeks: 28% versus 3%; remission at both visits: 32% versus 3%.",
      "limitations": "Remission never occurred in 47% of mepolizumab recipients. Do not infer universal response, a skin-specific benefit score, or efficacy in every vasculitis subtype.",
      "id": "vasculitis-v07",
      "refs": [
        "V07"
      ],
      "locator": "Abstract: Methods, Results and Conclusions",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "trial": "MANDARA",
      "condition": "egpa",
      "studyDesign": "Randomized double-blind active-controlled noninferiority phase 3 trial",
      "claim": "Benralizumab was noninferior, not superior, to mepolizumab for the primary remission endpoint in relapsing or refractory EGPA.",
      "quote": "showing noninferiority but not superiority of benralizumab to mepolizumab.",
      "population": "140 adults with relapsing or refractory EGPA receiving standard care.",
      "comparison": "Benralizumab 30 mg versus mepolizumab 300 mg, subcutaneously every four weeks for 52 weeks.",
      "endpoint": "Remission at weeks 36 and 48; prespecified noninferiority margin: −25 percentage points.",
      "result": "Adjusted remission: 59% versus 56%; difference 3 percentage points (95% CI −13 to 18).",
      "limitations": "Noninferiority under this margin is not equivalence or superiority. This comparison does not establish efficacy in GPA, MPA, GCA, or an isolated cutaneous endpoint.",
      "id": "vasculitis-v08",
      "refs": [
        "V08"
      ],
      "locator": "Abstract: Methods, Results and Conclusions",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "trial": "GiACTA",
      "condition": "gca",
      "studyDesign": "Randomized placebo-controlled four-arm trial",
      "claim": "Tocilizumab with a 26-week prednisone taper increased sustained glucocorticoid-free remission at week 52 in giant-cell arteritis.",
      "quote": "Sustained remission at week 52 occurred in 56% of the patients treated with tocilizumab weekly",
      "population": "251 participants with giant-cell arteritis.",
      "comparison": "Tocilizumab 162 mg subcutaneously weekly or every other week plus 26-week taper; placebo plus either 26-week or 52-week taper.",
      "endpoint": "Sustained glucocorticoid-free remission at week 52; primary comparison used placebo with the 26-week taper.",
      "result": "Weekly/every-other-week tocilizumab: 56%/53%; placebo with 26-/52-week tapers: 14%/18%.",
      "limitations": "Keep the four arms and taper schedules distinct. Do not generalize to all large-vessel vasculitis, infer prevention of visual loss, or claim indefinite remission durability.",
      "id": "vasculitis-v09",
      "refs": [
        "V09"
      ],
      "locator": "Abstract: Methods, Results and Conclusions",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    },
    {
      "trial": "PEXIVAS",
      "condition": "aav",
      "studyDesign": "Randomized two-by-two factorial trial; glucocorticoid noninferiority comparison",
      "claim": "A reduced-dose glucocorticoid regimen was noninferior to the standard-dose regimen for death or end-stage kidney disease in severe AAV.",
      "quote": "A reduced-dose regimen of glucocorticoids was noninferior to a standard-dose regimen with respect to death or ESKD.",
      "population": "Severe AAV with eGFR below 50 mL/min/1.73 m² or diffuse pulmonary hemorrhage.",
      "comparison": "Reduced-dose versus standard-dose oral glucocorticoid regimens; plasma exchange was a separately randomized factorial comparison.",
      "endpoint": "Death or end-stage kidney disease; glucocorticoid noninferiority margin: 11 percentage points.",
      "result": "Primary events: 92/330 versus 83/325; difference 2.3 percentage points (90% CI −3.4 to 8.0).",
      "limitations": "This is a regimen comparison, not glucocorticoids versus no treatment. Do not transfer it to other vasculitis subtypes or use it to generate a skin-benefit score.",
      "id": "vasculitis-v10",
      "refs": [
        "V10"
      ],
      "locator": "Abstract: Methods, Results and Conclusions",
      "disposition": "SUPPORTED_WITHIN_STUDY_SCOPE",
      "reviewStatus": "AI_ASSISTED_SOURCE_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "sourceKind": "primary-publication",
      "automaticGraphPromotion": false
    }
  ],
  "scope": "Ten narrow primary-source assertions: five mechanistic/observational and five randomized-trial comparisons. Claims retain their study scope; no whole-condition, whole-graph, regulatory, or human approval is implied."
};
  function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  root.AtlasVasculitisEvidence = freeze(packet);
})(globalThis);
