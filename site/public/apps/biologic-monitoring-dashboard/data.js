export const CONDITION_LABELS = {
  'asthma': 'Asthma',
  'rheumatoid-arthritis': 'Rheumatoid arthritis',
  'plaque-psoriasis': 'Plaque psoriasis',
  'psoriatic-arthritis': 'Psoriatic arthritis',
  'hidradenitis-suppurativa': 'Hidradenitis suppurativa',
  'crohns-disease': 'Crohn\'s disease',
  'ulcerative-colitis': 'Ulcerative colitis',
  'atopic-dermatitis': 'Atopic dermatitis',
  'prurigo-nodularis': 'Prurigo nodularis',
  'alopecia-areata': 'Alopecia areata',
  'systemic-lupus-erythematosus': 'Systemic lupus erythematosus',
  'cutaneous-lupus': 'Cutaneous lupus',
  'chronic-spontaneous-urticaria': 'Chronic spontaneous urticaria',
  'bullous-pemphigoid': 'Bullous pemphigoid',
  'chronic-obstructive-pulmonary-disease': 'COPD (eosinophilic)',
  'autoimmune-blistering-disease': 'Autoimmune blistering diseases',
  'pemphigus': 'Pemphigus',
  'lupus': 'Lupus',
  'dermatomyositis': 'Dermatomyositis',
  'nodulocystic-acne': 'Nodulocystic acne',
  'erythema-nodosum-leprosum': 'Erythema nodosum leprosum',
  'uveitis-associated': 'Uveitis-associated dermatoses',
  'behcets-disease': 'Behçet\'s disease',
  'pyoderma-gangrenosum': 'Pyoderma gangrenosum',
  'hidradenitis': 'Hidradenitis suppurativa',
  'immunobullous': 'Immunobullous disease'
};

export const REQUIREMENT_LABELS = {
  'tb-screening': 'TB screening',
  'hepatitis-screening': 'Hepatitis B/C screen',
  'hiv-screening': 'HIV screen',
  'cbc-lft': 'CBC & CMP',
  'lipid-panel': 'Lipid panel',
  'pregnancy-monitoring': 'Pregnancy monitoring',
  'ophthalmologic': 'Ophthalmologic exam',
  'neurologic': 'Neurologic exam',
  'psychiatric': 'Psychiatric assessment',
  'dermatologic': 'Skin cancer surveillance',
  'renal-function': 'Renal function labs',
  'blood-pressure': 'Blood pressure',
  'weight-monitoring': 'Weight monitoring',
  'zoster-vaccine': 'Zoster vaccination',
  'vaccination-review': 'Vaccination review',
  'electrolytes': 'Electrolytes',
  'albumin': 'Albumin',
  'tpmt-nudt15': 'TPMT/NUDT15 genotyping',
  'platelet-monitoring': 'Platelet trend',
  'dermatology-consult': 'Dermatology consult',
  'infection-counseling': 'Infection counseling',
  'smoking-assessment': 'Smoking status assessment',
  'chest-imaging': 'Chest imaging',
  'blood-glucose': 'Blood glucose',
  'anthropometrics': 'Height and weight'
};

export const MONITORING_FREQUENCY_LABELS = {
  minimal: 'Minimal (clinical surveillance)',
  moderate: 'Moderate (periodic labs)',
  frequent: 'Frequent (intensive labs)'
};

export const RISK_BADGE_LABELS = {
  'psychiatric': 'Mood / suicidality precaution',
  'pregnancy-monitoring': 'Pregnancy counseling',
  'ophthalmologic': 'Retinal monitoring',
  'boxed-warning': 'Boxed warning',
  'teratogenic': 'Teratogenic',
  'rems': 'REMS program',
  'age-65-plus': '≥65 age concern',
  'pediatric': 'Pediatric use',
  'infection': 'Serious infection risk'
};

function task(id, label, critical = false, notes = '') {
  return { id, label, critical, notes };
}

function schedule(id, timing, description, priority = 'standard', relativeWeeks = null) {
  return { id, timing, description, priority, relativeWeeks };
}

export const monitoringEntries = [
  {
    "id": "tnf-inhibitors",
    "name": "TNF inhibitors",
    "category": "Biologics",
    "agents": [
      "Adalimumab",
      "Infliximab",
      "Etanercept",
      "Certolizumab"
    ],
    "summary": "Anti-TNF therapies require infection/TB assessment and individualized monitoring. Contraindications, clinical uses and laboratory follow-up are agent-specific; class membership does not make these agents interchangeable.",
    "conditions": [
      "plaque-psoriasis",
      "psoriatic-arthritis",
      "hidradenitis-suppurativa",
      "pyoderma-gangrenosum",
      "behcets-disease",
      "uveitis-associated"
    ],
    "monitoringFrequency": "frequent",
    "riskLevel": "high",
    "warningFlags": [
      "boxed-warning",
      "infection"
    ],
    "tags": [
      "tb-screening",
      "hepatitis-screening",
      "hiv-screening",
      "cbc-lft",
      "infection-counseling"
    ],
    "baseline": "CBC with differential, comprehensive metabolic panel (including AST/ALT), hepatitis B and C serologies, HIV screen when indicated, TB testing with IGRA or Mantoux plus chest imaging for risk, and vaccination review before first dose.",
    "monitoring": "Monitor for infection, TB exposure, hepatitis B reactivation, hematologic abnormalities, liver injury and new/worsening heart failure. Determine CBC/liver-test intervals from the selected label, concomitant therapy and local protocol; the historical review is not a current class-wide FDA testing schedule.",
    "cautions": "Boxed warnings for serious infections and malignancy (especially hepatosplenic T-cell lymphoma in young IBD patients); hold therapy for active infection or rapidly rising LFTs/hematologic toxicity; avoid live vaccines once therapy begins.",
    "baselineTasks": [
      {
        "id": "cbc",
        "label": "CBC with differential",
        "critical": true,
        "notes": ""
      },
      {
        "id": "cmp",
        "label": "Comprehensive metabolic panel with AST/ALT",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hbv",
        "label": "Hepatitis B triple panel: HBsAg, total anti-HBc, and anti-HBs",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hcv",
        "label": "Hepatitis C antibody",
        "critical": true,
        "notes": ""
      },
      {
        "id": "tb",
        "label": "TB screening (IGRA preferred) ± chest radiograph",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hiv",
        "label": "HIV test when risk factors present",
        "critical": false,
        "notes": ""
      },
      {
        "id": "vaccines",
        "label": "Update inactivated vaccines; avoid live vaccines after initiation",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "baseline",
        "timing": "Before treatment",
        "description": "Complete agent-specific infection/TB and hepatitis B assessment, vaccination review and indicated laboratory testing.",
        "priority": "critical"
      },
      {
        "id": "followup",
        "timing": "During treatment; frequency individualized",
        "description": "Assess symptoms and exposure risk; monitor CBC/liver tests when indicated by agent, concomitant drugs, risk and local protocol. Monitor HBV carriers during and after therapy with specialist input.",
        "priority": "high"
      }
    ],
    "holdCriteria": [
      "Serious infection or sepsis: stop/hold as directed by the selected label and obtain clinical evaluation.",
      "New/worsening heart failure, significant hematologic abnormality or suspected liver injury: promptly evaluate and follow agent-specific discontinuation instructions.",
      "No shared numeric ANC, platelet or liver-enzyme cutoff is asserted for all TNF inhibitors."
    ],
    "contraindications": "Agent-specific. Infliximab doses >5 mg/kg are contraindicated in moderate/severe heart failure, and prior severe infliximab/component or murine-protein hypersensitivity is a contraindication. Heart failure is a warning/precaution for adalimumab, not a blanket class-wide absolute contraindication. Do not initiate during an active serious infection; evaluate and manage TB/HBV risk before treatment.",
    "interactions": "Avoid live vaccines during therapy; combination immunosuppression increases infection risk—coordinate prophylaxis for hepatitis B carriers.",
    "dosing": "Agents are weight-based or fixed dose per label; no routine dose adjustment for labs but hold for serious infection or cytopenia.",
    "references": [
      {
        "label": "Humira (adalimumab) Prescribing Information",
        "url": "https://www.rxabbvie.com/pdf/humira.pdf"
      },
      {
        "label": "Remicade (infliximab) Prescribing Information",
        "url": "https://www.janssenlabels.com/package-insert/product-monograph/prescribing-information/REMICADE-pi.pdf"
      },
      {
        "label": "Enbrel (etanercept) Prescribing Information",
        "url": "https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/103795s5635lbl.pdf"
      },
      {
        "label": "Cimzia (certolizumab) Prescribing Information",
        "url": "https://www.cimzia.com/sites/default/files/2023-08/CIMZIA_Prescribing_Information.pdf"
      },
      {
        "label": "Emer et al., 2010: historical monitoring review (not a 2025 AAD guideline)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2945861/"
      },
      {
        "label": "CDC: hepatitis B triple-panel screening",
        "url": "https://www.cdc.gov/hepatitis-b/hcp/diagnosis-testing/index.html"
      },
      {
        "label": "Manufacturer: infliximab contraindications and precautions",
        "url": "https://www.infliximab.com/hcp/dosing-and-administration/"
      },
      {
        "label": "Manufacturer: adalimumab safety and heart-failure precautions",
        "url": "https://www.humirapro.com/global-safety"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "HBV triple panel, correct historical reference date, agent-specific heart-failure precautions and removal of unsupported class-wide numeric rules",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    "id": "il17-inhibitors",
    "name": "IL-17 inhibitors",
    "category": "Biologics",
    "agents": [
      "Secukinumab",
      "Ixekizumab",
      "Brodalumab",
      "Bimekizumab"
    ],
    "summary": "Monitoring is agent-specific: assess TB, infection and IBD risk; bimekizumab also requires baseline and periodic liver testing. Brodalumab has a suicidal ideation/behavior boxed warning and REMS.",
    "conditions": [
      "plaque-psoriasis",
      "psoriatic-arthritis",
      "hidradenitis-suppurativa"
    ],
    "monitoringFrequency": "moderate",
    "riskLevel": "moderate",
    "warningFlags": [
      "infection",
      "psychiatric",
      "boxed-warning",
      "rems"
    ],
    "tags": [
      "tb-screening",
      "vaccination-review",
      "infection-counseling",
      "psychiatric",
      "cbc-lft"
    ],
    "baseline": "Evaluate TB and vaccines for the selected agent. Document IBD history: brodalumab is contraindicated in Crohn’s disease; avoid bimekizumab in active IBD. Before bimekizumab, test ALT, AST, alkaline phosphatase and bilirubin. Assess mood/suicidality history, particularly for brodalumab and bimekizumab.",
    "monitoring": "Assess infection, candidiasis and new or worsening IBD symptoms during treatment. Bimekizumab: repeat liver enzymes, alkaline phosphatase and bilirubin periodically according to its label and clinical judgment. Brodalumab: monitor for new/worsening depression or suicidal ideation; comply with SILIQ REMS. Do not generalize a no-laboratory-monitoring statement across this class.",
    "cautions": "Brodalumab carries a boxed warning for suicidal ideation and behavior; depression history is a risk-benefit precaution, not the labeled Crohn’s disease contraindication. Bimekizumab also has a suicidality warning. Avoid live vaccines. Condition tags describe uses of some class members, not approvals for every listed agent.",
    "baselineTasks": [
      {
        "id": "tb",
        "label": "Evaluate for tuberculosis before initiation",
        "critical": true,
        "notes": ""
      },
      {
        "id": "ibd-history",
        "label": "Review IBD history and the selected agent’s restrictions",
        "critical": true,
        "notes": ""
      },
      {
        "id": "vaccines",
        "label": "Review vaccines; avoid live vaccines during treatment",
        "critical": true,
        "notes": ""
      },
      {
        "id": "liver-bime",
        "label": "Bimekizumab: ALT, AST, alkaline phosphatase and bilirubin",
        "critical": true,
        "notes": ""
      },
      {
        "id": "psych-eval",
        "label": "Assess depression/suicidality history and counsel on symptoms",
        "critical": true,
        "notes": ""
      },
      {
        "id": "rems",
        "label": "Brodalumab: verify SILIQ REMS requirements",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "baseline",
        "timing": "Before initiation",
        "description": "Agent-specific screening and precautions above",
        "priority": "critical",
        "relativeWeeks": 0
      },
      {
        "id": "liver-bime",
        "timing": "Periodically: bimekizumab",
        "description": "Repeat ALT, AST, alkaline phosphatase and bilirubin; investigate suspected liver injury",
        "priority": "high",
        "relativeWeeks": null
      },
      {
        "id": "clinical",
        "timing": "During treatment",
        "description": "Assess infection, candidiasis, IBD symptoms and mood changes",
        "priority": "standard",
        "relativeWeeks": null
      }
    ],
    "holdCriteria": [
      "Serious infection: follow the selected agent’s interruption instructions.",
      "Bimekizumab: interrupt for suspected drug-induced liver injury until excluded; discontinue if causally associated liver injury is confirmed.",
      "Bimekizumab: discontinue for new or worsening IBD. Brodalumab: discontinue if Crohn’s disease develops.",
      "Emergent suicidal ideation requires urgent assessment and an individualized treatment decision."
    ],
    "contraindications": "Brodalumab: Crohn’s disease and clinically significant hypersensitivity to the product. Other agents have their own hypersensitivity restrictions and IBD precautions; consult the specific label.",
    "interactions": "Avoid live vaccines; caution with other immunosuppressants increasing infection risk.",
    "dosing": "Select the specific agent, indication, age and regimen using its current prescribing information; class members are not interchangeable.",
    "references": [
      {
        "label": "SILIQ: U.S. prescribing and boxed-warning information",
        "url": "https://www.siliq.com/hcp/"
      },
      {
        "label": "BIMZELX: U.S. safety and prescribing information",
        "url": "https://www.bimzelxhcp.com/"
      },
      {
        "label": "Cosentyx prescribing information",
        "url": "https://www.novartis.com/us-en/sites/novartis_us/files/cosentyx.pdf"
      },
      {
        "label": "Taltz prescribing information",
        "url": "https://uspl.lilly.com/taltz/taltz.html#pi"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "IBD treatment-filter exclusion, brodalumab contraindication/boxed warning, and bimekizumab liver and mood precautions",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    "id": "il23-inhibitors",
    "name": "IL-23 inhibitors",
    "category": "Biologics",
    "agents": [
      "Guselkumab",
      "Risankizumab",
      "Tildrakizumab",
      "Mirikizumab"
    ],
    "summary": "Liver monitoring depends on the agent and indication. An induction monitoring period is not an instruction to test only once every 12, 16 or 24 weeks.",
    "conditions": [
      "plaque-psoriasis",
      "psoriatic-arthritis",
      "crohns-disease",
      "ulcerative-colitis"
    ],
    "monitoringFrequency": "moderate",
    "riskLevel": "low",
    "warningFlags": [],
    "tags": [
      "tb-screening",
      "vaccination-review",
      "cbc-lft"
    ],
    "baseline": "Evaluate TB and vaccination status. For guselkumab or risankizumab in IBD, and for mirikizumab, obtain liver enzymes and bilirubin at baseline. For guselkumab in psoriasis/PsA, assess liver tests at baseline and periodically if clinically indicated.",
    "monitoring": "Guselkumab in Crohn’s disease/UC: monitor liver enzymes and bilirubin for at least the first 16 weeks, then periodically according to routine management. Risankizumab in Crohn’s disease/UC: monitor during induction (at least 12 weeks), then according to routine management. Mirikizumab: monitor for at least the first 24 weeks, then according to routine management. These are monitoring windows, not fixed testing intervals. Use the selected agent’s current label and clinical context.",
    "cautions": "The class listing pools different indications: tildrakizumab is not an IBD treatment, and mirikizumab is not a psoriasis treatment. Do not infer a shared regimen or universal approval from condition tags. Investigate suspected drug-induced liver injury and follow the specific label.",
    "baselineTasks": [
      {
        "id": "tb",
        "label": "Evaluate for TB",
        "critical": true,
        "notes": ""
      },
      {
        "id": "vaccines",
        "label": "Review vaccines and avoid live vaccines during treatment",
        "critical": true,
        "notes": ""
      },
      {
        "id": "lfts",
        "label": "Agent/indication-specific liver enzymes and bilirubin",
        "critical": true,
        "notes": "Required before IBD treatment with guselkumab, risankizumab or mirikizumab; guselkumab psoriasis/PsA testing if clinically indicated."
      }
    ],
    "monitoringSchedule": [
      {
        "id": "baseline",
        "timing": "Before initiation",
        "description": "TB, vaccines, and agent/indication-specific liver tests",
        "priority": "critical",
        "relativeWeeks": 0
      },
      {
        "id": "guselkumab",
        "timing": "Guselkumab, IBD: first 16 weeks or longer",
        "description": "Monitor liver enzymes and bilirubin throughout this period; then periodically per routine management",
        "priority": "high",
        "relativeWeeks": null
      },
      {
        "id": "risankizumab",
        "timing": "Risankizumab, IBD: induction (at least 12 weeks)",
        "description": "Monitor liver enzymes and bilirubin during induction; then per routine management",
        "priority": "high",
        "relativeWeeks": null
      },
      {
        "id": "mirikizumab",
        "timing": "Mirikizumab: first 24 weeks or longer",
        "description": "Monitor liver enzymes and bilirubin throughout this period; then per routine management",
        "priority": "high",
        "relativeWeeks": null
      },
      {
        "id": "guselkumab-derm",
        "timing": "Guselkumab, psoriasis/PsA: if clinically indicated",
        "description": "Liver enzymes and bilirubin at baseline and periodically",
        "priority": "standard",
        "relativeWeeks": null
      }
    ],
    "holdCriteria": [
      "Serious infection or suspected active TB: follow agent-specific instructions.",
      "Suspected drug-induced liver injury: investigate promptly and interrupt treatment according to the selected agent’s label; do not apply an invented class-wide laboratory threshold."
    ],
    "contraindications": "Clinically significant hypersensitivity restrictions are agent-specific. Active serious infection and liver disease require assessment under the specific warnings and precautions.",
    "interactions": "Avoid live vaccines.",
    "dosing": "Use agent- and indication-specific dosing; do not convert the monitoring windows above into injection or laboratory schedules.",
    "references": [
      {
        "label": "Tremfya: U.S. safety and prescribing information",
        "url": "https://www.tremfyahcp.com/"
      },
      {
        "label": "Skyrizi prescribing information",
        "url": "https://www.rxabbvie.com/pdf/skyrizi_pi.pdf"
      },
      {
        "label": "Ilumya prescribing information",
        "url": "https://www.ilumya.com/pdf/prescribing-information.pdf"
      },
      {
        "label": "Omvoh: U.S. safety and prescribing information",
        "url": "https://omvoh.lilly.com/hcp/"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "Separate guselkumab, risankizumab and mirikizumab liver-monitoring periods from testing intervals",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    id: 'ustekinumab',
    name: 'IL-12/23 inhibitor: Ustekinumab',
    category: 'Biologics',
    agents: ['Ustekinumab'],
    summary: 'Ustekinumab requires baseline CBC/CMP and periodic labs q3–6 months to detect rare cytopenia or hepatotoxicity, plus TB and hepatitis screening.',
    conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'crohns-disease', 'ulcerative-colitis'],
    monitoringFrequency: 'moderate',
    riskLevel: 'moderate',
    warningFlags: ['infection'],
    tags: ['tb-screening', 'hepatitis-screening', 'cbc-lft', 'dermatologic'],
    baseline: 'Obtain CBC, comprehensive metabolic panel (including bilirubin), hepatitis B/C serologies, and TB screening prior to initiation; review cancer history and update vaccines.',
    monitoring: 'Repeat CBC and CMP every 3–6 months; perform annual TB and hepatitis screening in high-risk patients and arrange yearly skin exams for non-melanoma skin cancer risk.',
    cautions: 'Monitor for infection and malignancy; avoid live vaccines during therapy.',
    baselineTasks: [
      task('cbc', 'CBC with differential', true),
      task('cmp', 'Comprehensive metabolic panel with bilirubin', true),
      task('hbv', 'Hepatitis B serologies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('tb', 'TB screening', true),
      task('vaccines', 'Update vaccinations; avoid live vaccines after starting', true)
    ],
    monitoringSchedule: [
      schedule('baseline', 'Baseline', 'CBC/CMP, hepatitis panel, TB screen', 'critical', 0),
      schedule('q3months', 'Every 3–6 months', 'CBC and CMP; assess infection and malignancy risk', 'high', 24),
      schedule('annual', 'Annually (risk-based)', 'Repeat TB/hepatitis screening if high risk; dermatologic skin exam', 'standard', 52)
    ],
    holdCriteria: [
      'Persistent leukopenia or thrombocytopenia',
      'ALT/AST >3 × ULN or bilirubin elevation',
      'Serious infection'
    ],
    contraindications: 'Clinically significant active infection.',
    interactions: 'Avoid live vaccines.',
    dosing: 'Weight-based SC dosing for psoriasis; IV induction for Crohn’s/UC followed by SC maintenance.',
    references: [
      { label: 'Stelara (ustekinumab) Prescribing Information', url: 'https://www.janssenlabels.com/package-insert/product-monograph/prescribing-information/STELARA-pi.pdf' },
      { label: 'AAD Psoriasis Guidelines', url: 'https://www.aad.org/member/clinical-quality/guidelines/psoriasis' }
    ]
  },
  {
    id: 'il4-13-blockers',
    name: 'IL-4/13 pathway blockers',
    category: 'Biologics',
    agents: ['Dupilumab', 'Tralokinumab', 'Lebrikizumab'],
    summary: 'Dupilumab family biologics require no routine labs but now include 2024–2025 indications for CSU, bullous pemphigoid, and pediatric atopic dermatitis.',
    conditions: ['atopic-dermatitis', 'chronic-spontaneous-urticaria', 'bullous-pemphigoid', 'chronic-obstructive-pulmonary-disease'],
    monitoringFrequency: 'minimal',
    riskLevel: 'low',
    warningFlags: ['pediatric'],
    tags: ['vaccination-review', 'infection-counseling'],
    baseline: 'No routine lab monitoring required; treat helminth infections before initiation and verify immunizations are current; review ocular history.',
    monitoring: 'Clinical surveillance for conjunctivitis/keratitis, eosinophilia, and arthralgia; refer to ophthalmology for persistent ocular symptoms.',
    cautions: 'Avoid live vaccines; if helminth infection develops and fails treatment, hold therapy until resolved; monitor for new joint pain or eosinophilic pneumonitis.',
    baselineTasks: [
      task('helminth', 'Treat helminth infections before starting', true),
      task('vaccines', 'Confirm routine vaccines; avoid live vaccines after initiation', true),
      task('ocular', 'Review ocular history and counsel on conjunctivitis risk')
    ],
    monitoringSchedule: [
      schedule('baseline', 'Baseline', 'Patient education on ocular symptoms and helminths', 'critical', 0),
      schedule('month1', 'Week 4', 'Assess for conjunctivitis, keratitis, arthralgia', 'standard', 4),
      schedule('quarterly', 'Every 3–6 months', 'Continue ocular and eosinophil symptom review', 'standard', 24)
    ],
    holdCriteria: [
      'Persistent severe conjunctivitis or keratitis requiring specialist intervention',
      'Helminth infection that does not respond to therapy'
    ],
    contraindications: 'Known hypersensitivity to formulation components.',
    interactions: 'Avoid live vaccines; minimal CYP interactions.',
    dosing: 'Dupilumab includes pediatric dosing ≥6 months for AD, CSU approval April 2025, bullous pemphigoid approval June 2025; lebrikizumab approved September 2024 ≥12 years.',
    references: [
      { label: 'Dupixent (dupilumab) Prescribing Information', url: 'https://www.regeneron.com/downloads/dupixent_fpi.pdf' },
      { label: 'Adbry (tralokinumab-ldrm) Prescribing Information', url: 'https://www.adbryhcp.com/sites/default/files/2023-10/adbry-uspi.pdf' },
      { label: 'Ebglyss (lebrikizumab-lylb) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/761325s000lbl.pdf' },
      { label: 'AAD 2024 Atopic Dermatitis Guidelines', url: 'https://www.ajmc.com/view/monoclonal-antibodies-and-jak-inhibitors-in-atopic-dermatitis-management-2024-guidelines-and-managed-care-considerations' }
    ]
  },
  {
    id: 'il31-antagonist',
    name: 'IL-31 receptor antagonist',
    category: 'Biologics',
    agents: ['Nemolizumab'],
    summary: 'Nemolizumab (2024–2025 approvals) requires vaccination review only; monitor clinically for hypersensitivity.',
    conditions: ['prurigo-nodularis', 'atopic-dermatitis'],
    monitoringFrequency: 'minimal',
    riskLevel: 'low',
    warningFlags: ['pediatric'],
    tags: ['vaccination-review', 'infection-counseling'],
    baseline: 'Ensure routine vaccinations are complete prior to initiation and avoid live vaccines once therapy begins.',
    monitoring: 'No scheduled labs; observe for immediate hypersensitivity reactions at each visit.',
    cautions: 'Discontinue permanently for hypersensitivity; use alongside topical corticosteroids/calcineurin inhibitors per label; dual-chamber pen requires use within 4 hours of reconstitution.',
    baselineTasks: [
      task('vaccines', 'Confirm age-appropriate vaccinations', true),
      task('education', 'Educate on injection technique and hypersensitivity signs', true)
    ],
    monitoringSchedule: [
      schedule('baseline', 'Baseline', 'Vaccination check and patient counseling', 'critical', 0),
      schedule('followup', 'Every visit', 'Assess for hypersensitivity reactions', 'standard', 12)
    ],
    holdCriteria: ['Hypersensitivity or anaphylaxis symptoms'],
    contraindications: 'Severe hypersensitivity to nemolizumab.',
    interactions: 'Avoid live vaccines; otherwise minimal drug interactions.',
    dosing: 'FDA approvals: Prurigo nodularis (Aug 2024 adults) and atopic dermatitis (Dec 2024 ≥12 years).',
    references: [
      { label: 'Nemlouvio (nemolizumab-ilto) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/761331s000lbl.pdf' },
      { label: 'VA Nemolizumab Monograph 2025', url: 'https://www.va.gov/formularyadvisor/DOC_PDF/MON_Nemolizumab-ilto_NEMLUVIO_in_Atopic_Dermatitis_Monograph_Jun_2025.pdf' }
    ]
  },
  {
    id: 'omalizumab',
    name: 'Anti-IgE monoclonal antibody',
    category: 'Biologics',
    agents: ['Omalizumab'],
    summary: 'Omalizumab features a boxed warning for anaphylaxis; observation times must be explicit for the first three injections.',
    conditions: ['chronic-spontaneous-urticaria', 'asthma'],
    monitoringFrequency: 'minimal',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'infection'],
    tags: ['infection-counseling'],
    baseline: 'No routine labs needed; prepare anaphylaxis management plan and have emergency medications available.',
    monitoring: 'Observe patients for two hours after each of the first three injections and for at least 30 minutes for subsequent injections.',
    cautions: 'Boxed warning for anaphylaxis; patients require auto-injectable epinephrine and education on delayed reactions.',
    baselineTasks: [
      task('anaphylaxis-plan', 'Establish anaphylaxis plan and emergency kit', true),
      task('education', 'Educate on signs of anaphylaxis and delayed reactions', true)
    ],
    monitoringSchedule: [
      schedule('dose1-3', 'First 3 doses', 'Monitor in clinic for ≥2 hours post-injection', 'critical', 0),
      schedule('maintenance', 'Subsequent doses', 'Observe for ≥30 minutes post-injection', 'high', 4)
    ],
    holdCriteria: ['Any episode of anaphylaxis until risk stratified'],
    contraindications: 'Severe hypersensitivity to omalizumab.',
    interactions: 'None clinically significant; avoid concomitant therapy that may blunt response to anaphylaxis treatment.',
    dosing: 'Fixed dosing based on weight/IgE for asthma; fixed 150–300 mg q4w for CSU.',
    references: [
      { label: 'Xolair (omalizumab) Prescribing Information', url: 'https://www.gene.com/download/pdf/xolair_prescribing.pdf' },
      { label: 'Omalizumab Anaphylaxis Guidance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3006370/' }
    ]
  },
  {
    id: 'anifrolumab',
    name: 'Type I interferon receptor antagonist',
    category: 'Biologics',
    agents: ['Anifrolumab'],
    summary: 'Anifrolumab for SLE requires TB/hepatitis screening and zoster vaccination review with optional baseline labs for infusion safety.',
    conditions: ['systemic-lupus-erythematosus', 'cutaneous-lupus'],
    monitoringFrequency: 'moderate',
    riskLevel: 'moderate',
    warningFlags: ['infection'],
    tags: ['tb-screening', 'hepatitis-screening', 'zoster-vaccine', 'cbc-lft', 'infection-counseling'],
    baseline: 'Screen for latent TB and hepatitis B/C; ensure recombinant zoster vaccine is updated; consider baseline CBC and CMP.',
    monitoring: 'Monitor for infusion reactions during/after each infusion, assess for recurrent infections and herpes zoster reactivation; perform periodic CBC/LFTs every 3–6 months if risk factors.',
    cautions: 'Increased risk of herpes-zoster reactivation; consider antiviral prophylaxis in high-risk patients.',
    baselineTasks: [
      task('tb', 'TB screening', true),
      task('hbv', 'Hepatitis B surface antigen/core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('zoster', 'Verify zoster vaccine status', true),
      task('cbc', 'CBC and CMP baseline (prudent)'),
      task('vaccines', 'Update routine vaccines; avoid live vaccines after starting', true)
    ],
    monitoringSchedule: [
      schedule('infusion', 'Each infusion', 'Monitor for infusion reactions and vital signs', 'critical', 0),
      schedule('quarterly', 'Every 3–6 months', 'CBC, LFTs, assess infections and herpes zoster history', 'standard', 24)
    ],
    holdCriteria: ['Serious infection or uncontrolled herpes zoster reactivation'],
    contraindications: 'Active serious infection.',
    interactions: 'Avoid live vaccines; immunosuppressive synergy with other biologics.',
    dosing: '300 mg IV every 4 weeks for SLE.',
    references: [
      { label: 'Saphnelo (anifrolumab-fnia) Prescribing Information', url: 'https://www.azpicentral.com/saphnelo/saphnelo.pdf' },
      { label: 'Anifrolumab Safety Review', url: 'https://pubmed.ncbi.nlm.nih.gov/39245905/' }
    ]
  },
  {
    id: 'upadacitinib',
    name: 'Upadacitinib (JAK1)',
    category: 'Targeted',
    agents: ['Upadacitinib'],
    summary: 'Upadacitinib carries boxed warnings for MACE, thrombosis, malignancy, and serious infection with 2024 requirements for ≥65-year risk stratification and smoking status documentation.',
    conditions: ['atopic-dermatitis', 'psoriatic-arthritis', 'rheumatoid-arthritis'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'age-65-plus', 'infection'],
    tags: ['cbc-lft', 'lipid-panel', 'tb-screening', 'hepatitis-screening', 'pregnancy-monitoring', 'smoking-assessment'],
    baseline: 'Obtain CBC with differential, liver enzymes, fasting lipid panel, TB and hepatitis B/C screening, and pregnancy test when applicable; document age ≥65 risk factors and smoking history.',
    monitoring: 'Repeat CBC and liver enzymes at 8–12 weeks, lipid panel at 12 weeks, then labs every 3–6 months; increase monitoring frequency for adults ≥65 or current/past smokers and hold per cytopenia thresholds (ANC <1.0, ALC <0.5, Hb <8 g/dL).',
    cautions: 'Boxed warnings for serious infection, malignancy, thrombosis, and major adverse cardiovascular events; avoid use in patients with high CV risk when alternatives exist.',
    baselineTasks: [
      task('cbc', 'CBC with differential', true),
      task('lfts', 'AST/ALT and bilirubin', true),
      task('lipids', 'Fasting lipid panel', true),
      task('tb', 'TB screening', true),
      task('hbv', 'Hepatitis B surface antigen/core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('pregnancy', 'Pregnancy test if applicable', true),
      task('smoking', 'Document smoking history and CV risk factors', true)
    ],
    monitoringSchedule: [
      schedule('week8', 'Week 8–12', 'CBC with differential and liver enzymes', 'critical', 12),
      schedule('week12', 'Week 12', 'Fasting lipid panel', 'high', 12),
      schedule('quarterly', 'Every 3–6 months', 'CBC/LFTs; assess CV/thrombotic risk; monitor lipids per guidelines', 'high', 24)
    ],
    holdCriteria: [
      'Absolute neutrophil count <1.0 × 10^3/µL',
      'Absolute lymphocyte count <0.5 × 10^3/µL',
      'Hemoglobin <8 g/dL',
      'Serious infection or thrombosis'
    ],
    contraindications: 'Avoid initiation in patients with active serious infection; use caution if history of thrombosis or malignancy.',
    interactions: 'Avoid strong CYP3A inducers; live vaccines contraindicated.',
    dosing: '15 mg PO daily for atopic dermatitis; consider lowest effective dose in adults ≥65 years.',
    references: [
      { label: 'Rinvoq (upadacitinib) Prescribing Information', url: 'https://www.rxabbvie.com/pdf/rinvoq_pi.pdf' },
      { label: '2024 JAK Monitoring Review', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11393246/' }
    ]
  },
  {
    "id": "abrocitinib",
    "name": "Abrocitinib (JAK1)",
    "category": "Targeted",
    "agents": [
      "Abrocitinib"
    ],
    "summary": "Check CBC at baseline, 4 weeks after initiation, and 4 weeks after dose increases. Check lipids at approximately 4 weeks, not week 12. Review the first-3-month antiplatelet contraindication.",
    "conditions": [
      "atopic-dermatitis"
    ],
    "monitoringFrequency": "frequent",
    "riskLevel": "high",
    "warningFlags": [
      "boxed-warning",
      "age-65-plus",
      "infection"
    ],
    "tags": [
      "cbc-lft",
      "platelet-monitoring",
      "lipid-panel",
      "tb-screening",
      "hepatitis-screening",
      "smoking-assessment"
    ],
    "baseline": "Obtain CBC, evaluate TB and viral hepatitis, review vaccines, renal function, pregnancy considerations and cardiovascular/thrombotic/malignancy risks. Do not initiate with platelets <150,000/µL, ALC <500/µL, ANC <1,000/µL or hemoglobin <8 g/dL. Select dose using renal function and interacting medicines.",
    "monitoring": "CBC at 4 weeks after initiation and 4 weeks after each dosage increase; evaluate thereafter according to routine patient management. Lipid parameters approximately 4 weeks after initiation, then manage under hyperlipidemia guidelines. Assess infection, thrombosis and other JAK-class risks. In patients with diabetes, monitor glucose closely because hypoglycemia has been reported.",
    "cautions": "Boxed warnings include serious infection, mortality, malignancy, major adverse cardiovascular events and thrombosis. A CBC includes platelets, neutrophils, lymphocytes and hemoglobin; platelet-only checks are insufficient. Glucose-lowering medication may need adjustment for hypoglycemia under clinician supervision.",
    "baselineTasks": [
      {
        "id": "cbc",
        "label": "CBC with differential, hemoglobin and platelets",
        "critical": true,
        "notes": "Do not initiate below the baseline thresholds in the summary."
      },
      {
        "id": "renal",
        "label": "Assess renal function and dose restrictions",
        "critical": true,
        "notes": ""
      },
      {
        "id": "tb",
        "label": "TB evaluation",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hbv",
        "label": "Hepatitis B triple panel: HBsAg, total anti-HBc, and anti-HBs",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hcv",
        "label": "Screen for hepatitis C under clinical guidelines",
        "critical": true,
        "notes": ""
      },
      {
        "id": "vaccines",
        "label": "Review vaccines, including zoster where appropriate",
        "critical": true,
        "notes": ""
      },
      {
        "id": "antiplatelets",
        "label": "Review antiplatelet medicines before initiation",
        "critical": true,
        "notes": "Contraindicated in first 3 months except aspirin ≤81 mg/day."
      },
      {
        "id": "risks",
        "label": "Review cardiovascular, thrombotic, malignancy, pregnancy and diabetes risks",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "baseline",
        "timing": "Before initiation",
        "description": "CBC with platelets; TB/hepatitis, vaccines, renal function and medication review",
        "priority": "critical",
        "relativeWeeks": 0
      },
      {
        "id": "week4",
        "timing": "Approximately week 4",
        "description": "CBC and lipid parameters",
        "priority": "critical",
        "relativeWeeks": 4
      },
      {
        "id": "dose-increase",
        "timing": "4 weeks after each dosage increase",
        "description": "Repeat CBC; this is not a universal week-8 visit",
        "priority": "critical",
        "relativeWeeks": null
      },
      {
        "id": "ongoing",
        "timing": "Ongoing, individualized",
        "description": "CBC per routine management; manage lipids per guidelines and monitor adverse effects",
        "priority": "high",
        "relativeWeeks": null
      }
    ],
    "holdCriteria": [
      "Platelets <50,000/µL: discontinue and follow CBC until platelets are >100,000/µL.",
      "ALC <500/µL, ANC <1,000/µL or hemoglobin <8 g/dL: temporarily interrupt and follow label criteria for restarting.",
      "Serious/opportunistic infection or thrombosis symptoms: follow urgent evaluation and interruption/discontinuation instructions in the label."
    ],
    "contraindications": "Concomitant antiplatelet therapy during the first 3 months is contraindicated, except low-dose aspirin ≤81 mg/day. Severe hepatic impairment, severe renal impairment and active serious infection are separate label restrictions/precautions.",
    "interactions": "Strong CYP2C19 inhibitors require dose reduction, not blanket avoidance. Avoid moderate/strong inhibitors of both CYP2C19 and CYP2C9 and moderate/strong CYP2C19 or CYP2C9 inducers per label. Review P-gp/CYP2C19 substrates and all antiplatelet drugs; avoid live vaccines. This is not a complete interaction list.",
    "dosing": "Usual starting dose 100 mg once daily; 200 mg may be used for inadequate response. Renal impairment, CYP2C19 metabolizer status and inhibitors can require 50/100 mg regimens; use the current label rather than age alone.",
    "references": [
      {
        "label": "CIBINQO U.S. prescribing information (Pfizer; sections 2, 4, 5 and 7)",
        "url": "https://labeling.pfizer.com/ShowLabeling.aspx?id=16652"
      },
      {
        "label": "CDC: hepatitis B triple-panel screening",
        "url": "https://www.cdc.gov/hepatitis-b/hcp/diagnosis-testing/index.html"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "U.S. label: CBC/lipid timing, baseline thresholds, antiplatelet contraindication, CYP/renal dose caveats and hypoglycemia warning",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    id: 'baricitinib',
    name: 'Baricitinib (JAK1/2)',
    category: 'Targeted',
    agents: ['Baricitinib'],
    summary: 'Baricitinib shares boxed warnings with class, requires baseline labs, thresholds for initiation, and 12-week lipid checks.',
    conditions: ['alopecia-areata', 'atopic-dermatitis', 'rheumatoid-arthritis'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'age-65-plus', 'infection'],
    tags: ['cbc-lft', 'lipid-panel', 'tb-screening', 'hepatitis-screening', 'smoking-assessment'],
    baseline: 'CBC with differential, liver enzymes, fasting lipids, TB and hepatitis B/C screening; avoid initiation if ANC <1000/mm³, ALC <500/mm³, or hemoglobin <8 g/dL.',
    monitoring: 'Repeat CBC/LFTs at 8–12 weeks and quarterly thereafter; lipid panel at 12 weeks; monitor for thrombosis, MACE, and malignancy, with intensified surveillance ≥65 years.',
    cautions: 'Boxed warnings for infection, MACE, malignancy, thrombosis; risk increases in older adults and smokers.',
    baselineTasks: [
      task('cbc', 'CBC with differential (ANC ≥1000, ALC ≥500, Hb ≥8 g/dL required)', true),
      task('lfts', 'AST/ALT and bilirubin', true),
      task('lipids', 'Fasting lipid panel', true),
      task('tb', 'TB screening', true),
      task('hbv', 'Hepatitis B surface antigen or core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('pregnancy', 'Pregnancy test if applicable'),
      task('smoking', 'Assess smoking and CV risk', true)
    ],
    monitoringSchedule: [
      schedule('week8', 'Week 8–12', 'CBC with differential, AST/ALT', 'critical', 12),
      schedule('week12', 'Week 12', 'Fasting lipid panel', 'high', 12),
      schedule('quarterly', 'Every 3 months', 'CBC/LFTs; assess thrombosis and infection risk', 'high', 24)
    ],
    holdCriteria: ['ANC <1000/mm³', 'ALC <500/mm³', 'Hemoglobin <8 g/dL', 'Serious infection or thrombosis'],
    contraindications: 'Active serious infection; avoid in severe hepatic impairment.',
    interactions: 'Adjust with strong OAT3 inhibitors; avoid live vaccines.',
    dosing: '2 mg PO daily for alopecia areata; reduce or avoid higher doses in adults ≥65 years with risk factors.',
    references: [
      { label: 'Olumiant (baricitinib) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/207924s006lbl.pdf' }
    ]
  },
  {
    id: 'ritlecitinib',
    name: 'Ritlecitinib (JAK3/TEC)',
    category: 'Targeted',
    agents: ['Ritlecitinib'],
    summary: 'First JAK inhibitor approved for adolescent alopecia areata (≥12 years); requires 4-week ALC/platelet check and ongoing skin cancer surveillance.',
    conditions: ['alopecia-areata'],
    monitoringFrequency: 'moderate',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'pediatric', 'infection'],
    tags: ['cbc-lft', 'platelet-monitoring', 'tb-screening', 'hepatitis-screening', 'dermatologic', 'smoking-assessment'],
    baseline: 'Screen for TB and hepatitis B/C; obtain CBC with differential focusing on ALC and platelets (do not initiate if ALC <500/mm³ or platelets <100,000/mm³); evaluate liver enzymes; update immunizations and perform pregnancy test if applicable.',
    monitoring: 'Repeat ALC and platelet counts at week 4, then follow standard CBC/LFT schedule every 3 months; perform dermatologic exams periodically for skin cancer risk; monitor lipids based on risk.',
    cautions: 'Boxed warnings for serious infection, malignancy, thrombosis; counsel adolescents on contraception and malignancy signs.',
    baselineTasks: [
      task('cbc', 'CBC with differential (ALC ≥500/mm³, platelets ≥100k required)', true),
      task('lfts', 'AST/ALT baseline', true),
      task('tb', 'TB screening', true),
      task('hbv', 'Hepatitis B surface antigen or core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('vaccines', 'Update immunizations; avoid live vaccines during therapy', true),
      task('pregnancy', 'Pregnancy test if applicable', true)
    ],
    monitoringSchedule: [
      schedule('week4', 'Week 4', 'ALC and platelet count', 'critical', 4),
      schedule('quarterly', 'Every 3 months', 'CBC/LFTs; dermatologic exam annually; infection monitoring', 'high', 12)
    ],
    holdCriteria: ['ALC <500/mm³', 'Platelet count <50,000/mm³', 'Serious infection'],
    contraindications: 'Active serious infection; baseline cytopenia below thresholds.',
    interactions: 'Avoid strong CYP3A inducers; live vaccines contraindicated.',
    dosing: '50 mg PO daily for alopecia areata; counsel on contraception.',
    references: [
      { label: 'Litfulo (ritlecitinib) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/215830s000lbl.pdf' }
    ]
  },
  {
    id: 'deucravacitinib',
    name: 'Deucravacitinib (TYK2)',
    category: 'Targeted',
    agents: ['Deucravacitinib'],
    summary: 'TYK2 inhibitor without boxed warnings but requires baseline triglycerides and optional CPK with symptom-directed monitoring.',
    conditions: ['plaque-psoriasis'],
    monitoringFrequency: 'moderate',
    riskLevel: 'moderate',
    warningFlags: ['infection'],
    tags: ['tb-screening', 'hepatitis-screening', 'lipid-panel', 'cbc-lft'],
    baseline: 'Screen for TB and hepatitis B/C, update immunizations, obtain fasting triglycerides and liver enzymes; consider baseline CPK.',
    monitoring: 'Monitor triglycerides per hyperlipidemia guidelines, liver enzymes in those with hepatic disease, and check CPK if muscle symptoms occur; periodic CBC optional based on risk.',
    cautions: 'Risk of elevated triglycerides and rare rhabdomyolysis; counsel on infection symptoms.',
    baselineTasks: [
      task('tb', 'TB screening', true),
      task('hbv', 'Hepatitis B surface antigen or core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('vaccines', 'Update immunizations; avoid live vaccines during therapy', true),
      task('triglycerides', 'Fasting triglycerides and lipid panel', true),
      task('lfts', 'Liver enzymes', true),
      task('cpk', 'Baseline CPK (optional)')
    ],
    monitoringSchedule: [
      schedule('week12', 'Every 12 weeks', 'Triglycerides and liver enzymes (risk-based)', 'standard', 12),
      schedule('symptoms', 'As needed', 'Check CPK if myopathy symptoms', 'standard', null)
    ],
    holdCriteria: ['Symptomatic rhabdomyolysis', 'Serious infection'],
    contraindications: 'Severe hepatic impairment not studied; active serious infection.',
    interactions: 'Minimal CYP involvement; avoid live vaccines.',
    dosing: '6 mg PO daily for moderate-to-severe plaque psoriasis.',
    references: [
      { label: 'Sotyktu (deucravacitinib) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/214353s000lbl.pdf' },
      { label: 'SOTYKTU VA Monograph', url: 'https://www.va.gov/formularyadvisor/DOC_PDF/MON_Deucravacitinib_SOTYKTU_in_Plaque_Psoriasis_Monograph_Apr_2023.pdf' }
    ]
  },
  {
    "id": "apremilast",
    "name": "Apremilast (PDE4)",
    "category": "Targeted",
    "agents": [
      "Apremilast"
    ],
    "summary": "PDE4 inhibitor: monitor weight, mood and gastrointestinal tolerance. Routine laboratory monitoring is not required by the U.S. label; renal function matters for dosing.",
    "conditions": [
      "plaque-psoriasis",
      "psoriatic-arthritis",
      "behcets-disease"
    ],
    "monitoringFrequency": "minimal",
    "riskLevel": "low",
    "warningFlags": [
      "pediatric"
    ],
    "tags": [
      "weight-monitoring",
      "psychiatric"
    ],
    "baseline": "Document baseline weight and mental health history; no routine labs required.",
    "monitoring": "Monitor weight regularly and assess mood and gastrointestinal symptoms. Unexplained or clinically significant weight loss warrants evaluation and consideration of discontinuation; do not wait for an arbitrary 10% loss.",
    "cautions": "Assess risks and benefits with a history of depression or suicidality; new mood symptoms require prompt evaluation. Severe diarrhea, nausea or vomiting may require dose reduction or suspension. Indications and age/weight eligibility depend on formulation and current label.",
    "baselineTasks": [
      {
        "id": "weight",
        "label": "Record baseline weight",
        "critical": true,
        "notes": ""
      },
      {
        "id": "mood",
        "label": "Screen for depression or suicidal ideation",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "clinical",
        "timing": "Regularly during treatment",
        "description": "Monitor weight, mood and gastrointestinal symptoms; investigate clinically significant changes",
        "priority": "standard",
        "relativeWeeks": null
      }
    ],
    "holdCriteria": [
      "Unexplained or clinically significant weight loss: evaluate and consider discontinuation.",
      "New or worsening depression or suicidal thoughts: promptly assess risks/benefits and obtain urgent help when indicated.",
      "Severe gastrointestinal symptoms or hypersensitivity: follow the label’s interruption/discontinuation instructions."
    ],
    "contraindications": "Known hypersensitivity to apremilast or product excipients. Depression is a warning requiring individualized assessment, not a blanket labeled contraindication.",
    "interactions": "Avoid strong CYP inducers reducing exposure.",
    "dosing": "Dosing and titration depend on formulation, age, weight and renal function. Consult the current U.S. label; do not use a simplified adult regimen for a child or a patient with severe renal impairment.",
    "references": [
      {
        "label": "Otezla/Otezla XR: U.S. safety and prescribing information",
        "url": "https://www.otezlapro.com/resource-center/"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "U.S. contraindication versus mood precaution, weight-loss trigger, clinical-use tags and dosing boundaries",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    id: 'methotrexate',
    name: 'Methotrexate',
    category: 'Conventional',
    agents: ['Methotrexate'],
    summary: 'Cornerstone systemic requiring intensive early lab monitoring, folate supplementation, and contraindications for renal impairment or pregnancy.',
    conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'autoimmune-blistering-disease'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'teratogenic'],
    tags: ['cbc-lft', 'hepatitis-screening', 'pregnancy-monitoring', 'chest-imaging', 'albumin', 'renal-function', 'blood-pressure'],
    baseline: 'Obtain CBC, CMP (including AST/ALT, creatinine, and albumin), hepatitis B/C/HIV serologies, chest X-ray or pulmonary screening, TB and varicella immunity as indicated, pregnancy test, blood pressure, and weight; initiate folic acid 1 mg daily.',
    monitoring: 'After initiation or dose change, check CBC, LFTs, and creatinine every 1–2 weeks for the first month (or until dose stable), then every 2–3 months; monitor for hepatotoxicity and myelosuppression; consider PIIINP for psoriasis.',
    cautions: 'Boxed warnings for hepatotoxicity, pulmonary toxicity, myelosuppression, and teratogenicity; avoid alcohol and in renal impairment (CrCl <50 mL/min).',
    baselineTasks: [
      task('cbc', 'CBC with differential', true),
      task('cmp', 'CMP with creatinine and albumin', true),
      task('hbv', 'Hepatitis B surface antigen/core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('hiv', 'HIV screen', true),
      task('chest-xray', 'Chest X-ray or pulmonary evaluation', true),
      task('tb', 'TB screening / varicella immunity as indicated', true),
      task('pregnancy', 'Pregnancy test (negative required)', true),
      task('bp', 'Blood pressure and weight', true),
      task('folate', 'Start folic acid 1 mg daily', true)
    ],
    monitoringSchedule: [
      schedule('week1-4', 'Weeks 1–4', 'CBC, LFTs, creatinine every 1–2 weeks until stable', 'critical', 1),
      schedule('maintenance', 'Every 2–3 months', 'CBC, LFTs, creatinine/albumin; assess alcohol intake and liver risk', 'high', 12)
    ],
    holdCriteria: [
      'AST or ALT >2 × normal for ≥1 month',
      'WBC <3.0 × 10^3/µL or platelets <100 × 10^3/µL',
      'Creatinine clearance <50 mL/min'
    ],
    contraindications: 'Pregnancy, chronic liver disease, significant renal impairment, alcoholism.',
    interactions: 'Avoid concomitant trimethoprim-sulfamethoxazole, NSAIDs at high doses, and other hepatotoxic drugs.',
    dosing: 'Weekly dosing with folate supplementation; consider subcutaneous route for GI intolerance.',
    references: [
      { label: 'Trexall (methotrexate) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2020/020004s031lbl.pdf' },
      { label: 'SPS Methotrexate Monitoring', url: 'https://www.sps.nhs.uk/monitorings/methotrexate-monitoring/' }
    ]
  },
  {
    id: 'cyclosporine',
    name: 'Cyclosporine',
    category: 'Conventional',
    agents: ['Cyclosporine'],
    summary: 'Rapid-acting calcineurin inhibitor requiring intensive renal, blood pressure, and electrolyte monitoring, especially during first months.',
    conditions: ['plaque-psoriasis', 'autoimmune-blistering-disease'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'infection'],
    tags: ['blood-pressure', 'renal-function', 'electrolytes', 'lipid-panel', 'cbc-lft', 'albumin'],
    baseline: 'Measure blood pressure twice, serum creatinine/eGFR twice, CBC, CMP (including AST/ALT), fasting lipids, magnesium, potassium, uric acid/urinalysis, vaccination status; screen high-risk patients for TB/hepatitis/HIV.',
    monitoring: 'Check blood pressure and creatinine every 2 weeks for first 6 weeks, then monthly; monitor albumin, AST/ALT, CBC, blood glucose every 2 weeks until stable then monthly; obtain lipid panel at 1 month and repeat labs every 1–3 months thereafter; adjust dose for creatinine rise >30%.',
    cautions: 'Nephrotoxicity, hypertension, hyperlipidemia and infection risk; avoid live vaccines.',
    baselineTasks: [
      task('bp', 'Blood pressure twice', true),
      task('creatinine', 'Serum creatinine/eGFR twice', true),
      task('cbc', 'CBC with differential', true),
      task('cmp', 'CMP with AST/ALT and electrolytes', true),
      task('lipids', 'Fasting lipids', true),
      task('magnesium', 'Serum magnesium and potassium', true),
      task('urate', 'Uric acid and urinalysis'),
      task('vaccines', 'Vaccination status; screen TB/hepatitis/HIV if high risk', true)
    ],
    monitoringSchedule: [
      schedule('week0-6', 'Every 2 weeks (first 6 weeks)', 'Blood pressure, creatinine/eGFR, albumin, AST/ALT, CBC, glucose', 'critical', 2),
      schedule('month1', 'Month 1', 'Fasting lipids', 'high', 4),
      schedule('maintenance', 'Every 1–3 months', 'Blood pressure, creatinine/eGFR, albumin, AST/ALT, CBC, glucose, magnesium/potassium', 'high', 12)
    ],
    holdCriteria: ['Creatinine increase >30% from baseline', 'Uncontrolled hypertension (>160/90 mmHg)', 'Serious infection'],
    contraindications: 'Uncontrolled hypertension, renal impairment, malignancy, concomitant nephrotoxic drugs.',
    interactions: 'CYP3A4 interactions (avoid grapefruit, certain antifungals); note nephrotoxic synergy with NSAIDs.',
    dosing: '2.5–5 mg/kg/day divided BID with taper to avoid rebound.',
    references: [
      { label: 'Neoral (cyclosporine) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2020/050715s073lbl.pdf' },
      { label: 'SPS Ciclosporin Monitoring', url: 'https://www.sps.nhs.uk/monitorings/ciclosporin-monitoring/' }
    ]
  },
  {
    id: 'mycophenolate',
    name: 'Mycophenolate mofetil',
    category: 'Conventional',
    agents: ['Mycophenolate mofetil'],
    summary: 'Teratogenic antimetabolite requiring dual pregnancy testing and 2-week lab cadence for first 6 weeks.',
    conditions: ['autoimmune-blistering-disease', 'lupus'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['teratogenic', 'pregnancy-monitoring'],
    tags: ['pregnancy-monitoring', 'cbc-lft', 'albumin', 'renal-function', 'blood-pressure', 'vaccination-review'],
    baseline: 'Obtain two negative pregnancy tests (8–10 days apart), CBC, CMP (ALT/AST, creatinine/eGFR), albumin, blood pressure, vaccination status, height, and weight.',
    monitoring: 'Monitor albumin, ALT/AST, CBC, and creatinine/eGFR every 2 weeks for at least 6 weeks until dose stable, then every 12 weeks.',
    cautions: 'Teratogenic—requires contraception during treatment and 6 weeks after; males use contraception during treatment and 90 days after; risk of cytopenias and infections.',
    baselineTasks: [
      task('pregnancy', 'Two negative pregnancy tests (8–10 days apart)', true),
      task('cbc', 'CBC with differential', true),
      task('cmp', 'CMP with ALT/AST and creatinine/eGFR', true),
      task('albumin', 'Serum albumin', true),
      task('bp', 'Blood pressure', true),
      task('vaccines', 'Vaccination status review', true),
      task('anthropometrics', 'Height and weight'),
      task('counseling', 'Contraception counseling (dual method)', true)
    ],
    monitoringSchedule: [
      schedule('weeks0-6', 'Every 2 weeks (first ≥6 weeks)', 'Albumin, ALT/AST, CBC, creatinine/eGFR', 'critical', 2),
      schedule('quarterly', 'Every 12 weeks once stable', 'Albumin, ALT/AST, CBC, creatinine/eGFR', 'high', 12)
    ],
    holdCriteria: ['WBC <3.0 × 10^3/µL', 'ANC <1.5 × 10^3/µL', 'Platelets <100 × 10^3/µL', 'AST/ALT >3 × ULN'],
    contraindications: 'Pregnancy, active serious infection.',
    interactions: 'Decreased efficacy with antacids/cholestyramine; avoid live vaccines.',
    dosing: '1–1.5 g BID for immunobullous disease; adjust for renal impairment.',
    references: [
      { label: 'CellCept (mycophenolate mofetil) Prescribing Information', url: 'https://www.gene.com/download/pdf/cellcept_prescribing.pdf' },
      { label: 'SPS Mycophenolate Monitoring', url: 'https://www.sps.nhs.uk/monitorings/mycophenolate-mofetil-monitoring/' }
    ]
  },
  {
    "id": "azathioprine",
    "name": "Azathioprine",
    "category": "Conventional",
    "agents": [
      "Azathioprine"
    ],
    "summary": "Thiopurine requiring TPMT and NUDT15 testing plus structured lab cadence and infection screening.",
    "conditions": [
      "pemphigus",
      "lupus",
      "autoimmune-blistering-disease"
    ],
    "monitoringFrequency": "frequent",
    "riskLevel": "high",
    "warningFlags": [
      "boxed-warning",
      "pregnancy-monitoring"
    ],
    "tags": [
      "tpmt-nudt15",
      "cbc-lft",
      "hepatitis-screening",
      "blood-pressure",
      "vaccination-review"
    ],
    "baseline": "Perform TPMT and NUDT15 genotype/phenotype, CBC, CMP (AST/ALT, creatinine/eGFR), blood pressure, height, weight, vaccination status, varicella immunity; screen high-risk patients for hepatitis B/C and HIV.",
    "monitoring": "Monitor CBC and LFTs every 1–2 weeks initially, then at weeks 4, 8, 12, and every 3 months thereafter; check creatinine/eGFR periodically.",
    "cautions": "Risk of myelosuppression is increased with TPMT/NUDT15 deficiency. Pharmacogenetic testing does not replace CBC monitoring. Discuss pregnancy and breastfeeding with the treating specialists rather than automatically discontinuing necessary therapy.",
    "baselineTasks": [
      {
        "id": "tpmt",
        "label": "TPMT and NUDT15 genotype/phenotype",
        "critical": true,
        "notes": ""
      },
      {
        "id": "cbc",
        "label": "CBC with differential",
        "critical": true,
        "notes": ""
      },
      {
        "id": "cmp",
        "label": "CMP with AST/ALT and creatinine/eGFR",
        "critical": true,
        "notes": ""
      },
      {
        "id": "bp",
        "label": "Blood pressure, height, and weight",
        "critical": true,
        "notes": ""
      },
      {
        "id": "vaccines",
        "label": "Vaccination status and varicella immunity",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hbv",
        "label": "Hepatitis B surface antigen/core antibodies (screen high-risk patients)",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hcv",
        "label": "Hepatitis C antibody (screen high-risk patients)",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hiv",
        "label": "HIV screen when risk factors present",
        "critical": true,
        "notes": ""
      },
      {
        "id": "pregnancy",
        "label": "Pregnancy counseling",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "weeks1-2",
        "timing": "Every 1–2 weeks (initiation)",
        "description": "CBC and LFTs",
        "priority": "critical",
        "relativeWeeks": 2
      },
      {
        "id": "week4",
        "timing": "Week 4",
        "description": "CBC, LFTs, creatinine/eGFR",
        "priority": "high",
        "relativeWeeks": 4
      },
      {
        "id": "week8",
        "timing": "Week 8",
        "description": "CBC, LFTs",
        "priority": "high",
        "relativeWeeks": 8
      },
      {
        "id": "week12",
        "timing": "Week 12",
        "description": "CBC, LFTs, creatinine/eGFR",
        "priority": "high",
        "relativeWeeks": 12
      },
      {
        "id": "quarterly",
        "timing": "Every 3 months",
        "description": "CBC and LFTs once stable",
        "priority": "high",
        "relativeWeeks": 24
      }
    ],
    "holdCriteria": [
      "Significant leukopenia or thrombocytopenia",
      "ALT/AST >3 × ULN"
    ],
    "contraindications": "Prior hypersensitivity to azathioprine requires avoidance. TPMT/NUDT15 deficiency requires specialist selection of alternatives or adjusted doses. Pregnancy is not a universal contraindication: use may be appropriate for some rheumatic diseases after specialist assessment; the U.S. rheumatoid-arthritis label has a pregnancy restriction.",
    "interactions": "Do not combine with febuxostat. Allopurinol can greatly increase thiopurine exposure; concomitant use requires a specialist-directed major azathioprine dose reduction and close blood-count monitoring. Do not treat these two interactions as interchangeable.",
    "dosing": "1–3 mg/kg/day with TPMT/NUDT15-guided adjustments.",
    "references": [
      {
        "label": "Imuran (azathioprine) Prescribing Information",
        "url": "https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/016324s043lbl.pdf"
      },
      {
        "label": "SPS Azathioprine Monitoring",
        "url": "https://www.sps.nhs.uk/monitorings/azathioprine-monitoring/"
      },
      {
        "label": "American College of Rheumatology: Azathioprine (updated May 2026)",
        "url": "https://rheumatology.org/patients/azathioprine-imuran"
      },
      {
        "label": "ULORIC prescribing information: azathioprine contraindication",
        "url": "https://www.accessdata.fda.gov/drugsatfda_docs/label/2019/021856s013lbl.pdf"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "Pregnancy risk-benefit qualification and separation of xanthine oxidase inhibitor interactions",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    "id": "hydroxychloroquine",
    "name": "Hydroxychloroquine",
    "category": "Conventional",
    "agents": [
      "Hydroxychloroquine"
    ],
    "summary": "Retinal screening should include a baseline fundus exam, OCT and FAF soon after initiation. Dose should not exceed 5 mg/kg/day actual body weight; screening frequency is risk-dependent.",
    "conditions": [
      "cutaneous-lupus",
      "rheumatoid-arthritis",
      "dermatomyositis"
    ],
    "monitoringFrequency": "moderate",
    "riskLevel": "moderate",
    "warningFlags": [
      "ophthalmologic"
    ],
    "tags": [
      "ophthalmologic",
      "cbc-lft",
      "renal-function",
      "weight-monitoring"
    ],
    "baseline": "Arrange baseline fundus examination, OCT and fundus autofluorescence (FAF) soon after starting. Document actual body weight, daily dose, renal disease, tamoxifen use, duration and older age at initiation; coordinate individualized assessment with ophthalmology.",
    "monitoring": "Annual OCT and wide-pattern FAF are recommended during treatment; screening may be deferred during the first 5 years only when there are no significant risk factors. Visual fields and multifocal ERG are confirmatory tools when needed. Laboratory monitoring is a separate clinical decision, not specified by the retinal-screening recommendation.",
    "cautions": "Higher daily dose, longer duration, renal disease, tamoxifen use and older age at initiation increase retinal risk. Retinal disease can complicate interpretation; it is not a substitute for individualized ophthalmologic assessment. Discuss uncertain early findings with the prescribing clinician before changing treatment.",
    "baselineTasks": [
      {
        "id": "ophthalmology",
        "label": "Baseline fundus examination, OCT and FAF soon after initiation",
        "critical": true,
        "notes": ""
      },
      {
        "id": "weight",
        "label": "Document actual body weight and daily dose (≤5 mg/kg/day)",
        "critical": true,
        "notes": ""
      },
      {
        "id": "risk",
        "label": "Assess renal disease, tamoxifen use, age at initiation and other retinal risks",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "baseline",
        "timing": "Soon after initiation",
        "description": "Baseline fundus examination, OCT and FAF for later comparison",
        "priority": "critical",
        "relativeWeeks": 0
      },
      {
        "id": "annual",
        "timing": "Annual; may defer first 5 years only if low risk",
        "description": "OCT and wide-pattern FAF; use additional testing to clarify suspected toxicity",
        "priority": "critical",
        "relativeWeeks": null
      },
      {
        "id": "risk-based",
        "timing": "According to individual clinical risk",
        "description": "Coordinate ophthalmology follow-up and systemic laboratory assessment",
        "priority": "standard",
        "relativeWeeks": null
      }
    ],
    "holdCriteria": [
      "Suspected retinal toxicity: obtain confirmatory ophthalmologic assessment and discuss stopping versus cautious monitoring with the patient and prescribing clinician. Do not automatically stop solely for an unconfirmed visual-field abnormality."
    ],
    "contraindications": "Verify the current product label for hypersensitivity and other restrictions. Pre-existing retinal disease requires individualized assessment and may limit screening reliability; it is not a universal contraindication.",
    "interactions": "Caution with QT-prolonging medications.",
    "dosing": "Retinal-safety recommendation: ≤5 mg/kg/day actual body weight. Consider renal function and other risk factors with the prescribing clinician; use the product label for indication-specific dosing.",
    "references": [
      {
        "label": "AAO Special Report: Hydroxychloroquine Retinopathy Screening (2025 Revision; published 2026)",
        "url": "https://pubmed.ncbi.nlm.nih.gov/41232611/"
      },
      {
        "label": "Plaquenil prescribing information (historical 2020 label; verify current label)",
        "url": "https://www.accessdata.fda.gov/drugsatfda_docs/label/2020/009768s048lbl.pdf"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "AAO 2025 revision: retinal screening modalities, timing, major risk factors and nonautomatic discontinuation",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    id: 'acitretin',
    name: 'Acitretin',
    category: 'Conventional',
    agents: ['Acitretin'],
    summary: 'Oral retinoid with strict contraception requirements and structured lipid/LFT monitoring schedule (weeks 4, 8, then every 12 weeks).',
    conditions: ['plaque-psoriasis'],
    monitoringFrequency: 'moderate',
    riskLevel: 'high',
    warningFlags: ['teratogenic', 'rems'],
    tags: ['pregnancy-monitoring', 'lipid-panel', 'cbc-lft', 'renal-function', 'blood-glucose'],
    baseline: 'Two negative pregnancy tests (within 2 weeks), CBC, liver enzymes (AST, ALT, alkaline phosphatase, gamma-GT), serum creatinine, fasting glucose, fasting lipids (triglycerides, cholesterol, HDL); counsel on strict contraception and alcohol avoidance.',
    monitoring: 'Repeat LFTs and lipid panel at weeks 4 and 8, then every 12 weeks; continue monthly pregnancy tests during therapy and every 3 months for 3 years post-therapy.',
    cautions: 'Teratogenic with 3-year contraception requirement; avoid alcohol to prevent etretinate formation.',
    baselineTasks: [
      task('pregnancy', 'Two negative pregnancy tests prior to start', true),
      task('cbc', 'CBC baseline', true),
      task('lfts', 'Liver enzymes (AST, ALT, ALP, GGT)', true),
      task('creatinine', 'Serum creatinine', true),
      task('glucose', 'Fasting glucose', true),
      task('lipids', 'Fasting lipid panel', true),
      task('counseling', 'Contraception & alcohol abstinence counseling', true)
    ],
    monitoringSchedule: [
      schedule('week4', 'Week 4', 'LFTs and lipid panel', 'critical', 4),
      schedule('week8', 'Week 8', 'LFTs and lipid panel', 'critical', 8),
      schedule('quarterly', 'Every 12 weeks', 'LFTs, lipid panel, CBC', 'high', 12),
      schedule('monthly-preg', 'Monthly', 'Pregnancy test during therapy and every 3 months for 3 years after', 'critical', 4)
    ],
    holdCriteria: ['AST/ALT >3 × ULN', 'Triglycerides >800 mg/dL', 'Positive pregnancy test'],
    contraindications: 'Pregnancy, breastfeeding, severe hepatic or renal impairment, chronic alcohol use.',
    interactions: 'Avoid tetracyclines (pseudotumor cerebri risk) and vitamin A supplements.',
    dosing: '25–50 mg PO daily with food; use lowest effective dose.',
    references: [
      { label: 'Soriatane (acitretin) Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/019821s024lbl.pdf' },
      { label: 'EuroGuiDerm 2024 Guideline', url: 'https://www.guidelines.edf.one/uploads/attachments/clrf2t72k3ttodtjrokdem0cy-0-euroguiderm-pso-gl-draft-2024.pdf' }
    ]
  },
  {
    "id": "isotretinoin",
    "name": "Isotretinoin (iPLEDGE)",
    "category": "Conventional",
    "agents": [
      "Isotretinoin"
    ],
    "summary": "Teratogenic retinoid requiring iPLEDGE safeguards. As of September 4, 2026, implementation of the newly approved REMS modifications is delayed until November 15, 2026; do not treat proposed or approved future rules as already implemented.",
    "conditions": [
      "nodulocystic-acne"
    ],
    "monitoringFrequency": "moderate",
    "riskLevel": "high",
    "warningFlags": [
      "teratogenic",
      "rems"
    ],
    "tags": [
      "pregnancy-monitoring",
      "lipid-panel",
      "cbc-lft"
    ],
    "baseline": "For patients who can get pregnant, complete the required pre-treatment pregnancy tests in a medical setting—not just the first test—and satisfy current iPLEDGE enrollment, pregnancy-prevention and authorization requirements. Obtain baseline fasting lipids and liver tests; other testing is individualized.",
    "monitoring": "Pregnancy testing during and after treatment follows current iPLEDGE requirements. Under FDA enforcement discretion, the prescriber may permit home tests during/after treatment with interpretation, documentation and safeguards against falsification; not for pre-treatment tests. Repeat lipids/liver tests until the response is established, then individualize frequency and reassess symptoms at follow-up.",
    "cautions": "Embryo-fetal toxicity: follow the current iPLEDGE pregnancy-prevention pathway. The February 2026 REMS modifications (including removal of the 19-day lockout) are not presented here as implemented: FDA announced a November 15, 2026 implementation date on June 16, 2026. Check the live program before each authorization. Also assess psychiatric symptoms, pancreatitis, intracranial hypertension and serious skin reactions.",
    "baselineTasks": [
      {
        "id": "pregnancy",
        "label": "Required pre-treatment pregnancy tests in a medical setting",
        "critical": true,
        "notes": "Applies to patients who can get pregnant. Home testing discretion applies only during/after treatment."
      },
      {
        "id": "lfts",
        "label": "Baseline liver enzymes",
        "critical": true,
        "notes": ""
      },
      {
        "id": "lipids",
        "label": "Baseline fasting lipid panel",
        "critical": true,
        "notes": ""
      },
      {
        "id": "cbc",
        "label": "Baseline CBC (optional)",
        "critical": false,
        "notes": ""
      },
      {
        "id": "counseling",
        "label": "Current iPLEDGE enrollment and pregnancy-prevention counseling",
        "critical": true,
        "notes": "Use current program requirements; planned 2026 changes must not be assumed active."
      }
    ],
    "monitoringSchedule": [
      {
        "id": "initial-labs",
        "timing": "Early treatment; individualized thereafter",
        "description": "Recheck lipids and liver function until the treatment response is established; use current label and risk-based protocol rather than a universal quarterly schedule.",
        "priority": "high"
      },
      {
        "id": "monthly",
        "timing": "Monthly during treatment for patients who can get pregnant",
        "description": "Document pregnancy tests under current iPLEDGE rules. Home tests only if permitted and verified by the prescriber.",
        "priority": "critical"
      },
      {
        "id": "after-treatment",
        "timing": "At completion and 1 month after treatment",
        "description": "Complete required post-treatment pregnancy testing for patients who can get pregnant.",
        "priority": "critical"
      }
    ],
    "holdCriteria": [
      "Positive pregnancy test or suspected pregnancy: stop treatment and obtain prompt specialist advice.",
      "Symptoms of pancreatitis: discontinue and evaluate; do not wait for a particular triglyceride threshold. Stop if hypertriglyceridemia cannot be controlled.",
      "Suspected hepatitis, significant persistent laboratory abnormality, psychiatric symptoms, intracranial hypertension or a serious skin reaction: follow the product-specific discontinuation and urgent evaluation instructions."
    ],
    "contraindications": "US label contraindications include pregnancy and hypersensitivity to the product or its components. Breastfeeding is not recommended. Hepatic disease, lipid abnormalities and other comorbidities require individualized assessment; this is not a complete eligibility determination.",
    "interactions": "Avoid tetracyclines, vitamin A supplements, and alcohol (hypertriglyceridemia).",
    "dosing": "Dose, food instructions and dosing frequency depend on the specific formulation and clinical circumstances; formulations are not automatically interchangeable. This reference does not calculate or authorize a prescription.",
    "references": [
      {
        "label": "FDA iPLEDGE REMS updates, including June 16, 2026 implementation delay",
        "url": "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/ipledge-risk-evaluation-and-mitigation-strategy-rems"
      },
      {
        "label": "US isotretinoin label (DailyMed; verify the dispensed formulation)",
        "url": "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=28948c32-a598-4bb5-bdb5-efbd87214d98"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "iPLEDGE implementation date, pre-treatment testing, contraindication/precaution distinction and removal of unsupported universal stop thresholds",
      "status": "Targeted source check; not a complete monograph validation"
    }
  },
  {
    id: 'thalidomide',
    name: 'Thalidomide',
    category: 'Conventional',
    agents: ['Thalidomide'],
    summary: 'REMS-controlled teratogen requiring ANC/platelet monitoring and vital sign surveillance for bradycardia.',
    conditions: ['erythema-nodosum-leprosum', 'autoimmune-blistering-disease'],
    monitoringFrequency: 'moderate',
    riskLevel: 'high',
    warningFlags: ['teratogenic', 'rems'],
    tags: ['pregnancy-monitoring', 'cbc-lft', 'neurologic', 'blood-pressure'],
    baseline: 'Two negative pregnancy tests (if applicable), CBC with differential (ensure ANC ≥750/mm³, platelets ≥100,000/mm³), VTE risk assessment, vital signs, HIV status if applicable; counsel on neuropathy and contraception.',
    monitoring: 'Pregnancy test weekly for first month then every 4 weeks, monitor ANC/platelets at week 4 then periodically, assess neuropathy and VTE symptoms, monitor vital signs including heart rate (bradycardia risk).',
    cautions: 'Severe teratogenicity; males must use condoms during therapy and 4 weeks after; monitor for peripheral neuropathy and bradycardia.',
    baselineTasks: [
      task('pregnancy', 'Two negative pregnancy tests (females of reproductive potential)', true),
      task('cbc', 'CBC with differential (ANC ≥750/mm³, platelets ≥100k)', true),
      task('vte', 'VTE risk assessment and prophylaxis counseling', true),
      task('vitals', 'Baseline vital signs including heart rate', true),
      task('hiv', 'HIV viral load if applicable'),
      task('counseling', 'REMS enrollment and dual contraception counseling', true)
    ],
    monitoringSchedule: [
      schedule('week4', 'Week 4', 'CBC with differential and platelet count', 'critical', 4),
      schedule('monthly', 'Monthly', 'Pregnancy test (after weekly first month), neuropathy check, vitals', 'high', 4),
      schedule('quarterly', 'Every 3 months', 'CBC/platelets and HIV viral load if positive', 'high', 12)
    ],
    holdCriteria: ['ANC <750/mm³', 'Platelets <50,000/mm³', 'Pregnancy', 'Symptomatic neuropathy or severe bradycardia'],
    contraindications: 'Pregnancy, inability to comply with REMS contraception requirements.',
    interactions: 'Additive sedation with CNS depressants; avoid drugs increasing neuropathy risk.',
    dosing: '100–300 mg at bedtime for ENL; titrate to lowest effective dose.',
    references: [
      { label: 'Thalomid (thalidomide) Prescribing Information', url: 'https://packageinserts.bms.com/pi/pi_thalomid.pdf' }
    ]
  },
  {
    "id": "ivig",
    "name": "Intravenous immunoglobulin (IVIG)",
    "category": "Conventional",
    "agents": [
      "Bivigam",
      "Privigen"
    ],
    "summary": "Infusion therapy with boxed thrombosis and renal dysfunction/acute renal failure warnings. Review the selected formulation, prior infusion reactions, renal function, hydration and thrombotic risk.",
    "conditions": [
      "autoimmune-blistering-disease"
    ],
    "monitoringFrequency": "moderate",
    "riskLevel": "high",
    "warningFlags": [
      "boxed-warning",
      "infection"
    ],
    "tags": [
      "renal-function",
      "neurologic",
      "blood-pressure"
    ],
    "baseline": "Review prior immunoglobulin reactions and relevant IgA/anti-IgA history, check renal function, assess thrombosis and hemolysis risk, and ensure appropriate hydration. Product excipients and contraindications differ; sucrose-free products still carry renal risk.",
    "monitoring": "Monitor vital signs and urine output during infusion, repeat BUN/creatinine in high-risk patients, watch for thrombosis and hemolysis with repeat dosing.",
    "cautions": "Risk of renal failure and thrombosis—use lowest practicable infusion rate and ensure hydration.",
    "baselineTasks": [
      {
        "id": "iga",
        "label": "Review prior immunoglobulin reactions and IgA-related risk",
        "critical": true,
        "notes": "An IgA level alone neither proves safety nor establishes the labeled contraindication; consider further evaluation when indicated."
      },
      {
        "id": "bun",
        "label": "BUN and serum creatinine",
        "critical": true,
        "notes": ""
      },
      {
        "id": "thrombosis",
        "label": "Assess thrombotic risk factors",
        "critical": true,
        "notes": ""
      },
      {
        "id": "hydration",
        "label": "Ensure adequate hydration and consider sucrose-free formulation",
        "critical": true,
        "notes": ""
      }
    ],
    "monitoringSchedule": [
      {
        "id": "infusion",
        "timing": "During infusion",
        "description": "Monitor vitals and urine output; adjust rate as needed",
        "priority": "critical",
        "relativeWeeks": 0
      },
      {
        "id": "postinfusion",
        "timing": "Post-infusion (high risk)",
        "description": "Repeat BUN/creatinine; monitor for hemolysis",
        "priority": "high",
        "relativeWeeks": 1
      }
    ],
    "holdCriteria": [
      "Rising creatinine or decreased urine output",
      "Symptoms of thrombosis or hemolysis"
    ],
    "contraindications": "Check the selected product. Privigen contraindications include previous severe systemic/hypersensitivity reactions to human immunoglobulin, IgA deficiency with anti-IgA antibodies AND a history of hypersensitivity, and hyperprolinemia. Low IgA alone is not this labeled contraindication.",
    "interactions": "Antibody-containing products can reduce responses to measles- or varicella-containing vaccines. Use the dose-/product-specific CDC spacing table, not a universal 3-month interval (examples: IVIG 300–400 mg/kg, 8 months; 1 g/kg for ITP, 10 months; 2 g/kg for Kawasaki disease, 11 months). Other vaccines have different rules.",
    "dosing": "Doses, intervals and infusion rates depend on indication and product. High-dose immunomodulatory regimens are not equivalent to replacement dosing; check whether the proposed indication is licensed or off-label for the selected product.",
    "references": [
      {
        "label": "Bivigam (immune globulin intravenous) Prescribing Information",
        "url": "https://labeling.grifols.com/PI/US/Bivigam/EN/Bivigam.pdf"
      },
      {
        "label": "Privigen (immune globulin intravenous) Prescribing Information",
        "url": "https://labeling.cslbehring.com/PI/US/Privigen/EN/Privigen-Prescribing-Information.pdf"
      },
      {
        "label": "Privigen manufacturer safety information: boxed risks and product-specific contraindications",
        "url": "https://www.privigen.com/important-safety-information"
      },
      {
        "label": "CDC: timing and spacing of immunobiologics, Table 3-6",
        "url": "https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html"
      }
    ],
    "safetyReview": {
      "date": "2026-09-04",
      "scope": "boxed risks, IgA/product-specific contraindications and dose-dependent vaccine spacing",
      "status": "Targeted source check; not a complete monograph validation"
    }
  }
];

export const dataVersion = '2025-09-23';

// A targeted safety revision is not a certification of every legacy statement.
export const safetyRevision = '2026-09-04';
