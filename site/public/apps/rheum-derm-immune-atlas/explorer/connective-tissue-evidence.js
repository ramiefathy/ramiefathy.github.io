/* Primary-abstract scope records: never a clinical approval or graph-score input. */
(function (root) {
  'use strict';
  const packet = {
  "schemaVersion": 1,
  "scope": "Seven independently examined primary abstracts. No full-text review, human approval, regulatory-status assertion or automatic graph promotion.",
  "references": [
    {
      "id": "R06",
      "pmid": "31851795",
      "doi": "10.1056/NEJMoa1912196",
      "title": "Trial of Anifrolumab in Active Systemic Lupus Erythematosus.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/31851795/"
    },
    {
      "id": "R07",
      "pmid": "32937045",
      "doi": "10.1056/NEJMoa2001180",
      "title": "Two-Year, Randomized, Controlled Trial of Belimumab in Lupus Nephritis.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/32937045/"
    },
    {
      "id": "R11",
      "pmid": "36198179",
      "doi": "10.1056/NEJMoa2117912",
      "title": "Trial of Intravenous Immune Globulin in Dermatomyositis.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/36198179/"
    },
    {
      "id": "R12",
      "pmid": "23124935",
      "doi": "10.1002/art.37754",
      "title": "Rituximab in the treatment of refractory adult and juvenile dermatomyositis and adult polymyositis: a randomized, placebo-phase trial.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/23124935/"
    },
    {
      "id": "R15",
      "pmid": "31112379",
      "doi": "10.1056/NEJMoa1903076",
      "title": "Nintedanib for Systemic Sclerosis-Associated Interstitial Lung Disease.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/31112379/"
    },
    {
      "id": "R17",
      "pmid": "38279402",
      "doi": "10.1016/S2665-9913(21)00107-7",
      "title": "Safety and efficacy of rituximab in systemic sclerosis (DESIRES): a double-blind, investigator-initiated, randomised, placebo-controlled trial.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/38279402/"
    },
    {
      "id": "CT08",
      "pmid": "27469583",
      "doi": "10.1016/S2213-2600(16)30152-7",
      "title": "Mycophenolate mofetil versus oral cyclophosphamide in scleroderma-related interstitial lung disease (SLS II): a randomised controlled, double-blind, parallel group trial.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/27469583/"
    }
  ],
  "claims": [
    {
      "id": "ctd-tulip2",
      "condition": "sle",
      "med": "anifro",
      "trial": "TULIP-2",
      "refs": [
        "R06"
      ],
      "claim": "Anifrolumab improved the prespecified BICLA composite in TULIP-2; not every secondary outcome improved.",
      "population": "362 patients with active SLE; 180 anifrolumab and 182 placebo.",
      "comparison": "Anifrolumab 300 mg IV versus placebo every four weeks for 48 weeks.",
      "endpoint": "Primary: BICLA response at week 52, a composite disease-activity endpoint.",
      "result": "47.8% versus 31.5%; difference 16.3 percentage points (95% CI 6.3 to 26.3), P=0.001.",
      "quote": "The percentage of patients who had a BICLA response was 47.8% in the anifrolumab group and 31.5% in the placebo group",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "The earlier phase 3 trial missed a different primary endpoint. Skin and steroid-reduction secondary outcomes favored treatment; joint-count and annualized-flare outcomes did not. This does not establish a nephritis indication or efficacy of every interferon-pathway drug.",
      "primaryOutcome": "MET",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    },
    {
      "id": "ctd-blissln",
      "condition": "sle",
      "med": "belimumab",
      "trial": "BLISS-LN",
      "refs": [
        "R07"
      ],
      "claim": "Belimumab added to standard treatment increased renal responses in active lupus nephritis.",
      "population": "448 adults with biopsy-proven active lupus nephritis, randomized 224 per group.",
      "comparison": "IV belimumab 10 mg/kg versus placebo, both with mycophenolate or cyclophosphamide followed by azathioprine.",
      "endpoint": "Primary: composite primary efficacy renal response at week 104; complete renal response was a secondary endpoint.",
      "result": "Primary response 43% versus 32% (P=0.03); complete response 30% versus 20% (P=0.02).",
      "quote": "more patients who received belimumab plus standard therapy had a primary efficacy renal response than those who received standard therapy alone.",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "These are renal, not isolated cutaneous, outcomes. The comparison is add-on therapy, not belimumab monotherapy. An observed reduction in the renal-event/death composite does not establish a separate mortality benefit.",
      "primaryOutcome": "MET",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    },
    {
      "id": "ctd-proderm",
      "condition": "dm",
      "med": "ivig",
      "trial": "ProDERM",
      "refs": [
        "R11"
      ],
      "claim": "IVIG improved the composite minimal-improvement response in active adult dermatomyositis.",
      "population": "95 adults, randomized 47 IVIG and 48 placebo.",
      "comparison": "IVIG 2 g/kg versus placebo every four weeks for 16 weeks; an extension followed the controlled phase.",
      "endpoint": "Primary: TIS at least 20 at week 16 without confirmed deterioration. Skin activity was a secondary endpoint.",
      "result": "37/47 (79%) versus 21/48 (44%); difference 35 percentage points (95% CI 17 to 53), P<0.001.",
      "quote": "79% of the patients in the IVIG group (37 of 47) and 44% of those in the placebo group (21 of 48)",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "TIS combines six measures; it is not isolated skin, swallowing or ILD efficacy. Creatine kinase did not differ meaningfully. Six related thromboembolic events were reported over 40 weeks: events are not necessarily six distinct patients. The trial does not establish interchangeability of IVIG formulations.",
      "primaryOutcome": "MET",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    },
    {
      "id": "ctd-rim",
      "condition": "dm",
      "med": "ritux",
      "trial": "RIM",
      "refs": [
        "R12"
      ],
      "claim": "RIM did not show a difference between early and delayed rituximab for its primary or secondary endpoints.",
      "population": "200 refractory myositis patients randomized: 76 polymyositis, 76 adult DM and 48 juvenile DM; 195 analyzed.",
      "comparison": "Early versus delayed rituximab in a placebo-phase design; background immunosuppression was permitted.",
      "endpoint": "Primary: time to the preliminary definition of improvement; secondary outcomes included week-8 response and muscle strength.",
      "result": "Median 20.0 versus 20.2 weeks; primary P=0.74. The reported 83% overall response is not a randomized treatment-effect estimate.",
      "quote": "there were no significant differences in the 2 treatment arms for the primary and secondary end points",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "A failed between-group comparison is not proof of no possible benefit. Conversely, pooled improvement after both groups received treatment cannot establish placebo-controlled efficacy, isolated ILD benefit, or equivalence of the regimens.",
      "primaryOutcome": "NOT_MET",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    },
    {
      "id": "ctd-senscis",
      "condition": "ssc",
      "med": "nintedanib",
      "trial": "SENSCIS",
      "refs": [
        "R15"
      ],
      "claim": "Nintedanib slowed FVC decline in SSc-ILD; skin and quality-of-life outcomes did not significantly differ.",
      "population": "576 treated patients with SSc-ILD and at least 10% lung fibrosis; 48.4% used mycophenolate at baseline.",
      "comparison": "Oral nintedanib 150 mg twice daily versus placebo.",
      "endpoint": "Primary: annual FVC decline over 52 weeks; mRSS and SGRQ were key secondary endpoints.",
      "result": "FVC change -52.4 versus -93.3 mL/year; difference 41.0 (95% CI 2.9 to 79.0), P=0.04.",
      "quote": "no clinical benefit of nintedanib was observed for other manifestations of systemic sclerosis.",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "Slower decline is not reversal of fibrosis. Missing-data sensitivity analyses yielded P=0.06 to 0.10. Diarrhea occurred in 75.7% versus 31.6%. This trial does not establish generalized skin or mortality benefit.",
      "primaryOutcome": "MET_WITH_SENSITIVITY_LIMITATION",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    },
    {
      "id": "ctd-desires",
      "condition": "ssc",
      "med": "ritux",
      "trial": "DESIRES",
      "refs": [
        "R17"
      ],
      "claim": "Rituximab improved the primary skin-thickening endpoint in the DESIRES systemic-sclerosis trial.",
      "population": "56 patients randomized at four Japanese hospitals; ages 20-79 and baseline mRSS at least 10.",
      "comparison": "Rituximab 375 mg/m² IV versus placebo weekly for four weeks.",
      "endpoint": "Primary: mRSS change at 24 weeks; analyzed patients received treatment and had an endpoint assessment.",
      "result": "mRSS change -6.30 versus +2.14; difference -8.44 (95% CI -11.00 to -5.88), P<0.0001.",
      "quote": "this is the first clinical trial to show efficacy of rituximab with skin sclerosis as the primary endpoint.",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "This small short-duration skin trial does not establish survival, every-organ efficacy or safety in all SSc populations. Twenty-seven rituximab and 22 placebo recipients completed 24 weeks; attrition and population scope remain relevant.",
      "primaryOutcome": "MET",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    },
    {
      "id": "ctd-sls2",
      "condition": "ssc",
      "med": "mmf",
      "trial": "SLS II",
      "refs": [
        "CT08"
      ],
      "claim": "SLS II did not confirm superior lung efficacy of mycophenolate over oral cyclophosphamide.",
      "population": "142 patients with SSc-ILD randomized; 126 included in the primary analysis.",
      "comparison": "MMF target 1,500 mg twice daily for 24 months versus oral cyclophosphamide 2 mg/kg/day for 12 months followed by placebo for 12 months.",
      "endpoint": "Primary: course of percent-predicted FVC over 24 months.",
      "result": "Between-group primary P=0.24. MMF had fewer withdrawals and less hematologic toxicity.",
      "quote": "the hypothesis that it would have greater efficacy at 24 months than cyclophosphamide was not confirmed.",
      "locator": "Primary publication abstract; methods, results and interpretation",
      "studyDesign": "Randomized double-blind controlled trial",
      "limitations": "Within-group improvements came from a post-hoc analysis and do not establish placebo-controlled efficacy. A nonsignificant superiority comparison is not proof of noninferiority or equivalence. Regimen duration and tolerability differ.",
      "primaryOutcome": "NOT_MET",
      "disposition": "SUPPORTED_WITHIN_ABSTRACT_SCOPE",
      "reviewStatus": "AI_ASSISTED_ABSTRACT_ADJUDICATION",
      "reviewedAt": "2026-09-05",
      "sourceKind": "primary-publication",
      "evidenceAccess": "abstract",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false
    }
  ],
  "publicationHolds": [
    {
      "id": "publication-hold-33971155",
      "sourcePmid": "33971155",
      "condition": "sle",
      "med": "voclosporin",
      "trial": "AURORA 1",
      "refs": [
        "R08"
      ],
      "claim": "Indexed publication corrections require reconciliation before a new independent source-review pass.",
      "reviewStatus": "PUBLICATION_CORRECTION_REVIEW_PENDING",
      "disposition": "NOT_ADJUDICATED",
      "correctionPmids": [
        "34062140"
      ],
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false,
      "caveat": "A correction is not a retraction or proof of a negative result. This holds the source-review disposition; it does not change existing clinical-effect scores or give treatment advice. Correction contents have not been reconciled."
    },
    {
      "id": "publication-hold-32866440",
      "sourcePmid": "32866440",
      "condition": "ssc",
      "med": "toci",
      "trial": "focuSSced",
      "refs": [
        "R16"
      ],
      "claim": "Indexed publication corrections require reconciliation before a new independent source-review pass.",
      "reviewStatus": "PUBLICATION_CORRECTION_REVIEW_PENDING",
      "disposition": "NOT_ADJUDICATED",
      "correctionPmids": [
        "33007286",
        "33667402"
      ],
      "reviewedAt": "2026-09-05",
      "humanApproved": false,
      "clinicallyValidated": false,
      "automaticGraphPromotion": false,
      "caveat": "A correction is not a retraction or proof of a negative result. This holds the source-review disposition; it does not change existing clinical-effect scores or give treatment advice. Correction contents have not been reconciled."
    }
  ]
};
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function install(data) {
    // Validate the whole join before mutating the application's reference index.
    const additions = [];
    for (const ref of packet.references) {
      const existing = data.references.find(r => r.id === ref.id);
      if (existing && (existing.pmid !== ref.pmid || existing.doi.toLowerCase() !== ref.doi.toLowerCase())) {
        throw new Error('Conflicting primary reference identity: ' + ref.id);
      }
      if (!existing) additions.push(ref);
    }
    for (const hold of packet.publicationHolds) {
      if (!hold.refs.every(id => data.references.some(r => r.id === id))) throw new Error('Unresolved publication hold');
    }
    if (data.scopedClaims.some(c => packet.claims.some(n => n.id === c.id))) throw new Error('Duplicate primary-claim installation');
    data.references.push(...additions);
    data.scopedClaims = [...data.scopedClaims, ...packet.claims];
    data.publicationReviewHolds = packet.publicationHolds;
  }
  root.AtlasConnectiveTissueEvidence = Object.freeze({ packet: freeze(packet), install });
})(globalThis);
