// js/data.js - CTCL Mind Maps Data

// --- Reusable Tooltip Objects ---
const classic_mf_tooltip = { title: 'Mycosis Fungoides (Classic)', content: '<ul><li><strong>Epidemiology:</strong> Most common CTCL (50-70% of cases). Incidence: 6-9 per million/year. Male:female 1.6-2:1. Peak age 55-60. Higher incidence in Black populations.</li><li><strong>Manifestations:</strong> Indolent course. Progresses from <strong>patches</strong> to <strong>plaques</strong> to <strong>tumors</strong>. Pruritus in >80%. Large cell transformation (>25% large cells) = poor prognosis.</li><li><strong>Histopathology:</strong> Atypical cerebriform lymphocytes. <strong>Epidermotropism</strong> without spongiosis. Pautrier microabscesses (pathognomonic but only in 10-20%).</li><li><strong>Molecular:</strong> TP53 mutations (10-15%), CDKN2A deletions (30-40% in transformed), JAK/STAT pathway (60-70% advanced).</li><li><strong>Prognosis by Stage:</strong> IA: 5yr DSS >95%. IB: 5yr DSS 85-95%. IIA: 5yr DSS 80-85%. IIB: 5yr DSS 60-75%. III-IV: 5yr DSS 15-55%.</li></ul>' };
const ss_tooltip = { title: 'Sézary Syndrome', content: '<ul><li><strong>Epidemiology:</strong> Rare CTCL (2-3% of cases). Incidence: 0.1-0.3 per million/year.</li><li><strong>Manifestations:</strong> Triad: <strong>erythroderma</strong> (>80% BSA), <strong>lymphadenopathy</strong>, <strong>Sézary cells</strong>. Severe pruritus >90%. Keratoderma, alopecia, ectropion common.</li><li><strong>B2 Criteria (need ONE):</strong> ≥1000/μL Sézary cells; CD4:CD8 ≥10 + clone; CD4+CD7- ≥40% or CD4+CD26- ≥30% + clone; Chromosomal abnormality. KIR3DL2/CD158k: 85% sensitive, 95% specific.</li><li><strong>Molecular:</strong> PLCG1 mutations ~10%, JAK/STAT pathway 60-70%, DNMT3A = poor prognosis.</li><li><strong>Prognosis:</strong> Median survival 2-4 years. 5-year DSS ~36%. First-line: ECP, mogamulizumab (FDA-approved first-line), retinoids±IFN.</li></ul>' };
const fmf_tooltip = { title: 'Folliculotropic MF (FMF)', content: '<ul><li><strong>Manifestations:</strong> A variant of MF characterized by infiltration of hair follicles. Presents as follicular-based patches, plaques, acneiform lesions, or tumors, often on the head and neck. Can cause alopecia, especially of the eyebrows.</li><li><strong>Histopathology:</strong> Characterized by perifollicular and follicular infiltrates of atypical T cells, often with associated follicular mucinosis (mucin deposition in the hair follicle). Epidermotropism is often sparse or absent.</li><li><strong>Prognosis:</strong> Traditionally considered more aggressive than classic MF due to deeper infiltration, making it less responsive to skin-directed therapies. However, recent studies suggest prognosis is stage-dependent, with early-stage FMF having a more favorable outcome than advanced-stage FMF.</li></ul>' };
const pagetoid_tooltip = { title: 'Pagetoid Reticulosis (Woringer-Kolopp)', content: '<ul><li><strong>Manifestations:</strong> Rare variant of MF presenting as a solitary, slowly growing, well-demarcated, psoriasiform or hyperkeratotic patch or plaque, typically on a distal extremity (hand or foot).</li><li><strong>Histopathology:</strong> Marked pagetoid (intraepidermal) proliferation of large atypical T-cells, which occupy the entire thickness of the epidermis.</li><li><strong>Prognosis:</strong> Excellent and indolent. It is not associated with systemic spread, and local treatment (excision or radiotherapy) is often curative. 5-year disease-specific survival is 100%.</li></ul>' };
const gss_tooltip = { title: 'Granulomatous Slack Skin', content: '<ul><li><strong>Manifestations:</strong> Extremely rare variant of MF. Characterized by the slow development of bulky, pendulous folds of lax, atrophic skin, classically in intertriginous areas like the axillae and groin.</li><li><strong>Histopathology:</strong> A granulomatous infiltrate with multinucleated giant cells that engulf elastic fibers (elastophagocytosis), leading to loss of skin elasticity.</li><li><strong>Prognosis:</strong> Very indolent clinical course. However, it is associated with an increased risk of developing a secondary lymphoid malignancy, most commonly Hodgkin lymphoma.</li></ul>' };
const pcalcl_tooltip = { title: 'Primary Cutaneous Anaplastic Large Cell Lymphoma (pcALCL)', content: '<ul><li><strong>Epidemiology:</strong> Part of CD30+ LPD spectrum (~25% of CTCLs with LyP). Median age 60 years. M:F ratio 2-3:1.</li><li><strong>Manifestations:</strong> Solitary/localized (80%), rapidly growing nodules/tumors. Ulceration in 40%. Spontaneous regression 20-25%. Leg involvement = poor prognosis.</li><li><strong>Histopathology:</strong> Large anaplastic cells, >75% CD30+. ALK-negative. May express cytotoxic markers (TIA-1, granzyme B, perforin).</li><li><strong>Treatment:</strong> Solitary: excision or RT (CR >95%). Multifocal: low-dose MTX, brentuximab vedotin (ORR 86%, CR 57%, median DoR 16.8 months).</li><li><strong>Prognosis:</strong> 5-year DSS >90% (non-leg), ~50% (leg). Cutaneous relapses 40%. Extracutaneous spread <10%.</li></ul>' };
const lyp_tooltip = { title: 'Lymphomatoid Papulosis (LyP)', content: '<ul><li><strong>Epidemiology:</strong> Incidence 1.2-1.9 per million/year. Median age 45. M:F 1.5:1. Can occur at any age (including children).</li><li><strong>Manifestations:</strong> Recurrent crops of 3-100 papulonodules that necrotize centrally, resolve in 3-12 weeks leaving scars. Continuous eruption of new lesions.</li><li><strong>Histologic Types:</strong> A (most common): CD30+ cells with neutrophils/eosinophils. B: MF-like. C: ALCL-like. D: CD8+ epidermotropic. E: angioinvasive (worse prognosis). F: folliculotropic.</li><li><strong>Associated Lymphomas:</strong> 10-20% lifetime risk (highest in first 10 years). MF (most common), pcALCL, Hodgkin. Type E = higher risk.</li><li><strong>Management:</strong> Often none needed. Options: topical steroids, phototherapy, low-dose MTX (10-25mg/week, best for suppression). Avoid aggressive therapy.</li><li><strong>Prognosis:</strong> 5-year survival >99%. Does not affect life expectancy unless secondary lymphoma develops.</li></ul>' };
const sptcl_tooltip = { title: 'Subcutaneous Panniculitis-like T-cell Lymphoma (SPTCL)', content: '<ul><li><strong>Epidemiology:</strong> Very rare (<1% of CTCLs). Median age 35 years. F>M (2:1). Associated with autoimmune disorders (20-30%), especially lupus.</li><li><strong>Manifestations:</strong> Subcutaneous nodules/plaques on legs, arms, trunk. Resembles panniculitis. B-symptoms common (fever, weight loss). αβ T-cell phenotype.</li><li><strong>Histopathology:</strong> CD8+ cytotoxic T-cells in subcutis. Characteristic "rimming" of adipocytes. No epidermis/dermis involvement. Express TIA-1, granzyme B, perforin.</li><li><strong>Complications:</strong> HLH in 15-20% (poor prognosis). Screen with ferritin, sIL-2R, triglycerides.</li><li><strong>Treatment:</strong> First-line: systemic steroids, cyclosporine. Refractory: combination chemotherapy. Consider HSCT for HLH.</li><li><strong>Prognosis:</strong> 5-year OS ~80-90% without HLH, <50% with HLH. Better prognosis than PCGD-TCL.</li></ul>' };
const pcgd_tooltip = { title: 'Primary Cutaneous Gamma-Delta T-cell Lymphoma (PCGD-TCL)', content: '<ul><li><strong>Manifestations:</strong> A rare and very aggressive CTCL composed of gamma-delta (γδ) T-cells. Presents with rapidly progressing, deeply ulcerated plaques, nodules, or tumors, often on the extremities.</li><li><strong>Histopathology:</strong> Infiltrate of atypical γδ T-cells in the dermis and/or subcutis, often with angiodestruction and necrosis.</li><li><strong>Prognosis:</strong> Very poor, with a median survival of approximately 15 months. Resistant to multi-agent chemotherapy.</li></ul>' };
const aectcl_tooltip = { title: 'Aggressive Epidermotropic CD8+ Cytotoxic T-cell Lymphoma', content: '<ul><li><strong>Manifestations:</strong> A rare and very aggressive CTCL characterized by widespread, eruptive papules, nodules, and tumors that show central ulceration and necrosis. It disseminates rapidly to visceral sites but often spares lymph nodes.</li><li><strong>Histopathology:</strong> A dense, band-like infiltrate of atypical epidermotropic CD8+ cytotoxic T-cells.</li><li><strong>Prognosis:</strong> Aggressive clinical course with a median survival of less than 32 months (2.7 years).</li></ul>' };
const atll_tooltip = { title: 'Adult T-cell Leukemia/Lymphoma (ATLL)', content: '<ul><li><strong>Epidemiology:</strong> A peripheral T-cell neoplasm caused by the human T-cell leukemia virus 1 (HTLV-1). Endemic in areas like Japan, the Caribbean, and parts of South and Central America.</li><li><strong>Manifestations:</strong> ~25% of patients present with skin lesions that can mimic MF or Sézary syndrome. Acute ATLL is aggressive, featuring leukemia, lymphadenopathy, and hypercalcemia.</li><li><strong>Diagnosis:</strong> Presence of HTLV-1 antibodies is key. Blood smear shows characteristic "flower cells" (polylobated nuclei).</li><li><strong>Prognosis:</strong> Poor for acute and lymphomatous types, with a median survival of less than one year.</li></ul>' };
const pcsm_tooltip = { title: 'PC CD4+ Small/Medium TCLPD', content: '<ul><li><strong>Epidemiology:</strong> An indolent subtype, accounts for ~6% of CTCL.</li><li><strong>Manifestations:</strong> Typically presents as a solitary plaque or tumor on the face, neck, or upper trunk.</li><li><strong>Histopathology:</strong> A dense, nodular-to-diffuse dermal infiltrate of small to medium-sized pleomorphic CD4+ T-cells, with a significant admixture of reactive B-cells, eosinophils, and histiocytes.</li><li><strong>Prognosis:</strong> Excellent, with a 5-year survival rate of 100%. Due to its benign course, it is classified as a "lymphoproliferative disorder" (TCLPD) rather than a true lymphoma.</li></ul>' };
const acral_cd8_tooltip = { title: 'PC Acral CD8+ TCLPD', content: '<ul><li><strong>Manifestations:</strong> Presents as a solitary, slow-growing papule or nodule on an acral site, most commonly the ear.</li><li><strong>Histopathology:</strong> A dense, diffuse dermal infiltrate of monomorphous, medium-sized CD8+ cytotoxic T-cells, but with a very low proliferation rate.</li><li><strong>Prognosis:</strong> Excellent, with a 5-year survival of 100%. Despite an aggressive histologic appearance, the clinical behavior is indolent. Now classified as a "lymphoproliferative disorder" (TCLPD).</li></ul>' };
const enktcl_tooltip = { title: 'Extranodal NK/T-cell Lymphoma, Nasal Type', content: '<ul><li><strong>Manifestations:</strong> A highly aggressive lymphoma, nearly always EBV-positive. The skin is the second most common site after the nasal cavity. Presents as ulcerated plaques and tumors.</li><li><strong>Histopathology:</strong> An angiocentric and angiodestructive infiltrate of atypical NK-cells or cytotoxic T-cells.</li><li><strong>Prognosis:</strong> Very aggressive with a poor prognosis. 5-year disease-specific survival is only 16%.</li></ul>' };

// MF Variants object for reuse
const mf_variants_object = {
    id: 'mf_variants',
    name: 'MF Variants',
    tooltip: { title: 'Mycosis Fungoides Variants', content: 'These are distinct clinicopathologic variants of MF included in the WHO-EORTC classification.' },
    children: [
        { id: 'fmf', name: 'Folliculotropic MF', tooltip: fmf_tooltip },
        { id: 'pagetoid', name: 'Pagetoid Reticulosis', tooltip: pagetoid_tooltip },
        { id: 'gss', name: 'Granulomatous Slack Skin', tooltip: gss_tooltip }
    ]
};

// --- Mind Map Data Structures ---
const mindMapData = {
    'question': {
        id: 'root',
        name: 'CTCL Workup',
        tooltip: { title: 'Central Question', content: 'The core goal is to investigate a chronic, recalcitrant skin rash that could be Cutaneous T-Cell Lymphoma (CTCL). The workup follows a logical path from suspicion to diagnosis, staging, and establishing prognosis.' },
        children: [
            {
                id: 'q1', name: 'Diagnosis & Subtype',
                tooltip: { title: 'Question 1: What is it?', content: 'The first step is to confirm the diagnosis of CTCL and determine its specific subtype through a careful integration of clinical, pathologic, and molecular findings.' },
                children: [
                    { id: 'skin_biopsy', name: 'Skin Biopsy', tooltip: { title: 'Skin Biopsy (Histopathology)', content: '<ul><li><strong>Purpose:</strong> The cornerstone of diagnosis. Multiple biopsies from different areas may be needed.</li><li><strong>Key MF/SS Features:</strong> A superficial infiltrate of <strong>atypical lymphocytes</strong> with cerebriform nuclei.</li><li><strong>Epidermotropism:</strong> Atypical lymphocytes infiltrating the epidermis without significant spongiosis (inflammation).</li><li><strong>Pautrier Microabscesses:</strong> Intraepidermal clusters of atypical lymphocytes; pathognomonic but not always present.</li></ul>' } },
                    { id: 'tcr_skin', name: 'TCR (Skin)', tooltip: { title: 'TCR Gene Rearrangement (Skin)', content: '<ul><li><strong>Purpose:</strong> Detects a dominant T-cell population (a clone), which supports a diagnosis of lymphoma.</li><li><strong>Method:</strong> PCR or High-Throughput Sequencing (HTS) of the T-cell receptor (TCR) gamma chain gene.</li><li><strong>Interpretation:</strong> A positive result (monoclonality) supports CTCL, but is <strong>not diagnostic alone</strong>.</li></ul>' } },
                    { id: 'early_mf_algo', name: 'Early MF Algorithm', tooltip: { title: 'ISCL/EORTC Diagnostic Algorithm', content: 'A point-based system for diagnosing early MF (<strong>≥4 points required</strong>).<ul><li><strong>Clinical (1-2 pts):</strong> Persistent/progressive patches/plaques, non-sun-exposed location.</li><li><strong>Histopathologic (1-2 pts):</strong> Superficial lymphoid infiltrate PLUS epidermotropism without spongiosis.</li><li><strong>Molecular (1 pt):</strong> A clonal TCR gene rearrangement is present.</li><li><strong>Immunopathologic (1 pt):</strong> Loss of T-cell antigens.</li></ul>' } }
                ]
            },
            {
                id: 'q2', name: 'Staging & Extent',
                tooltip: { title: 'Question 2: How extensive is it?', content: 'Once diagnosed, TNMB (Tumor, Node, Metastasis, Blood) staging is performed to determine the disease burden, which is the most important prognostic factor.' },
                children: [
                    { id: 'imaging', name: 'Imaging', tooltip: { title: 'Radiologic Imaging (CT or PET-CT)', content: '<ul><li><strong>Purpose:</strong> To assess for lymphadenopathy (N stage) or visceral organ involvement (M stage).</li><li><strong>Indications:</strong> Recommended for any patient with Sézary syndrome, tumor-stage disease, or palpable lymphadenopathy.</li></ul>' } },
                    { id: 'ln_biopsy', name: 'LN Biopsy', tooltip: { title: 'Lymph Node Biopsy', content: '<ul><li><strong>Purpose:</strong> To pathologically confirm if clinically abnormal lymph nodes contain lymphoma.</li><li><strong>Method:</strong> Excisional biopsy is preferred over core needle or fine needle aspirate.</li></ul>' } },
                    { id: 'tnmb', name: 'TNMB Staging', tooltip: { title: 'TNMB Staging System', content: 'A comprehensive system to classify disease extent:<ul><li><strong>T (Skin):</strong> T1 (<10% BSA), T2 (≥10% BSA), T3 (Tumors), T4 (Erythroderma).</li><li><strong>N (Nodes):</strong> N0 (normal) to N3 (effaced) based on pathology.</li><li><strong>M (Viscera):</strong> M0 (none) or M1 (present).</li><li><strong>B (Blood):</strong> B0 (no significant involvement), B1 (low burden), B2 (high burden/leukemic).</li></ul>' } }
                ]
            },
            {
                id: 'q3', name: 'Systemic Involvement',
                tooltip: { title: 'Question 3: Is it in the blood?', content: 'This is critical for diagnosing Sézary Syndrome and staging advanced disease. Assessment is done via peripheral blood.' },
                children: [
                    { id: 'flow', name: 'Flow Cytometry', tooltip: { title: 'Flow Cytometry (Peripheral Blood)', content: '<ul><li><strong>Purpose:</strong> The preferred method to identify and quantify an aberrant T-cell population in the blood.</li><li><strong>Key Criteria for B2 Blood / SS:</strong> An absolute Sézary cell count of <strong>≥1,000 cells/μL</strong> is the primary criterion.</li></ul>' } },
                    { id: 'tcr_blood', name: 'TCR (Blood)', tooltip: { title: 'TCR Gene Rearrangement (Blood)', content: '<ul><li><strong>Purpose:</strong> To identify a dominant T-cell clone in the blood and compare it to the skin.</li><li><strong>Key Interpretation:</strong> Finding an <strong>identical T-cell clone</strong> in both the blood and a skin biopsy is a key criterion for B2 blood staging and the diagnosis of Sézary Syndrome.</li></ul>' } },
                    { id: 'smear', name: 'Peripheral Smear', tooltip: { title: 'Peripheral Blood Smear', content: '<ul><li><strong>Purpose:</strong> Manual microscopic examination of blood cells.</li><li><strong>Finding:</strong> Identification of "Sézary cells," which are atypical lymphocytes with characteristic cerebriform (convoluted, brain-like) nuclei.</li></ul>' } }
                ]
            },
            {
                id: 'q4', name: 'Baseline & Prognosis',
                tooltip: { title: 'Question 4: What is the baseline health and prognosis?', content: 'Routine labs are performed to establish baseline organ function, rule out mimics, and identify prognostic markers.' },
                children: [
                    { id: 'cbc', name: 'CBC w/ Diff', tooltip: { title: 'Complete Blood Count with Differential', content: '<ul><li><strong>Purpose:</strong> Provides the absolute lymphocyte count needed for Sézary cell calculation.</li></ul>' } },
                    { id: 'cmp', name: 'CMP', tooltip: { title: 'Comprehensive Metabolic Panel', content: '<ul><li><strong>Purpose:</strong> To assess baseline kidney and liver function before initiating potential systemic therapies.</li></ul>' } },
                    { id: 'ldh', name: 'LDH', tooltip: { title: 'Lactate Dehydrogenase', content: '<ul><li><strong>Purpose:</strong> A non-specific tumor marker reflecting cell turnover and disease burden.</li><li><strong>Prognostic Value:</strong> An elevated LDH is an independent adverse prognostic factor in advanced MF/SS.</li></ul>' } },
                    { id: 'htlv', name: 'HTLV-1/2 Serology', tooltip: { title: 'HTLV-1/2 Serology', content: '<ul><li><strong>Purpose:</strong> To rule out Adult T-cell Leukemia/Lymphoma (ATLL), which is caused by the HTLV-1 retrovirus and can clinically mimic MF/SS.</li></ul>' } }
                ]
            }
        ]
    },
    'test': {
        id: 'root',
        name: 'CTCL Tests',
        tooltip: { title: 'CTCL Workup by Test Type', content: 'The diagnostic evaluation for CTCL integrates tests from multiple modalities, from routine blood work to advanced molecular and imaging studies.' },
        children: [
            {
                id: 'basic_labs', name: 'Basic Labs',
                tooltip: { title: 'Basic Laboratory Studies', content: 'These initial blood tests establish the patient\'s baseline health, assess overall disease burden, and identify key prognostic markers.' },
                children: [
                    { id: 'cbc_diff', name: 'CBC w/ Diff', tooltip: { title: 'Complete Blood Count with Differential', content: '<ul><li><strong>Purpose:</strong> Quantifies white blood cells, lymphocytes, and eosinophils. The absolute lymphocyte count is essential for calculating the absolute Sézary cell count.</li></ul>' } },
                    { id: 'cmp_test', name: 'CMP', tooltip: { title: 'Comprehensive Metabolic Panel', content: '<ul><li><strong>Purpose:</strong> Assesses baseline liver and kidney function.</li></ul>' } },
                    { id: 'ldh_test', name: 'LDH', tooltip: { title: 'Lactate Dehydrogenase', content: '<ul><li><strong>Purpose:</strong> A non-specific marker of cell turnover.</li><li><strong>Relevance:</strong> Elevated LDH is an independent adverse prognostic factor in advanced MF/SS.</li></ul>' } }
                ]
            },
            {
                id: 'flow_cytometry', name: 'Flow Cytometry (Blood)',
                tooltip: { title: 'Flow Cytometry (Peripheral Blood)', content: 'The primary method for quantifying blood involvement (B stage) and diagnosing Sézary Syndrome.' },
                children: [
                    { id: 'cd4_cd8', name: 'CD4:CD8 Ratio', tooltip: { title: 'CD4:CD8 Ratio', content: '<ul><li><strong>Purpose:</strong> Measures the ratio of helper (CD4+) to cytotoxic (CD8+) T-cells.</li><li><strong>Relevance:</strong> In SS, a clonal expansion of CD4+ cells often leads to a markedly elevated ratio (>10).</li></ul>' } },
                    { id: 'marker_loss', name: 'T-Cell Marker Loss', tooltip: { title: 'T-Cell Marker Loss', content: '<ul><li><strong>Purpose:</strong> Identifies an aberrant immunophenotype. Neoplastic T-cells often lose surface markers.</li><li><strong>Relevance:</strong> Loss of CD7 or CD26 on CD4+ T-cells is a key diagnostic feature of a malignant clone.</li></ul>' } },
                    { id: 'abs_count', name: 'Absolute Sézary Count', tooltip: { title: 'Absolute Sézary Cell Count', content: '<ul><li><strong>Purpose:</strong> To directly quantify the number of malignant cells in circulation.</li><li><strong>Relevance:</strong> An absolute count of <strong>≥1,000 cells/μL</strong> with an abnormal phenotype and a documented clone is a major criterion for B2 blood involvement.</li></ul>' } }
                ]
            },
            {
                id: 'molecular', name: 'Biopsy & Molecular',
                tooltip: { title: 'Biopsy & Molecular Testing', content: 'Tissue-based and molecular analyses are essential for definitive diagnosis and clonality assessment.' },
                children: [
                    { id: 'skin_biopsy_test', name: 'Skin Biopsy', tooltip: { title: 'Skin Biopsy (Histopathology)', content: '<ul><li><strong>Purpose:</strong> The gold standard for initial diagnosis of MF.</li><li><strong>Method:</strong> A 4mm punch biopsy or deep shave from the most indurated lesion is recommended.</li></ul>' } },
                    { id: 'tcr_test', name: 'TCR Gene Rearrangement', tooltip: { title: 'TCR Gene Rearrangement', content: '<ul><li><strong>Purpose:</strong> Detects monoclonality by identifying a dominant T-cell receptor gene sequence.</li></ul>' } },
                    { id: 'ln_biopsy_test', name: 'Lymph Node Biopsy', tooltip: { title: 'Lymph Node Biopsy', content: '<ul><li><strong>Purpose:</strong> To pathologically confirm lymphoma in clinically suspicious lymph nodes.</li><li><strong>Method:</strong> Excisional biopsy is preferred.</li></ul>' } }
                ]
            },
            {
                id: 'imaging_studies', name: 'Imaging',
                tooltip: { title: 'Radiologic Imaging', content: 'Performed for staging in patients with advanced disease to assess for extracutaneous spread.' },
                children: [
                    { id: 'ct_scan', name: 'CT Scan', tooltip: { title: 'CT Scan with Contrast', content: '<ul><li><strong>Purpose:</strong> To detect enlarged lymph nodes and visceral organ involvement.</li></ul>' } },
                    { id: 'pet_ct', name: 'PET-CT Scan', tooltip: { title: 'PET-CT Scan', content: '<ul><li><strong>Purpose:</strong> More sensitive than CT for detecting metabolically active disease.</li></ul>' } }
                ]
            }
        ]
    },
    'staging': {
        id: 'root',
        name: 'TNMB Staging',
        tooltip: { title: 'MF/SS Staging System', content: 'The TNMB system is the standard for staging Mycosis Fungoides (MF) and Sézary Syndrome (SS). The final clinical stage (IA through IVB) is determined by combining the individual T, N, M, and B scores.' },
        children: [
            {
                id: 't_skin', name: 'T (Skin)',
                tooltip: { title: 'T - Skin Involvement', content: 'Based on the type and percentage of body surface area (BSA) affected by lesions.' },
                children: [
                    { id: 't1', name: 'T1', tooltip: { title: 'T1: Limited Patch/Plaque', content: 'Patches, papules, or plaques covering <10% of the skin surface.' } },
                    { id: 't2', name: 'T2', tooltip: { title: 'T2: Generalized Patch/Plaque', content: 'Patches, papules, or plaques covering ≥10% of the skin surface.' } },
                    { id: 't3', name: 'T3', tooltip: { title: 'T3: Tumor(s)', content: 'One or more tumors that are ≥1 cm in diameter.' } },
                    { id: 't4', name: 'T4', tooltip: { title: 'T4: Erythroderma', content: 'Confluence of erythema covering ≥80% of the skin surface.' } }
                ]
            },
            {
                id: 'n_nodes', name: 'N (Nodes)',
                tooltip: { title: 'N - Lymph Node Involvement', content: 'Based on clinical palpation and, more definitively, on histopathology of a biopsied lymph node.' },
                children: [
                    { id: 'n0', name: 'N0', tooltip: { title: 'N0', content: 'No clinically abnormal peripheral lymph nodes.' } },
                    { id: 'n1', name: 'N1', tooltip: { title: 'N1', content: 'Clinically abnormal nodes, but histopathology shows only dermatopathic changes.' } },
                    { id: 'n2', name: 'N2', tooltip: { title: 'N2', content: 'Clinically abnormal nodes with early lymphoma involvement but preserved nodal architecture.' } },
                    { id: 'n3', name: 'N3 (Lymphoma)', tooltip: { title: 'N3 (Lymphoma)', content: 'Partial or complete effacement of the lymph node architecture by lymphoma.' } },
                    { id: 'nx', name: 'NX', tooltip: { title: 'NX', content: 'Clinically abnormal lymph nodes that have not been biopsied.' } }
                ]
            },
            {
                id: 'm_viscera', name: 'M (Viscera)',
                tooltip: { title: 'M - Visceral Involvement', content: 'Assesses for metastasis to internal organs other than lymph nodes or skin.' },
                children: [
                    { id: 'm0', name: 'M0', tooltip: { title: 'M0', content: 'No visceral organ involvement.' } },
                    { id: 'm1', name: 'M1', tooltip: { title: 'M1', content: 'Visceral involvement confirmed by pathology.' } }
                ]
            },
            {
                id: 'b_blood', name: 'B (Blood)',
                tooltip: { title: 'B - Blood Involvement', content: 'Quantifies the burden of circulating malignant T-cells, primarily by flow cytometry.' },
                children: [
                    { id: 'b0', name: 'B0', tooltip: { title: 'B0: No Significant Involvement', content: 'Absence of significant blood involvement; absolute Sézary count <250/μL.' } },
                    { id: 'b1', name: 'B1', tooltip: { title: 'B1: Low Blood Tumor Burden', content: 'Does not meet the criteria for B0 or B2.' } },
                    { id: 'b2', name: 'B2', tooltip: { title: 'B2: High Blood Tumor Burden', content: 'A key criterion for Sézary Syndrome. Defined by ≥1000/μL circulating Sézary cells.' } }
                ]
            }
        ]
    },
    'subtypes-overall': {
        id: 'root',
        name: 'CTCL Subtypes',
        tooltip: { title: 'Classification of Cutaneous T-Cell Lymphomas', content: 'CTCL is a heterogeneous group of non-Hodgkin T-cell lymphomas. Subtypes are defined by distinct clinical, pathologic, and molecular characteristics.' },
        children: [
            {
                id: 'mf_ss', name: 'MF & SS Spectrum',
                tooltip: { title: 'Mycosis Fungoides & Sézary Syndrome Spectrum', content: 'The most common types of CTCL, representing a spectrum from indolent skin-limited disease to aggressive leukemic disease. They account for ~65% of all CTCLs.' },
                children: [
                    { id: 'classic_mf', name: 'Classic MF', tooltip: classic_mf_tooltip },
                    { id: 'ss', name: 'Sézary Syndrome', tooltip: ss_tooltip },
                    mf_variants_object
                ]
            },
            {
                id: 'cd30_lpds', name: 'CD30+ LPDs',
                tooltip: { title: 'Primary Cutaneous CD30+ Lymphoproliferative Disorders', content: 'A spectrum of diseases defined by the expression of the CD30 antigen. They generally have an excellent prognosis and account for ~25% of all CTCLs.' },
                children: [
                    { id: 'pcalcl', name: 'PC-ALCL', tooltip: pcalcl_tooltip },
                    { id: 'lyp', name: 'LyP', tooltip: lyp_tooltip }
                ]
            },
            {
                id: 'rare_subtypes', name: 'Rarer Subtypes',
                tooltip: { title: 'Rarer CTCL Subtypes', content: 'A diverse group of less common CTCLs, many of which have an aggressive clinical course and poor prognosis. They account for ~10% of all CTCLs.' },
                children: [
                    { id: 'sptcl', name: 'SPTCL', tooltip: sptcl_tooltip },
                    { id: 'pcgd', name: 'PCGD-TCL', tooltip: pcgd_tooltip },
                    { id: 'aectcl', name: 'CD8+ AECTCL', tooltip: aectcl_tooltip },
                    { id: 'atll', name: 'ATLL', tooltip: atll_tooltip },
                    { id: 'pcsm', name: 'PC CD4+ S/M TCLPD', tooltip: pcsm_tooltip },
                    { id: 'acral_cd8_overall', name: 'PC Acral CD8+ TCLPD', tooltip: acral_cd8_tooltip },
                    { id: 'enktcl_overall', name: 'ENKTCL', tooltip: enktcl_tooltip }
                ]
            }
        ]
    },
    'subtypes-immuno': {
        id: 'root',
        name: 'By Immunophenotype',
        tooltip: { title: 'Classification by Immunophenotype', content: 'Grouping CTCL subtypes based on their characteristic T-cell surface marker expression provides a framework for understanding their lineage and potential biologic behavior.' },
        children: [
            {
                id: 'cd4_pos', name: 'CD4+ Predominant',
                tooltip: { title: 'CD4-Positive Subtypes', content: 'These lymphomas typically arise from a clonal expansion of CD4+ helper T-cells.' },
                children: [
                    { id: 'mf_ss_cd4', name: 'MF / Sézary Syndrome', tooltip: ss_tooltip },
                    { id: 'atll_cd4', name: 'ATLL', tooltip: atll_tooltip },
                    { id: 'pcsm_cd4', name: 'PC CD4+ S/M TCLPD', tooltip: pcsm_tooltip }
                ]
            },
            {
                id: 'cd8_pos', name: 'CD8+ Predominant',
                tooltip: { title: 'CD8-Positive Subtypes', content: 'These lymphomas typically arise from a clonal expansion of CD8+ cytotoxic T-cells.' },
                children: [
                    { id: 'sptcl_cd8', name: 'SPTCL', tooltip: sptcl_tooltip },
                    { id: 'aectcl_cd8', name: 'CD8+ AECTCL', tooltip: aectcl_tooltip },
                    { id: 'acral_cd8', name: 'PC Acral CD8+ TCLPD', tooltip: acral_cd8_tooltip },
                    { id: 'hypo_mf', name: 'Hypopigmented MF', tooltip: { title: 'Hypopigmented Mycosis Fungoides', content: 'A clinical variant of MF often seen in younger and darkly pigmented individuals. It is typically characterized by a CD8+ phenotype.' } }
                ]
            },
            {
                id: 'cd30_pos', name: 'CD30+ Predominant',
                tooltip: { title: 'CD30-Positive Subtypes', content: 'These lymphoproliferative disorders are defined by strong expression of the CD30 activation marker on the majority of neoplastic cells.' },
                children: [
                    { id: 'pcalcl_cd30', name: 'PC-ALCL', tooltip: pcalcl_tooltip },
                    { id: 'lyp_cd30', name: 'LyP', tooltip: lyp_tooltip },
                    { id: 'mf_lct_cd30', name: 'MF with LCT', tooltip: { title: 'MF with Large Cell Transformation', content: 'A poor prognostic feature in advanced MF. The large transformed cells often acquire strong CD30 expression, making it a therapeutic target for agents like brentuximab vedotin.' } }
                ]
            },
            {
                id: 'gamma_delta', name: 'Gamma-Delta (γδ)',
                tooltip: { title: 'Gamma-Delta T-Cell Subtypes', content: 'Lymphomas arising from the γδ T-cell lineage, which are distinct from the more common αβ T-cell lymphomas.' },
                children: [
                    { id: 'pcgd_gd', name: 'PCGD-TCL', tooltip: pcgd_tooltip }
                ]
            },
            {
                id: 'nk_cell', name: 'NK/T-Cell',
                tooltip: { title: 'NK/T-Cell Subtypes', content: 'Lymphomas arising from Natural Killer (NK) cells or cytotoxic T-cells, often associated with EBV.' },
                children: [
                    { id: 'enktcl_nk', name: 'ENKTCL, Nasal Type', tooltip: enktcl_tooltip }
                ]
            }
        ]
    },
    'subtypes-pattern': {
        id: 'root',
        name: 'By Histologic Pattern',
        tooltip: { title: 'Classification by Histologic Pattern', content: 'Grouping CTCLs based on their primary site of infiltration within the skin can provide diagnostic clues and reflect their underlying biology.' },
        children: [
            {
                id: 'epidermotropic', name: 'Epidermotropic',
                tooltip: { title: 'Epidermotropic Pattern', content: 'The defining feature is the infiltration of neoplastic lymphocytes into the epidermis. This pattern is characteristic of early-stage Mycosis Fungoides.' },
                children: [
                    { id: 'mf_patch_epi', name: 'MF (Patch/Plaque)', tooltip: classic_mf_tooltip },
                    { id: 'aectcl_epi', name: 'CD8+ AECTCL', tooltip: aectcl_tooltip },
                    { id: 'lyp_epi', name: 'LyP (Type B & D)', tooltip: lyp_tooltip },
                    { id: 'pagetoid_epi', name: 'Pagetoid Reticulosis', tooltip: pagetoid_tooltip }
                ]
            },
            {
                id: 'dermal_mixed', name: 'Dermal / Nodular',
                tooltip: { title: 'Dermal or Nodular Pattern', content: 'The infiltrate is primarily or exclusively located in the dermis, often forming nodules or diffuse sheets of cells. The epidermis is typically spared.' },
                children: [
                    { id: 'mf_tumor_dermal', name: 'MF (Tumor Stage)', tooltip: classic_mf_tooltip },
                    { id: 'pcsm_dermal', name: 'PC CD4+ S/M TCLPD', tooltip: pcsm_tooltip },
                    { id: 'pcalcl_dermal', name: 'PC-ALCL', tooltip: pcalcl_tooltip },
                    { id: 'lyp_dermal', name: 'LyP (Type A, C, E)', tooltip: lyp_tooltip },
                    { id: 'acral_cd8_dermal', name: 'PC Acral CD8+ TCLPD', tooltip: acral_cd8_tooltip }
                ]
            },
            {
                id: 'subcutis', name: 'Subcutis (Panniculitic)',
                tooltip: { title: 'Panniculitic Pattern', content: 'The lymphoma cells primarily infiltrate the subcutaneous fat, mimicking inflammatory panniculitis.' },
                children: [
                    { id: 'sptcl_sub', name: 'SPTCL', tooltip: sptcl_tooltip },
                    { id: 'pcgd_sub', name: 'PCGD-TCL', tooltip: pcgd_tooltip },
                    { id: 'enktcl_sub', name: 'ENKTCL', tooltip: enktcl_tooltip }
                ]
            }
        ]
    },
    'subtypes-ebv': {
        id: 'root',
        name: 'By EBV Association',
        tooltip: { title: 'Classification by EBV Association', content: 'The role of Epstein-Barr Virus (EBV) varies among lymphoproliferative disorders. In some, it is a key pathogenic driver, while in most CTCLs, it is absent.' },
        children: [
            {
                id: 'ebv_pos', name: 'EBV-Positive',
                tooltip: { title: 'EBV-Positive Lymphoproliferative Disorders', content: 'These lymphomas are pathogenically linked to EBV infection. EBV can be detected in the tumor cells via in-situ hybridization (EBER).' },
                children: [
                    { id: 'enktcl_ebv', name: 'ENKTCL, Nasal Type', tooltip: enktcl_tooltip },
                    { id: 'caebv', name: 'Chronic Active EBV Infection', tooltip: { title: 'Chronic Active EBV Infection of T/NK-cell Type', content: 'A systemic lymphoproliferative disorder driven by EBV, which can have significant cutaneous manifestations like hydroa vacciniforme-like lesions.' } },
                    { id: 'ebv_mcu', name: 'EBV+ Mucocutaneous Ulcer', tooltip: { title: 'EBV+ Mucocutaneous Ulcer', content: 'An indolent, self-limited ulceration of the skin or mucosa, typically seen in elderly or immunosuppressed patients. It is a B-cell lymphoproliferative disorder, not a CTCL.' } }
                ]
            },
            {
                id: 'ebv_neg', name: 'Typically EBV-Negative',
                tooltip: { title: 'Typically EBV-Negative Lymphomas', content: 'The vast majority of common CTCL subtypes are not associated with Epstein-Barr Virus.' },
                children: [
                    { id: 'mf_ss_ebv', name: 'MF / Sézary Syndrome', tooltip: classic_mf_tooltip },
                    { id: 'cd30_lpd_ebv', name: 'CD30+ LPDs', tooltip: pcalcl_tooltip },
                    { id: 'sptcl_ebv', name: 'SPTCL', tooltip: sptcl_tooltip }
                ]
            }
        ]
    },
    'treatment': {
        id: 'root',
        name: 'Treatment by Therapy Type',
        tooltip: { title: 'CTCL Treatment Overview', content: 'Treatment is stage-adapted, prioritizing immune-preserving, skin-directed therapies for early disease and escalating to systemic agents for advanced or refractory cases. The goal is long-term disease control and palliation, not cure.' },
        children: [
            {
                id: 'sdt', name: 'Skin-Directed Therapies',
                tooltip: { title: 'Skin-Directed Therapies (SDT)', content: 'Cornerstone of treatment for early-stage MF (IA-IIA). Can be used as adjunctive therapy at any stage to control skin-based symptoms.' },
                children: [
                    { id: 'topical_steroids', name: 'Topical Corticosteroids', tooltip: { title: 'Topical Corticosteroids', content: '<ul><li><strong>Mechanism:</strong> Anti-inflammatory, antimitotic, and immunosuppressive.</li><li><strong>Use:</strong> Preferred first-line option for Stage IA MF; adjunctive use for pruritus at all stages.</li></ul>' } },
                    { id: 'mechlorethamine', name: 'Topical Mechlorethamine', tooltip: { title: 'Topical Mechlorethamine (Nitrogen Mustard)', content: '<ul><li><strong>Mechanism:</strong> Topical alkylating agent (chemotherapy).</li><li><strong>Use:</strong> First- or second-line for Stage IA/IB MF.</li></ul>' } },
                    {
                        id: 'phototherapy', name: 'Phototherapy',
                        tooltip: { title: 'Phototherapy', content: 'Used for generalized patch or plaque disease.' },
                        children: [
                            { id: 'nb_uvb', name: 'NB-UVB', tooltip: { title: 'Narrowband UVB (NB-UVB)', content: '<ul><li><strong>Use:</strong> Effective for patch-stage disease (T1a/T2a).</li></ul>' } },
                            { id: 'puva', name: 'PUVA', tooltip: { title: 'Psoralen + UVA (PUVA)', content: '<ul><li><strong>Use:</strong> Deeper penetration makes it effective for thicker plaques (T1b/T2b).</li></ul>' } }
                        ]
                    },
                    {
                        id: 'radiation', name: 'Radiation Therapy',
                        tooltip: { title: 'Radiation Therapy', content: 'Highly effective for inducing local responses.' },
                        children: [
                            { id: 'localized_rt', name: 'Localized Radiation', tooltip: { title: 'Localized Radiation Therapy', content: '<ul><li><strong>Use:</strong> For solitary tumors (Stage IIB) or refractory plaques.</li></ul>' } },
                            { id: 'tsebt', name: 'TSEBT', tooltip: { title: 'Total Skin Electron Beam Therapy (TSEBT)', content: '<ul><li><strong>Use:</strong> For widespread, thick, recalcitrant plaques or tumors.</li></ul>' } }
                        ]
                    }
                ]
            },
            {
                id: 'systemic', name: 'Systemic Therapies',
                tooltip: { title: 'Systemic Therapies', content: 'Used for advanced-stage disease (≥IIB), erythrodermic disease, Sézary syndrome, or early-stage disease refractory to SDTs.' },
                children: [
                    {
                        id: 'immunomodulators', name: 'Immunomodulators',
                        tooltip: { title: 'Immunomodulatory Therapies', content: 'Agents that work by modulating the patient\'s immune system to fight the lymphoma.' },
                        children: [
                            { id: 'ecp', name: 'ECP', tooltip: { title: 'Extracorporeal Photopheresis (ECP)', content: '<ul><li><strong>Use:</strong> A first-line treatment for Sézary syndrome and erythrodermic MF.</li></ul>' } },
                            { id: 'interferons', name: 'Interferons', tooltip: { title: 'Interferons (IFN-α)', content: '<ul><li><strong>Use:</strong> For advanced or refractory MF/SS. Often combined with other therapies.</li></ul>' } },
                            { id: 'retinoids_sys', name: 'Systemic Retinoids', tooltip: { title: 'Systemic Retinoids (Bexarotene)', content: '<ul><li><strong>Use:</strong> For advanced or refractory MF/SS.</li><li><strong>Mechanism:</strong> Binds to the retinoid X receptor (RXR), inducing apoptosis.</li></ul>' } }
                        ]
                    },
                    {
                        id: 'targeted_biologics', name: 'Targeted Biologics',
                        tooltip: { title: 'Targeted Biologics & Antibody-Drug Conjugates', content: 'Modern agents targeting specific molecules on malignant cells.' },
                        children: [
                            { id: 'brentuximab', name: 'Brentuximab Vedotin', tooltip: { title: 'Brentuximab Vedotin', content: '<ul><li><strong>Use:</strong> A preferred agent for tumor-stage MF, large cell transformation, and CD30+ LPDs.</li><li><strong>Mechanism:</strong> Antibody-drug conjugate targeting CD30.</li></ul>' } },
                            { id: 'mogamulizumab', name: 'Mogamulizumab', tooltip: { title: 'Mogamulizumab', content: '<ul><li><strong>Use:</strong> A preferred agent for high-burden Sézary Syndrome and relapsed/refractory MF/SS.</li><li><strong>Mechanism:</strong> Monoclonal antibody targeting CCR4.</li></ul>' } }
                        ]
                    },
                    {
                        id: 'chemo_sys', name: 'Chemotherapy',
                        tooltip: { title: 'Systemic Chemotherapy', content: 'Reserved for rapidly progressive, advanced, or refractory disease.' },
                        children: [
                            { id: 'single_agent_chemo', name: 'Single-Agent Chemo', tooltip: { title: 'Single-Agent Chemotherapy', content: '<ul><li><strong>Examples:</strong> Gemcitabine, Pegylated Liposomal Doxorubicin, Pralatrexate.</li></ul>' } },
                            { id: 'hdac_inhibitors', name: 'HDAC Inhibitors', tooltip: { title: 'HDAC Inhibitors (Vorinostat, Romidepsin)', content: '<ul><li><strong>Use:</strong> For relapsed/refractory MF/SS after prior systemic therapies.</li></ul>' } }
                        ]
                    },
                    { id: 'hsct_sys', name: 'Allogeneic HSCT', tooltip: { title: 'Allogeneic Stem Cell Transplant (HSCT)', content: '<ul><li><strong>Use:</strong> The only potentially curative option, reserved for young, fit patients with aggressive, refractory disease.</li></ul>' } }
                ]
            }
        ]
    },
    'treatment-stage': {
        id: 'root',
        name: 'Treatment by Stage',
        tooltip: { title: 'Treatment by Stage', content: 'CTCL treatment follows a stage-adapted approach. Early-stage disease is managed with skin-directed therapies, while advanced disease requires systemic agents. The goal is long-term disease control, not cure.' },
        children: [
            {
                id: 'early_mf', name: 'Early-Stage MF (IA-IIA)',
                tooltip: { title: 'Early-Stage Mycosis Fungoides (Stage IA to IIA)', content: 'Primary goal is symptom palliation using skin-directed therapies.' },
                children: [
                    {
                        id: 'stage_ia', name: 'Stage IA (<10% BSA)',
                        tooltip: { title: 'Stage IA Management', content: 'Focus on clearing limited skin lesions with minimal toxicity. "Watchful waiting" is an option for asymptomatic disease.' },
                        children: [
                            { id: 'ia_first_line', name: 'First-Line', tooltip: { title: 'First-Line Therapies for Stage IA', content: '<ul><li><strong>Topical Corticosteroids:</strong> High-potency steroids are often the initial choice.</li><li><strong>Topical Mechlorethamine:</strong> An alternative first-line option.</li><li><strong>Phototherapy (NB-UVB):</strong> For widespread but thin patches.</li></ul>' } },
                            { id: 'ia_refractory', name: 'Refractory/Localized', tooltip: { title: 'Refractory/Localized Stage IA Lesions', content: '<ul><li><strong>Localized Radiation:</strong> Highly effective for a single resistant plaque.</li></ul>' } }
                        ]
                    },
                    {
                        id: 'stage_ib_iia', name: 'Stage IB/IIA (≥10% BSA)',
                        tooltip: { title: 'Stage IB / IIA Management', content: 'Requires therapies that can cover larger skin surface areas. Systemic therapy may be added for refractory disease.' },
                        children: [
                            { id: 'ib_primary', name: 'Primary Therapies', tooltip: { title: 'Primary Therapies for Stage IB/IIA', content: '<ul><li><strong>Phototherapy (PUVA):</strong> Preferred for thicker, more extensive plaques.</li><li><strong>TSEBT (Total Skin Electron Beam):</strong> Low-dose (10-12 Gy) is effective for widespread plaques.</li></ul>' } },
                            { id: 'ib_adjunctive', name: 'Adjunctive Systemic Therapies', tooltip: { title: 'Adjunctive Systemic Therapies for Stage IB/IIA', content: 'Added to skin-directed therapies for symptomatic or progressive disease. Low-toxicity agents like oral bexarotene are preferred initially.' } }
                        ]
                    }
                ]
            },
            {
                id: 'advanced_mf', name: 'Advanced-Stage MF (IIB-IV) & SS',
                tooltip: { title: 'Advanced-Stage MF & Sézary Syndrome', content: 'Management requires systemic therapy to control skin, blood, lymph node, and/or visceral involvement. Skin-directed therapies are often used adjunctively.' },
                children: [
                    { id: 'stage_iib', name: 'Stage IIB (Tumors)', tooltip: { title: 'Stage IIB Management (Tumors)', content: '<ul><li><strong>Limited Tumors:</strong> Localized radiation is the primary treatment.</li><li><strong>Generalized Tumors:</strong> <strong>Brentuximab vedotin</strong> is a preferred systemic option.</li></ul>' } },
                    {
                        id: 'stage_iii_ss', name: 'Stage III (Erythroderma) & Sézary Syndrome',
                        tooltip: { title: 'Stage III & SS Management', content: 'Treatment must target both widespread skin disease and systemic/blood involvement.' },
                        children: [
                            { id: 'ss_first', name: 'First-Line Systemic', tooltip: { title: 'First-Line Systemic Therapies for SS/Stage III', content: '<ul><li><strong>ECP (Extracorporeal Photopheresis):</strong> A standard of care, especially for SS.</li><li><strong>Mogamulizumab:</strong> Highly effective for clearing blood.</li></ul>' } },
                            { id: 'ss_second', name: 'Second-Line Systemic', tooltip: { title: 'Second-Line Therapies for SS/Stage III', content: 'For refractory disease. Options include Romidepsin, Alemtuzumab, or Pembrolizumab.' } }
                        ]
                    },
                    {
                        id: 'stage_iv', name: 'Stage IV (Extracutaneous)',
                        tooltip: { title: 'Stage IV Management (Nodal/Visceral)', content: 'Indicates aggressive disease requiring potent systemic therapy.' },
                        children: [
                            { id: 'iv_primary', name: 'Primary Options', tooltip: { title: 'Primary Options for Stage IV', content: 'Agents with proven efficacy in advanced disease: <strong>Brentuximab vedotin, Romidepsin, Pralatrexate</strong>.' } },
                            { id: 'iv_aggressive', name: 'Aggressive/Refractory', tooltip: { title: 'Aggressive or Refractory Stage IV', content: '<ul><li><strong>Single-Agent Chemo:</strong> Gemcitabine or liposomal doxorubicin for rapid disease control.</li><li><strong>Allogeneic HSCT:</strong> The only curative option, considered for eligible high-risk patients.</li></ul>' } }
                        ]
                    }
                ]
            },
            {
                id: 'cd30_lpd_tx', name: 'CD30+ LPDs (pcALCL & LyP)',
                tooltip: { title: 'Treatment of CD30+ LPDs', content: 'Management is generally conservative due to the excellent prognosis.' },
                children: [
                    {
                        id: 'cd30_localized', name: 'Solitary / Localized Disease',
                        tooltip: { title: 'Solitary or Localized CD30+ LPDs', content: 'Management for single or few lesions.' },
                        children: [
                            { id: 'cd30_obs', name: 'Observation', tooltip: { title: 'Observation', content: 'Reasonable for LyP due to spontaneous regression.' } },
                            { id: 'cd30_exc_rad', name: 'Excision / Radiotherapy', tooltip: { title: 'Excision or Radiotherapy', content: 'First-line options for solitary pcALCL.' } },
                            { id: 'cd30_steroids', name: 'Topical/Intralesional Corticosteroids', tooltip: { title: 'Corticosteroids for CD30+ LPDs', content: 'Can be used for localized lesions.' } }
                        ]
                    },
                    {
                        id: 'cd30_widespread', name: 'Multifocal / Widespread Disease',
                        tooltip: { title: 'Multifocal or Widespread CD30+ LPDs', content: 'Management for multiple lesions.' },
                        children: [
                            { id: 'cd30_mtx', name: 'Low-Dose Methotrexate', tooltip: { title: 'Low-Dose Methotrexate', content: 'Most effective for widespread LyP and an option for multifocal pcALCL.' } },
                            { id: 'cd30_puva', name: 'Phototherapy (PUVA)', tooltip: { title: 'Phototherapy (PUVA)', content: 'Effective for widespread LyP.' } },
                            { id: 'cd30_brentuximab', name: 'Brentuximab Vedotin', tooltip: { title: 'Brentuximab Vedotin', content: 'Used for multifocal/symptomatic pcALCL and refractory LyP.' } }
                        ]
                    }
                ]
            },
            {
                id: 'rare_ctcl_tx', name: 'Rare CTCL Subtypes',
                tooltip: { title: 'Treatment of Rare CTCL Subtypes', content: 'Approach depends on the specific subtype\'s behavior (indolent vs. aggressive).' },
                children: [
                    {
                        id: 'rare_agg', name: 'Aggressive Subtypes',
                        tooltip: { title: 'Aggressive Subtypes (PCGD-TCL, AECTCL)', content: 'Rare, aggressive diseases with poor prognosis.' },
                        children: [
                            { id: 'rare_chemo', name: 'Multi-Agent Chemo', tooltip: { title: 'Multi-Agent Chemotherapy', content: 'Typically treated with regimens designed for peripheral T-cell lymphoma.' } }
                        ]
                    },
                    {
                        id: 'rare_indolent', name: 'Indolent Subtypes',
                        tooltip: { title: 'Indolent Subtypes (Acral CD8+, CD4+ S/M)', content: 'Present with solitary lesions and have excellent prognosis.' },
                        children: [
                            { id: 'rare_exc_rad', name: 'Excision or Local RT', tooltip: { title: 'Excision or Local Radiotherapy', content: 'Typical treatment for indolent subtypes.' } }
                        ]
                    }
                ]
            }
        ]
    }
};
