export const monitoringEntries = [
  {
    id: 'tnf-inhibitors',
    name: 'TNF inhibitors',
    agents: ['Adalimumab', 'Infliximab', 'Etanercept', 'Certolizumab'],
    category: 'Biologics',
    uses: 'Plaque psoriasis, psoriatic arthritis, hidradenitis suppurativa',
    baseline: 'TB test; HBV serologies; CBC/LFTs reasonable to establish baseline status.',
    monitoring: 'Clinical surveillance for infection; repeat CBC/LFTs based on risk factors or combination immunosuppression.',
    cautions: 'Hold for serious infection; monitor HBV carriers during and for several months after therapy; counsel on endemic fungal exposure.',
    references: [
      { label: 'HUMIRA Prescribing Information', url: 'https://www.drugs.com/pro/humira.html' }
    ]
  },
  {
    id: 'il17-inhibitors',
    name: 'IL-17 inhibitors',
    agents: ['Secukinumab', 'Ixekizumab', 'Brodalumab', 'Bimekizumab'],
    category: 'Biologics',
    uses: 'Psoriasis, psoriatic arthritis; hidradenitis suppurativa (secukinumab/bimekizumab).',
    baseline: 'Screen for latent TB; document IBD history; review immunization status.',
    monitoring: 'Monitor for mucocutaneous candidiasis and neutropenia as clinically indicated; watch for new or worsening GI symptoms.',
    cautions: 'Caution in patients with known or suspected IBD; avoid live vaccines during therapy.',
    references: [
      { label: 'COSENTYX Prescribing Information', url: 'https://www.drugs.com/medical-answers/cosentyx-black-box-warning-3560241/' }
    ]
  },
  {
    id: 'il23-inhibitors',
    name: 'IL-23 inhibitors',
    agents: ['Guselkumab', 'Risankizumab', 'Tildrakizumab'],
    category: 'Biologics',
    uses: 'Plaque psoriasis; psoriatic arthritis (guselkumab, risankizumab); IBD indications for guselkumab.',
    baseline: 'TB evaluation; ensure vaccinations are up to date; obtain LFTs if using IV induction protocols for IBD.',
    monitoring: 'Clinical infection surveillance; liver enzymes per label when treating Crohn’s disease or ulcerative colitis.',
    cautions: 'Avoid live vaccines while on therapy; counsel patients to report infection symptoms promptly.',
    references: [
      { label: 'TREMFYA Prescribing Information', url: 'https://www.drugs.com/pro/tremfya.html' }
    ]
  },
  {
    id: 'il12-23-inhibitor',
    name: 'IL-12/23 inhibitor',
    agents: ['Ustekinumab'],
    category: 'Biologics',
    uses: 'Plaque psoriasis, psoriatic arthritis, Crohn’s disease, ulcerative colitis.',
    baseline: 'Screen for latent TB; review malignancy history; avoid live vaccines after initiation.',
    monitoring: 'Clinical monitoring for infection; consider periodic skin exams for non-melanoma skin cancer in high-risk populations.',
    cautions: 'Potential malignancy risk noted in labeling; avoid live vaccines during treatment.',
    references: [
      { label: 'STELARA Prescribing Information', url: 'https://www.drugs.com/pro/stelara.html' }
    ]
  },
  {
    id: 'il4-13-blockers',
    name: 'IL-4/13 blockers',
    agents: ['Dupilumab', 'Tralokinumab', 'Lebrikizumab'],
    category: 'Biologics',
    uses: 'Atopic dermatitis, prurigo nodularis (dupilumab), asthma/CRSwNP, eosinophilic esophagitis (dupilumab).',
    baseline: 'No routine labs required; treat pre-existing helminth infections before initiation; update inactivated vaccines.',
    monitoring: 'Monitor for conjunctivitis/keratitis and eosinophilia if symptomatic; assess new joint pain or arthralgia.',
    cautions: 'Avoid live vaccines; if helminth infection occurs and fails standard therapy, discontinue until resolved.',
    references: [
      { label: 'DUPIXENT Full Prescribing Information', url: 'https://www.regeneron.com/downloads/dupixent_fpi.pdf' }
    ]
  },
  {
    id: 'il31-antagonist',
    name: 'IL-31 receptor antagonist',
    agents: ['Nemolizumab'],
    category: 'Biologics',
    uses: 'Prurigo nodularis; atopic dermatitis in patients 12 years and older.',
    baseline: 'Complete age-appropriate vaccinations prior to therapy; avoid live vaccines during treatment.',
    monitoring: 'Clinical monitoring for hypersensitivity reactions; no routine laboratory testing mandated.',
    cautions: 'Hypersensitivity reactions have been reported; counsel to avoid live vaccines.',
    references: [
      { label: 'NEMLUVIO Prescribing Information', url: 'https://www.drugs.com/pro/nemluvio.html' }
    ]
  },
  {
    id: 'omalizumab',
    name: 'Anti-IgE monoclonal antibody',
    agents: ['Omalizumab'],
    category: 'Biologics',
    uses: 'Chronic spontaneous urticaria; adjunct for IgE-mediated food allergy.',
    baseline: 'Observe initial injections in clinic; baseline IgE not required for CSU.',
    monitoring: 'Post-dose observation according to label guidance; maintain emergency action plan.',
    cautions: 'Boxed warning for anaphylaxis; ensure patient carries rescue medication.',
    references: [
      { label: 'XOLAIR Prescribing Information', url: 'https://www.drugs.com/pro/xolair.html' }
    ]
  },
  {
    id: 'anifrolumab',
    name: 'Type I interferon receptor antagonist',
    agents: ['Anifrolumab'],
    category: 'Biologics',
    uses: 'Systemic lupus erythematosus; off-label for cutaneous lupus.',
    baseline: 'Screen for TB and HBV; review zoster vaccination status.',
    monitoring: 'Monitor for infusion reactions and recurrent infections; consider antiviral prophylaxis in high-risk patients.',
    cautions: 'Increased risk of herpesvirus reactivation (HSV/VZV); counsel on early evaluation of suspicious lesions.',
    references: [
      { label: 'Anifrolumab Safety Review', url: 'https://pubmed.ncbi.nlm.nih.gov/39245905/' }
    ]
  },
  {
    id: 'upadacitinib',
    name: 'Upadacitinib',
    agents: ['Upadacitinib (JAK1)'],
    category: 'Targeted & Conventional',
    uses: 'Atopic dermatitis; off-label for other inflammatory dermatoses.',
    baseline: 'CBC, LFTs, lipid panel, TB, HBV/HCV screening; pregnancy test when applicable.',
    monitoring: 'CBC/LFTs at 4–8 weeks then every 3–6 months; lipids around 12 weeks; reassess cardiovascular risk.',
    cautions: 'Boxed warnings for serious infections, MACE, malignancy, thrombosis; avoid live vaccines.',
    references: [
      { label: 'RINVOQ Prescribing Information', url: 'https://www.drugs.com/pro/rinvoq.html' }
    ]
  },
  {
    id: 'abrocitinib',
    name: 'Abrocitinib',
    agents: ['Abrocitinib (JAK1)'],
    category: 'Targeted & Conventional',
    uses: 'Atopic dermatitis.',
    baseline: 'CBC including platelets and neutrophils, lipids, TB, HBV/HCV screening.',
    monitoring: 'Platelet count monthly for first 3 months then every 3 months; CBC/LFTs and lipids per clinical judgment.',
    cautions: 'JAK-class boxed warnings; adjust or hold for thrombocytopenia; avoid live vaccines.',
    references: [
      { label: 'CIBINQO Prescribing Information', url: 'https://www.drugs.com/pro/cibinqo.html' }
    ]
  },
  {
    id: 'baricitinib',
    name: 'Baricitinib',
    agents: ['Baricitinib (JAK1/2)'],
    category: 'Targeted & Conventional',
    uses: 'Alopecia areata; atopic dermatitis in select regions.',
    baseline: 'CBC, LFTs, lipids, TB, HBV/HCV screening.',
    monitoring: 'CBC/LFTs at 4–8 weeks then periodically; lipids at 12 weeks; monitor for DVT/PE symptoms.',
    cautions: 'Class boxed warnings (infection, MACE, malignancy, thrombosis); evaluate for VTE promptly.',
    references: [
      { label: 'OLUMIANT Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/207924s006lbl.pdf' }
    ]
  },
  {
    id: 'ritlecitinib',
    name: 'Ritlecitinib',
    agents: ['Ritlecitinib (JAK3/TEC)'],
    category: 'Targeted & Conventional',
    uses: 'Alopecia areata.',
    baseline: 'Screen for TB and HBV; collect CBC and LFTs; pregnancy testing when indicated.',
    monitoring: 'CBC/LFTs during the first 3 months; lipid monitoring as clinically indicated.',
    cautions: 'JAK-class boxed warnings; avoid live vaccines during therapy.',
    references: [
      { label: 'LITFULO Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/215830s000lbl.pdf' }
    ]
  },
  {
    id: 'deucravacitinib',
    name: 'Deucravacitinib',
    agents: ['Deucravacitinib (TYK2)'],
    category: 'Targeted & Conventional',
    uses: 'Plaque psoriasis.',
    baseline: 'Screen for TB; review immunizations; baseline CBC/LFTs reasonable.',
    monitoring: 'Periodic CBC/LFTs per clinical risk; reinforce infection vigilance.',
    cautions: 'Risk of infection and lab abnormalities; avoid combination with other potent immunosuppressants.',
    references: [
      { label: 'SOTYKTU Prescribing Information', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/214958s000lbl.pdf' }
    ]
  },
  {
    id: 'apremilast',
    name: 'Apremilast',
    agents: ['Apremilast (PDE4 inhibitor)'],
    category: 'Targeted & Conventional',
    uses: 'Psoriasis, psoriatic arthritis.',
    baseline: 'Document weight and mood history.',
    monitoring: 'Monitor weight and mood during therapy; consider dose adjustment if significant weight loss or depression occurs.',
    cautions: 'Warn about potential weight loss and neuropsychiatric events.',
    references: [
      { label: 'OTEZLA Prescribing Information', url: 'https://www.drugs.com/pro/otezla.html' }
    ]
  },
  {
    id: 'methotrexate',
    name: 'Methotrexate',
    agents: ['Methotrexate'],
    category: 'Targeted & Conventional',
    uses: 'Systemic psoriasis; adjunct for cutaneous T-cell lymphoma.',
    baseline: 'CBC, CMP (including LFTs and creatinine), hepatitis B/C serologies, pregnancy test, consider chest imaging/TB screen; start folate.',
    monitoring: 'CBC and CMP every 2–4 weeks initially, spacing to every 1–3 months once stable.',
    cautions: 'Monitor for hepatotoxicity and myelosuppression; teratogenic—strict contraception required.',
    references: [
      { label: 'AAD Psoriasis Guideline', url: 'https://www.aad.org/member/clinical-quality/guidelines/psoriasis' }
    ]
  },
  {
    id: 'cyclosporine',
    name: 'Cyclosporine',
    agents: ['Cyclosporine'],
    category: 'Targeted & Conventional',
    uses: 'Severe psoriasis; acute atopic dermatitis flares.',
    baseline: 'Blood pressure, creatinine (two readings), CBC, CMP, lipids, magnesium, uric acid.',
    monitoring: 'Blood pressure and creatinine every 2 weeks for 3 months then monthly; monitor electrolytes and lipids periodically.',
    cautions: 'Risk of nephrotoxicity and hypertension; employ short intermittent courses; adjust for renal function changes.',
    references: [
      { label: 'JAAD Cyclosporine Consensus', url: 'https://www.jaad.org/article/S0190-9622%2820%2930284-X/fulltext' }
    ]
  },
  {
    id: 'mycophenolate',
    name: 'Mycophenolate mofetil',
    agents: ['Mycophenolate mofetil'],
    category: 'Targeted & Conventional',
    uses: 'Autoimmune blistering disease; CTCL adjunct.',
    baseline: 'CBC, CMP, pregnancy testing (two negatives), blood pressure; review vaccinations.',
    monitoring: 'CBC/CMP every 2 weeks for at least 6 weeks, then every 3 months once stable.',
    cautions: 'Teratogenic—ensure contraception; monitor for cytopenias and renal decline.',
    references: [
      { label: 'SPS Monitoring Guidance', url: 'https://www.sps.nhs.uk/monitorings/mycophenolate-mofetil-monitoring/' }
    ]
  },
  {
    id: 'azathioprine',
    name: 'Azathioprine',
    agents: ['Azathioprine'],
    category: 'Targeted & Conventional',
    uses: 'Pemphigus, connective tissue dermatoses.',
    baseline: 'CBC, CMP; TPMT/NUDT15 genotype or activity prior to first dose.',
    monitoring: 'CBC and LFT every 1–2 weeks initially, spacing to every 1–3 months; increase frequency when introducing interacting drugs.',
    cautions: 'Myelosuppression risk with TPMT/NUDT15 deficiency; contraindicated with allopurinol unless dose adjusted.',
    references: [
      { label: 'CPIC TPMT/NUDT15 Guidelines', url: 'https://www.ncbi.nlm.nih.gov/books/NBK100661/' }
    ]
  },
  {
    id: 'hydroxychloroquine',
    name: 'Hydroxychloroquine',
    agents: ['Hydroxychloroquine'],
    category: 'Targeted & Conventional',
    uses: 'Cutaneous lupus erythematosus, dermatomyositis, porphyria cutanea tarda.',
    baseline: 'Baseline ophthalmologic exam within first year; dose at ≤5 mg/kg actual body weight.',
    monitoring: 'Annual retinal screening after 5 years (earlier if high risk); monitor renal function in chronic kidney disease.',
    cautions: 'Retinopathy risk increases with higher doses or prolonged duration.',
    references: [
      { label: 'AAO Screening Recommendations', url: 'https://www.aao.org/education/clinical-statement/revised-recommendations-on-screening-chloroquine-h' }
    ]
  },
  {
    id: 'acitretin',
    name: 'Acitretin',
    agents: ['Acitretin'],
    category: 'Targeted & Conventional',
    uses: 'Psoriasis, keratinization disorders.',
    baseline: 'Two negative pregnancy tests, LFTs, fasting lipids; counsel on contraception and alcohol avoidance.',
    monitoring: 'LFTs and lipids every 1–3 months; monthly pregnancy tests during therapy and every 3 months for 3 years post-therapy.',
    cautions: 'Highly teratogenic; avoid pregnancy for 3 years after stopping; avoid alcohol to prevent etretinate formation.',
    references: [
      { label: 'SORIATANE Prescribing Information', url: 'https://www.drugs.com/pro/soriatane.html' }
    ]
  },
  {
    id: 'isotretinoin',
    name: 'Isotretinoin',
    agents: ['Isotretinoin'],
    category: 'Targeted & Conventional',
    uses: 'Nodulocystic acne; refractory folliculitis.',
    baseline: 'Pregnancy tests (CLIA setting), LFTs, fasting lipids prior to initiation.',
    monitoring: 'Pregnancy test monthly; laboratory monitoring at ~2 months and then as clinically indicated.',
    cautions: 'Teratogenic—strict adherence to iPLEDGE; consider reduced lab frequency after stable results.',
    references: [
      { label: 'iPLEDGE REMS (2024 update)', url: 'https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/ipledge-risk-evaluation-and-mitigation-strategy-rems' }
    ]
  },
  {
    id: 'thalidomide',
    name: 'Thalidomide',
    agents: ['Thalidomide'],
    category: 'Targeted & Conventional',
    uses: 'Erythema nodosum leprosum, refractory aphthosis, prurigo.',
    baseline: 'Two negative pregnancy tests; contraception counseling; assess VTE risk factors.',
    monitoring: 'Pregnancy testing weekly for first month then every 4 weeks; monitor for neuropathy and thromboembolism.',
    cautions: 'REMS program required; dual contraception; consider VTE prophylaxis when combined with steroids.',
    references: [
      { label: 'THALOMID Prescribing Information', url: 'https://packageinserts.bms.com/pi/pi_thalomid.pdf' }
    ]
  },
  {
    id: 'ivig',
    name: 'Intravenous immunoglobulin',
    agents: ['IVIG (various preparations)'],
    category: 'Targeted & Conventional',
    uses: 'Autoimmune blistering disease, dermatomyositis, chronic urticaria variants.',
    baseline: 'Check IgA level; assess renal function and thrombotic risk; ensure adequate hydration and slow infusion plan.',
    monitoring: 'Monitor vitals during infusion; track renal function and urine output in high-risk patients; assess for hemolysis with repeat dosing.',
    cautions: 'Risk of aseptic meningitis, acute kidney injury, thrombosis—use sucrose-free products and slow infusion in susceptible patients.',
    references: [
      { label: 'IVIG Adverse Effect Review', url: 'https://pubmed.ncbi.nlm.nih.gov/16391392/' }
    ]
  }
];
