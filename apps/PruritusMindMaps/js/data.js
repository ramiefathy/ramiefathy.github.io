// js/data.js

const mindMapData = {
    'approach': {
        id: 'root',
        name: 'Pruritus Workup',
        tooltip: {
            title: 'Diagnostic Approach to the Itchy Patient',
            content: 'A systematic approach to evaluating a patient with chronic pruritus, focusing on the cardinal question of whether a primary skin rash is present to guide the diagnostic pathway.'
        },
        children: [
            {
                id: 'history',
                name: 'Comprehensive History',
                tooltip: {
                    title: 'The Patient History',
                    content: 'A thorough history is the most fundamental factor in diagnosing the cause of itch. It provides crucial clues to narrow the vast differential diagnosis.'
                },
                children: [
                    {
                        id: 'history_char',
                        name: 'Itch Characteristics',
                        tooltip: {
                            title: 'Characterizing the Itch',
                            content: '<ul><li><strong>Onset & Duration:</strong> Acute (<6 weeks) vs. Chronic (>6 weeks). Gradual vs. abrupt.</li><li><strong>Timing:</strong> Constant, intermittent, or paroxysmal. Nocturnal worsening is common in many types but especially suggestive of scabies.</li><li><strong>Quality:</strong> Pruritus vs. burning, stinging, or tingling sensations (suggests a neuropathic component).</li><li><strong>Localization:</strong> Generalized vs. localized. Acral start (palms/soles) suggests cholestasis. Dermatomal pattern suggests neuropathic cause.</li><li><strong>Severity:</strong> Use validated scales like Visual Analog Scale (VAS) or Numeric Rating Scale (NRS) (0-10).</li></ul>'
                        }
                    },
                    {
                        id: 'history_triggers',
                        name: 'Triggers & Alleviators',
                        tooltip: {
                            title: 'Triggers and Alleviating Factors',
                            content: '<ul><li><strong>Exacerbating Factors:</strong> Water (aquagenic pruritus), heat, sweat, stress, specific foods, or clothing (wool).</li><li><strong>Alleviating Factors:</strong> Cold (e.g., the "ice-pack sign" in brachioradial pruritus), cooling lotions (menthol), or scratching.</li></ul>'
                        }
                    },
                    {
                        id: 'history_ros',
                        name: 'Review of Systems',
                        tooltip: {
                            title: 'Systemic Review of Systems',
                            content: 'Screen for symptoms of underlying systemic disease.<ul><li><strong>Constitutional:</strong> Fever, night sweats, weight loss (suggests malignancy, esp. lymphoma).</li><li><strong>Hepatobiliary:</strong> Jaundice, pale stools (suggests cholestasis).</li><li><strong>Renal:</strong> Decreased urine output, malaise (suggests CKD).</li><li><strong>Endocrine:</strong> Heat/cold intolerance, palpitations (suggests thyroid disease).</li></ul>'
                        }
                    },
                    {
                        id: 'history_meds',
                        name: 'Medication History',
                        tooltip: {
                            title: 'Medication and Substance History',
                            content: 'A complete list of all prescription, over-the-counter, and supplement use is critical.<ul><li><strong>Common Culprits:</strong> Opioids, ACE inhibitors, calcium-channel blockers, and targeted cancer therapies.</li><li><strong>Substance Use:</strong> Opioids, cocaine, and amphetamines can cause itch.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'exam',
                name: 'Physical Examination',
                tooltip: {
                    title: 'The Physical Examination',
                    content: 'The physical exam is the most important branch point. The primary goal is to determine if the itch is caused by a primary skin disease or an underlying systemic/neurologic issue.'
                },
                children: [
                    {
                        id: 'exam_rash_q',
                        name: 'Primary Rash Present?',
                        tooltip: {
                            title: 'The Cardinal Question: Rash or No Rash?',
                            content: 'The presence or absence of a primary dermatosis fundamentally changes the diagnostic algorithm.'
                        },
                        children: [
                             {
                                id: 'exam_rash_yes',
                                name: 'Itch with Primary Rash',
                                tooltip: {
                                    title: 'Pruritus on Inflamed/Diseased Skin',
                                    content: 'The patient has a primary skin condition causing the itch. Diagnosis is based on lesion morphology and distribution. Examples include atopic dermatitis, psoriasis, and scabies.'
                                }
                            },
                            {
                                id: 'exam_rash_no',
                                name: 'Itch without Primary Rash',
                                tooltip: {
                                    title: 'Pruritus on Non-Diseased Skin',
                                    content: 'The itch is the primary problem. Skin changes (excoriations, prurigo nodules) are secondary to scratching. This presentation strongly suggests a systemic, neuropathic, psychogenic, or unknown origin (CPUO).'
                                }
                            }
                        ]
                    },
                    {
                        id: 'exam_lesions',
                        name: 'Secondary Lesions',
                        tooltip: {
                            title: 'Lesions from Scratching',
                            content: 'These are the consequences of chronic itch, not the cause. Their presence does not rule out a systemic etiology.<ul><li><strong>Excoriations:</strong> Linear scratch marks.</li><li><strong>Lichen Simplex Chronicus:</strong> Thickened skin plaques with accentuated skin lines from chronic rubbing.</li><li><strong>Prurigo Nodularis:</strong> Firm, intensely itchy nodules arising from chronic, focused scratching.</li></ul>'
                        }
                    },
                    {
                        id: 'exam_clues',
                        name: 'Specific Clinical Clues',
                        tooltip: {
                            title: 'Bedside Diagnostic Clues',
                            content: '<ul><li><strong>"Butterfly Sign":</strong> Sparing of the mid-upper back, an area the patient cannot reach. Suggests the lesions are self-induced from scratching.</li><li><strong>Burrows:</strong> Thin, serpiginous lines, especially in finger webs. Pathognomonic for scabies.</li><li><strong>Nail Pitting:</strong> Suggests psoriasis.</li><li><strong>Jaundice/Palmar Erythema:</strong> Suggests underlying liver disease.</li></ul>'
                        }
                    },
                    {
                        id: 'exam_labs',
                        name: 'Initial Lab Workup',
                        tooltip: {
                            title: 'Screening Labs for Itch without a Rash',
                            content: 'Recommended for all patients with chronic pruritus and no clear primary skin disease.<ul><li><strong>Core Labs:</strong> Complete blood count (CBC) with differential, liver and renal function tests (CMP), Thyroid-stimulating hormone (TSH).</li><li><strong>Guided Labs:</strong> Based on H&P, consider HIV/hepatitis serologies, iron studies, chest x-ray, and protein electrophoresis.</li><li><strong>Skin Biopsy:</strong> Recommended if latent dermatosis (e.g., bullous pemphigoid) is suspected.</li></ul>'
                        }
                    }
                ]
            }
        ]
    },
    'classification': {
        id: 'root',
        name: 'Etiologies of Pruritus',
        tooltip: {
            title: 'Classification of Chronic Pruritus',
            content: 'Chronic itch is broadly categorized based on its underlying origin, following the classification system proposed by the International Forum for the Study of Itch (IFSI).'
        },
        children: [
            {
                id: 'class_derm',
                name: 'Dermatologic',
                tooltip: {
                    title: 'Dermatologic Pruritus',
                    content: 'Itch arising from a primary inflammatory or infectious skin disease. This is the most common cause of chronic pruritus.'
                },
                children: [
                    {
                        id: 'class_derm_ecz',
                        name: 'Eczematous Dermatitis',
                        tooltip: { title: 'Eczematous Dermatitis', content: 'Includes Atopic Dermatitis ("the itch that rashes"), Contact Dermatitis, and Xerotic Eczema (dry skin).' }
                    },
                    {
                        id: 'class_derm_pap',
                        name: 'Papulosquamous',
                        tooltip: { title: 'Papulosquamous Disorders', content: 'Includes Psoriasis and Lichen Planus.' }
                    },
                    {
                        id: 'class_derm_inf',
                        name: 'Infections/Infestations',
                        tooltip: { title: 'Infections and Infestations', content: 'Scabies is a key diagnosis to consider in any patient with severe, nocturnal itch.' }
                    },
                    {
                        id: 'class_derm_auto',
                        name: 'Autoimmune Blistering',
                        tooltip: { title: 'Autoimmune Blistering Diseases', content: 'Bullous Pemphigoid can present with intense pruritus and urticarial plaques for months before blisters appear, especially in the elderly.' }
                    }
                ]
            },
            {
                id: 'class_sys',
                name: 'Systemic',
                tooltip: {
                    title: 'Systemic Pruritus',
                    content: 'Itch as a manifestation of an internal disease. It typically presents as generalized pruritus without a primary rash.'
                },
                children: [
                    {
                        id: 'class_sys_renal',
                        name: 'Renal',
                        tooltip: { title: 'Chronic Kidney Disease-Associated Pruritus (CKD-aP)', content: 'Common in patients on dialysis. Often severe, generalized, and worse at night.' }
                    },
                    {
                        id: 'class_sys_hep',
                        name: 'Hepatobiliary',
                        tooltip: { title: 'Cholestatic Pruritus', content: 'Caused by impaired bile flow (e.g., primary biliary cholangitis). Often starts on palms and soles.' }
                    },
                    {
                        id: 'class_sys_hem',
                        name: 'Hematologic/Oncologic',
                        tooltip: { title: 'Hematologic and Malignant Causes', content: '<strong>Polycythemia Vera:</strong> presents with aquagenic pruritus (itching after contact with water). <strong>Lymphoma (esp. Hodgkin):</strong> can present with severe, nocturnal pruritus and B-symptoms.' }
                    },
                    {
                        id: 'class_sys_endo',
                        name: 'Endocrine',
                        tooltip: { title: 'Endocrine Causes', content: 'Hyperthyroidism, and less commonly, diabetes mellitus and hypothyroidism can be associated with generalized pruritus.' }
                    }
                ]
            },
            {
                id: 'class_neuro',
                name: 'Neuropathic',
                tooltip: {
                    title: 'Neuropathic Pruritus',
                    content: 'Itch caused by injury or dysfunction of the afferent nervous system. Often localized to a specific dermatome and accompanied by other sensations like burning or stinging.'
                },
                children: [
                     {
                        id: 'class_neuro_brp',
                        name: 'Brachioradial Pruritus',
                        tooltip: { title: 'Brachioradial Pruritus', content: 'Itch on the dorsolateral forearms, thought to be from cervical spine disease (C5-C7). Classically improves with application of ice (the "ice-pack sign").' }
                    },
                    {
                        id: 'class_neuro_np',
                        name: 'Notalgia Paresthetica',
                        tooltip: { title: 'Notalgia Paresthetica', content: 'Unilateral itch on the mid-upper back (medial to the scapula), from nerve entrapment of T2-T6 spinal nerves.' }
                    },
                     {
                        id: 'class_neuro_php',
                        name: 'Post-herpetic Pruritus',
                        tooltip: { title: 'Post-herpetic Pruritus', content: 'Chronic itch that persists in a dermatome after an episode of herpes zoster (shingles).' }
                    }
                ]
            },
            {
                id: 'class_psych',
                name: 'Psychogenic',
                tooltip: {
                    title: 'Psychogenic Pruritus',
                    content: 'Itch related to a primary psychiatric disorder. This is a diagnosis of exclusion. Includes conditions like delusional infestation.'
                },
            },
            {
                id: 'class_cpuo',
                name: 'CPUO',
                tooltip: {
                    title: 'Chronic Pruritus of Unknown Origin (CPUO)',
                    content: 'A diagnosis of exclusion for patients with chronic itch lasting >6 weeks where a thorough workup reveals no dermatologic, systemic, neuropathic, or psychogenic cause.'
                }
            }
        ]
    },
    'pathophysiology': {
        id: 'root',
        name: 'Pathophysiology of Itch',
        tooltip: {
            title: 'The Neuro-Immune Basis of Itch',
            content: 'Itch is a complex sensation resulting from the interplay between the nervous system, immune cells, and skin cells (keratinocytes). It involves dedicated neural pathways and a host of chemical mediators.'
        },
        children: [
            {
                id: 'path_peripheral',
                name: 'Peripheral Mechanisms',
                tooltip: {
                    title: 'Mechanisms in the Skin',
                    content: 'The itch signal originates from the activation of pruriceptors (itch-sensing nerve endings) in the epidermis and dermis.'
                },
                children: [
                    {
                        id: 'path_nerves',
                        name: 'Nerve Fibers',
                        tooltip: {
                            title: 'Pruriceptive Nerve Fibers',
                            content: '<ul><li><strong>Unmyelinated C-fibers:</strong> The primary transmitters of itch. Subsets are either histamine-sensitive (acute itch) or non-histaminergic (most chronic itch).</li><li><strong>Myelinated A-delta fibers:</strong> Contribute to itch sensation as well.</li></ul>'
                        }
                    },
                    {
                        id: 'path_mediators',
                        name: 'Key Itch Mediators',
                        tooltip: {
                            title: 'Pruritogenic Mediators',
                            content: 'A host of molecules released by immune cells, nerves, and keratinocytes can activate pruriceptors.<ul><li><strong>Histamine:</strong> The classic mediator of acute, urticarial itch, released from mast cells.</li><li><strong>Cytokines (Type 2):</strong> <strong>IL-31, IL-4, and IL-13</strong> are crucial drivers of chronic itch in atopic diseases like dermatitis and prurigo nodularis.</li><li><strong>Neuropeptides:</strong> Substance P and CGRP are released from nerve endings, causing neurogenic inflammation.</li><li><strong>Proteases:</strong> Tryptase from mast cells activates PAR-2 receptors on nerves, a key non-histaminergic pathway.</li></ul>'
                        }
                    },
                    {
                        id: 'path_receptors',
                        name: 'Key Itch Receptors',
                        tooltip: {
                            title: 'Receptors on Nerve Endings',
                            content: '<ul><li><strong>Histamine Receptors (H1R, H4R):</strong> Target for antihistamines.</li><li><strong>IL-31 Receptor (OSMRβ/IL31RA):</strong> Target for nemolizumab.</li><li><strong>PAR-2:</strong> Receptor for proteases like tryptase.</li><li><strong>TRP Channels (TRPV1, TRPA1):</strong> Ion channels that modulate itch and are activated by capsaicin, menthol, and other stimuli.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'path_central',
                name: 'Central Mechanisms',
                tooltip: {
                    title: 'Mechanisms in the Spinal Cord & Brain',
                    content: 'The itch signal is processed and modulated at the level of the spinal cord and perceived in the brain.'
                },
                children: [
                     {
                        id: 'path_spinal',
                        name: 'Spinal Cord Processing',
                        tooltip: {
                            title: 'Spinal Cord Processing',
                            content: 'Pruriceptive neurons synapse in the dorsal horn of the spinal cord, activating second-order neurons that ascend to the brain via the spinothalamic tract.'
                        }
                    },
                    {
                        id: 'path_brain',
                        name: 'Brain Perception',
                        tooltip: {
                            title: 'Brain Perception of Itch',
                            content: 'The itch signal is processed in multiple brain areas involved in sensation, emotion, attention, and reward, explaining the distressing and all-consuming nature of chronic itch.'
                        }
                    }
                ]
            },
            {
                id: 'path_cycle',
                name: 'The Itch-Scratch Cycle',
                tooltip: {
                    title: 'The Vicious Itch-Scratch Cycle',
                    content: 'A central concept in chronic itch. The sensation of itch leads to the urge to scratch. Scratching provides temporary relief but damages the skin barrier, causing more inflammation and release of itch mediators, which in turn leads to more itch.'
                }
            }
        ]
    },
    'modality': {
        id: 'root',
        name: 'Therapeutic Modalities',
        tooltip: {
            title: 'Overview of Treatment Types for Pruritus',
            content: 'The management of chronic pruritus involves a multimodal approach, combining non-pharmacologic strategies, topical agents, systemic medications, and procedural therapies.'
        },
        children: [
            {
                id: 'mod_general',
                name: 'General & Topical',
                tooltip: {
                    title: 'Foundational & Topical Therapies',
                    content: 'First-line approaches for managing itch, especially when localized or associated with dry/inflamed skin.'
                },
                children: [
                    {
                        id: 'mod_top_base',
                        name: 'Skincare & Emollients',
                        tooltip: { title: 'Skincare and Barrier Repair', content: 'The cornerstone of management. Includes gentle cleansing, trigger avoidance, and frequent use of moisturizers to restore skin barrier function.' }
                    },
                    {
                        id: 'mod_top_antiinflam',
                        name: 'Topical Anti-inflammatories',
                        tooltip: { title: 'Topical Anti-inflammatories', content: '<ul><li><strong>Corticosteroids:</strong> Mainstay for itch associated with inflammatory dermatoses (eg, eczema).</li><li><strong>Calcineurin Inhibitors:</strong> Tacrolimus and pimecrolimus are steroid-sparing alternatives for sensitive areas.</li></ul>'}
                    },
                    {
                        id: 'mod_top_neuro',
                        name: 'Topical Neuromodulators',
                        tooltip: { title: 'Topical Neuromodulators', content: '<ul><li><strong>Counter-irritants:</strong> Menthol and camphor provide a cooling sensation.</li><li><strong>Anesthetics:</strong> Pramoxine and lidocaine provide temporary relief.</li><li><strong>Capsaicin:</strong> Depletes neuropeptides from nerve endings; effective for neuropathic itch but causes initial burning.</li></ul>'}
                    }
                ]
            },
            {
                id: 'mod_systemic',
                name: 'Systemic Therapies',
                tooltip: {
                    title: 'Systemic (Oral/Injectable) Therapies',
                    content: 'Used for generalized, severe, or refractory pruritus that does not respond to topical measures.'
                },
                children: [
                    {
                        id: 'mod_sys_anti',
                        name: 'Antihistamines',
                        tooltip: { title: 'Antihistamines', content: 'Highly effective for histaminergic itch (e.g., urticaria). Limited efficacy in most chronic itch, but sedating first-generation agents can be useful for nocturnal itch.' }
                    },
                    {
                        id: 'mod_sys_neuro',
                        name: 'Neuromodulators',
                        tooltip: { title: 'Neuromodulators', content: 'A mainstay for neuropathic itch, uremic pruritus, and CPUO.<ul><li><strong>Gabapentinoids:</strong> Gabapentin and pregabalin.</li><li><strong>Antidepressants:</strong> SSRIs (sertraline) and Tricyclics (doxepin) have antipruritic effects.</li></ul>' }
                    },
                    {
                        id: 'mod_sys_immuno',
                        name: 'Immunomodulators',
                        tooltip: { title: 'Immunomodulators', content: 'Used for severe inflammatory itch. Includes methotrexate, cyclosporine, and targeted biologics like Dupilumab (anti-IL-4/13).' }
                    },
                    {
                        id: 'mod_sys_opioid',
                        name: 'Opioid Modulators',
                        tooltip: { title: 'Opioid Modulators', content: 'Target the opioid system imbalance in chronic itch. Includes μ-opioid antagonists (naltrexone) and κ-opioid agonists (difelikefalin).' }
                    }
                ]
            }
        ]
    },
    'treatment-pn': {
        id: 'root',
        name: 'Prurigo Nodularis Tx',
        tooltip: {
            title: 'Treatment of Prurigo Nodularis (PN)',
            content: 'The goal is to break the vicious itch-scratch cycle. Management requires a multimodal approach targeting the intense itch and the resulting skin lesions.'
        },
        children: [
            {
                id: 'pn_first',
                name: 'First-Line Therapies',
                tooltip: { title: 'First-Line Therapies for PN', content: 'Focus on potent anti-inflammatory and antipruritic topicals.'},
                children: [
                    { id: 'pn_top_steroids', name: 'High-Potency Topical Steroids', tooltip: { title: 'High-Potency Topical Steroids', content: 'Often used under occlusion (e.g., Unna boot) or as a medicated tape (flurandrenolide) to enhance penetration and provide a physical barrier to scratching.'}},
                    { id: 'pn_il_steroids', name: 'Intralesional Corticosteroids', tooltip: { title: 'Intralesional Corticosteroids', content: 'Direct injection of triamcinolone into nodules is effective for alleviating pruritus and flattening lesions.'}},
                    { id: 'pn_emollients', name: 'Emollients & Anesthetics', tooltip: { title: 'Supportive Topicals', content: 'Topical anesthetics (pramoxine) and cooling agents (menthol) provide symptomatic relief.'}}
                ]
            },
            {
                id: 'pn_second',
                name: 'Second-Line Therapies',
                tooltip: { title: 'Second-Line Therapies for PN', content: 'For patients with widespread or refractory disease.'},
                children: [
                    { id: 'pn_photo', name: 'Phototherapy', tooltip: { title: 'Phototherapy', content: 'Narrowband UVB (NBUVB) is a useful option for generalized PN.'}},
                    { id: 'pn_gaba', name: 'Gabapentinoids', tooltip: { title: 'Gabapentinoids', content: 'Gabapentin and pregabalin are first-line systemic agents for targeting the neuropathic component of PN itch.'}}
                ]
            },
            {
                id: 'pn_third',
                name: 'Third-Line & Emerging',
                tooltip: { title: 'Third-Line and Emerging Therapies', content: 'For severe, recalcitrant disease.'},
                children: [
                    { id: 'pn_immuno', name: 'Immunomodulators', tooltip: { title: 'Systemic Immunomodulators', content: 'Agents like methotrexate, cyclosporine, and dupilumab are used for their potent anti-inflammatory and antipruritic effects.'}},
                    { id: 'pn_nemolizumab', name: 'Nemolizumab', tooltip: { title: 'Nemolizumab (Nemluvio)', content: 'FDA-approved monoclonal antibody targeting IL-31 receptor alpha. First-in-class biologic specifically approved for prurigo nodularis, demonstrating significant itch reduction and lesion improvement.'}},
                    { id: 'pn_opioid', name: 'Opioid Modulators', tooltip: { title: 'Opioid Modulators', content: 'Opioid antagonists like naltrexone can be effective.'}},
                    { id: 'pn_thalidomide', name: 'Thalidomide', tooltip: { title: 'Thalidomide', content: 'A neuroactive medication reserved for patients who have failed traditional therapies due to its significant side effect profile.'}},
                    { id: 'pn_emerging', name: 'Emerging Therapies', tooltip: { title: 'Other Emerging Targeted Therapies', content: 'Additional biologics and small molecules in development, including serlopitant (NK1R inhibitor) and other novel agents targeting itch pathways.'}}
                ]
            }
        ]
    },
    'treatment-ckd': {
        id: 'root',
        name: 'CKD-Associated Pruritus Tx',
        tooltip: {
            title: 'Treatment of Chronic Kidney Disease-Associated Pruritus',
            content: 'Management involves optimizing dialysis, aggressive skincare, and targeting the neuropathic/opioidergic components of the itch.'
        },
        children: [
             {
                id: 'ckd_first',
                name: 'First-Line Therapies',
                tooltip: { title: 'First-Line Therapies', content: 'Foundational management for all patients.'},
                children: [
                    { id: 'ckd_dialysis', name: 'Optimize Dialysis', tooltip: { title: 'Optimize Dialysis', content: 'Ensure adequacy of hemodialysis as a first step.'}},
                    { id: 'ckd_emollients', name: 'Emollients', tooltip: { title: 'Aggressive Emollient Use', content: 'Essential for managing the xerosis that is almost always present and contributes to itch.'}},
                    { id: 'ckd_gaba', name: 'Gabapentinoids', tooltip: { title: 'Gabapentinoids', content: 'Gabapentin (e.g., 100-300mg post-dialysis) and pregabalin are the first-line systemic treatments for uremic pruritus.'}}
                ]
            },
            {
                id: 'ckd_second',
                name: 'Second-Line Therapies',
                tooltip: { title: 'Second-Line Therapies', content: 'For patients who do not respond to first-line agents.'},
                children: [
                    { id: 'ckd_photo', name: 'Phototherapy', tooltip: { title: 'Phototherapy', content: 'Broadband or narrowband UVB is an effective option.'}},
                    { id: 'ckd_naltrexone', name: 'Naltrexone', tooltip: { title: 'Naltrexone', content: 'The μ-opioid antagonist can be effective, though results in trials have been mixed.'}}
                ]
            },
            {
                id: 'ckd_third',
                name: 'Third-Line & Emerging',
                tooltip: { title: 'Third-Line and Emerging Therapies', content: 'For refractory uremic pruritus.'},
                children: [
                    { id: 'ckd_mirtazapine', name: 'Mirtazapine', tooltip: { title: 'Mirtazapine', content: 'A low-dose antidepressant that can be helpful, particularly for nocturnal itch due to its sedative effects.'}},
                    { id: 'ckd_difelikefalin', name: 'Difelikefalin', tooltip: { title: 'Difelikefalin', content: 'A peripherally-acting κ-opioid receptor agonist that is a newer, targeted therapy shown to be effective in clinical trials.'}}
                ]
            }
        ]
    },
    'counseling': {
        id: 'root',
        name: 'Patient Counseling',
        tooltip: {
            title: 'Patient Counseling and Foundational Management',
            content: 'Effective itch management combines targeted medical therapy with robust patient education, behavioral modification, and skincare fundamentals to address the multifaceted nature of chronic pruritus.'
        },
        children: [
            {
                id: 'counsel_education',
                name: 'Patient Education',
                tooltip: {
                    title: 'Educating the Patient',
                    content: 'Empowering patients with knowledge is a critical first step.<ul><li><strong>Explain the Itch-Scratch Cycle:</strong> Help patients understand how scratching, while providing temporary relief, perpetuates the problem by damaging the skin.</li><li><strong>Set Realistic Expectations:</strong> Counsel that the goal is often significant reduction and control of itch, not necessarily 100% elimination.</li></ul>'
                }
            },
            {
                id: 'counsel_skincare',
                name: 'Skincare & Behavioral',
                tooltip: {
                    title: 'Skincare and Behavioral Strategies',
                    content: 'These non-pharmacologic interventions are crucial for all patients with chronic itch.'
                },
                children: [
                    {
                        id: 'counsel_skin_care',
                        name: 'Gentle Skincare',
                        tooltip: {
                            title: 'Gentle Skincare Routine',
                            content: '<ul><li><strong>Bathing:</strong> Use lukewarm (not hot) water and limit duration.</li><li><strong>Cleansers:</strong> Use mild, non-soap, low-pH cleansers instead of harsh alkaline soaps.</li><li><strong>Moisturizing:</strong> Apply emollients liberally and frequently, especially immediately after bathing on damp skin to lock in moisture.</li></ul>'
                        }
                    },
                    {
                        id: 'counsel_triggers',
                        name: 'Trigger Avoidance',
                        tooltip: {
                            title: 'Identifying and Avoiding Triggers',
                            content: 'Work with the patient to identify and avoid personal itch triggers, such as:<ul><li><strong>Environmental:</strong> Overheating, low humidity.</li><li><strong>Clothing:</strong> Rough fabrics like wool.</li><li><strong>Stress:</strong> Emotional stress is a common exacerbator.</li></ul>'
                        }
                    },
                    {
                        id: 'counsel_scratch',
                        name: 'Scratch Reduction',
                        tooltip: {
                            title: 'Breaking the Habit of Scratching',
                            content: '<ul><li><strong>Substitute Scratching:</strong> Advise patients to pinch, rub gently, or apply a cold pack/emollient instead of scratching.</li><li><strong>Keep Nails Short:</strong> Minimizes skin damage from scratching.</li><li><strong>Occlusion:</strong> Using dressings or "wet wraps" can provide relief and a physical barrier.</li></ul>'
                        }
                    }
                ]
            },
            {
                id: 'counsel_psych',
                name: 'Psychosocial Support',
                tooltip: {
                    title: 'Addressing the Psychosocial Burden',
                    content: 'Chronic itch has a profound impact on quality of life, comparable to chronic pain.<ul><li><strong>Validate the Experience:</strong> Acknowledge the significant impact of itch on sleep, mood (anxiety, depression), and daily functioning.</li><li><strong>Consider Psychological Support:</strong> Relaxation techniques, stress management, and cognitive behavioral therapy can be valuable adjuncts.</li></ul>'
                }
            }
        ]
    }
};