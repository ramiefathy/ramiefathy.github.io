// js/data.js

const mindMapData = {
    'approach': {
        id: 'root',
        name: 'Alopecia Workup',
        tooltip: {
            title: 'Clinical Approach',
            content: 'Following the logical thought process of a clinician evaluating a patient with hair loss.'
        },
        children: [
            {
                id: 'history',
                name: 'Comprehensive History',
                tooltip: {
                    title: 'History Taking',
                    content: 'The cornerstone of the evaluation. Details gathered here will guide the physical exam and diagnostic testing.'
                },
                children: [
                    {
                        id: 'timeline',
                        name: 'Timeline & Onset',
                        tooltip: {
                            title: 'Timeline & Onset',
                            content: '<ul><li><strong>Acute vs. Chronic:</strong> Sudden onset suggests Telogen Effluvium or Alopecia Areata. Gradual onset suggests Androgenetic Alopecia or a scarring process.</li><li><strong>Duration:</strong> How long has the patient been experiencing hair loss?</li><li><strong>Triggers:</strong> Inquire about recent illness (esp. febrile), surgery, major life stress, or starting new medications.</li></ul>'
                        }
                    },
                    {
                        id: 'symptoms',
                        name: 'Scalp Symptoms',
                        tooltip: {
                            title: 'Scalp Symptoms',
                            content: '<ul><li><strong>Significance:</strong> The presence of itching, burning, pain, or pustules strongly suggests an active inflammatory process.</li><li><strong>Associated Conditions:</strong> Common in Lichen Planopilaris, Folliculitis Decalvans, and Discoid Lupus. Less common but can occur in Alopecia Areata.</li></ul>'
                        }
                    },
                    {
                        id: 'meds',
                        name: 'Medication History',
                        tooltip: {
                            title: 'Medication History',
                            content: '<ul><li><strong>Importance:</strong> A wide range of medications can induce Telogen Effluvium. It is critical to get a full list of prescription, OTC, and supplement use.</li><li><strong>Examples:</strong> Retinoids, anticoagulants, beta-blockers, and some biologics are known culprits.</li></ul>'
                        }
                    },
                    {
                        id: 'pmh',
                        name: 'Medical & Gyn History',
                        tooltip: {
                            title: 'Medical & Gynecological History',
                            content: '<ul><li><strong>Systemic Clues:</strong> Ask about thyroid disease, autoimmune conditions (lupus, vitiligo), and signs of hyperandrogenism (acne, hirsutism).</li><li><strong>Hormonal Factors:</strong> Inquire about menstrual regularity and history of PCOS, pregnancy, or menopause.</li></ul>'
                        }
                    },
                    {
                        id: 'habits',
                        name: 'Hair Care Habits',
                        tooltip: {
                            title: 'Hair Care Habits',
                            content: '<ul><li><strong>Mechanical Stress:</strong> High-tension styles (tight braids, ponytails, weaves) can cause Traction Alopecia.</li><li><strong>Chemical/Heat Damage:</strong> Frequent use of relaxers, perms, bleach, or high-heat styling tools can lead to hair shaft breakage.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'exam',
                name: 'Clinical Examination',
                tooltip: {
                    title: 'Physical Examination',
                    content: 'A detailed examination of the scalp and hair is performed to identify the pattern of loss and specific clinical signs.'
                },
                children: [
                    {
                        id: 'pattern',
                        name: 'Pattern Recognition',
                        tooltip: {
                            title: 'Pattern of Hair Loss',
                            content: '<ul><li><strong>Androgenetic:</strong> Bitemporal recession and vertex thinning in men (MPHL); central part widening in women (FPHL).</li><li><strong>Patchy:</strong> Well-demarcated round patches are classic for Alopecia Areata.</li><li><strong>Diffuse:</strong> Generalized thinning seen in Telogen Effluvium.</li></ul>'
                        }
                    },
                    {
                        id: 'scarring_ques',
                        name: 'Scarring vs. Non-Scarring?',
                        tooltip: {
                            title: 'The Critical Question: Scarring?',
                            content: 'The most important branch point in the diagnostic algorithm. The presence of scarring signifies permanent follicular destruction.'
                        },
                        children: [
                            {
                                id: 'fol_ostia',
                                name: 'Follicular Ostia',
                                tooltip: {
                                    title: 'Follicular Ostia (Pores)',
                                    content: '<ul><li><strong>The Key Sign:</strong> The presence of follicular openings indicates a non-scarring process.</li><li><strong>Loss of Ostia:</strong> A smooth, shiny scalp surface with loss of pores is the cardinal sign of a scarring (cicatricial) alopecia.</li></ul>'
                                }
                            },
                            {
                                id: 'inflam_signs',
                                name: 'Signs of Inflammation',
                                tooltip: {
                                    title: 'Associated Inflammatory Signs',
                                    content: 'Erythema (redness), scale, and pustules around the hair follicles are clues for an active scarring alopecia like LPP or DLE.'
                                }
                            }
                        ]
                    },
                    {
                        id: 'shaft',
                        name: 'Hair Shaft Integrity',
                        tooltip: {
                            title: 'Hair Shaft Examination',
                            content: 'Assess for breakage, which can be the primary cause of apparent hair loss.'
                        }
                    },
                    {
                        id: 'pull_test',
                        name: 'Hair Pull Test',
                        tooltip: {
                            title: 'Hair Pull Test',
                            content: '<ul><li><strong>Technique:</strong> Gently grasp ~50 hairs and pull from proximal to distal.</li><li><strong>Interpretation:</strong> Pulling >10% of hairs (~5 hairs) suggests an active shedding process (positive test), characteristic of Telogen or Anagen Effluvium.</li></ul>'
                        }
                    },
                    {
                        id: 'assoc_signs',
                        name: 'Associated Signs',
                        tooltip: {
                            title: 'Associated Physical Signs',
                            content: 'Check for signs of systemic disease, such as nail pitting in alopecia areata or skin rashes in lupus erythematosus.'
                        }
                    }
                ]
            }
        ]
    },
    'classification': {
        id: 'root',
        name: 'Alopecia Types',
        tooltip: {
            title: 'Classification of Alopecias',
            content: 'A systematic breakdown of the major categories and specific types of hair loss.'
        },
        children: [
            {
                id: 'nonscar',
                name: 'Non-Scarring Alopecias',
                tooltip: {
                    title: 'Non-Scarring (Noncicatricial) Alopecias',
                    content: 'A group of alopecias where the hair follicle is preserved, and hair regrowth is possible. Characterized by the presence of follicular ostia on exam.'
                },
                children: [
                    {
                        id: 'aga_class',
                        name: 'Androgenetic Alopecia',
                        tooltip: {
                            title: 'Androgenetic Alopecia (AGA)',
                            content: '<ul><li><strong>Pathophysiology:</strong> Genetically determined, androgen-mediated progressive miniaturization of hair follicles.</li><li><strong>Presentation:</strong> Male Pattern Hair Loss (MPHL) and Female Pattern Hair Loss (FPHL).</li></ul>'
                        }
                    },
                    {
                        id: 'aa_class',
                        name: 'Alopecia Areata',
                        tooltip: {
                            title: 'Alopecia Areata (AA)',
                            content: '<ul><li><strong>Pathophysiology:</strong> Autoimmune attack on the anagen hair bulb, leading to rapid, patchy hair loss.</li><li><strong>Variants:</strong> Can be patchy, totalis (all scalp hair), or universalis (all body hair).</li></ul>'
                        }
                    },
                    {
                        id: 'te_class',
                        name: 'Telogen Effluvium',
                        tooltip: {
                            title: 'Telogen Effluvium (TE)',
                            content: '<ul><li><strong>Pathophysiology:</strong> An abrupt shift of a large number of hairs from the anagen (growth) phase to the telogen (resting) phase, leading to diffuse shedding ~3 months later.</li><li><strong>Triggers:</strong> Illness, surgery, childbirth, stress, medications.</li></ul>'
                        }
                    },
                    {
                        id: 'ae_class',
                        name: 'Anagen Effluvium',
                        tooltip: {
                            title: 'Anagen Effluvium',
                            content: '<ul><li><strong>Pathophysiology:</strong> An insult that abruptly stops mitotic activity in the anagen hair bulb, causing the shaft to break and shed rapidly.</li><li><strong>Primary Cause:</strong> Chemotherapy.</li></ul>'
                        }
                    },
                    {
                        id: 'traumatic_class',
                        name: 'Traumatic Alopecias',
                        tooltip: {
                            title: 'Traumatic/Mechanical Alopecias',
                            content: '<ul><li><strong>Traction Alopecia:</strong> Hair loss from prolonged or repetitive tension on the hair follicle. Can become scarring if chronic.</li><li><strong>Trichotillomania:</strong> An impulse-control disorder characterized by the compulsive pulling out of hair.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'scar',
                name: 'Scarring Alopecias',
                tooltip: {
                    title: 'Scarring (Cicatricial) Alopecias',
                    content: 'A group of inflammatory disorders that cause permanent destruction of the hair follicle, leading to irreversible hair loss. Characterized by loss of follicular ostia.'
                },
                children: [
                    {
                        id: 'lymph_scar',
                        name: 'Lymphocytic',
                        tooltip: {
                            title: 'Primary Lymphocytic Cicatricial Alopecias',
                            content: 'The inflammatory infiltrate is predominantly composed of lymphocytes.'
                        },
                        children: [
                            {
                                id: 'lpp_class',
                                name: 'Lichen Planopilaris (LPP)',
                                tooltip: {
                                    title: 'Lichen Planopilaris (LPP)',
                                    content: 'Presents with perifollicular erythema and scale, typically on the vertex scalp.'
                                }
                            },
                            {
                                id: 'ffa_class',
                                name: 'Frontal Fibrosing Alopecia (FFA)',
                                tooltip: {
                                    title: 'Frontal Fibrosing Alopecia (FFA)',
                                    content: 'A variant of LPP causing a progressive band of alopecia along the frontal hairline.'
                                }
                            },
                            {
                                id: 'ccca_class',
                                name: 'CCCA',
                                tooltip: {
                                    title: 'Central Centrifugal Cicatricial Alopecia (CCCA)',
                                    content: 'Begins on the crown and spreads centrifugally. Most common in women of African descent.'
                                }
                            },
                            {
                                id: 'dle_class',
                                name: 'Discoid Lupus (DLE)',
                                tooltip: {
                                    title: 'Discoid Lupus Erythematosus (DLE)',
                                    content: 'Presents as erythematous, atrophic plaques with adherent scale and follicular plugging.'
                                }
                            }
                        ]
                    },
                    {
                        id: 'neutro_scar',
                        name: 'Neutrophilic',
                        tooltip: {
                            title: 'Primary Neutrophilic Cicatricial Alopecias',
                            content: 'The inflammatory infiltrate is predominantly composed of neutrophils.'
                        },
                        children: [
                            {
                                id: 'fd_class',
                                name: 'Folliculitis Decalvans',
                                tooltip: {
                                    title: 'Folliculitis Decalvans (FD)',
                                    content: 'Characterized by chronic pustules, erosions, and crusting, often leading to hair tufting.'
                                }
                            },
                            {
                                id: 'dc_class',
                                name: 'Dissecting Cellulitis',
                                tooltip: {
                                    title: 'Dissecting Cellulitis of the Scalp (DC)',
                                    content: 'Presents as painful, boggy nodules and abscesses that interconnect, forming sinus tracts.'
                                }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'med_induced',
                name: 'Medication-Induced',
                tooltip: {
                    title: 'Medication-Induced Alopecias',
                    content: 'Hair loss as a direct adverse effect of a medication. Can manifest as various types of alopecia.'
                },
                children: [
                    {
                        id: 'te_med',
                        name: 'Telogen Effluvium Inducers',
                        tooltip: {
                            title: 'Telogen Effluvium Inducers',
                            content: 'The most common form of drug-induced hair loss. Examples include retinoids, beta-blockers, anticoagulants.'
                        }
                    },
                    {
                        id: 'ae_med',
                        name: 'Anagen Effluvium Inducers',
                        tooltip: {
                            title: 'Anagen Effluvium Inducers',
                            content: 'Primarily caused by cytotoxic chemotherapeutic agents.'
                        }
                    },
                    {
                        id: 'aa_med',
                        name: 'Alopecia Areata Inducers',
                        tooltip: {
                            title: 'Alopecia Areata Inducers',
                            content: 'Less common, but can be paradoxically induced by biologics like TNF-alpha inhibitors and immune checkpoint inhibitors.'
                        }
                    }
                ]
            }
        ]
    },
    'tools': {
        id: 'root',
        name: 'Diagnostic Toolbox',
        tooltip: {
            title: 'The "How" of Diagnosis',
            content: 'An overview of the essential tools and tests used to arrive at a definitive diagnosis for alopecia.'
        },
        children: [
            {
                id: 'trichoscopy',
                name: 'Trichoscopy',
                tooltip: {
                    title: 'Trichoscopy (Scalp Dermoscopy)',
                    content: 'Non-invasive visualization of the scalp and hair shafts. Considered an essential part of the modern hair loss consultation.'
                },
                children: [
                    {
                        id: 'aga_trich',
                        name: 'AGA Findings',
                        tooltip: {
                            title: 'Trichoscopy of Androgenetic Alopecia',
                            content: '<ul><li><strong>Hallmark Sign:</strong> Hair shaft diameter diversity >20% (anisotrichosis).</li><li><strong>Other Signs:</strong> Increased single-hair units, perifollicular pigmentation, empty follicles (yellow dots).</li></ul>'
                        }
                    },
                    {
                        id: 'aa_trich',
                        name: 'AA Findings',
                        tooltip: {
                            title: 'Trichoscopy of Alopecia Areata',
                            content: '<ul><li><strong>Active Disease:</strong> Exclamation mark hairs, black dots (cadaverized hairs), broken hairs.</li><li><strong>Chronic Disease:</strong> Yellow dots (sebaceous gland openings).</li><li><strong>Regrowth:</strong> Short vellus hairs, pigtail (circle) hairs.</li></ul>'
                        }
                    },
                    {
                        id: 'lpp_trich',
                        name: 'LPP/FFA Findings',
                        tooltip: {
                            title: 'Trichoscopy of LPP/FFA',
                            content: '<ul><li><strong>Hallmark Sign:</strong> Perifollicular scaling (tubular casts).</li><li><strong>Other Signs:</strong> Perifollicular erythema, loss of follicular openings, "lonely hair" sign in FFA.</li></ul>'
                        }
                    },
                    {
                        id: 'dle_trich',
                        name: 'DLE Findings',
                        tooltip: {
                            title: 'Trichoscopy of Discoid Lupus',
                            content: '<ul><li><strong>Key Signs:</strong> Thick arborizing (branching) blood vessels, follicular keratotic plugs.</li><li><strong>Other Signs:</strong> Follicular red dots, speckled blue-gray dots (pigment incontinence).</li></ul>'
                        }
                    },
                    {
                        id: 'fd_trich',
                        name: 'FD/DC Findings',
                        tooltip: {
                            title: 'Trichoscopy of Neutrophilic Alopecias',
                            content: '<ul><li><strong>FD:</strong> Hair tufts (>5 hairs per unit), follicular pustules, yellowish crusts.</li><li><strong>DC:</strong> AA-like empty follicles in early stages; later shows cutaneous clefts with emerging hairs ("3D" appearance).</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'biopsy',
                name: 'Scalp Biopsy',
                tooltip: {
                    title: 'Scalp Biopsy',
                    content: 'The gold standard for definitively diagnosing scarring alopecias and confirming inflammatory non-scarring alopecias.'
                },
                children: [
                    {
                        id: 'biopsy_why',
                        name: 'Why Biopsy?',
                        tooltip: {
                            title: 'Indications for Biopsy',
                            content: '<ul><li>When the diagnosis is in doubt.</li><li>To definitively differentiate scarring from non-scarring alopecia.</li><li>To assess for prognosis or document permanent hair loss.</li></ul>'
                        }
                    },
                    {
                        id: 'biopsy_how',
                        name: 'Technique',
                        tooltip: {
                            title: 'Biopsy Technique',
                            content: '<ul><li><strong>Standard:</strong> A 4-mm punch biopsy is preferred to ensure an adequate number of follicles.</li><li><strong>Depth:</strong> Must extend into the subcutaneous fat to include the hair bulbs.</li><li><strong>Sectioning:</strong> Horizontal (transverse) sectioning is most valuable for quantifying follicles and evaluating architecture.</li></ul>'
                        }
                    },
                    {
                        id: 'biopsy_where',
                        name: 'Site Selection',
                        tooltip: {
                            title: 'Biopsy Site Selection',
                            content: '<ul><li><strong>Scarring Alopecia:</strong> Biopsy the <strong>active edge</strong>, identified by clinical inflammation (redness, scale) or trichoscopic features. Avoid the bald, end-stage center.</li><li><strong>Non-Scarring Alopecia:</strong> Biopsy the area of most severe thinning or the active border of a patch.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'labs',
                name: 'Laboratory Workup',
                tooltip: {
                    title: 'Laboratory Evaluation',
                    content: 'Labs are guided by the clinical history and differential diagnosis. There is no standard universal panel.'
                },
                children: [
                    {
                        id: 'labs_diffuse',
                        name: 'For Diffuse Shedding (TE)',
                        tooltip: {
                            title: 'Labs for Diffuse Hair Loss',
                            content: '<ul><li><strong>CBC:</strong> To rule out anemia.</li><li><strong>TSH:</strong> To screen for thyroid dysfunction.</li><li><strong>Ferritin:</strong> To assess for iron deficiency (a level >40-70 ng/mL is often targeted).</li><li><strong>Vitamin D:</strong> To assess for deficiency.</li></ul>'
                        }
                    },
                    {
                        id: 'labs_fphl',
                        name: 'For FPHL with Virilization',
                        tooltip: {
                            title: 'Labs for FPHL with Hyperandrogenism',
                            content: 'Indicated if female patient presents with acne, hirsutism, or irregular menses.'
                        },
                        children: [
                            {
                                id: 'hormones',
                                name: 'Hormone Panel',
                                tooltip: {
                                    title: 'Hormone Panel',
                                    content: '<ul><li>Total and Free Testosterone</li><li>DHEA-S</li></ul>'
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    'modality': {
        id: 'root',
        name: 'Therapeutic Modality',
        tooltip: {
            title: 'Treatment Types',
            content: 'An overview of the alopecia treatment armamentarium, organized by mechanism or delivery method.'
        },
        children: [
            {
                id: 'topical',
                name: 'Topical Therapies',
                tooltip: {
                    title: 'Topical Therapies',
                    content: 'Applied directly to the scalp.'
                },
                children: [
                    {
                        id: 'minox_top',
                        name: 'Growth Stimulants',
                        tooltip: {
                            title: 'Topical Growth Stimulants',
                            content: '<strong>Minoxidil (Rogaine):</strong> The most well-known. Available OTC. Works by prolonging the anagen phase.'
                        }
                    },
                    {
                        id: 'steroids_top',
                        name: 'Anti-inflammatories',
                        tooltip: {
                            title: 'Topical Anti-inflammatories',
                            content: '<ul><li><strong>Corticosteroids:</strong> High-potency formulations (e.g., clobetasol) are used to suppress inflammation in scarring alopecias and alopecia areata.</li><li><strong>Calcineurin Inhibitors:</strong> (Tacrolimus, Pimecrolimus) A steroid-sparing option for facial areas in FFA or DLE.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'systemic',
                name: 'Systemic Oral Therapies',
                tooltip: {
                    title: 'Systemic Oral Therapies',
                    content: 'Pills taken by mouth to treat hair loss from within.'
                },
                children: [
                    {
                        id: 'minox_oral',
                        name: 'Growth Stimulants',
                        tooltip: {
                            title: 'Oral Growth Stimulants',
                            content: '<strong>Low-Dose Oral Minoxidil (LDOM):</strong> A highly effective, increasingly popular off-label treatment for various alopecias, especially AGA.'
                        }
                    },
                    {
                        id: 'anti_androgen',
                        name: 'Anti-androgens',
                        tooltip: {
                            title: 'Anti-androgens',
                            content: '<ul><li><strong>5-alpha Reductase Inhibitors:</strong> Finasteride and Dutasteride block the conversion of testosterone to DHT. Mainstay for male AGA.</li><li><strong>Androgen Receptor Blockers:</strong> Spironolactone is used off-label in women with FPHL.</li></ul>'
                        }
                    },
                    {
                        id: 'immuno_sys',
                        name: 'Immuno-modulators',
                        tooltip: {
                            title: 'Systemic Immunomodulators',
                            content: '<ul><li><strong>Hydroxychloroquine/Doxycycline:</strong> Used for their anti-inflammatory properties in lymphocytic scarring alopecias like LPP and DLE.</li><li><strong>Methotrexate/Cyclosporine:</strong> More potent immunosuppressants for severe cases.</li></ul>'
                        }
                    },
                    {
                        id: 'jak_sys',
                        name: 'Targeted Biologics',
                        tooltip: {
                            title: 'Targeted Biologic Therapy (JAK Inhibitors)',
                            content: '<strong>Baricitinib & Ritlecitinib:</strong> FDA-approved oral medications that target the Janus kinase pathway, reversing the autoimmune attack in alopecia areata.'
                        }
                    }
                ]
            },
            {
                id: 'procedural',
                name: 'Procedural & Injectable',
                tooltip: {
                    title: 'Procedural & Injectable Therapies',
                    content: 'In-office treatments.'
                },
                children: [
                    {
                        id: 'il_steroids',
                        name: 'Intralesional Injections',
                        tooltip: {
                            title: 'Intralesional Corticosteroids',
                            content: 'Direct injection of steroids (e.g., triamcinolone) into the scalp skin. A first-line treatment for patchy AA and used to control inflammation in scarring alopecias.'
                        }
                    },
                    {
                        id: 'prp',
                        name: 'Platelet-Rich Plasma (PRP)',
                        tooltip: {
                            title: 'Platelet-Rich Plasma (PRP)',
                            content: 'Involves drawing the patient blood, concentrating the platelets, and injecting the PRP into the scalp to stimulate growth.'
                        }
                    },
                    {
                        id: 'lllt',
                        name: 'Low-Level Light Therapy',
                        tooltip: {
                            title: 'Low-Level Light Therapy (LLLT)',
                            content: 'Also known as photobiomodulation. Uses red light devices (caps, combs) to stimulate cellular activity in the follicles.'
                        }
                    }
                ]
            },
            {
                id: 'surgical',
                name: 'Surgical Therapies',
                tooltip: {
                    title: 'Surgical Therapies',
                    content: 'The definitive option for restoring hair in stable areas of loss.'
                },
                children: [
                    {
                        id: 'hair_tx',
                        name: 'Hair Transplantation',
                        tooltip: {
                            title: 'Hair Transplantation',
                            content: '<ul><li><strong>Concept:</strong> Moving DHT-resistant follicles from the occipital scalp to areas of thinning.</li><li><strong>FUE (Follicular Unit Extraction):</strong> Individual follicular units are harvested, leaving minimal dot scars.</li><li><strong>FUT (Follicular Unit Transplantation):</strong> A strip of scalp is removed, and follicles are dissected under a microscope.</li></ul>'
                        }
                    }
                ]
            }
        ]
    },
    'treatment-aga': {
        id: 'root',
        name: 'AGA Treatment',
        tooltip: {
            title: 'Treatment of Androgenetic Alopecia',
            content: 'A step-wise approach focusing on stimulating growth, blocking androgens, and procedural enhancement.'
        },
        children: [
            {
                id: 'aga_first',
                name: 'First-Line Medical',
                tooltip: {
                    title: 'First-Line Medical Therapies',
                    content: 'The foundational treatments for AGA.'
                },
                children: [
                    {
                        id: 'minox_aga',
                        name: 'Minoxidil',
                        tooltip: {
                            title: 'Minoxidil for AGA',
                            content: '<ul><li><strong>Topical (5% foam/solution):</strong> OTC standard of care for men and women.</li><li><strong>Low-Dose Oral (LDOM):</strong> Highly effective off-label option (0.25-5 mg daily). Often more effective and easier for adherence than topical.</li></ul>'
                        }
                    },
                    {
                        id: '5ari_aga',
                        name: '5-alpha Reductase Inhibitors',
                        tooltip: {
                            title: '5-alpha Reductase Inhibitors',
                            content: '<ul><li><strong>Finasteride (1mg):</strong> FDA-approved for male AGA.</li><li><strong>Dutasteride (0.5mg):</strong> Off-label but more potent than finasteride.</li><li><strong>Use in Women:</strong> Can be used off-label in postmenopausal women or those on reliable contraception.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'aga_fphl',
                name: 'FPHL-Specific Medical',
                tooltip: {
                    title: 'Therapies Primarily for Female Pattern Hair Loss',
                    content: 'Targeting androgen activity in women.'
                },
                children: [
                    {
                        id: 'spiro_aga',
                        name: 'Spironolactone',
                        tooltip: {
                            title: 'Spironolactone',
                            content: 'An oral anti-androgen used off-label for FPHL. Doses typically range from 50-200 mg daily.'
                        }
                    }
                ]
            },
            {
                id: 'aga_proc',
                name: 'Adjunctive Procedures',
                tooltip: {
                    title: 'Procedural Interventions for AGA',
                    content: 'In-office treatments to supplement medical therapy.'
                },
                children: [
                    {
                        id: 'prp_aga',
                        name: 'Platelet-Rich Plasma (PRP)',
                        tooltip: {
                            title: 'PRP for AGA',
                            content: 'Used to increase hair count and density. A typical regimen is monthly injections for 3 months, followed by maintenance.'
                        }
                    },
                    {
                        id: 'lllt_aga',
                        name: 'Low-Level Light Therapy (LLLT)',
                        tooltip: {
                            title: 'LLLT for AGA',
                            content: 'At-home devices (caps, helmets) used several times per week to stimulate growth. Best for those with mild-to-moderate AGA.'
                        }
                    }
                ]
            },
            {
                id: 'aga_surg',
                name: 'Surgical Restoration',
                tooltip: {
                    title: 'Surgical Options for AGA',
                    content: 'The only way to restore hair to bald areas.'
                },
                children: [
                    {
                        id: 'tx_aga',
                        name: 'Hair Transplantation',
                        tooltip: {
                            title: 'Hair Transplantation',
                            content: 'An excellent option for suitable candidates with sufficient donor hair and realistic expectations. Medical therapy is crucial to maintain non-transplanted hair.'
                        }
                    }
                ]
            }
        ]
    },
    'treatment-aa': {
        id: 'root',
        name: 'AA Treatment',
        tooltip: {
            title: 'Treatment of Alopecia Areata',
            content: 'Therapy is stratified by the extent and severity of disease.'
        },
        children: [
            {
                id: 'aa_limited',
                name: 'Limited / Patchy Disease',
                tooltip: {
                    title: 'Treatment for Limited AA (<50% Scalp Involvement)',
                    content: 'Focus is on localized anti-inflammatory treatments.'
                },
                children: [
                    {
                        id: 'il_steroids_aa',
                        name: 'Intralesional Corticosteroids',
                        tooltip: {
                            title: 'Intralesional Corticosteroids',
                            content: 'The first-line treatment for patchy AA. Injections of triamcinolone acetonide are given directly into the alopecic patches every 4-6 weeks.'
                        }
                    },
                    {
                        id: 'topicals_aa',
                        name: 'Topical Therapies',
                        tooltip: {
                            title: 'Topical Therapies for AA',
                            content: '<ul><li><strong>High-Potency Steroids:</strong> Can be used alone or between injection sessions.</li><li><strong>Topical Minoxidil:</strong> May help stimulate and maintain regrowth.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'aa_severe',
                name: 'Moderate-to-Severe Disease',
                tooltip: {
                    title: 'Treatment for Severe AA (≥50% Scalp, Totalis, Universalis)',
                    content: 'Requires systemic therapy to address widespread autoimmune activity.'
                },
                children: [
                    {
                        id: 'jaki_aa',
                        name: 'Oral JAK Inhibitors',
                        tooltip: {
                            title: 'Oral Janus Kinase (JAK) Inhibitors',
                            content: '<ul><li><strong>Mechanism:</strong> Target the cytokine signaling pathway (IFN-gamma, IL-15) that drives the disease.</li><li><strong>Baricitinib (Olumiant):</strong> FDA-approved for severe AA in adults.</li><li><strong>Ritlecitinib (Litfulo):</strong> FDA-approved for severe AA in adults and adolescents 12+.</li><li><strong>Tofacitinib/Ruxolitinib:</strong> Used effectively off-label.</li></ul>'
                        }
                    },
                    {
                        id: 'contact_immuno',
                        name: 'Contact Immunotherapy',
                        tooltip: {
                            title: 'Contact Immunotherapy',
                            content: 'Application of a potent contact allergen (like DPCP) to the scalp to induce a mild allergic reaction, which is thought to displace the autoimmune response.'
                        }
                    },
                    {
                        id: 'systemic_trad',
                        name: 'Traditional Systemics',
                        tooltip: {
                            title: 'Traditional Systemic Immunosuppressants',
                            content: 'Agents like methotrexate or cyclosporine may be considered but have been largely superseded by the efficacy and specificity of JAK inhibitors.'
                        }
                    }
                ]
            }
        ]
    },
    'treatment-lpp': {
        id: 'root',
        name: 'Lymphocytic PCA Tx',
        tooltip: {
            title: 'Treatment of Lymphocytic Scarring Alopecias (LPP, FFA, CCCA)',
            content: 'The primary goal is to halt disease progression and control inflammation to prevent further permanent hair loss.'
        },
        children: [
            {
                id: 'lpp_goal',
                name: 'Primary Goal: Halt Progression',
                tooltip: {
                    title: 'The Goal of Therapy',
                    content: 'Regrowth is not the primary goal. The main objective is to stop inflammation, reduce symptoms (itch/pain), and prevent the disease from destroying more follicles.'
                }
            },
            {
                id: 'lpp_first',
                name: 'First-Line Anti-inflammatory',
                tooltip: {
                    title: 'First-Line Anti-inflammatory Agents',
                    content: 'The initial therapies aimed at controlling the lymphocytic infiltrate.'
                },
                children: [
                    {
                        id: 'steroids_lpp',
                        name: 'Corticosteroids',
                        tooltip: {
                            title: 'Corticosteroids for Lymphocytic PCA',
                            content: '<ul><li><strong>Topical:</strong> High-potency topical steroids (e.g., Clobetasol) are a mainstay.</li><li><strong>Intralesional:</strong> Injections of triamcinolone directly into inflamed areas are highly effective.</li></ul>'
                        }
                    },
                    {
                        id: 'hcq_lpp',
                        name: 'Hydroxychloroquine',
                        tooltip: {
                            title: 'Hydroxychloroquine (Plaquenil)',
                            content: 'An oral immunomodulator that is a common first-line systemic option, particularly for LPP and DLE.'
                        }
                    },
                    {
                        id: 'doxy_lpp',
                        name: 'Tetracyclines',
                        tooltip: {
                            title: 'Tetracyclines (Doxycycline, Minocycline)',
                            content: 'Used for their anti-inflammatory, not antibiotic, properties.'
                        }
                    }
                ]
            },
            {
                id: 'lpp_second',
                name: 'Second-Line / Refractory',
                tooltip: {
                    title: 'Second-Line Therapies',
                    content: 'For patients who do not respond to or cannot tolerate first-line agents.'
                },
                children: [
                    {
                        id: 'mmf_lpp',
                        name: 'Mycophenolate Mofetil',
                        tooltip: {
                            title: 'Mycophenolate Mofetil',
                            content: 'A systemic immunosuppressant used for more aggressive or refractory disease.'
                        }
                    },
                    {
                        id: 'piog_lpp',
                        name: 'Pioglitazone',
                        tooltip: {
                            title: 'Pioglitazone',
                            content: 'An oral medication that targets PPAR-gamma, thought to be involved in the fibrosing process.'
                        }
                    },
                    {
                        id: '5ari_ffa',
                        name: '5-alpha Reductase Inhibitors (for FFA)',
                        tooltip: {
                            title: '5-ARIs for Frontal Fibrosing Alopecia',
                            content: 'Finasteride or Dutasteride are often used specifically for FFA, as an androgenic component is suspected.'
                        }
                    }
                ]
            }
        ]
    },
    'treatment-fd': {
        id: 'root',
        name: 'Neutrophilic PCA Tx',
        tooltip: {
            title: 'Treatment of Neutrophilic Scarring Alopecias (FD, DC)',
            content: 'Therapy is focused on reducing the bacterial component and controlling the intense neutrophilic inflammation.'
        },
        children: [
            {
                id: 'fd_first',
                name: 'First-Line Therapy',
                tooltip: {
                    title: 'First-Line Treatment Approach',
                    content: 'Aimed at targeting both infection and inflammation.'
                },
                children: [
                    {
                        id: 'antibiotics_fd',
                        name: 'Systemic Antibiotics',
                        tooltip: {
                            title: 'Systemic Antibiotics',
                            content: '<ul><li><strong>Tetracyclines (Doxycycline):</strong> Often used long-term for anti-inflammatory effects.</li><li><strong>Rifampin + Clindamycin:</strong> A potent combination used for 10-12 weeks to induce remission in Folliculitis Decalvans.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'fd_refractory',
                name: 'Refractory Disease',
                tooltip: {
                    title: 'Therapies for Refractory Disease',
                    content: 'For cases that do not respond to antibiotic combinations.'
                },
                children: [
                    {
                        id: 'isotret_fd',
                        name: 'Isotretinoin',
                        tooltip: {
                            title: 'Isotretinoin (Accutane)',
                            content: 'Can be effective, particularly for Dissecting Cellulitis.'
                        }
                    },
                    {
                        id: 'biologics_fd',
                        name: 'Biologics',
                        tooltip: {
                            title: 'Biologic Agents (TNF-alpha inhibitors)',
                            content: 'Agents like Adalimumab or Infliximab are reserved for severe, recalcitrant cases of Dissecting Cellulitis or Folliculitis Decalvans.'
                        }
                    }
                ]
            }
        ]
    },
    'counseling': {
        id: 'root',
        name: 'Patient Counseling',
        tooltip: {
            title: 'Effective Patient Counseling',
            content: 'Optimal management combines expert diagnosis with individualized counseling that acknowledges the emotional impact of hair loss.'
        },
        children: [
            {
                id: 'experience',
                name: 'The Hair Loss Experience',
                tooltip: {
                    title: 'Understanding the Patient Experience',
                    content: 'Hair loss is not just a medical issue; it has deep psychosocial, cultural, and emotional components.'
                },
                children: [
                    {
                        id: 'culture',
                        name: 'Race, Ethnicity & Culture',
                        tooltip: {
                            title: 'Race, Ethnicity, and Culture',
                            content: '<ul><li>Acknowledge that cultural hair care practices can contribute to hair loss (e.g., traction).</li><li>Be aware that some patients may feel clinicians lack an understanding of their hair type (e.g., Black patients), leading to apprehension.</li></ul>'
                        }
                    },
                    {
                        id: 'socioeconomic',
                        name: 'Socioeconomic Factors',
                        tooltip: {
                            title: 'Socioeconomic Factors',
                            content: '<ul><li>Recognize that treatments, procedures, and cosmetic options (wigs) can be expensive and may not be covered by insurance.</li><li>Work with patients to find affordable and accessible treatment plans.</li></ul>'
                        }
                    },
                    {
                        id: 'mental_health',
                        name: 'Mental Health & Empathy',
                        tooltip: {
                            title: 'Mental Health and Empathy',
                            content: '<ul><li><strong>Validate Feelings:</strong> Acknowledge that the strong emotions (grief, anxiety, depression) associated with hair loss are real and significant.</li><li><strong>Screen:</strong> Patients are at higher risk for psychiatric comorbidities. Refer to mental health services when appropriate.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'strategies',
                name: 'Core Counseling Strategies',
                tooltip: {
                    title: 'Core Communication and Management Strategies',
                    content: 'Building trust and empowering the patient are key to a successful therapeutic alliance.'
                },
                children: [
                    {
                        id: 'education',
                        name: 'Patient Education',
                        tooltip: {
                            title: 'Patient Education',
                            content: '<ul><li><strong>Use Simple Language:</strong> Avoid jargon. Explain the diagnosis, etiology, and pathogenesis in terms the patient understands.</li><li><strong>Be a Trusted Source:</strong> Help patients navigate disinformation from online "influencers" or advertisements.</li></ul>'
                        }
                    },
                    {
                        id: 'expectations',
                        name: 'Manage Expectations',
                        tooltip: {
                            title: 'Expectation Management',
                            content: '<ul><li><strong>Be Realistic:</strong> Clearly define the likely timing, extent, and duration of hair regrowth.</li><li><strong>Be Honest:</strong> Acknowledge when a treatment is failing or when further intervention is futile, especially in advanced scarring alopecia.</li></ul>'
                        }
                    },
                    {
                        id: 'shared_decision',
                        name: 'Shared Decision-Making',
                        tooltip: {
                            title: 'Empowerment Through Shared Decisions',
                            content: 'Outline all treatment options and engage the patient in choosing a path. This gives them a sense of control over their situation.'
                        }
                    }
                ]
            },
            {
                id: 'support',
                name: 'Practical Support',
                tooltip: {
                    title: 'Providing Practical Support',
                    content: 'Offering tangible solutions beyond medical treatment shows comprehensive care.'
                },
                children: [
                    {
                        id: 'camouflage',
                        name: 'Offer Camouflage',
                        tooltip: {
                            title: 'Camouflage Options',
                            content: '<ul><li><strong>Scalp:</strong> Discuss wigs, toppers, hair pieces, scalp micropigmentation, or hair fibers.</li><li><strong>Brows/Lashes:</strong> Suggest alternatives like microblading, eyebrow tattooing, or false eyelashes.</li><li><strong>Benefit:</strong> These interventions can significantly reduce social anxiety and stress.</li></ul>'
                        }
                    },
                    {
                        id: 'resources',
                        name: 'Provide Resources',
                        tooltip: {
                            title: 'Patient Resources',
                            content: 'Connect patients with advocacy and support groups, such as the National Alopecia Areata Foundation (NAAF).'
                        }
                    }
                ]
            }
        ]
    }
};