// js/data.js

const mindMapDataByClassification = {id:'root',name:'Blister Level',tooltip:{title:'Classification by Level of Split',content:'The fundamental histopathologic branch point for diagnosing autoimmune bullous diseases is the location of the blister within or below the epidermis. This guides the entire diagnostic workup.'},children:[{id:'intraepi',name:'Intraepidermal',tooltip:{title:'Intraepidermal Blistering',content:'Blisters form due to loss of adhesion between keratinocytes (acantholysis). These blisters are typically flaccid and rupture easily, leaving erosions.'},children:[{id:'suprabasal',name:'Suprabasal Split',tooltip:{title:'Suprabasal Split',content:'Cleavage occurs just above the basal cell layer, leaving a "row of tombstones." Caused by autoantibodies against desmosomal proteins.'},children:[{id:'pv_class',name:'Pemphigus Vulgaris'},{id:'pnp_class',name:'Paraneoplastic Pemphigus'}]},{id:'subcorneal',name:'Subcorneal/Granular Split',tooltip:{title:'Subcorneal or Granular Layer Split',content:'A very superficial split high in the epidermis. Blisters are extremely fragile.'},children:[{id:'pf_class',name:'Pemphigus Foliaceus'},{id:'iga_class',name:'IgA Pemphigus'}]}]},{id:'subepi',name:'Subepidermal',tooltip:{title:'Subepidermal Blistering',content:'Blisters form due to detachment of the entire epidermis from the underlying dermis at the basement membrane zone. These blisters are typically tense and remain intact.'},children:[{id:'eosinophilic_split',name:'Eosinophil-Predominant',tooltip:{title:'Eosinophil-Rich Infiltrate',content:'The inflammatory infiltrate in the dermis is primarily composed of eosinophils.'},children:[{id:'bp_class',name:'Bullous Pemphigoid'},{id:'pg_class',name:'Pemphigoid Gestationis'}]},{id:'neutrophilic_split',name:'Neutrophil-Predominant',tooltip:{title:'Neutrophil-Rich Infiltrate',content:'The inflammatory infiltrate in the dermis is primarily composed of neutrophils, often forming microabscesses in the dermal papillae.'},children:[{id:'dh_class',name:'Dermatitis Herpetiformis'},{id:'liga_class',name:'Linear IgA Bullous Dermatosis'},{id:'bsle_class',name:'Bullous SLE'}]},{id:'pauci_split',name:'Paucicellular',tooltip:{title:'Paucicellular (Non-inflammatory)',content:'Blistering occurs with minimal to no associated inflammation. Often associated with scarring.'},children:[{id:'eba_class',name:'Epidermolysis Bullosa Acquisita'},{id:'pct_class',name:'Porphyria Cutanea Tarda'}]}]}]};

const mindMapDataByWorkup = {id:'root',name:'Diagnostic Workup',tooltip:{title:'Diagnostic Toolkit',content:'A multi-modal approach is required for accurate diagnosis, combining clinical findings with histology, immunofluorescence, and serology.'},children:[{id:'biopsy',name:'Skin Biopsy',tooltip:{title:'Skin Biopsy',content:'The cornerstone of diagnosis. Two biopsies are typically required.'},children:[{id:'lesional',name:'Lesional Biopsy (for H&E)',tooltip:{title:'Lesional Biopsy (for Histology)',content:'<ul><li><strong>Purpose:</strong> To determine the level of the split (intraepidermal vs. subepidermal) and characterize the inflammatory infiltrate.</li><li><strong>Technique:</strong> A 4mm punch biopsy from the edge of a fresh, intact blister is ideal.</li></ul>'}},{id:'perilesional',name:'Perilesional Biopsy (for DIF)',tooltip:{title:'Perilesional Biopsy (for Direct Immunofluorescence)',content:'<ul><li><strong>Purpose:</strong> To detect in-vivo deposition of autoantibodies and complement in the patient\'s skin.</li><li><strong>Technique:</strong> A 4mm punch biopsy from normal-appearing skin immediately adjacent to a blister. Must be placed in special transport medium (e.g., Michel\'s or Zeus), NOT formalin.</li></ul>'}}]}, {id:'if',name:'Immunofluorescence',tooltip:{title:'Immunofluorescence (IF)',content:'Techniques to visualize the location and pattern of autoantibody deposition.'},children:[{id:'dif',name:'Direct IF (DIF)',tooltip:{title:'Direct Immunofluorescence (DIF)',content:'<ul><li><strong>What it Shows:</strong> Detects antibodies directly deposited in the patient\'s skin.</li><li><strong>Pemphigus Pattern:</strong> Intercellular ("net-like" or "chicken wire") deposition of IgG and C3 within the epidermis.</li><li><strong>Pemphigoid Pattern:</strong> Linear deposition of IgG and/or C3 along the basement membrane zone.</li><li><strong>DH Pattern:</strong> Granular IgA deposits in the dermal papillae.</li></ul>'}},{id:'iif',name:'Indirect IF (IIF)',tooltip:{title:'Indirect Immunofluorescence (IIF)',content:'<ul><li><strong>What it Shows:</strong> Detects circulating autoantibodies in the patient\'s serum.</li><li><strong>Technique:</strong> Patient serum is incubated with a substrate (e.g., monkey esophagus, salt-split skin).</li></ul>'}},{id:'sss',name:'IIF on Salt-Split Skin',tooltip:{title:'Salt-Split Skin IIF',content:'<ul><li><strong>Purpose:</strong> The critical test to differentiate subepidermal bullous diseases. Skin is artificially split at the lamina lucida.</li><li><strong>Roof Staining (Epidermal):</strong> Antibodies bind to the top of the split. Classic for <strong>Bullous Pemphigoid</strong>.</li><li><strong>Floor Staining (Dermal):</strong> Antibodies bind to the bottom of the split. Classic for <strong>Epidermolysis Bullosa Acquisita</strong> and <strong>Bullous SLE</strong>.</li></ul>'}}]}, {id:'serology',name:'Serology (ELISA)',tooltip:{title:'Serology (ELISA)',content:'Enzyme-linked immunosorbent assays that detect and quantify circulating antibodies against specific target antigens. Titers often correlate with disease activity.'},children:[{id:'pemphigus_elisa',name:'Pemphigus Antigens',tooltip:{title:'Pemphigus Antigens',content:'<ul><li><strong>Desmoglein 3 (DSG3):</strong> Primarily associated with Pemphigus Vulgaris, especially mucosal involvement.</li><li><strong>Desmoglein 1 (DSG1):</strong> Primarily associated with Pemphigus Foliaceus and the cutaneous lesions of Pemphigus Vulgaris.</li></ul>'}},{id:'pemphigoid_elisa',name:'Pemphigoid Antigens',tooltip:{title:'Pemphigoid Antigens',content:'<ul><li><strong>BP180 (Type XVII Collagen):</strong> The primary pathogenic antigen in Bullous Pemphigoid.</li><li><strong>BP230:</strong> Another major antigen in Bullous Pemphigoid.</li><li><strong>Type VII Collagen:</strong> The target antigen in Epidermolysis Bullosa Acquisita and Bullous SLE.</li></ul>'}}]}]};

const mindMapDataByTreatment = {id:'root',name:'By Modality',tooltip:{title:'Therapeutic Modalities',content:'Treatment aims to suppress autoantibody production and inflammation to stop blistering and promote healing.'},children:[{id:'steroids_tx',name:'Corticosteroids',tooltip:{title:'Corticosteroids',content:'The mainstay of initial therapy for most autoimmune bullous diseases to gain rapid control of inflammation.'},children:[{id:'topical_steroids_tx',name:'High-Potency Topicals',tooltip:{title:'High-Potency Topical Steroids',content:'(e.g., Clobetasol) A first-line, preferred treatment for localized or even generalized Bullous Pemphigoid, as it has fewer systemic side effects than oral steroids.'}},{id:'systemic_steroids_tx',name:'Systemic Steroids',tooltip:{title:'Systemic Steroids',content:'(e.g., Prednisone) Required for most cases of Pemphigus and severe cases of other bullous diseases to induce remission.'}}]}, {id:'immunosuppressants_tx',name:'Conventional Immunosuppressants',tooltip:{title:'Conventional Immunosuppressants ("Steroid-Sparing" Agents)',content:'Added to systemic steroids to allow for dose reduction and long-term maintenance, minimizing steroid toxicity.'},children:[{id:'aza_mmf',name:'Antimetabolites',tooltip:{title:'Antimetabolites',content:'<ul><li><strong>Mycophenolate Mofetil (MMF)</strong></li><li><strong>Azathioprine</strong></li><li>Both are commonly used as first-line steroid-sparing agents in Pemphigus and Pemphigoid.</li></ul>'}},{id:'dapsone_tx',name:'Dapsone',tooltip:{title:'Dapsone',content:'A sulfone antibiotic with potent anti-neutrophilic effects. It is the absolute first-line treatment for Dermatitis Herpetiformis and Linear IgA Bullous Dermatosis.'}},{id:'tetracyclines_tx',name:'Tetracyclines',tooltip:{title:'Tetracyclines & Nicotinamide',content:'(e.g., Doxycycline, Minocycline) A well-tolerated combination with anti-inflammatory properties, often used for milder Bullous Pemphigoid.'}}]}, {id:'biologics_tx',name:'Biologic & Targeted Therapy',tooltip:{title:'Biologic & Targeted Therapies',content:'Highly specific agents for refractory or severe disease.'},children:[{id:'rituximab_tx',name:'Rituximab',tooltip:{title:'Rituximab',content:'A monoclonal antibody that depletes B-cells (the source of autoantibodies). Now a first-line agent, along with steroids, for moderate-to-severe Pemphigus.'}},{id:'ivig_tx',name:'IVIG',tooltip:{title:'Intravenous Immunoglobulin (IVIG)',content:'A pool of human antibodies thought to work by neutralizing pathogenic autoantibodies. Used for severe, refractory disease.'}},{id:'other_targeted_tx',name:'Other Agents',tooltip:{title:'Other Targeted Therapies',content:'Includes agents like Dupilumab and Omalizumab for Bullous Pemphigoid.'}}]}]};

const mindMapDataCompendiumPV = {
    id: 'root',
    name: 'Pemphigus Vulgaris',
    tooltip: {
        title: 'Pemphigus Vulgaris (PV)',
        content: 'An autoimmune blistering disease characterized by flaccid bullae and painful erosions on skin and mucous membranes. It is potentially life-threatening if untreated.'
    },
    children: [
        {
            id: 'patho_pv',
            name: 'Pathophysiology',
            tooltip: {
                title: 'Pathophysiology of PV',
                content: 'Understanding the molecular mechanisms of pemphigus vulgaris'
            },
            children: [
                {
                    id: 'pv_target_antigens',
                    name: 'Target Antigens',
                    tooltip: {
                        title: 'Target Antigens',
                        content: 'Autoantibodies (IgG) against Desmoglein 3 (DSG3) and/or Desmoglein 1 (DSG1)'
                    }
                },
                {
                    id: 'pv_acantholysis',
                    name: 'Acantholysis',
                    tooltip: {
                        title: 'Acantholysis',
                        content: 'Antibodies disrupt desmosomal adhesion, causing keratinocytes to separate'
                    }
                },
                {
                    id: 'pv_blister_level',
                    name: 'Blister Level',
                    tooltip: {
                        title: 'Blister Level',
                        content: 'Leads to a suprabasal intraepidermal split'
                    }
                }
            ]
        },
        {
            id: 'clinical_pv',
            name: 'Clinical Features',
            tooltip: {
                title: 'Clinical Features of PV',
                content: 'Key clinical manifestations and physical findings'
            },
            children: [
                {
                    id: 'pv_mucosal',
                    name: 'Mucosal Erosions',
                    tooltip: {
                        title: 'Mucosal Erosions',
                        content: 'Painful oral erosions are the first sign in ~70% of patients'
                    }
                },
                {
                    id: 'pv_cutaneous',
                    name: 'Cutaneous Bullae',
                    tooltip: {
                        title: 'Cutaneous Bullae',
                        content: 'Flaccid, fragile blisters on normal-appearing skin that rupture easily to form widespread, painful erosions'
                    }
                },
                {
                    id: 'pv_nikolsky',
                    name: 'Nikolsky Sign',
                    tooltip: {
                        title: 'Nikolsky Sign',
                        content: 'Positive. Gentle pressure on the skin causes the epidermis to shear off'
                    }
                }
            ]
        },
        {
            id: 'diag_pv',
            name: 'Diagnosis',
            tooltip: {
                title: 'Diagnosis of PV',
                content: 'Diagnostic tests and findings'
            },
            children: [
                {
                    id: 'pv_histology',
                    name: 'Histology',
                    tooltip: {
                        title: 'Histology',
                        content: 'Suprabasal acantholysis with a "row of tombstones" appearance'
                    }
                },
                {
                    id: 'pv_dif',
                    name: 'DIF',
                    tooltip: {
                        title: 'Direct Immunofluorescence',
                        content: 'Intercellular "net-like" pattern of IgG and C3 deposition'
                    }
                },
                {
                    id: 'pv_serology',
                    name: 'Serology',
                    tooltip: {
                        title: 'Serology',
                        content: 'Positive ELISA for anti-DSG3 and/or anti-DSG1 antibodies'
                    }
                }
            ]
        },
        {
            id: 'tx_pv',
            name: 'Treatment',
            tooltip: {
                title: 'Treatment of PV',
                content: 'Therapeutic approaches for pemphigus vulgaris'
            },
            children: [
                {
                    id: 'pv_first_line',
                    name: 'First Line (Mod-Sev)',
                    tooltip: {
                        title: 'First Line Treatment',
                        content: 'Rituximab plus systemic glucocorticoids (e.g., Prednisone)'
                    }
                },
                {
                    id: 'pv_adjuvants',
                    name: 'Adjuvants',
                    tooltip: {
                        title: 'Adjuvant Therapy',
                        content: 'Steroid-sparing agents like Mycophenolate Mofetil or Azathioprine'
                    }
                },
                {
                    id: 'pv_refractory',
                    name: 'Refractory Disease',
                    tooltip: {
                        title: 'Refractory Disease Treatment',
                        content: 'IVIG, immunoadsorption, or cyclophosphamide'
                    }
                }
            ]
        }
    ]
};

const mindMapDataCompendiumBP = {
    id: 'root',
    name: 'Bullous Pemphigoid',
    tooltip: {
        title: 'Bullous Pemphigoid (BP)',
        content: 'The most common autoimmune blistering disease, typically affecting the elderly. Characterized by tense bullae and intense pruritus.'
    },
    children: [
        {
            id: 'patho_bp',
            name: 'Pathophysiology',
            tooltip: {
                title: 'Pathophysiology of BP',
                content: 'Understanding the molecular mechanisms of bullous pemphigoid'
            },
            children: [
                {
                    id: 'bp_target_antigens',
                    name: 'Target Antigens',
                    tooltip: {
                        title: 'Target Antigens',
                        content: 'Autoantibodies (IgG) against hemidesmosomal proteins BP180 (Type XVII Collagen) and BP230'
                    }
                },
                {
                    id: 'bp_mechanism',
                    name: 'Mechanism',
                    tooltip: {
                        title: 'Mechanism',
                        content: 'Antibody binding at the basement membrane zone (BMZ) activates complement and recruits eosinophils and neutrophils, leading to separation'
                    }
                },
                {
                    id: 'bp_blister_level',
                    name: 'Blister Level',
                    tooltip: {
                        title: 'Blister Level',
                        content: 'Subepidermal split'
                    }
                }
            ]
        },
        {
            id: 'clinical_bp',
            name: 'Clinical Features',
            tooltip: {
                title: 'Clinical Features of BP',
                content: 'Key clinical manifestations and physical findings'
            },
            children: [
                {
                    id: 'bp_prodrome',
                    name: 'Prodrome',
                    tooltip: {
                        title: 'Prodrome',
                        content: 'Intense pruritus and urticarial or eczematous plaques may precede blisters by weeks to months'
                    }
                },
                {
                    id: 'bp_cutaneous',
                    name: 'Cutaneous Bullae',
                    tooltip: {
                        title: 'Cutaneous Bullae',
                        content: 'Large, tense bullae on erythematous or urticarial skin. Rupture leads to erosions that heal without scarring'
                    }
                },
                {
                    id: 'bp_nikolsky',
                    name: 'Nikolsky Sign',
                    tooltip: {
                        title: 'Nikolsky Sign',
                        content: 'Negative'
                    }
                },
                {
                    id: 'bp_distribution',
                    name: 'Distribution',
                    tooltip: {
                        title: 'Distribution',
                        content: 'Trunk, flexural areas, and extremities'
                    }
                }
            ]
        },
        {
            id: 'diag_bp',
            name: 'Diagnosis',
            tooltip: {
                title: 'Diagnosis of BP',
                content: 'Diagnostic tests and findings'
            },
            children: [
                {
                    id: 'bp_histology',
                    name: 'Histology',
                    tooltip: {
                        title: 'Histology',
                        content: 'Subepidermal blister with an eosinophil-rich infiltrate'
                    }
                },
                {
                    id: 'bp_dif',
                    name: 'DIF',
                    tooltip: {
                        title: 'Direct Immunofluorescence',
                        content: 'Linear deposition of IgG and C3 along the BMZ'
                    }
                },
                {
                    id: 'bp_salt_split',
                    name: 'IIF (Salt-Split)',
                    tooltip: {
                        title: 'Salt-Split Skin',
                        content: 'Antibody binding to the roof (epidermal side) of the split'
                    }
                },
                {
                    id: 'bp_serology',
                    name: 'Serology',
                    tooltip: {
                        title: 'Serology',
                        content: 'Positive ELISA for anti-BP180 and/or anti-BP230 antibodies'
                    }
                }
            ]
        },
        {
            id: 'tx_bp',
            name: 'Treatment',
            tooltip: {
                title: 'Treatment of BP',
                content: 'Therapeutic approaches for bullous pemphigoid'
            },
            children: [
                {
                    id: 'bp_first_line_topical',
                    name: 'First Line (Generalized)',
                    tooltip: {
                        title: 'First Line - Topical',
                        content: 'High-potency topical corticosteroids (e.g., Clobetasol) are preferred'
                    }
                },
                {
                    id: 'bp_first_line_oral',
                    name: 'First Line (Oral)',
                    tooltip: {
                        title: 'First Line - Oral',
                        content: 'Systemic steroids (Prednisone) or Doxycycline are alternatives'
                    }
                },
                {
                    id: 'bp_adjuvants',
                    name: 'Adjuvants',
                    tooltip: {
                        title: 'Adjuvant Therapy',
                        content: 'Methotrexate, Mycophenolate, Azathioprine'
                    }
                },
                {
                    id: 'bp_refractory',
                    name: 'Refractory Disease',
                    tooltip: {
                        title: 'Refractory Disease Treatment',
                        content: 'Rituximab, Dupilumab, Omalizumab, IVIG'
                    }
                }
            ]
        }
    ]
};

const mindMapDataCompendiumDH = {
    id: 'root',
    name: 'Dermatitis Herpetiformis',
    tooltip: {
        title: 'Dermatitis Herpetiformis (DH)',
        content: 'The cutaneous manifestation of celiac disease (gluten sensitivity). Characterized by intensely pruritic vesicles and papules.'
    },
    children: [
        {
            id: 'patho_dh',
            name: 'Pathophysiology',
            tooltip: {
                title: 'Pathophysiology of DH',
                content: 'Understanding the molecular mechanisms of dermatitis herpetiformis'
            },
            children: [
                {
                    id: 'dh_mechanism',
                    name: 'Mechanism',
                    tooltip: {
                        title: 'Mechanism',
                        content: 'Ingestion of gluten leads to production of IgA autoantibodies against tissue transglutaminase (tTG) and epidermal transglutaminase (eTG)'
                    }
                },
                {
                    id: 'dh_deposition',
                    name: 'Deposition',
                    tooltip: {
                        title: 'Deposition',
                        content: 'IgA-eTG immune complexes deposit in the dermal papillae, recruiting neutrophils and causing blistering'
                    }
                },
                {
                    id: 'dh_blister_level',
                    name: 'Blister Level',
                    tooltip: {
                        title: 'Blister Level',
                        content: 'Subepidermal split'
                    }
                }
            ]
        },
        {
            id: 'clinical_dh',
            name: 'Clinical Features',
            tooltip: {
                title: 'Clinical Features of DH',
                content: 'Key clinical manifestations and physical findings'
            },
            children: [
                {
                    id: 'dh_symptoms',
                    name: 'Symptoms',
                    tooltip: {
                        title: 'Symptoms',
                        content: 'Intense, burning pruritus is the hallmark symptom'
                    }
                },
                {
                    id: 'dh_lesions',
                    name: 'Lesions',
                    tooltip: {
                        title: 'Lesions',
                        content: 'Grouped ("herpetiform") vesicles, papules, and urticarial plaques. Often excoriated and difficult to see intact blisters'
                    }
                },
                {
                    id: 'dh_distribution',
                    name: 'Distribution',
                    tooltip: {
                        title: 'Distribution',
                        content: 'Symmetrical involvement of extensor surfaces (elbows, knees), buttocks, and posterior scalp'
                    }
                }
            ]
        },
        {
            id: 'diag_dh',
            name: 'Diagnosis',
            tooltip: {
                title: 'Diagnosis of DH',
                content: 'Diagnostic tests and findings'
            },
            children: [
                {
                    id: 'dh_histology',
                    name: 'Histology',
                    tooltip: {
                        title: 'Histology',
                        content: 'Neutrophilic microabscesses in the dermal papillae'
                    }
                },
                {
                    id: 'dh_dif',
                    name: 'DIF',
                    tooltip: {
                        title: 'Direct Immunofluorescence',
                        content: 'The gold standard. Shows granular IgA deposition in the dermal papillae'
                    }
                },
                {
                    id: 'dh_serology',
                    name: 'Serology',
                    tooltip: {
                        title: 'Serology',
                        content: 'Positive serology for anti-tTG and anti-endomysial IgA antibodies confirms underlying celiac disease'
                    }
                }
            ]
        },
        {
            id: 'tx_dh',
            name: 'Treatment',
            tooltip: {
                title: 'Treatment of DH',
                content: 'Therapeutic approaches for dermatitis herpetiformis'
            },
            children: [
                {
                    id: 'dh_diet',
                    name: 'Diet',
                    tooltip: {
                        title: 'Dietary Treatment',
                        content: 'A strict, lifelong gluten-free diet is the primary treatment and manages both skin and gut disease'
                    }
                },
                {
                    id: 'dh_pharmacologic',
                    name: 'Pharmacologic',
                    tooltip: {
                        title: 'Pharmacologic Treatment',
                        content: 'Dapsone provides rapid relief of pruritus and skin lesions but does not treat the underlying intestinal disease'
                    }
                }
            ]
        }
    ]
};

const mindMapDataCompendiumLIGA = {
    id: 'root',
    name: 'Linear IgA',
    tooltip: {
        title: 'Linear IgA Bullous Dermatosis (LABD)',
        content: 'A rare autoimmune disease characterized by linear deposition of IgA at the basement membrane zone. It has both idiopathic and drug-induced forms.'
    },
    children: [
        {
            id: 'patho_liga',
            name: 'Pathophysiology',
            tooltip: {
                title: 'Pathophysiology of LABD',
                content: 'Understanding the molecular mechanisms of linear IgA bullous dermatosis'
            },
            children: [
                {
                    id: 'liga_target_antigens',
                    name: 'Target Antigens',
                    tooltip: {
                        title: 'Target Antigens',
                        content: 'IgA autoantibodies target proteolytic fragments of BP180 (LAD-1, LABD97)'
                    }
                },
                {
                    id: 'liga_mechanism',
                    name: 'Mechanism',
                    tooltip: {
                        title: 'Mechanism',
                        content: 'IgA deposition recruits neutrophils, leading to a subepidermal split'
                    }
                },
                {
                    id: 'liga_blister_level',
                    name: 'Blister Level',
                    tooltip: {
                        title: 'Blister Level',
                        content: 'Subepidermal'
                    }
                }
            ]
        },
        {
            id: 'clinical_liga',
            name: 'Clinical Features',
            tooltip: {
                title: 'Clinical Features of LABD',
                content: 'Key clinical manifestations and physical findings'
            },
            children: [
                {
                    id: 'liga_classic_lesion',
                    name: 'Classic Lesion',
                    tooltip: {
                        title: 'Classic Lesion',
                        content: 'Tense vesicles and bullae arranged in an annular or "string of pearls" configuration'
                    }
                },
                {
                    id: 'liga_childhood',
                    name: 'Childhood Presentation',
                    tooltip: {
                        title: 'Childhood Form',
                        content: 'Often presents as Chronic Bullous Disease of Childhood with prominent involvement of the lower abdomen and perineum'
                    }
                },
                {
                    id: 'liga_adults',
                    name: 'Adult Presentation',
                    tooltip: {
                        title: 'Adult Form',
                        content: 'More widespread involvement of trunk and limbs. Mucosal involvement is common'
                    }
                }
            ]
        },
        {
            id: 'diag_liga',
            name: 'Diagnosis',
            tooltip: {
                title: 'Diagnosis of LABD',
                content: 'Diagnostic tests and findings'
            },
            children: [
                {
                    id: 'liga_histology',
                    name: 'Histology',
                    tooltip: {
                        title: 'Histology',
                        content: 'Subepidermal blister with a neutrophil-predominant infiltrate'
                    }
                },
                {
                    id: 'liga_dif',
                    name: 'DIF',
                    tooltip: {
                        title: 'Direct Immunofluorescence',
                        content: 'The gold standard. Shows linear IgA deposition along the basement membrane zone'
                    }
                },
                {
                    id: 'liga_salt_split',
                    name: 'IIF (Salt-Split)',
                    tooltip: {
                        title: 'Salt-Split Skin',
                        content: 'Antibody binding usually to the epidermal side (roof) of the split'
                    }
                }
            ]
        },
        {
            id: 'tx_liga',
            name: 'Treatment',
            tooltip: {
                title: 'Treatment of LABD',
                content: 'Therapeutic approaches for linear IgA bullous dermatosis'
            },
            children: [
                {
                    id: 'liga_first_line',
                    name: 'First Line',
                    tooltip: {
                        title: 'First Line Treatment',
                        content: 'Dapsone or Sulfapyridine'
                    }
                },
                {
                    id: 'liga_second_line',
                    name: 'Second Line',
                    tooltip: {
                        title: 'Second Line Treatment',
                        content: 'Systemic corticosteroids, colchicine, or immunosuppressants like Mycophenolate Mofetil'
                    }
                }
            ]
        }
    ]
};

const mindMapDataCompendiumEBA = {
    id: 'root',
    name: 'EBA',
    tooltip: {
        title: 'Epidermolysis Bullosa Acquisita (EBA)',
        content: 'A rare, chronic autoimmune disease caused by antibodies to Type VII collagen. Presents with skin fragility and blistering.'
    },
    children: [
        {
            id: 'patho_eba',
            name: 'Pathophysiology',
            tooltip: {
                title: 'Pathophysiology of EBA',
                content: 'Understanding the molecular mechanisms of epidermolysis bullosa acquisita'
            },
            children: [
                {
                    id: 'eba_target_antigen',
                    name: 'Target Antigen',
                    tooltip: {
                        title: 'Target Antigen',
                        content: 'Autoantibodies (IgG) against Type VII Collagen, the main component of anchoring fibrils'
                    }
                },
                {
                    id: 'eba_mechanism',
                    name: 'Mechanism',
                    tooltip: {
                        title: 'Mechanism',
                        content: 'Disruption of anchoring fibrils weakens dermo-epidermal adhesion'
                    }
                },
                {
                    id: 'eba_blister_level',
                    name: 'Blister Level',
                    tooltip: {
                        title: 'Blister Level',
                        content: 'Subepidermal split deep in the sub-lamina densa'
                    }
                }
            ]
        },
        {
            id: 'clinical_eba',
            name: 'Clinical Features',
            tooltip: {
                title: 'Clinical Features of EBA',
                content: 'EBA has two main presentations'
            },
            children: [
                {
                    id: 'eba_classical',
                    name: 'Classical (Non-inflammatory)',
                    tooltip: {
                        title: 'Classical Form',
                        content: 'Resembles hereditary dystrophic EB. Skin fragility, trauma-induced tense bullae, atrophic scarring, and milia formation'
                    }
                },
                {
                    id: 'eba_inflammatory',
                    name: 'Inflammatory',
                    tooltip: {
                        title: 'Inflammatory Form',
                        content: 'Can mimic Bullous Pemphigoid, with widespread tense bullae on inflamed skin and intense pruritus'
                    }
                }
            ]
        },
        {
            id: 'diag_eba',
            name: 'Diagnosis',
            tooltip: {
                title: 'Diagnosis of EBA',
                content: 'Diagnostic tests and findings'
            },
            children: [
                {
                    id: 'eba_histology',
                    name: 'Histology',
                    tooltip: {
                        title: 'Histology',
                        content: 'Paucicellular subepidermal blister'
                    }
                },
                {
                    id: 'eba_dif',
                    name: 'DIF',
                    tooltip: {
                        title: 'Direct Immunofluorescence',
                        content: 'Linear IgG and C3 deposition at the BMZ'
                    }
                },
                {
                    id: 'eba_salt_split',
                    name: 'IIF (Salt-Split)',
                    tooltip: {
                        title: 'Salt-Split Skin',
                        content: 'The key diagnostic test. Shows antibody binding to the dermal side (floor) of the split'
                    }
                },
                {
                    id: 'eba_serology',
                    name: 'Serology',
                    tooltip: {
                        title: 'Serology',
                        content: 'ELISA for anti-Type VII Collagen antibodies is available'
                    }
                }
            ]
        },
        {
            id: 'tx_eba',
            name: 'Treatment',
            tooltip: {
                title: 'Treatment of EBA',
                content: 'Therapeutic approaches for epidermolysis bullosa acquisita'
            },
            children: [
                {
                    id: 'eba_first_line',
                    name: 'First Line',
                    tooltip: {
                        title: 'First Line Treatment',
                        content: 'Often difficult to treat. Colchicine or Dapsone can be effective, especially for the inflammatory variant'
                    }
                },
                {
                    id: 'eba_refractory',
                    name: 'Refractory Disease',
                    tooltip: {
                        title: 'Refractory Disease Treatment',
                        content: 'Systemic corticosteroids, immunosuppressants, IVIG, and Rituximab'
                    }
                }
            ]
        }
    ]
};

const mindMapDataPathologyFindings = {
    id: 'root',
    name: 'Pathology Findings',
    tooltip: {
        title: 'Pathology Findings by Disease Category',
        content: 'Histopathologic and direct immunofluorescence findings organized by disease location and mechanism'
    },
    children: [
        {
            id: 'intraepidermal_group',
            name: 'Intraepidermal\nDiseases',
            tooltip: {
                title: 'Intraepidermal Bullous Diseases',
                content: 'Pemphigus group diseases with intraepidermal blister formation and acantholysis'
            },
            children: [
                {
                    id: 'pv_pathology',
                    name: 'Pemphigus\nVulgaris',
                    tooltip: {
                        title: 'Pemphigus Vulgaris Pathology',
                        content: 'Intraepidermal blistering disease with suprabasal acantholysis'
                    },
                    children: [
                        {
                            id: 'pv_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'PV Histopathology',
                                content: '<ul><li><strong>Blister level:</strong> Suprabasal split</li><li><strong>Key finding:</strong> "Row of tombstones" - basal keratinocytes remain attached to BMZ</li><li><strong>Acantholysis:</strong> Loss of cell-cell adhesion with rounded acantholytic cells</li><li><strong>Infiltrate:</strong> Usually sparse, mixed inflammatory cells</li></ul>'
                            }
                        },
                        {
                            id: 'pv_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'PV Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> Intercellular "net-like" or "chicken wire"</li><li><strong>Antibodies:</strong> IgG and C3 throughout epidermis</li><li><strong>Distribution:</strong> Most prominent in lower epidermis</li><li><strong>Subclass:</strong> IgG4 predominant</li></ul>'
                            }
                        },
                        {
                            id: 'pv_iif',
                            name: 'IIF/Serology',
                            tooltip: {
                                title: 'PV Indirect IF & Serology',
                                content: '<ul><li><strong>IIF substrate:</strong> Monkey esophagus shows intercellular pattern</li><li><strong>ELISA:</strong> Anti-DSG3 (mucosal), Anti-DSG1 (cutaneous)</li><li><strong>Titer correlation:</strong> Often correlates with disease activity</li></ul>'
                            }
                        }
                    ]
                },
                {
                    id: 'pf_pathology',
                    name: 'Pemphigus\nFoliaceus',
                    tooltip: {
                        title: 'Pemphigus Foliaceus Pathology',
                        content: 'Superficial intraepidermal blistering in the granular layer'
                    },
                    children: [
                        {
                            id: 'pf_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'PF Histopathology',
                                content: '<ul><li><strong>Blister level:</strong> Subcorneal/granular layer split</li><li><strong>Acantholysis:</strong> High in epidermis, very superficial</li><li><strong>Infiltrate:</strong> Mixed with eosinophils and neutrophils</li><li><strong>Note:</strong> Blisters are very fragile, often see only crusted erosions</li></ul>'
                            }
                        },
                        {
                            id: 'pf_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'PF Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> Intercellular, concentrated in upper epidermis</li><li><strong>Antibodies:</strong> IgG and C3</li><li><strong>Distribution:</strong> Most prominent in superficial layers</li><li><strong>Subclass:</strong> IgG1 predominant</li></ul>'
                            }
                        },
                        {
                            id: 'pf_serology',
                            name: 'Serology',
                            tooltip: {
                                title: 'PF Serology',
                                content: '<ul><li><strong>Target:</strong> Anti-DSG1 antibodies only</li><li><strong>DSG3:</strong> Negative (unlike PV)</li><li><strong>Endemic form:</strong> Fogo selvagem has same antibody profile</li></ul>'
                            }
                        }
                    ]
                },
                {
                    id: 'iga_pemphigus_pathology',
                    name: 'IgA\nPemphigus',
                    tooltip: {
                        title: 'IgA Pemphigus Pathology',
                        content: 'Rare intraepidermal neutrophilic disease'
                    },
                    children: [
                        {
                            id: 'iga_pemphigus_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'IgA Pemphigus Histopathology',
                                content: '<ul><li><strong>SPD type:</strong> Subcorneal pustules</li><li><strong>IEN type:</strong> Intraepidermal neutrophilic pustules</li><li><strong>Minimal acantholysis:</strong> Unlike classic pemphigus</li><li><strong>Neutrophils:</strong> Predominant cell type</li></ul>'
                            }
                        },
                        {
                            id: 'iga_pemphigus_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'IgA Pemphigus DIF',
                                content: '<ul><li><strong>Pattern:</strong> Intercellular IgA deposition</li><li><strong>NO IgG:</strong> Key distinguishing feature</li><li><strong>Distribution:</strong> Throughout epidermis or superficial</li></ul>'
                            }
                        },
                        {
                            id: 'iga_pemphigus_subtypes',
                            name: 'Subtypes',
                            tooltip: {
                                title: 'IgA Pemphigus Subtypes',
                                content: '<ul><li><strong>SPD type:</strong> Targets desmocollin-1</li><li><strong>IEN type:</strong> Unknown target antigen</li><li><strong>Clinical:</strong> Annular pustular lesions</li></ul>'
                            }
                        }
                    ]
                },
                {
                    id: 'pnp_pathology',
                    name: 'Paraneo-\nplastic\nPemphigus',
                    tooltip: {
                        title: 'Paraneoplastic Pemphigus Pathology',
                        content: 'Severe mucocutaneous disease associated with neoplasms'
                    },
                    children: [
                        {
                            id: 'pnp_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'PNP Histopathology',
                                content: '<ul><li><strong>Variable:</strong> Suprabasal acantholysis + interface dermatitis</li><li><strong>Lichenoid changes:</strong> Basal vacuolar degeneration</li><li><strong>Dyskeratotic cells:</strong> Throughout epidermis</li><li><strong>Mixed pattern:</strong> Features of pemphigus + EM/lichenoid</li></ul>'
                            }
                        },
                        {
                            id: 'pnp_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'PNP Direct Immunofluorescence',
                                content: '<ul><li><strong>Dual pattern:</strong> Intercellular AND linear BMZ</li><li><strong>IgG and C3:</strong> Both patterns present</li><li><strong>Unique:</strong> Combined pattern highly suggestive</li></ul>'
                            }
                        },
                        {
                            id: 'pnp_associations',
                            name: 'Associations',
                            tooltip: {
                                title: 'PNP Associations & Antibodies',
                                content: '<ul><li><strong>Neoplasms:</strong> NHL, CLL, Castleman disease, thymoma</li><li><strong>Antigens:</strong> Plakins (desmoplakin, envoplakin, periplakin)</li><li><strong>IIF:</strong> Rat bladder epithelium positive</li><li><strong>Prognosis:</strong> Often poor, bronchiolitis obliterans</li></ul>'
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: 'subepidermal_igg_group',
            name: 'Subepidermal\nIgG-Mediated',
            tooltip: {
                title: 'Subepidermal IgG-Mediated Diseases',
                content: 'Pemphigoid group and related diseases with IgG deposition at the basement membrane zone'
            },
            children: [
                {
                    id: 'bp_pathology',
                    name: 'Bullous\nPemphigoid',
                    tooltip: {
                        title: 'Bullous Pemphigoid Pathology',
                        content: 'Most common subepidermal blistering disease with eosinophilic infiltrate'
                    },
                    children: [
                        {
                            id: 'bp_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'BP Histopathology',
                                content: '<ul><li><strong>Blister level:</strong> Subepidermal split</li><li><strong>Infiltrate:</strong> Eosinophil-rich, often forming microabscesses</li><li><strong>Early lesion:</strong> Eosinophilic spongiosis</li><li><strong>Blister cavity:</strong> Contains eosinophils and fibrin</li></ul>'
                            }
                        },
                        {
                            id: 'bp_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'BP Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> Linear at basement membrane zone</li><li><strong>Antibodies:</strong> IgG and C3 (C3 may be stronger)</li><li><strong>n-serrated pattern:</strong> On high-resolution IF</li><li><strong>Salt-split:</strong> Binds to roof (epidermal side)</li></ul>'
                            }
                        },
                        {
                            id: 'bp_serology',
                            name: 'Serology',
                            tooltip: {
                                title: 'BP Serology',
                                content: '<ul><li><strong>BP180 ELISA:</strong> Most sensitive and specific</li><li><strong>BP230 ELISA:</strong> Also positive in many cases</li><li><strong>NC16A domain:</strong> Pathogenic epitope on BP180</li></ul>'
                            }
                        }
                    ]
                },
                {
                    id: 'pg_pathology',
                    name: 'Pemphigoid\nGestationis',
                    tooltip: {
                        title: 'Pemphigoid Gestationis Pathology',
                        content: 'Pregnancy-associated autoimmune blistering disease'
                    },
                    children: [
                        {
                            id: 'pg_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'PG Histopathology',
                                content: '<ul><li><strong>Similar to BP:</strong> Subepidermal blister with eosinophils</li><li><strong>Papillary edema:</strong> Often prominent</li><li><strong>Eosinophilic spongiosis:</strong> Common in urticarial phase</li></ul>'
                            }
                        },
                        {
                            id: 'pg_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'PG Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> Linear C3 at BMZ (100% of cases)</li><li><strong>IgG:</strong> Present in only 30-50%</li><li><strong>C3 dominance:</strong> Key feature</li></ul>'
                            }
                        },
                        {
                            id: 'pg_associations',
                            name: 'Associations',
                            tooltip: {
                                title: 'PG Clinical Associations',
                                content: '<ul><li><strong>Timing:</strong> 2nd-3rd trimester, can flare postpartum</li><li><strong>Target:</strong> BP180 NC16A domain</li><li><strong>Fetal risk:</strong> Prematurity, SGA</li><li><strong>Recurrence:</strong> Common in subsequent pregnancies</li></ul>'
                            }
                        }
                    ]
                },
                {
                    id: 'eba_pathology',
                    name: 'EBA',
                    tooltip: {
                        title: 'Epidermolysis Bullosa Acquisita Pathology',
                        content: 'Mechanobullous disease targeting type VII collagen'
                    },
                    children: [
                        {
                            id: 'eba_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'EBA Histopathology',
                                content: '<ul><li><strong>Classic type:</strong> Paucicellular subepidermal blister</li><li><strong>Minimal inflammation:</strong> Clean split</li><li><strong>Inflammatory variant:</strong> Can have neutrophils/eosinophils</li><li><strong>Late:</strong> Scarring and milia formation</li></ul>'
                            }
                        },
                        {
                            id: 'eba_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'EBA Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> Linear IgG (± C3) at BMZ</li><li><strong>u-serrated pattern:</strong> On high-resolution IF</li><li><strong>Salt-split:</strong> Binds to FLOOR (dermal side)</li><li><strong>Key test:</strong> Floor binding distinguishes from BP</li></ul>'
                            }
                        },
                        {
                            id: 'eba_serology',
                            name: 'Serology',
                            tooltip: {
                                title: 'EBA Serology',
                                content: '<ul><li><strong>Target:</strong> Type VII collagen (anchoring fibrils)</li><li><strong>ELISA:</strong> Anti-type VII collagen available</li><li><strong>NC1 domain:</strong> Major antigenic region</li></ul>'
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: 'subepidermal_iga_group',
            name: 'Subepidermal\nIgA-Mediated',
            tooltip: {
                title: 'Subepidermal IgA-Mediated Diseases',
                content: 'IgA-mediated subepidermal blistering diseases'
            },
            children: [
                {
                    id: 'dh_pathology',
                    name: 'Dermatitis\nHerpetiformis',
                    tooltip: {
                        title: 'Dermatitis Herpetiformis Pathology',
                        content: 'Gluten-sensitive disease with characteristic papillary IgA deposits'
                    },
                    children: [
                        {
                            id: 'dh_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'DH Histopathology',
                                content: '<ul><li><strong>Early lesion:</strong> Neutrophilic microabscesses in papillary tips</li><li><strong>Later:</strong> Subepidermal vesicle formation</li><li><strong>Key feature:</strong> Must biopsy early lesion for diagnosis</li><li><strong>Infiltrate:</strong> Predominantly neutrophils</li></ul>'
                            }
                        },
                        {
                            id: 'dh_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'DH Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> Granular IgA in dermal papillae</li><li><strong>Location:</strong> Tips of dermal papillae</li><li><strong>Key:</strong> NOT linear - granular deposits</li><li><strong>Perilesional skin:</strong> Best site for DIF</li></ul>'
                            }
                        },
                        {
                            id: 'dh_associations',
                            name: 'Associations',
                            tooltip: {
                                title: 'DH Associations',
                                content: '<ul><li><strong>Celiac disease:</strong> Present in nearly 100%</li><li><strong>Anti-tTG:</strong> Tissue transglutaminase antibodies</li><li><strong>Anti-endomysial:</strong> Often positive</li><li><strong>HLA:</strong> DQ2/DQ8 association</li></ul>'
                            }
                        }
                    ]
                },
                {
                    id: 'labd_pathology',
                    name: 'Linear\nIgA\nDermatosis',
                    tooltip: {
                        title: 'Linear IgA Bullous Dermatosis Pathology',
                        content: 'IgA-mediated subepidermal blistering disease'
                    },
                    children: [
                        {
                            id: 'labd_histopath',
                            name: 'Histopathology',
                            tooltip: {
                                title: 'LABD Histopathology',
                                content: '<ul><li><strong>Blister level:</strong> Subepidermal split</li><li><strong>Infiltrate:</strong> Neutrophil-predominant</li><li><strong>Distribution:</strong> Along DEJ and in papillae</li><li><strong>Similar to:</strong> Can look like DH on H&E</li></ul>'
                            }
                        },
                        {
                            id: 'labd_dif',
                            name: 'DIF Pattern',
                            tooltip: {
                                title: 'LABD Direct Immunofluorescence',
                                content: '<ul><li><strong>Pattern:</strong> LINEAR IgA at BMZ</li><li><strong>Key distinction:</strong> Linear (not granular like DH)</li><li><strong>Homogeneous:</strong> Smooth linear deposition</li><li><strong>Salt-split:</strong> Usually binds to roof</li></ul>'
                            }
                        },
                        {
                            id: 'labd_variants',
                            name: 'Variants',
                            tooltip: {
                                title: 'LABD Variants',
                                content: '<ul><li><strong>Drug-induced:</strong> Vancomycin is classic cause</li><li><strong>Childhood:</strong> Chronic bullous disease of childhood</li><li><strong>Target antigens:</strong> LAD-1, LABD97 (BP180 fragments)</li></ul>'
                            }
                        }
                    ]
                }
            ]
        }
    ]
};


const dataMap = {
    'classification': mindMapDataByClassification,
    'workup': mindMapDataByWorkup,
    'pathology': mindMapDataPathologyFindings,
    'treatment': mindMapDataByTreatment,
    'compendium-pv': mindMapDataCompendiumPV,
    'compendium-bp': mindMapDataCompendiumBP,
    'compendium-dh': mindMapDataCompendiumDH,
    'compendium-liga': mindMapDataCompendiumLIGA,
    'compendium-eba': mindMapDataCompendiumEBA,
};

// Export dataMap globally for use by other scripts
window.dataMap = dataMap;