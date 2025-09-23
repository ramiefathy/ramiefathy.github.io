export const CONDITION_LABELS = {
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
    id: 'tnf-inhibitors',
    name: 'TNF inhibitors',
    category: 'Biologics',
    agents: ['Adalimumab', 'Infliximab', 'Etanercept', 'Certolizumab'],
    summary: 'High-risk anti-TNF agents that demand comprehensive infectious screening and scheduled CBC/LFT surveillance to prevent severe infection and hepatotoxicity.',
    conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'hidradenitis-suppurativa', 'pyoderma-gangrenosum', 'behcets-disease', 'uveitis-associated'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'infection'],
    tags: ['tb-screening', 'hepatitis-screening', 'hiv-screening', 'cbc-lft', 'infection-counseling'],
    baseline: 'CBC with differential, comprehensive metabolic panel (including AST/ALT), hepatitis B and C serologies, HIV screen when indicated, TB testing with IGRA or Mantoux plus chest imaging for risk, and vaccination review before first dose.',
    monitoring: 'Repeat CBC and liver enzymes at week 4, week 12, then every 3–6 months; maintain annual TB surveillance in high-risk patients and monitor hepatitis B carriers during treatment.',
    cautions: 'Boxed warnings for serious infections and malignancy (especially hepatosplenic T-cell lymphoma in young IBD patients); hold therapy for active infection or rapidly rising LFTs/hematologic toxicity; avoid live vaccines once therapy begins.',
    baselineTasks: [
      task('cbc', 'CBC with differential', true),
      task('cmp', 'Comprehensive metabolic panel with AST/ALT', true),
      task('hbv', 'Hepatitis B surface/core antibodies', true),
      task('hcv', 'Hepatitis C antibody', true),
      task('tb', 'TB screening (IGRA preferred) ± chest radiograph', true),
      task('hiv', 'HIV test when risk factors present'),
      task('vaccines', 'Update inactivated vaccines; avoid live vaccines after initiation', true)
    ],
    monitoringSchedule: [
      schedule('baseline', 'Baseline', 'Document labs and infectious disease screen prior to first dose', 'critical', 0),
      schedule('week4', 'Week 4', 'CBC with differential and AST/ALT', 'critical', 4),
      schedule('week12', 'Week 12', 'CBC with differential and AST/ALT', 'critical', 12),
      schedule('quarterly', 'Every 3–6 months', 'CBC, AST/ALT, assess infection/malignancy symptoms', 'high', 24),
      schedule('annual-tb', 'Annually (high-risk)', 'Repeat TB screening and hepatitis serologies if indicated', 'standard', 52)
    ],
    holdCriteria: [
      'Neutrophils <1.0 × 10^3/µL or platelets <100 × 10^3/µL',
      'ALT or AST >3 × upper limit of normal despite evaluation',
      'Signs of invasive infection or untreated latent TB'
    ],
    contraindications: 'Active serious infection, untreated latent tuberculosis, NYHA class III/IV heart failure.',
    interactions: 'Avoid live vaccines during therapy; combination immunosuppression increases infection risk—coordinate prophylaxis for hepatitis B carriers.',
    dosing: 'Agents are weight-based or fixed dose per label; no routine dose adjustment for labs but hold for serious infection or cytopenia.',
    references: [
      { label: 'HUMIRA Prescribing Information', url: 'https://www.drugs.com/pro/humira.html' },
      { label: 'AAD Biologic Monitoring Review 2025', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2945861/' }
    ]
  },
  {
    id: 'il17-inhibitors',
    name: 'IL-17 inhibitors',
    category: 'Biologics',
    agents: ['Secukinumab', 'Ixekizumab', 'Brodalumab', 'Bimekizumab'],
    summary: 'IL-17 blockade requires baseline TB evaluation but otherwise relies on clinical surveillance; update now includes hidradenitis suppurativa approval for secukinumab and 2023 bimekizumab launch.',
    conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'hidradenitis-suppurativa', 'crohns-disease'],
    monitoringFrequency: 'minimal',
    riskLevel: 'moderate',
    warningFlags: ['infection', 'psychiatric'],
    tags: ['tb-screening', 'vaccination-review', 'infection-counseling', 'psychiatric'],
    baseline: 'Evaluate for latent tuberculosis (IGRA or Mantoux) and update immunizations prior to initiation; document inflammatory bowel disease history and screen for suicidal ideation when considering brodalumab.',
    monitoring: 'No routine lab monitoring required; assess at each visit for mucocutaneous candidiasis, neutropenia, IBD flare, and mood changes (brodalumab carries a boxed warning for suicidal ideation).',
    cautions: 'Brodalumab has a boxed warning for suicidal ideation and requires psychiatric monitoring; IL-17 blockers may worsen IBD—coordinate gastroenterology care in high-risk patients; avoid live vaccines.',
    baselineTasks: [
      task('tb', 'TB screening before first dose', true),
      task('ibd-history', 'Document history of inflammatory bowel disease', true),
      task('vaccines', 'Update routine vaccines; avoid live vaccines once therapy starts', true),
      task('psych-eval', 'Screen for mood or suicidal ideation (brodalumab)', true)
    ],
    monitoringSchedule: [
      schedule('baseline', 'Baseline', 'TB evaluation and psychiatric screening for brodalumab', 'critical', 0),
      schedule('monthly', 'Every visit', 'Assess for mucocutaneous candidiasis, neutropenia, IBD flare, and mood changes', 'standard', 12)
    ],
    holdCriteria: [
      'Onset or worsening inflammatory bowel disease symptoms',
      'Serious infection or invasive candidiasis',
      'Emergent suicidal ideation on brodalumab'
    ],
    contraindications: 'Active serious infection; avoid brodalumab in patients with active or untreated depression unless benefit outweighs risk.',
    interactions: 'Avoid live vaccines; caution with other immunosuppressants increasing infection risk.',
    dosing: 'Fixed dosing varies by agent; secukinumab approved for hidradenitis suppurativa (2023) with loading schedule.',
    references: [
      { label: 'COSENTYX HCP Safety', url: 'https://www.cosentyxhcp.com/rheumatology/safety/jpsa-era-safety' },
      { label: 'Brodalumab Prescribing Information', url: 'https://www.drugs.com/pro/brodalumab.html' }
    ]
  },
  {
    id: 'il23-inhibitors',
    name: 'IL-23 inhibitors',
    category: 'Biologics',
    agents: ['Guselkumab', 'Risankizumab', 'Tildrakizumab', 'Mirikizumab'],
    summary: 'IL-23 inhibitors maintain a low laboratory burden for dermatology indications but require LFT surveillance for IBD dosing of guselkumab or mirikizumab.',
    conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'crohns-disease', 'ulcerative-colitis'],
    monitoringFrequency: 'minimal',
    riskLevel: 'low',
    warningFlags: [],
    tags: ['tb-screening', 'vaccination-review', 'cbc-lft'],
    baseline: 'Screen for latent TB before therapy and review vaccinations; for Crohn’s or ulcerative colitis induction, obtain baseline liver enzymes and bilirubin.',
    monitoring: 'Dermatology patients require clinical surveillance only; for IBD dosing monitor liver enzymes at baseline and every 16 weeks during induction and maintenance.',
    cautions: 'Maintain vigilance for infections; specify that LFT monitoring applies to IBD regimens rather than plaque psoriasis alone.',
    baselineTasks: [
      task('tb', 'TB screening (IGRA or Mantoux)', true),
      task('vaccines', 'Update vaccines; avoid live agents once on therapy', true),
      task('lfts', 'Baseline liver enzymes for IBD induction regimens')
    ],
    monitoringSchedule: [
      schedule('baseline', 'Baseline', 'TB evaluation and vaccine review', 'critical', 0),
      schedule('week16', 'Every 16 weeks (IBD only)', 'Liver enzymes and bilirubin per label during induction/maintenance', 'standard', 16)
    ],
    holdCriteria: [
      'Serious infection or reactivation of latent TB',
      'Persistent ALT/AST elevation >3 × ULN in IBD regimens'
    ],
    contraindications: 'Active serious infection.',
    interactions: 'Avoid live vaccines.',
    dosing: 'Agent-specific fixed dosing; guselkumab and mirikizumab have induction IV regimens for IBD that trigger additional LFT monitoring requirements.',
    references: [
      { label: 'TREMFYA Prescribing Information', url: 'https://www.janssenlabels.com/package-insert/product-monograph/prescribing-information/TREMFYA-pi.pdf' },
      { label: 'Mirikizumab FDA Label', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761150s000lbl.pdf' }
    ]
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
      { label: 'STELARA Prescribing Information', url: 'https://www.drugs.com/pro/stelara.html' },
      { label: 'Drugs.com Monitoring Guidance', url: 'https://www.drugs.com/medical-answers/blood-tests-needed-stelara-3539116/' }
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
      { label: 'Dupixent Prescribing Information', url: 'https://www.regeneron.com/downloads/dupixent_fpi.pdf' },
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
      task('hbv', 'Hepatitis B/C serologies', true),
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
      { label: 'Anifrolumab Safety Review', url: 'https://pubmed.ncbi.nlm.nih.gov/39245905/' }
    ]
  },
  {
    id: 'upadacitinib',
    name: 'Upadacitinib (JAK1)',
    category: 'Targeted & Conventional',
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
      task('hbv', 'Hepatitis B/C serologies', true),
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
      { label: 'RINVOQ Prescribing Information', url: 'https://www.rinvoqhcp.com/dermatology/dosing-lab-monitoring' },
      { label: '2024 JAK Monitoring Review', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11393246/' }
    ]
  },
  {
    id: 'abrocitinib',
    name: 'Abrocitinib (JAK1)',
    category: 'Targeted & Conventional',
    agents: ['Abrocitinib'],
    summary: 'Requires platelet monitoring at weeks 4 and 8 and lipids at week 12, with enhanced risk counseling for patients ≥65 or with CV risks.',
    conditions: ['atopic-dermatitis'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'age-65-plus', 'infection'],
    tags: ['cbc-lft', 'platelet-monitoring', 'lipid-panel', 'tb-screening', 'hepatitis-screening', 'smoking-assessment'],
    baseline: 'CBC with differential (focus on platelets), liver enzymes, fasting lipids, TB and hepatitis B/C screening; pregnancy test as appropriate; document smoking status.',
    monitoring: 'Check platelet count at weeks 4 and 8, repeat CBC/LFTs every 3 months, and perform lipid panel at week 12; monitor ongoing cytopenias and CV risk.',
    cautions: 'Platelet reductions are common (26–41%); boxed warnings parallel other JAK inhibitors.',
    baselineTasks: [
      task('cbc', 'CBC with differential and platelets', true),
      task('lfts', 'AST/ALT and bilirubin', true),
      task('lipids', 'Fasting lipid panel', true),
      task('tb', 'TB screening', true),
      task('hbv', 'Hepatitis B/C screen', true),
      task('pregnancy', 'Pregnancy test if applicable', true),
      task('smoking', 'Document smoking status', true)
    ],
    monitoringSchedule: [
      schedule('week4', 'Week 4', 'Platelet count', 'critical', 4),
      schedule('week8', 'Week 8', 'Platelet count', 'critical', 8),
      schedule('week12', 'Week 12', 'CBC, LFTs, lipid panel', 'high', 12),
      schedule('quarterly', 'Every 3 months', 'CBC/LFTs; monitor for infections and thrombosis', 'high', 24)
    ],
    holdCriteria: ['Platelets <50 × 10^3/µL', 'ANC <1.0 × 10^3/µL', 'Serious infection or thrombosis'],
    contraindications: 'Active serious infection; avoid in severe hepatic impairment.',
    interactions: 'Avoid strong CYP2C19 inhibitors/inducers; live vaccines contraindicated.',
    dosing: '100 mg or 200 mg PO daily; consider 100 mg in patients ≥65 years.',
    references: [
      { label: 'CIBINQO Prescribing Information', url: 'https://www.drugs.com/pro/cibinqo.html' },
      { label: 'JAK Monitoring Guidance 2024', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11393246/' }
    ]
  },
  {
    id: 'baricitinib',
    name: 'Baricitinib (JAK1/2)',
    category: 'Targeted & Conventional',
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
      task('hbv', 'Hepatitis B/C screen', true),
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
      { label: 'OLUMIANT Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/207924s006lbl.pdf' }
    ]
  },
  {
    id: 'ritlecitinib',
    name: 'Ritlecitinib (JAK3/TEC)',
    category: 'Targeted & Conventional',
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
      task('hbv', 'Hepatitis B/C screen', true),
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
      { label: 'LITFULO Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/215830s000lbl.pdf' }
    ]
  },
  {
    id: 'deucravacitinib',
    name: 'Deucravacitinib (TYK2)',
    category: 'Targeted & Conventional',
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
      task('hbv', 'Hepatitis B/C screen', true),
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
      { label: 'SOTYKTU VA Monograph', url: 'https://www.va.gov/formularyadvisor/DOC_PDF/MON_Deucravacitinib_SOTYKTU_in_Plaque_Psoriasis_Monograph_Apr_2023.pdf' }
    ]
  },
  {
    id: 'apremilast',
    name: 'Apremilast (PDE4)',
    category: 'Targeted & Conventional',
    agents: ['Apremilast'],
    summary: 'Oral PDE4 inhibitor with 2024 pediatric approval for plaque psoriasis ≥6 years; focus on weight and mood monitoring.',
    conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'atopic-dermatitis'],
    monitoringFrequency: 'minimal',
    riskLevel: 'low',
    warningFlags: ['pediatric'],
    tags: ['weight-monitoring', 'psychiatric'],
    baseline: 'Document baseline weight and mental health history; no routine labs required.',
    monitoring: 'Monitor weight and mood every 3 months; consider annual CBC if clinical concern.',
    cautions: 'Warn about potential weight loss and depression/suicidal ideation; adjust dosing for severe renal impairment.',
    baselineTasks: [
      task('weight', 'Record baseline weight', true),
      task('mood', 'Screen for depression or suicidal ideation', true)
    ],
    monitoringSchedule: [
      schedule('quarterly', 'Every 3 months', 'Assess weight change and mood', 'standard', 12)
    ],
    holdCriteria: ['Unintentional weight loss >10%', 'Emergent depression or suicidality'],
    contraindications: 'Severe depression or suicidal ideation without psychiatric support.',
    interactions: 'Avoid strong CYP inducers reducing exposure.',
    dosing: '30 mg PO BID for adults; pediatric weight-based dosing: 20 mg BID for 20–50 kg, 30 mg BID ≥50 kg.',
    references: [
      { label: 'Otezla Prescribing Information', url: 'https://www.drugs.com/pro/otezla.html' },
      { label: 'BAD Apremilast Guidance', url: 'https://www.skinhealthinfo.org.uk/condition/apremilast/' }
    ]
  },
  {
    id: 'methotrexate',
    name: 'Methotrexate',
    category: 'Targeted & Conventional',
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
      task('hbv', 'Hepatitis B/C and HIV screen', true),
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
      { label: 'SPS Methotrexate Monitoring', url: 'https://www.sps.nhs.uk/monitorings/methotrexate-monitoring/' }
    ]
  },
  {
    id: 'cyclosporine',
    name: 'Cyclosporine',
    category: 'Targeted & Conventional',
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
      { label: 'SPS Ciclosporin Monitoring', url: 'https://www.sps.nhs.uk/monitorings/ciclosporin-monitoring/' }
    ]
  },
  {
    id: 'mycophenolate',
    name: 'Mycophenolate mofetil',
    category: 'Targeted & Conventional',
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
      { label: 'SPS Mycophenolate Monitoring', url: 'https://www.sps.nhs.uk/monitorings/mycophenolate-mofetil-monitoring/' }
    ]
  },
  {
    id: 'azathioprine',
    name: 'Azathioprine',
    category: 'Targeted & Conventional',
    agents: ['Azathioprine'],
    summary: 'Thiopurine requiring TPMT and NUDT15 testing plus structured lab cadence and infection screening.',
    conditions: ['pemphigus', 'lupus', 'autoimmune-blistering-disease'],
    monitoringFrequency: 'frequent',
    riskLevel: 'high',
    warningFlags: ['boxed-warning', 'teratogenic'],
    tags: ['tpmt-nudt15', 'cbc-lft', 'hepatitis-screening', 'blood-pressure', 'vaccination-review'],
    baseline: 'Perform TPMT and NUDT15 genotype/phenotype, CBC, CMP (AST/ALT, creatinine/eGFR), blood pressure, height, weight, vaccination status, varicella immunity; screen high-risk patients for hepatitis B/C and HIV.',
    monitoring: 'Monitor CBC and LFTs every 1–2 weeks initially, then at weeks 4, 8, 12, and every 3 months thereafter; check creatinine/eGFR periodically.',
    cautions: 'Risk of myelosuppression especially with TPMT/NUDT15 deficiency; advise contraception.',
    baselineTasks: [
      task('tpmt', 'TPMT and NUDT15 genotype/phenotype', true),
      task('cbc', 'CBC with differential', true),
      task('cmp', 'CMP with AST/ALT and creatinine/eGFR', true),
      task('bp', 'Blood pressure, height, and weight', true),
      task('vaccines', 'Vaccination status and varicella immunity', true),
      task('hepatitis', 'Hepatitis B/C ± HIV screen when risk', true),
      task('pregnancy', 'Pregnancy counseling', true)
    ],
    monitoringSchedule: [
      schedule('weeks1-2', 'Every 1–2 weeks (initiation)', 'CBC and LFTs', 'critical', 2),
      schedule('week4', 'Week 4', 'CBC, LFTs, creatinine/eGFR', 'high', 4),
      schedule('week8', 'Week 8', 'CBC, LFTs', 'high', 8),
      schedule('week12', 'Week 12', 'CBC, LFTs, creatinine/eGFR', 'high', 12),
      schedule('quarterly', 'Every 3 months', 'CBC and LFTs once stable', 'high', 24)
    ],
    holdCriteria: ['Significant leukopenia or thrombocytopenia', 'ALT/AST >3 × ULN'],
    contraindications: 'Pregnancy, known TPMT deficiency without dose adjustment.',
    interactions: 'Allopurinol/febuxostat markedly increase exposure—dose reduction mandatory.',
    dosing: '1–3 mg/kg/day with TPMT/NUDT15-guided adjustments.',
    references: [
      { label: 'SPS Azathioprine Monitoring', url: 'https://www.sps.nhs.uk/monitorings/azathioprine-monitoring/' }
    ]
  },
  {
    id: 'hydroxychloroquine',
    name: 'Hydroxychloroquine',
    category: 'Targeted & Conventional',
    agents: ['Hydroxychloroquine'],
    summary: 'Antimalarial with ocular toxicity risk requiring baseline ophthalmologic exam and weight-based dosing ≤5 mg/kg actual body weight.',
    conditions: ['cutaneous-lupus', 'rheumatoid-arthritis', 'dermatomyositis'],
    monitoringFrequency: 'moderate',
    riskLevel: 'moderate',
    warningFlags: ['ophthalmologic'],
    tags: ['ophthalmologic', 'cbc-lft', 'renal-function', 'weight-monitoring'],
    baseline: 'Arrange ophthalmologic exam within first year (preferably baseline); document actual body weight to ensure ≤5 mg/kg dosing; consider baseline CBC, liver transaminases, and creatinine per 2024 ACR guidance.',
    monitoring: 'Annual retinal screening after 5 years of therapy (earlier if high risk: age ≥65, female sex, African or West Indies ancestry, renal impairment); periodic CBC/CMP optional based on risk.',
    cautions: 'Risk factors for retinopathy include daily dose >5 mg/kg actual weight, renal disease, and long duration; adjust dosing in renal impairment.',
    baselineTasks: [
      task('ophthalmology', 'Schedule ophthalmologic exam within first year', true),
      task('weight', 'Document actual body weight (dose ≤5 mg/kg)', true),
      task('labs', 'Optional baseline CBC, liver transaminases, creatinine')
    ],
    monitoringSchedule: [
      schedule('year5', 'Annual after 5 years', 'Retinal screening ± OCT, visual fields (earlier if high risk)', 'critical', 260),
      schedule('risk-based', 'Risk-based', 'Periodic CBC/CMP and renal function if clinically indicated', 'standard', 52)
    ],
    holdCriteria: ['Visual field changes suggestive of retinopathy'],
    contraindications: 'Pre-existing maculopathy.',
    interactions: 'Caution with QT-prolonging medications.',
    dosing: '≤5 mg/kg actual body weight per day; adjust for renal impairment.',
    references: [
      { label: 'AAO Retinopathy Screening Guideline', url: 'https://www.aao.org/education/clinical-statement/revised-recommendations-on-screening-chloroquine-h' },
      { label: 'ACR 2024 Guideline', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11111504/' }
    ]
  },
  {
    id: 'acitretin',
    name: 'Acitretin',
    category: 'Targeted & Conventional',
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
      { label: 'EuroGuiDerm 2024 Guideline', url: 'https://www.guidelines.edf.one/uploads/attachments/clrf2t72k3ttodtjrokdem0cy-0-euroguiderm-pso-gl-draft-2024.pdf' }
    ]
  },
  {
    id: 'isotretinoin',
    name: 'Isotretinoin (iPLEDGE)',
    category: 'Targeted & Conventional',
    agents: ['Isotretinoin'],
    summary: 'Updated 2024 iPLEDGE modifications allow home pregnancy testing and remove CLIA requirement; labs should occur at baseline, 1 month, and every 3 months thereafter.',
    conditions: ['nodulocystic-acne'],
    monitoringFrequency: 'moderate',
    riskLevel: 'high',
    warningFlags: ['teratogenic', 'rems'],
    tags: ['pregnancy-monitoring', 'lipid-panel', 'cbc-lft'],
    baseline: 'Two negative pregnancy tests (one in-office), LFTs, fasting lipids (triglycerides, cholesterol); consider baseline CBC; enroll in updated iPLEDGE program noting CLIA lab requirement removal and home testing allowance.',
    monitoring: 'Perform pregnancy test monthly (home tests allowed with documentation), repeat LFTs and lipid panel at 1 month and every 3 months thereafter; tailor lab frequency based on individual risk once stable.',
    cautions: 'Teratogenic—requires dual contraception; counsel on updated iPLEDGE rules (no 19-day lockout, reduced counseling for non-childbearing potential).',
    baselineTasks: [
      task('pregnancy', 'Two negative pregnancy tests (initial in clinic)', true),
      task('lfts', 'Baseline liver enzymes', true),
      task('lipids', 'Baseline fasting lipid panel', true),
      task('cbc', 'Baseline CBC (optional)'),
      task('counseling', 'Contraception and iPLEDGE education (2024 updates)', true)
    ],
    monitoringSchedule: [
      schedule('month1', 'Month 1', 'LFTs, lipid panel, pregnancy test', 'critical', 4),
      schedule('monthly', 'Monthly', 'Pregnancy test (home test acceptable with verification)', 'critical', 4),
      schedule('quarterly', 'Every 3 months', 'LFTs and lipid panel during therapy', 'high', 12)
    ],
    holdCriteria: ['Positive pregnancy test', 'Triglycerides >800 mg/dL', 'Persistent ALT/AST >3 × ULN'],
    contraindications: 'Pregnancy, breastfeeding, severe hepatic or renal disease, uncontrolled hyperlipidemia.',
    interactions: 'Avoid tetracyclines, vitamin A supplements, and alcohol (hypertriglyceridemia).',
    dosing: '0.5–1 mg/kg/day divided BID; goal cumulative dose 120–150 mg/kg.',
    references: [
      { label: 'Revised iPLEDGE 2024 Guidance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11362893/' }
    ]
  },
  {
    id: 'thalidomide',
    name: 'Thalidomide',
    category: 'Targeted & Conventional',
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
      { label: 'THALOMID Prescribing Information', url: 'https://packageinserts.bms.com/pi/pi_thalomid.pdf' }
    ]
  },
  {
    id: 'ivig',
    name: 'Intravenous immunoglobulin (IVIG)',
    category: 'Targeted & Conventional',
    agents: ['IVIG (various formulations)'],
    summary: 'High-cost infusion requiring IgA screening, renal monitoring (BUN/creatinine), hydration, and thrombosis vigilance.',
    conditions: ['autoimmune-blistering-disease'],
    monitoringFrequency: 'moderate',
    riskLevel: 'high',
    warningFlags: ['infection'],
    tags: ['renal-function', 'neurologic', 'blood-pressure'],
    baseline: 'Check serum IgA level to assess risk for anaphylaxis, obtain BUN and creatinine, evaluate thrombotic risk factors, ensure adequate hydration and select sucrose-free formulation when possible.',
    monitoring: 'Monitor vital signs and urine output during infusion, repeat BUN/creatinine in high-risk patients, watch for thrombosis and hemolysis with repeat dosing.',
    cautions: 'Risk of renal failure and thrombosis—use lowest practicable infusion rate and ensure hydration.',
    baselineTasks: [
      task('iga', 'Serum IgA level', true),
      task('bun', 'BUN and serum creatinine', true),
      task('thrombosis', 'Assess thrombotic risk factors', true),
      task('hydration', 'Ensure adequate hydration and consider sucrose-free formulation', true)
    ],
    monitoringSchedule: [
      schedule('infusion', 'During infusion', 'Monitor vitals and urine output; adjust rate as needed', 'critical', 0),
      schedule('postinfusion', 'Post-infusion (high risk)', 'Repeat BUN/creatinine; monitor for hemolysis', 'high', 1)
    ],
    holdCriteria: ['Rising creatinine or decreased urine output', 'Symptoms of thrombosis or hemolysis'],
    contraindications: 'Severe IgA deficiency with anti-IgA antibodies.',
    interactions: 'May interfere with live vaccines; delay immunization 3 months.',
    dosing: '2 g/kg divided over 2–5 days monthly depending on indication; adjust rate for tolerability.',
    references: [
      { label: 'Bivigam Prescribing Information', url: 'https://www.drugs.com/pro/bivigam.html' }
    ]
  }
];

export const dataVersion = '2025-09-23';
