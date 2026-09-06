// js/data.js - Psoriasis & Psoriatic Arthritis Mind Maps Data

const mindMapData = {
  "patho": {
    "id": "root",
    "name": "Pathogenesis",
    "tooltip": {
      "title": "The Immune Basis of Psoriasis",
      "content": "Psoriasis is a chronic immune-mediated disease where an interplay of genetic and environmental factors triggers a cascade of inflammation, primarily driven by the IL-23/Th17 axis."
    },
    "children": [
      {
        "id": "genetics",
        "name": "Genetic & Environmental",
        "tooltip": {
          "title": "Genetic & Environmental Factors",
          "content": "The initial phase where susceptibility meets a trigger, initiating the inflammatory process."
        },
        "children": [
          {
            "id": "hla",
            "name": "Genetic Susceptibility",
            "tooltip": {
              "title": "Genetic Susceptibility",
              "content": "<ul><li><strong>HLA-C*06:02:</strong> The main genetic risk factor for psoriasis.</li><li><strong>HLA-B*27:</strong> A strong genetic marker for axial disease in Psoriatic Arthritis (PsA).</li><li><strong>Other Genes:</strong> Loci related to IL23R and other immune pathways are also implicated.</li></ul>"
            }
          },
          {
            "id": "env_triggers",
            "name": "Environmental Triggers",
            "tooltip": {
              "title": "Environmental Triggers",
              "content": "<ul><li><strong>Infections:</strong> Streptococcal pharyngitis is a classic trigger for guttate psoriasis.</li><li><strong>Trauma (Koebner):</strong> Psoriatic lesions appearing at sites of skin injury.</li><li><strong>Stress:</strong> Both physical and psychological stress can trigger or exacerbate psoriasis.</li><li><strong>Medications:</strong> Beta-blockers, lithium, and antimalarials are known triggers.</li></ul>"
            }
          }
        ]
      },
      {
        "id": "il23_th17",
        "name": "IL-23/Th17 Axis",
        "tooltip": {
          "title": "The IL-23/Th17 Axis",
          "content": "The core inflammatory pathway driving the clinical manifestations of psoriasis."
        },
        "children": [
          {
            "id": "apc",
            "name": "Antigen Presentation",
            "tooltip": {
              "title": "Antigen-Presenting Cells (APCs)",
              "content": "Dendritic cells in the skin are activated by triggers and produce key cytokines, including IL-23 and IL-12."
            }
          },
          {
            "id": "th17",
            "name": "T-Helper 17 (Th17) Cells",
            "tooltip": {
              "title": "Th17 Cell Activation",
              "content": "IL-23 acts as a \"master cytokine\" that promotes the survival and proliferation of Th17 cells. These cells are the primary source of IL-17."
            }
          },
          {
            "id": "il17_22",
            "name": "Effector Cytokines",
            "tooltip": {
              "title": "Effector Cytokines (IL-17 & IL-22)",
              "content": "<ul><li><strong>IL-17:</strong> A key pro-inflammatory cytokine that stimulates keratinocytes to produce chemokines, recruiting inflammatory cells (like neutrophils) into the skin.</li><li><strong>IL-22:</strong> Directly drives the hyperproliferation of keratinocytes, leading to the thick, scaly plaques characteristic of psoriasis.</li><li><strong>TNF-α:</strong> Another critical cytokine that contributes to the overall inflammatory milieu.</li></ul>"
            }
          }
        ]
      },
      {
        "id": "kc_hyper",
        "name": "Keratinocyte Hyperproliferation",
        "tooltip": {
          "title": "Clinical Manifestation",
          "content": "The result of the cytokine cascade on the skin."
        },
        "children": [
          {
            "id": "plaque",
            "name": "Plaque Formation",
            "tooltip": {
              "title": "Plaque Formation",
              "content": "The combined effects of IL-17 and IL-22 lead to:<ul><li><strong>Hyperproliferation:</strong> Epidermal cell turnover is dramatically increased.</li><li><strong>Inflammation:</strong> Influx of neutrophils and other immune cells into the epidermis and dermis.</li><li><strong>Vascular Changes:</strong> Dilation of blood vessels in the dermis.</li></ul>This results in the characteristic erythematous, indurated, and scaly psoriatic plaque."
            }
          }
        ]
      }
    ]
  },
  "subtypes": {
    "id": "root",
    "name": "Clinical Subtypes",
    "tooltip": {
      "title": "Clinical Presentations of Psoriasis",
      "content": "Psoriasis is a heterogeneous disease that can manifest in several distinct clinical forms. A patient can have more than one type at a time or over their lifetime."
    },
    "children": [
      {
        "id": "plaque_sub",
        "name": "Plaque Psoriasis",
        "tooltip": {
          "title": "Plaque Psoriasis (Psoriasis Vulgaris)",
          "content": "<ul><li><strong>Prevalence:</strong> Most common type, affecting 80-90% of patients.</li><li><strong>Manifestations:</strong> Well-demarcated, raised, erythematous plaques with a silvery-white scale.</li><li><strong>Locations:</strong> Typically affects extensor surfaces like elbows and knees, scalp, and the lumbosacral area.</li></ul>"
        }
      },
      {
        "id": "guttate_sub",
        "name": "Guttate Psoriasis",
        "tooltip": {
          "title": "Guttate Psoriasis",
          "content": "<ul><li><strong>Prevalence:</strong> Affects about 8% of patients.</li><li><strong>Manifestations:</strong> Characterized by small, \"drop-like,\" erythematous papules and plaques.</li><li><strong>Triggers:</strong> Often appears suddenly after a streptococcal infection, especially in children and young adults.</li></ul>"
        }
      },
      {
        "id": "inverse_sub",
        "name": "Inverse Psoriasis",
        "tooltip": {
          "title": "Inverse (Flexural) Psoriasis",
          "content": "<ul><li><strong>Prevalence:</strong> Affects about 25% of patients.</li><li><strong>Manifestations:</strong> Smooth, shiny, erythematous plaques without significant scaling.</li><li><strong>Locations:</strong> Occurs in skin folds such as the axillae, groin, inframammary, and gluteal cleft.</li></ul>"
        }
      },
      {
        "id": "pustular_sub",
        "name": "Pustular Psoriasis",
        "tooltip": {
          "title": "Pustular Psoriasis",
          "content": "<ul><li><strong>Prevalence:</strong> Affects about 3% of patients.</li><li><strong>Manifestations:</strong> Characterized by sterile, pus-filled pustules. Can be localized (e.g., palmoplantar pustulosis) or generalized (von Zumbusch), which is a medical emergency.</li></ul>"
        }
      },
      {
        "id": "erythro_sub",
        "name": "Erythrodermic Psoriasis",
        "tooltip": {
          "title": "Erythrodermic Psoriasis",
          "content": "<ul><li><strong>Manifestations:</strong> A severe form involving generalized erythema and scaling of >90% of the body surface area.</li><li><strong>Complications:</strong> Can lead to severe systemic complications like dehydration, electrolyte imbalance, and cardiac failure, often requiring hospitalization.</li></ul>"
        }
      },
      {
        "id": "nail_sub",
        "name": "Nail Psoriasis",
        "tooltip": {
          "title": "Nail Psoriasis",
          "content": "<ul><li><strong>Manifestations:</strong> Can affect fingernails and toenails. Findings include pitting, onycholysis (lifting of the nail plate), subungual hyperkeratosis, and \"oil drop\" spots.</li><li><strong>Association:</strong> Strongly associated with the presence of psoriatic arthritis.</li></ul>"
        }
      }
    ]
  },
  "comorbid": {
    "id": "root",
    "name": "Comorbidities",
    "tooltip": {
      "title": "Psoriasis as a Systemic Disease",
      "content": "Psoriasis is not just a skin disease; it is a systemic inflammatory condition associated with numerous significant comorbidities."
    },
    "children": [
      {
        "id": "psa_comorbid",
        "name": "Psoriatic Arthritis (PsA)",
        "tooltip": {
          "title": "Psoriatic Arthritis (PsA)",
          "content": "<ul><li><strong>Prevalence:</strong> The most common comorbidity, affecting up to 30% of patients with psoriasis.</li><li><strong>Impact:</strong> An inflammatory arthritis that can lead to irreversible joint damage and disability if not treated early.</li></ul>"
        }
      },
      {
        "id": "cardio_comorbid",
        "name": "Cardiometabolic Disease",
        "tooltip": {
          "title": "Cardiometabolic & Cardiovascular Disease",
          "content": "<ul><li><strong>Association:</strong> Patients with moderate-to-severe psoriasis have an increased risk of obesity, hypertension, dyslipidemia, type 2 diabetes, and metabolic syndrome.</li><li><strong>Mechanism:</strong> Believed to be driven by shared systemic inflammatory pathways.</li><li><strong>Risk:</strong> Leads to a higher risk of major adverse cardiovascular events (MACE), including myocardial infarction and stroke.</li></ul>"
        }
      },
      {
        "id": "psych_comorbid",
        "name": "Psychosocial Burden",
        "tooltip": {
          "title": "Psychosocial Comorbidities",
          "content": "<ul><li><strong>Conditions:</strong> Increased prevalence of depression and anxiety.</li><li><strong>Impact:</strong> The visible nature of the disease can lead to social stigmatization, low self-esteem, and a significantly reduced quality of life, comparable to other major chronic diseases like cancer and heart disease.</li></ul>"
        }
      },
      {
        "id": "other_comorbid",
        "name": "Other Comorbidities",
        "tooltip": {
          "title": "Other Associated Conditions",
          "content": "<ul><li><strong>Inflammatory Bowel Disease:</strong> Increased risk of Crohn's disease.</li><li><strong>Uveitis:</strong> Inflammation of the eye, particularly common in patients with PsA.</li><li><strong>Fatty Liver Disease:</strong> Increased risk of non-alcoholic fatty liver disease (NAFLD).</li></ul>"
        }
      }
    ]
  },
  "psa": {
    "id": "root",
    "name": "Psoriatic Arthritis (PsA)",
    "tooltip": {
      "title": "Psoriatic Arthritis (PsA) for the Dermatologist",
      "content": "PsA is a seronegative inflammatory arthritis strongly associated with psoriasis. Dermatologists are on the front line for early detection, as skin disease precedes arthritis in ~85% of cases."
    },
    "children": [
      {
        "id": "screening",
        "name": "Screening",
        "tooltip": {
          "title": "Screening for PsA in Psoriasis Patients",
          "content": "Early diagnosis is critical to prevent irreversible joint damage. Dermatologists should screen psoriasis patients regularly."
        },
        "children": [
          {
            "id": "mnemonic",
            "name": "\"PSA\" Mnemonic",
            "tooltip": {
              "title": "The \"PSA\" Mnemonic",
              "content": "A simple tool to remember key symptoms:<ul><li><strong>P:</strong> Pain in joints</li><li><strong>S:</strong> Stiffness (especially morning stiffness >30 min) / Swelling / Sausage digit</li><li><strong>A:</strong> Axial (inflammatory back pain)</li></ul>"
            }
          },
          {
            "id": "tools_psa",
            "name": "Screening Tools",
            "tooltip": {
              "title": "Validated Screening Questionnaires",
              "content": "Tools like the PEST (Psoriasis Epidemiology Screening Tool) can be used in the clinic to identify patients at high risk who require referral to a rheumatologist."
            }
          }
        ]
      },
      {
        "id": "domains",
        "name": "Clinical Domains",
        "tooltip": {
          "title": "The Domains of PsA",
          "content": "PsA is a heterogeneous disease that can affect multiple musculoskeletal sites."
        },
        "children": [
          {
            "id": "peripheral_psa",
            "name": "Peripheral Arthritis",
            "tooltip": {
              "title": "Peripheral Arthritis",
              "content": "Inflammation of joints in the limbs. Can be oligoarticular (<5 joints) or polyarticular (≥5 joints), and is often asymmetric."
            }
          },
          {
            "id": "axial_psa",
            "name": "Axial Disease",
            "tooltip": {
              "title": "Axial Disease",
              "content": "Inflammation of the spine (spondylitis) and sacroiliac joints (sacroiliitis), causing inflammatory back pain."
            }
          },
          {
            "id": "enthesitis_psa",
            "name": "Enthesitis",
            "tooltip": {
              "title": "Enthesitis",
              "content": "Inflammation at the site of tendon or ligament insertion into bone. Classic locations include the Achilles tendon and plantar fascia insertion on the heel."
            }
          },
          {
            "id": "dactylitis_psa",
            "name": "Dactylitis",
            "tooltip": {
              "title": "Dactylitis (\"Sausage Digit\")",
              "content": "Inflammation of the entire digit (finger or toe), including the joint, tendon, and soft tissue, leading to diffuse swelling."
            }
          },
          {
            "id": "skin_nails_psa",
            "name": "Skin & Nails",
            "tooltip": {
              "title": "Skin and Nail Disease",
              "content": "The presence of psoriasis, particularly nail psoriasis (pitting, onycholysis), is a key feature and a risk factor for developing PsA."
            }
          }
        ]
      }
    ]
  },
  "treatment-modality": {
    "id": "root",
    "name": "By Modality",
    "tooltip": {
      "title": "Therapeutic Armamentarium",
      "content": "An overview of psoriasis treatment options, organized by their mode of delivery and mechanism."
    },
    "children": [
      {
        "id": "topical_tx",
        "name": "Topical Therapies",
        "tooltip": {
          "title": "Topical Therapies",
          "content": "First-line for limited or mild disease (<3-5% BSA) and used as adjuncts in moderate-to-severe disease."
        },
        "children": [
          {
            "id": "top_steroids",
            "name": "Corticosteroids",
            "tooltip": {
              "title": "Topical Corticosteroids",
              "content": "The mainstay of topical treatment. Available in various potencies and vehicles (creams, ointments, foams, solutions)."
            }
          },
          {
            "id": "vit_d",
            "name": "Vitamin D Analogs",
            "tooltip": {
              "title": "Vitamin D Analogs",
              "content": "(e.g., Calcipotriene, Calcitriol) Work by inhibiting keratinocyte proliferation. Often used in combination with steroids."
            }
          },
          {
            "id": "top_other",
            "name": "Other Topicals",
            "tooltip": {
              "title": "Other Topical Agents",
              "content": "Includes topical retinoids (Tazarotene), calcineurin inhibitors (for face/flexures), and newer agents like Tapinarof (Aryl hydrocarbon receptor agonist) and Roflumilast (PDE4 inhibitor)."
            }
          }
        ]
      },
      {
        "id": "photo_tx",
        "name": "Phototherapy",
        "tooltip": {
          "title": "Phototherapy",
          "content": "The use of ultraviolet (UV) light to treat widespread psoriasis. A second-line option for moderate-to-severe disease."
        },
        "children": [
          {
            "id": "nb_uvb",
            "name": "Narrowband UVB (NB-UVB)",
            "tooltip": {
              "title": "Narrowband UVB",
              "content": "The most common and effective form of phototherapy, using a specific wavelength (311 nm) of UV light."
            }
          },
          {
            "id": "puva_tx",
            "name": "PUVA",
            "tooltip": {
              "title": "PUVA",
              "content": "Psoralen plus UVA light. Highly effective but less commonly used now due to increased skin cancer risk and logistical challenges."
            }
          },
          {
            "id": "excimer_tx",
            "name": "Excimer Laser",
            "tooltip": {
              "title": "Excimer Laser",
              "content": "A targeted form of UVB therapy for localized, persistent plaques."
            }
          }
        ]
      },
      {
        "id": "systemic_tx",
        "name": "Systemic Therapies",
        "tooltip": {
          "title": "Systemic Therapies",
          "content": "Oral or injectable medications for moderate-to-severe psoriasis and psoriatic arthritis that work throughout the body."
        },
        "children": [
          {
            "id": "oral_sys",
            "name": "Traditional Oral Systemics",
            "tooltip": {
              "title": "Traditional Oral Systemics",
              "content": "<ul><li><strong>Methotrexate:</strong> An immunomodulator effective for both skin and joints.</li><li><strong>Acitretin:</strong> An oral retinoid, particularly useful for pustular psoriasis.</li><li><strong>Cyclosporine:</strong> A potent immunosuppressant used for rapid control of severe flares.</li><li><strong>Apremilast:</strong> An oral PDE4 inhibitor.</li></ul>"
            }
          },
          {
            "id": "biologics_sys",
            "name": "Biologic Agents",
            "tooltip": {
              "title": "Biologic Agents",
              "content": "Targeted monoclonal antibodies or fusion proteins that block specific cytokines or immune cells."
            },
            "children": [
              {
                "id": "tnfi",
                "name": "TNF-α inhibitors",
                "tooltip": {
                  "title": "TNF-α Inhibitors",
                  "content": "Examples: Adalimumab, Etanercept, Infliximab, Certolizumab. Effective for skin and joints."
                }
              },
              {
                "id": "il17i",
                "name": "IL-17 inhibitors",
                "tooltip": {
                  "title": "IL-17 Inhibitors",
                  "content": "Examples: Secukinumab, Ixekizumab, Brodalumab. Highly effective for skin clearance."
                }
              },
              {
                "id": "il23i",
                "name": "IL-23 inhibitors",
                "tooltip": {
                  "title": "IL-23 Inhibitors",
                  "content": "Examples: Guselkumab, Risankizumab, Tildrakizumab. Durable efficacy with infrequent dosing."
                }
              },
              {
                "id": "il1223i",
                "name": "IL-12/23 inhibitors",
                "tooltip": {
                  "title": "IL-12/23 Inhibitors",
                  "content": "Ustekinumab. Targets the p40 subunit shared by IL-12 and IL-23."
                }
              }
            ]
          },
          {
            "id": "jak_sys_modality",
            "name": "Oral Targeted Synthetics",
            "tooltip": {
              "title": "Oral Targeted Synthetic DMARDs",
              "content": "Small molecule drugs that inhibit intracellular signaling pathways."
            },
            "children": [
              {
                "id": "jak_inhib",
                "name": "JAK inhibitors",
                "tooltip": {
                  "title": "JAK Inhibitors",
                  "content": "Examples: Tofacitinib, Upadacitinib. Effective for PsA."
                }
              },
              {
                "id": "tyk2_inhib",
                "name": "TYK2 inhibitors",
                "tooltip": {
                  "title": "TYK2 Inhibitors",
                  "content": "Deucravacitinib. Selective TYK2 inhibitor for psoriasis."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "treatment-skin": {
    "id": "root",
    "name": "Psoriasis (Skin)",
    "tooltip": {
      "title": "Treatment Algorithm for Psoriasis",
      "content": "Treatment is stratified based on disease severity (Body Surface Area affected) and location."
    },
    "children": [
      {
        "id": "mild_skin",
        "name": "Mild/Limited Disease",
        "tooltip": {
          "title": "Mild to Moderate Plaque Psoriasis (<5-10% BSA)",
          "content": "Typically managed with topical therapies."
        },
        "children": [
          {
            "id": "mild_first",
            "name": "First Line",
            "tooltip": {
              "title": "First-Line for Mild Psoriasis",
              "content": "<ul><li><strong>High-potency topical corticosteroids</strong> (e.g., clobetasol).</li><li>Combination topicals (e.g., <strong>steroid + vitamin D analog</strong>) are often more effective.</li></ul>"
            }
          },
          {
            "id": "mild_second",
            "name": "Second Line / Special Sites",
            "tooltip": {
              "title": "Second-Line & Special Sites",
              "content": "<ul><li><strong>Face/Flexures:</strong> Lower potency steroids, topical calcineurin inhibitors.</li><li><strong>Refractory Plaques:</strong> Topical retinoids (Tazarotene), intralesional steroid injections.</li></ul>"
            }
          }
        ]
      },
      {
        "id": "mod_sev_skin",
        "name": "Moderate-to-Severe Disease",
        "tooltip": {
          "title": "Moderate to Severe Plaque Psoriasis (>5-10% BSA or impacting sensitive areas)",
          "content": "Requires phototherapy or systemic treatment."
        },
        "children": [
          {
            "id": "photo_skin",
            "name": "Phototherapy",
            "tooltip": {
              "title": "Phototherapy",
              "content": "An excellent option for patients with widespread disease who have access and no contraindications. <strong>Narrowband UVB</strong> is the preferred modality."
            }
          },
          {
            "id": "systemic_skin",
            "name": "Systemic Therapy",
            "tooltip": {
              "title": "Systemic Therapy",
              "content": "The mainstay for most patients with moderate-to-severe disease."
            },
            "children": [
              {
                "id": "biologics_skin",
                "name": "Biologics First-Line",
                "tooltip": {
                  "title": "Biologics as First-Line Systemic",
                  "content": "Due to their high efficacy and favorable safety profiles, biologics are often preferred. Choice depends on comorbidities and patient factors.<ul><li><strong>IL-17 / IL-23 inhibitors:</strong> Generally offer the highest levels of skin clearance (PASI 90/100).</li><li><strong>TNF-α inhibitors:</strong> Broadly effective, especially if PsA is also present.</li></ul>"
                }
              },
              {
                "id": "orals_skin",
                "name": "Oral Systemics",
                "tooltip": {
                  "title": "Oral Systemics",
                  "content": "<p>Oral options include methotrexate, apremilast and selective TYK2 inhibition. Selection requires agent-specific efficacy, adverse-effect, reproductive and monitoring assessment. Neither absence of routine laboratory requirements for one drug nor efficacy in one trial establishes superiority or safety equivalence to a biologic class.</p>\n"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "treatment-psa": {
    "id": "root",
    "name": "Psoriatic Arthritis (PsA)",
    "tooltip": {
      "title": "Treatment Algorithm for PsA",
      "content": "Treatment choice is guided by the specific domains of disease involved (e.g., peripheral arthritis, axial disease, enthesitis)."
    },
    "children": [
      {
        "id": "nsaids_psa",
        "name": "Initial Symptom Control",
        "tooltip": {
          "title": "Initial Symptom Control",
          "content": "Non-steroidal anti-inflammatory drugs (NSAIDs) can be used for mild pain and stiffness but do not prevent joint damage."
        }
      },
      {
        "id": "csdmards_psa",
        "name": "csDMARDs",
        "tooltip": {
          "title": "Conventional Synthetic DMARDs",
          "content": "<strong>Methotrexate:</strong> Often the first-line DMARD, especially for peripheral arthritis. It treats both skin and joints but is not effective for axial disease."
        }
      },
      {
        "id": "biologics_psa",
        "name": "Biologics & tsDMARDs",
        "tooltip": {
          "title": "Biologics and Targeted Synthetic DMARDs (tsDMARDs)",
          "content": "The primary treatment for moderate-to-severe or progressive PsA. The choice is based on the dominant clinical domain."
        },
        "children": [
          {
            "id": "peripheral_tx",
            "name": "Peripheral Arthritis Dominant",
            "tooltip": {
              "title": "Treatment for Peripheral Arthritis",
              "content": "<ul><li><strong>TNF-α inhibitors:</strong> The gold-standard first-line biologic class, effective for all PsA domains.</li><li><strong>IL-17 inhibitors:</strong> Highly effective for joints and skin.</li><li><strong>IL-23 inhibitors:</strong> Effective, particularly with prominent skin disease.</li><li><strong>Oral JAK inhibitors:</strong> An effective oral alternative to biologics.</li></ul>"
            }
          },
          {
            "id": "axial_tx",
            "name": "Axial Disease Dominant",
            "tooltip": {
              "title": "Treatment for Axial Disease",
              "content": "<ul><li><strong>First Line:</strong> TNF-α inhibitors.</li><li><strong>Second Line:</strong> IL-17 inhibitors.</li><li>(Note: IL-23 and IL-12/23 inhibitors are generally not effective for axial disease).</li></ul>"
            }
          },
          {
            "id": "enthesitis_dactylitis_tx",
            "name": "Enthesitis/Dactylitis Dominant",
            "tooltip": {
              "title": "Treatment for Enthesitis and Dactylitis",
              "content": "Generally responds well to the same biologics used for peripheral arthritis, particularly <strong>TNF-α</strong> and <strong>IL-17 inhibitors</strong>."
            }
          },
          {
            "id": "comorbid_tx_consider",
            "name": "Comorbidity Considerations",
            "tooltip": {
              "title": "Considering Comorbidities",
              "content": "<ul><li><strong>Inflammatory Bowel Disease:</strong> Prefer TNF-α inhibitors or IL-12/23 inhibitors. AVOID IL-17 inhibitors.</li><li><strong>Uveitis:</strong> Prefer monoclonal antibody TNF-α inhibitors (e.g., adalimumab, infliximab).</li></ul>"
            }
          }
        ]
      }
    ]
  }
};
