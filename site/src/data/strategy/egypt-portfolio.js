// Data model for the unlisted Egypt AI & Technology Opportunity Portfolio dashboard.
export const PHASES = [
  {
    "key": "immediate",
    "label": "Immediate",
    "color": "#1F6F7A",
    "description": "Launch-ready in next 90 days"
  },
  {
    "key": "sector",
    "label": "Sector scale",
    "color": "#2E8B97",
    "description": "Sectoral pilots in months 4–18"
  },
  {
    "key": "infrastructure",
    "label": "Infrastructure",
    "color": "#0F1B2D",
    "description": "Anchor-tenant-driven build, year 2+"
  },
  {
    "key": "foundation",
    "label": "Foundation",
    "color": "#7A8A6F",
    "description": "Trust/assurance layer; low-cost, high-leverage"
  },
  {
    "key": "selective",
    "label": "Selective",
    "color": "#A88652",
    "description": "Visible brand value; selective scope"
  },
  {
    "key": "crosscutting",
    "label": "Cross-cutting",
    "color": "#5A6573",
    "description": "Talent and venture creation across portfolio"
  }
];

export const VENTURES = [
  {
    "num": 1,
    "id": "export-services",
    "name": "AI Export Services Accelerator",
    "tag": "Near-term export and jobs engine",
    "phase": "Immediate",
    "phaseKey": "immediate",
    "cost": "Low–medium",
    "costTier": 2,
    "impact": 9,
    "costscore": 4,
    "firstCohort": true,
    "plain": "Create a specialized export-services business that helps international clients use AI better, with Egypt-based teams providing Arabic evaluation, AI-assisted customer operations, software QA, data engineering, and cybersecurity support.",
    "why": "Egypt already has a scaled offshoring base: digital exports reached $4.8B in 2025, 240+ offshoring companies operate in the country, and 2025 agreements were expected to create more than 70,000 high-value jobs.",
    "products": [
      "Arabic model evaluation and red-teaming",
      "AI-enabled customer operations/contact centers",
      "AI-assisted software QA and coding support",
      "Data engineering and cybersecurity support pods"
    ],
    "buyers": [
      "AI model companies",
      "Cloud providers and system integrators",
      "European and Gulf enterprises",
      "Banks, telcos, airlines, travel, e-commerce"
    ],
    "first_moves": [
      "Select three paid service lines and five anchor buyer types",
      "Certify 3–5 pilot delivery teams",
      "Create Arabic evaluation rubric and QA manual",
      "Run two paid pilots with baseline productivity metrics",
      "Publish an export-services capability deck and pricing menu"
    ],
    "compliance": "Usually incorporable as IT/software/outsourcing services. Avoid regulated financial, health, telecom, or security activity unless separately licensed. Use strong data-processing agreements, access controls, audit logs, and client-controlled environments.",
    "risks": [
      "Commodity pricing pressure",
      "Training-output mismatch",
      "Data leakage"
    ],
    "mitigation": [
      "Move into domain QA, Arabic evaluation, cybersecurity and engineering R&D",
      "Employer-designed curricula tied to paid pilot work",
      "Least-privilege access, DPAs, logging and client-controlled environments"
    ],
    "docs": "01_AI_Export_Services_Accelerator dossier and registration submission pack; template library for MSA/SOW, pilot agreement, NDA/DPA elements, DPIA, model card, and vendor diligence.",
    "evidence": [
      "R1",
      "R2"
    ]
  },
  {
    "num": 2,
    "id": "arabic-ai",
    "name": "Arabic and Egyptian-Dialect AI Commons",
    "tag": "Language-data and evaluation moat",
    "phase": "Immediate",
    "phaseKey": "immediate",
    "cost": "Low–medium",
    "costTier": 2,
    "impact": 8,
    "costscore": 3,
    "firstCohort": true,
    "plain": "Build the shared language assets that make Arabic and Egyptian-dialect AI work reliably: licensed datasets, speech tools, translation tools, evaluation tests, and safety benchmarks.",
    "why": "Egypt’s National AI Strategy emphasizes national AI capability, datasets, infrastructure, ecosystem growth, Arabic/African-language opportunity, 30,000 AI professionals, and 250+ AI startups by 2030.",
    "products": [
      "Egyptian Arabic speech-to-text and text-to-speech datasets",
      "Dialect-to-Modern Standard Arabic translation",
      "Arabic hallucination and safety benchmarks",
      "Model evaluation/red-teaming services",
      "Official-source government and regulated-sector assistants"
    ],
    "buyers": [
      "Frontier-model vendors",
      "Cloud providers",
      "Government agencies",
      "Banks, telcos, media companies, universities"
    ],
    "first_moves": [
      "Define corpus inclusion/exclusion policy",
      "Sign three data-contributor letters of intent",
      "Recruit the first annotator/evaluator cohort",
      "Build a secure annotation platform",
      "Publish a first Egyptian Arabic evaluation challenge"
    ],
    "compliance": "The key issue is data rights. Use licensed or public-domain content, auditable provenance, contributor agreements, consent where needed, and bias checks across regions, ages, gender, and channels.",
    "risks": [
      "Copyright contamination",
      "Dialect bias",
      "Overbuilding a symbolic foundation model"
    ],
    "mitigation": [
      "Licensed/public-domain data with provenance",
      "Multi-region and multi-demographic sampling",
      "Prioritize datasets, evaluation, speech and source-grounded systems before large model training"
    ],
    "docs": "02_Arabic_Egyptian_Dialect_AI_Commons dossier and registration submission pack; template library for data contributor agreements, DPIA, model card, and licensing terms.",
    "evidence": [
      "R2",
      "R3",
      "R4",
      "R5",
      "R6"
    ]
  },
  {
    "num": 3,
    "id": "govai",
    "name": "GovAI Shared-Services Factory",
    "tag": "Public-sector productivity platform",
    "phase": "Immediate",
    "phaseKey": "immediate",
    "cost": "Medium",
    "costTier": 3,
    "impact": 8,
    "costscore": 4,
    "firstCohort": true,
    "plain": "Create a reusable government AI platform that ministries can use for document processing, citizen questions, caseworker support, call-center automation, and service backlogs.",
    "why": "Egypt already has meaningful digital-government momentum, including thousands of fiber-connected government buildings, a target to connect all 32,000 government entities by 2030, and World Bank GovTech Category A status in the document library’s evidence base.",
    "products": [
      "Citizen-service assistant grounded in official sources",
      "Caseworker copilot for ministry staff",
      "Document classification/extraction/summarization",
      "Contact-center automation",
      "Standard procurement and audit templates"
    ],
    "buyers": [
      "Cabinet/central digital authority",
      "Sector ministries",
      "Governorates",
      "Public hospitals and insurers"
    ],
    "first_moves": [
      "Select three service families: documents, contact centers, caseworker copilots",
      "Publish standard AI procurement clauses",
      "Define government data classes and model-risk tiers",
      "Run two ministry prototypes using official-source retrieval",
      "Baseline service-processing KPIs"
    ],
    "compliance": "Use data classification, official-source answers only for public interactions, human escalation, audit logging, and appeal/review processes for high-impact government decisions.",
    "risks": [
      "Ministry silos",
      "Incorrect AI answers",
      "Slow procurement"
    ],
    "mitigation": [
      "Central templates plus sector-owned adoption plans",
      "Official-source grounding and human escalation",
      "Pre-approved vendor panels and outcome-based contracts"
    ],
    "docs": "03_GovAI_Shared_Services_Factory dossier and registration submission pack; template library for procurement clauses, model risk tiers, and ministry-by-ministry MOU templates.",
    "evidence": [
      "R7",
      "R38",
      "R4",
      "R5"
    ]
  },
  {
    "num": 4,
    "id": "health",
    "name": "Health Data and UHI Intelligence Layer",
    "tag": "Digital health and operational AI",
    "phase": "Sector scale",
    "phaseKey": "sector",
    "cost": "Medium–high",
    "costTier": 4,
    "impact": 8,
    "costscore": 6,
    "firstCohort": false,
    "plain": "Help hospitals, insurers, and public health systems use data to process claims faster, schedule care more efficiently, manage capacity, and understand population-health needs.",
    "why": "The evidence base includes World Bank support for Egypt’s healthcare transformation and national launch of DHIS2 as part of the health information system. Universal Health Insurance expansion creates a practical buyer and data environment.",
    "products": [
      "Claims and coding automation",
      "Referral and scheduling optimization",
      "Bed/theatre/resource analytics",
      "Population-health dashboards",
      "Later-stage validated clinical decision support"
    ],
    "buyers": [
      "Universal Health Insurance bodies",
      "Ministry of Health stakeholders",
      "Public and university hospitals",
      "Private hospital groups"
    ],
    "first_moves": [
      "Define UHI/Ministry data sharing terms with PDPL alignment",
      "Pilot claims automation in two governorates",
      "Build referral and scheduling optimizer for one tertiary center",
      "Stand up population-health dashboards for one priority condition",
      "Publish operational KPI baselines and improvement targets"
    ],
    "compliance": "PDPL alignment is mandatory; clinical AI requires staged validation, human-in-the-loop, audit trails, and Ministry of Health approvals. Avoid premature deployment of unvalidated clinical decision support.",
    "risks": [
      "Data fragmentation across providers",
      "PDPL/regulatory delays",
      "Clinical liability for decision-support tools"
    ],
    "mitigation": [
      "Begin with operational/non-clinical analytics",
      "Embed legal/regulatory counsel from day 1",
      "Stage clinical AI behind validation studies and Ministry of Health approvals"
    ],
    "docs": "04_Health_Data_UHI_Intelligence_Layer dossier and registration submission pack; template library for data-sharing agreements, DPIA, model card, and clinical-validation protocols.",
    "evidence": [
      "R22",
      "R23",
      "R4",
      "R39"
    ]
  },
  {
    "num": 5,
    "id": "agri-water",
    "name": "Smart Agriculture and Water Intelligence Network",
    "tag": "Food, water, and rural productivity",
    "phase": "Sector scale",
    "phaseKey": "sector",
    "cost": "Medium",
    "costTier": 3,
    "impact": 7,
    "costscore": 5,
    "firstCohort": false,
    "plain": "Use weather, satellite, soil, irrigation, and farm data to help farmers use less water, improve yields, reduce losses, and meet export-quality requirements.",
    "why": "Egypt’s FY2025/26 agriculture and irrigation plan targets yield improvements of 10–15%, smart irrigation expansion, contract farming, and broader Farmer Card coverage.",
    "products": [
      "Irrigation scheduling engine",
      "Satellite crop classification and yield forecasting",
      "Pest/disease early warning",
      "SMS/WhatsApp/voice farmer advisory",
      "Agri-finance and crop-insurance data layer"
    ],
    "buyers": [
      "Agriculture and water authorities",
      "Farmer cooperatives",
      "Agribusiness exporters",
      "Input suppliers",
      "Rural finance providers"
    ],
    "first_moves": [
      "Sign data partnerships with agriculture/irrigation authorities",
      "Pilot irrigation scheduling for one governorate’s high-value crop",
      "Build SMS/WhatsApp advisory in Egyptian Arabic",
      "Recruit field extension partner for ground-truth",
      "Publish baseline water/yield improvement targets"
    ],
    "compliance": "Light regulatory burden, but data partnerships with public authorities require careful agreements. Telecoms partner needed for SMS/voice channel licensing.",
    "risks": [
      "Smallholder adoption",
      "Ground-truth data scarcity",
      "Climate variability"
    ],
    "mitigation": [
      "Partner with cooperatives and extension agents",
      "Layer satellite + reported data with active correction loops",
      "Forecast uncertainty bands in advisory outputs"
    ],
    "docs": "05_Smart_Agriculture_Water_Intelligence_Network dossier and registration submission pack; template library for data partnerships, farmer consent, and outcome reporting.",
    "evidence": [
      "R24"
    ]
  },
  {
    "num": 6,
    "id": "fintech",
    "name": "Fintech and SME Intelligence Platform",
    "tag": "Financial inclusion and SME productivity",
    "phase": "Sector scale",
    "phaseKey": "sector",
    "cost": "Medium",
    "costTier": 3,
    "impact": 8,
    "costscore": 5,
    "firstCohort": false,
    "plain": "Build tools that help banks, payment companies, and merchants understand cash flow, reduce fraud, score SME credit risk, and offer better financial products.",
    "why": "The evidence base cites 177 fintech/fintech-enabled startups and PSPs in the 2023 landscape report, financial inclusion of 77.6% by end-2025, and 2025 CBE licensing/registration rules for PSOs and PSPs.",
    "products": [
      "SME cash-flow underwriting",
      "Merchant analytics and cash/inventory forecasting",
      "Fraud and AML risk scoring",
      "Collections intelligence",
      "Arabic financial copilot for SMEs"
    ],
    "buyers": [
      "Banks",
      "Payment-service providers",
      "Merchant acquirers",
      "Microfinance firms",
      "Large merchants/platforms"
    ],
    "first_moves": [
      "Decide vendor vs. licensed-PSP/PSO posture early",
      "Sign data and distribution partnerships with 1–2 banks",
      "Build merchant analytics product with one acquirer",
      "Stand up fraud/AML scoring on real transaction streams",
      "Publish performance benchmarks vs. baseline"
    ],
    "compliance": "CBE PSO/PSP licensing rules apply if directly handling payments; vendor model avoids licensing but limits data access. PDPL applies to all customer data.",
    "risks": [
      "Mis-scoping into licensed activity",
      "Data access bottlenecks at banks",
      "Model bias on thin-file SMEs"
    ],
    "mitigation": [
      "Engage CBE counsel early on activity scoping",
      "Build vendor-friendly architecture with clear data contracts",
      "Validate models on diverse SME segments before deployment"
    ],
    "docs": "06_Fintech_SME_Intelligence_Platform dossier and registration submission pack; template library for CBE-aligned vendor agreements, DPA, fairness/bias audits.",
    "evidence": [
      "R11",
      "R12"
    ]
  },
  {
    "num": 7,
    "id": "industrial",
    "name": "Industrial AI, Electronics and Edge Systems Accelerator",
    "tag": "Manufacturing productivity and engineering exports",
    "phase": "Sector scale",
    "phaseKey": "sector",
    "cost": "Medium–high",
    "costTier": 4,
    "impact": 7,
    "costscore": 6,
    "firstCohort": false,
    "plain": "Help factories reduce downtime, improve quality, save energy, and build higher-value electronics/embedded systems capabilities.",
    "why": "The evidence base cites EGP 252.8B targeted FY2025/26 manufacturing investment, EGP 6.8T target industrial output, and Egypt Makes Electronics as a platform for electronics, embedded systems, semiconductors, and design work.",
    "products": [
      "Predictive maintenance",
      "Computer-vision quality inspection",
      "Energy optimization and demand forecasting",
      "Embedded/edge AI systems",
      "Electronics design and verification services"
    ],
    "buyers": [
      "Food processors",
      "Chemical manufacturers",
      "Building-materials producers",
      "Electronics assemblers",
      "Industrial zones"
    ],
    "first_moves": [
      "Sign two factory pilot agreements with measurable downtime/quality KPIs",
      "Stand up edge-inference reference architecture",
      "Recruit electronics design pod for embedded-systems exports",
      "Define energy-optimization protocol with one heavy-industry pilot",
      "Publish industrial AI playbook for Egyptian manufacturers"
    ],
    "compliance": "Industrial licensing under IDA; standard environmental and safety regulations. Electronics export activities benefit from Egypt Makes Electronics incentives.",
    "risks": [
      "Long sales cycles",
      "Capex sensitivity",
      "Skill shortages in embedded/electronics"
    ],
    "mitigation": [
      "Outcome-based pilots with shared savings",
      "Edge-only deployments to reduce capex",
      "Talent pipeline through Venture #11 talent studio"
    ],
    "docs": "07_Industrial_AI_Electronics_Edge_Systems_Accelerator dossier and registration submission pack; template library for factory pilot agreements, IDA-aligned licensing, electronics export incentives.",
    "evidence": [
      "R25",
      "R26",
      "R27"
    ]
  },
  {
    "num": 8,
    "id": "cloud-data",
    "name": "Sovereign Cloud and Digital Suez Data-Center Corridor",
    "tag": "Hybrid infrastructure and data-center investment",
    "phase": "Infrastructure",
    "phaseKey": "infrastructure",
    "cost": "High",
    "costTier": 5,
    "impact": 9,
    "costscore": 10,
    "firstCohort": false,
    "plain": "Develop local and hybrid cloud/data-center capacity that allows government, banks, hospitals, exporters, and industrial firms to host sensitive systems with more control, resilience, and lower latency.",
    "why": "Trade.gov projected Egypt’s data-center market to grow from $278M in 2024 to $694M by 2030, and the evidence base notes 15 operational submarine cables plus three under construction as of mid-2025. Public hyperscaler region lists reviewed did not show Egypt as a public cloud region, supporting hybrid/local strategies.",
    "products": [
      "Sovereign landing zones",
      "Managed cloud migration factory",
      "AI inference pods",
      "Carrier-neutral colocation",
      "Disaster recovery and regulated workload hosting"
    ],
    "buyers": [
      "Government shared-services programs",
      "Banks and fintechs",
      "Hospitals/UHI systems",
      "Export-services providers",
      "Industrial firms"
    ],
    "first_moves": [
      "Secure anchor tenants from GovAI and regulated-sector pipelines",
      "Confirm NTRA licensing pathway and power/site partnerships",
      "Negotiate hyperscaler hybrid arrangements (Outposts, sovereign zones)",
      "Launch managed migration factory for first 5 anchor workloads",
      "Publish economics, latency, and compliance benchmarks vs. offshore"
    ],
    "compliance": "NTRA framework for data centers, hosting, cloud computing applies; PDPL and sector regulators (CBE, Ministry of Health) drive workload-specific controls. Power/grid access and water/cooling require IDA/utility coordination.",
    "risks": [
      "Stranded capacity without anchors",
      "Power/water/cooling constraints",
      "Hyperscaler partnership complexity"
    ],
    "mitigation": [
      "Anchor-tenant-led build (no speculative capacity)",
      "Site selection driven by power/water availability",
      "Phased buildout with hybrid-first architecture"
    ],
    "docs": "08_Sovereign_Cloud_Digital_Suez_Data_Center_Corridor dossier and registration submission pack; template library for NTRA-aligned operating model, anchor-tenant MOUs, hyperscaler hybrid agreements, power/site agreements.",
    "evidence": [
      "R13",
      "R14",
      "R15",
      "R16",
      "R17",
      "R18",
      "R19",
      "R20",
      "R21"
    ]
  },
  {
    "num": 9,
    "id": "assurance",
    "name": "National AI and Cyber Assurance Lab",
    "tag": "Trust, safety, compliance, and exportable assurance",
    "phase": "Foundation",
    "phaseKey": "foundation",
    "cost": "Low",
    "costTier": 1,
    "impact": 6,
    "costscore": 2,
    "firstCohort": true,
    "plain": "Set up a lab that tests AI systems for accuracy, safety, privacy, cybersecurity, bias, Arabic-language performance, and readiness for use in regulated or public-facing settings.",
    "why": "Egypt already has responsible-AI and generative-AI guidance. Turning that guidance into practical evaluation, audit, and certification-style services can reduce risk and become a regional business line.",
    "products": [
      "AI risk assessment and audit",
      "Arabic hallucination and safety benchmark testing",
      "Model red-teaming",
      "DPIA and model/system card review",
      "Cybersecurity posture assessment for AI deployments"
    ],
    "buyers": [
      "Government agencies",
      "Banks/PSPs",
      "Hospitals",
      "Cloud/data-center operators",
      "AI startups and enterprise buyers"
    ],
    "first_moves": [
      "Publish an Arabic AI evaluation methodology v1",
      "Sign three pilot audit engagements with regulated buyers",
      "Build relationships with NTRA, CBE, and Ministry of Health for sector overlays",
      "Recruit founding evaluator/auditor cohort",
      "Publish first sector benchmark report"
    ],
    "compliance": "Operates as advisory/assurance services. Pathway to certification-style status requires accreditation discussions with relevant regulators; remain explicitly advisory until accredited.",
    "risks": [
      "Independence concerns if also advising clients",
      "Slow regulator adoption",
      "Talent scarcity"
    ],
    "mitigation": [
      "Strict separation of audit and advisory practices",
      "Co-develop with regulators rather than imposing",
      "Cross-train from cybersecurity and traditional audit talent pools"
    ],
    "docs": "09_National_AI_Cyber_Assurance_Lab dossier and registration submission pack; template library for assurance methodology, audit engagement letter, sector benchmark protocols.",
    "evidence": [
      "R4",
      "R5",
      "R6",
      "R39"
    ]
  },
  {
    "num": 10,
    "id": "tourism",
    "name": "Tourism and Cultural-Heritage AI Platform",
    "tag": "Tourism, heritage, and digital content",
    "phase": "Selective",
    "phaseKey": "selective",
    "cost": "Medium",
    "costTier": 3,
    "impact": 6,
    "costscore": 4,
    "firstCohort": false,
    "plain": "Use AI to improve visitor planning, museum/site interpretation, multilingual support, crowd management, and digital preservation of Egypt’s cultural assets.",
    "why": "The evidence base cites record tourist arrivals of 19M in 2025 and a 30M annual tourist target, plus Google Arts & Culture’s Taste of Egypt / Sofret Masr as a precedent for cultural-digital partnership.",
    "products": [
      "Multilingual AI travel concierge",
      "Museum/site guide with AR-ready content",
      "Crowd and itinerary optimization",
      "Digital heritage content platform",
      "Visitor analytics for tourism authorities and operators"
    ],
    "buyers": [
      "Tourism authorities",
      "Museums",
      "Heritage sites",
      "Tour operators",
      "Hotels and airlines"
    ],
    "first_moves": [
      "Sign one museum/site partnership for AR-ready content",
      "Pilot multilingual concierge with one tour operator",
      "Stand up crowd-management analytics for one major site",
      "Confirm cultural IP and content licensing terms",
      "Publish visitor-experience baseline KPIs"
    ],
    "compliance": "Cultural IP and Antiquities authority approvals required for heritage content. Standard tourism-sector licensing.",
    "risks": [
      "Cultural IP disputes",
      "Visitor uptake unpredictability",
      "Site authority coordination"
    ],
    "mitigation": [
      "Early Antiquities authority partnership and licensing",
      "Tie product launches to high-traffic seasons",
      "Co-develop with site authorities rather than over-the-top"
    ],
    "docs": "10_Tourism_Cultural_Heritage_AI_Platform dossier and registration submission pack; template library for cultural IP licensing, site partnership MOUs, visitor analytics protocols.",
    "evidence": [
      "R35",
      "R36",
      "R37"
    ]
  },
  {
    "num": 11,
    "id": "talent-studio",
    "name": "AI Talent and Startup Venture Studio",
    "tag": "Workforce, founder pipeline, and venture creation",
    "phase": "Cross-cutting",
    "phaseKey": "crosscutting",
    "cost": "Medium",
    "costTier": 3,
    "impact": 8,
    "costscore": 5,
    "firstCohort": false,
    "plain": "Build employer-linked apprenticeships, venture creation programs, and problem-led startup cohorts that create the people and companies needed across the portfolio.",
    "why": "The National AI Strategy targets 30,000 AI professionals and 250+ AI startups by 2030. Training only matters if it produces deployable skills, jobs, and venture formation.",
    "products": [
      "AI apprenticeship program",
      "Founder studio for vertical AI startups",
      "Employer-sponsored bootcamps",
      "Portfolio-based assessment",
      "Provider-credit and hiring dashboard"
    ],
    "buyers": [
      "Venture portfolio companies",
      "Universities",
      "Employers",
      "Ministries",
      "Investors and donors"
    ],
    "first_moves": [
      "Sign employer commitments for first apprenticeship cohort",
      "Define problem statements with each portfolio venture",
      "Recruit founding apprenticeship and founder cohorts",
      "Stand up portfolio-based assessment and hiring dashboard",
      "Publish first cohort outcomes after 6 months"
    ],
    "compliance": "Education/training licensing pathways through Ministry of Higher Education and ITIDA. Standard employer agreements.",
    "risks": [
      "Cohort-to-employer matching",
      "Quality drift at scale",
      "Funder dependency"
    ],
    "mitigation": [
      "Employer co-designed curricula and paid apprenticeships",
      "Portfolio-based assessment and continuous outcome tracking",
      "Mixed funding model with employer fees, ministry grants, and donor capital"
    ],
    "docs": "11_AI_Talent_Startup_Venture_Studio dossier and registration submission pack; template library for apprenticeship agreements, founder studio terms, employer commitments.",
    "evidence": [
      "R2",
      "R3",
      "R33",
      "R34"
    ]
  }
];

export const REFERENCES = [
  [
    "R1",
    "ITIDA: Egypt digital offshoring exports doubled to $4.8B, 240+ offshoring companies, 70K expected jobs from 2025 agreements.",
    "https://itida.gov.eg/English/PressReleases/Pages/Egypt-Doubles-Digital-Offshoring-Exports-to-4.8B-Dollars.aspx",
    "sector"
  ],
  [
    "R2",
    "Egypt National AI Strategy 2025–2030 / OECD AI policy tracker.",
    "https://oecd.ai/en/dashboards/policy-initiatives/egypt-national-artificial-intelligence-strategy",
    "policy"
  ],
  [
    "R3",
    "Egypt National AI Strategy PDF, January 2025.",
    "https://ai.gov.eg/SynchedFiles/en/Resources/AIstrategy%20English%2016-1-2025-1.pdf",
    "policy"
  ],
  [
    "R4",
    "Egypt National Guidelines for Trustworthy and Responsible AI, March 2026.",
    "https://ai.gov.eg/SynchedFiles/ar/Resources/Egypt%20National%20Guidelines%20for%20Trustworthy%20and%20Responsible%20AI.pdf",
    "policy"
  ],
  [
    "R5",
    "Egypt National Generative AI Guidelines, 2026.",
    "https://ai.gov.eg/SynchedFiles/ar/Resources/EGYPT%20National%20Guidlines%20for%20Generative%20AI.pdf",
    "policy"
  ],
  [
    "R6",
    "UNESCO AI readiness assessment report: Egypt.",
    "https://unesdoc.unesco.org/ark:/48223/pf0000395173",
    "international"
  ],
  [
    "R7",
    "Trade.gov Egypt Digital Economy country commercial guide.",
    "https://www.trade.gov/country-commercial-guides/egypt-digital-economy",
    "sector"
  ],
  [
    "R8",
    "GAFI Company Incorporation Services.",
    "https://www.gafi.gov.eg/English/eServices/Pages/DepartmentService.aspx?DSID=7",
    "regulator"
  ],
  [
    "R9",
    "GAFI Companies Incorporation Procedures via E-portal PDF.",
    "https://www.gafi.gov.eg/English/Documents/Companies%20Incorporation%20Procedures.pdf",
    "regulator"
  ],
  [
    "R10",
    "GAFI Investors Services Center / One Stop Shop.",
    "https://www.gafi.gov.eg/English/Howcanwehelp/OneStopShop/Pages/default.aspx",
    "regulator"
  ],
  [
    "R11",
    "CBE PSO and PSP licensing rules, June 2025.",
    "https://www.cbe.org.eg/en/payment-systems-and-services/payment-systems-and-services-oversight/psos-and-psps-licensing-rules",
    "regulator"
  ],
  [
    "R12",
    "CBE financial inclusion update, February 2026.",
    "https://www.cbe.org.eg/en/news-publications/news/2026/02/17/14/44/financial-inclusion-2026",
    "regulator"
  ],
  [
    "R13",
    "Trade.gov Egypt Data Centers market intelligence.",
    "https://www.trade.gov/market-intelligence/egypt-data-centers",
    "infrastructure"
  ],
  [
    "R14",
    "CSIS: The Strategic Future of Subsea Cables — Egypt Case Study.",
    "https://www.csis.org/analysis/strategic-future-subsea-cables-egypt-case-study",
    "infrastructure"
  ],
  [
    "R15",
    "NTRA regulatory framework for data centers, hosting, and cloud computing.",
    "https://www.tra.gov.eg/en/regulatory-framework-for-establishing-operating-data-centers-and-providing-hosting-and-cloud-computing-services/",
    "regulator"
  ],
  [
    "R16",
    "NTRA regulatory framework brief for data centers and cloud services.",
    "https://www.tra.gov.eg/wp-content/uploads/2022/02/Framework-Brief-English.pdf",
    "regulator"
  ],
  [
    "R17",
    "AWS Cairo CloudFront edge location announcement.",
    "https://aws.amazon.com/about-aws/whats-new/2024/05/new-edge-location-egypt/",
    "hyperscaler"
  ],
  [
    "R18",
    "AWS Outposts availability in Egypt.",
    "https://aws.amazon.com/about-aws/whats-new/2022/12/aws-outposts-egypt/",
    "hyperscaler"
  ],
  [
    "R19",
    "Microsoft Azure regions list.",
    "https://learn.microsoft.com/en-us/azure/reliability/regions-list",
    "hyperscaler"
  ],
  [
    "R20",
    "Google Cloud locations.",
    "https://cloud.google.com/about/locations",
    "hyperscaler"
  ],
  [
    "R21",
    "Oracle public cloud regions.",
    "https://www.oracle.com/cloud/public-cloud-regions/",
    "hyperscaler"
  ],
  [
    "R22",
    "World Bank Transforming Egypt Healthcare System Project.",
    "https://www.worldbank.org/en/news/press-release/2018/06/27/45-million-egyptians-to-benefit-from-improvements-to-the-public-health-system",
    "sector"
  ],
  [
    "R23",
    "DHIS2: Egypt officially launches DHIS2 as part of national health information system.",
    "https://dhis2.org/egypt-launches-dhis2-in-health-information-system/",
    "sector"
  ],
  [
    "R24",
    "Ministry of Planning: agriculture and irrigation sector targets for FY2025/26.",
    "https://mped.gov.eg/singlenews?id=6505&lang=en",
    "sector"
  ],
  [
    "R25",
    "Ministry of Planning: manufacturing-sector targets for FY2025/26.",
    "https://mped.gov.eg/singlenews?id=6509&lang=en",
    "sector"
  ],
  [
    "R26",
    "ITIDA Egypt Makes Electronics initiative.",
    "https://itida.gov.eg/English/Programs/egyptmakeselectronics/Pages/default.aspx",
    "sector"
  ],
  [
    "R27",
    "Industrial Development Authority brief / industrial licensing timeframes.",
    "https://www.ida.gov.eg/uploads/files/pdfs/QR_PDF/about%20IDA.pdf",
    "regulator"
  ],
  [
    "R28",
    "OpenAI data controls and data residency documentation.",
    "https://developers.openai.com/api/docs/guides/your-data",
    "frontier"
  ],
  [
    "R29",
    "OpenAI for Countries / Stargate UAE announcement.",
    "https://openai.com/index/introducing-stargate-uae/",
    "frontier"
  ],
  [
    "R30",
    "Anthropic Claude API data residency documentation.",
    "https://platform.claude.com/docs/en/build-with-claude/data-residency",
    "frontier"
  ],
  [
    "R31",
    "Anthropic Claude API pricing documentation.",
    "https://platform.claude.com/docs/en/about-claude/pricing",
    "frontier"
  ],
  [
    "R32",
    "IndiaAI mission update: 38,000 GPUs and ₹10,300+ crore allocation.",
    "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2178092",
    "comparator"
  ],
  [
    "R33",
    "AI Singapore 100 Experiments program.",
    "https://aisingapore.org/innovation/100e/",
    "comparator"
  ],
  [
    "R34",
    "Singapore AI Trailblazers initiative / 100 genAI use cases.",
    "https://www.mddi.gov.sg/newsroom/mci-disg-sndgo-and-google-cloud-launch-ai-trailblazers-initiative/",
    "comparator"
  ],
  [
    "R35",
    "Google Arts & Culture: Taste of Egypt.",
    "https://artsandculture.google.com/project/taste-of-egypt",
    "cultural"
  ],
  [
    "R36",
    "Google blog: Taste of Egypt / Sofret Masr with Egyptian Tourism Authority.",
    "https://blog.google/intl/en-mena/company-news/outreach-initiatives/taste-of-egypt/",
    "cultural"
  ],
  [
    "R37",
    "Egypt tourism arrivals and 30M visitor target reporting.",
    "https://www.dailynewsegypt.com/2026/01/04/egypt-targets-30-million-annual-tourists-following-record-19-million-arrivals/",
    "sector"
  ],
  [
    "R38",
    "Open Data Policy, Arab Republic of Egypt, 2025.",
    "https://ai.gov.eg/SynchedFiles/en/Resources/Open%20Data%20Policy.pdf",
    "policy"
  ],
  [
    "R39",
    "Baker McKenzie: Egypt PDPL Executive Regulations update, January 2026.",
    "https://www.bakermckenzie.com/en/insight/publications/2026/01/egypt-important-data-protection-update",
    "regulator"
  ]
];

export const PARTNERS = [
  {
    "name": "OpenAI",
    "use": "High-value assistants, Arabic evaluation, education/public-sector pilots, model access where data controls are acceptable",
    "refs": [
      "R28",
      "R29"
    ]
  },
  {
    "name": "Anthropic",
    "use": "Enterprise reasoning, coding assistants, document-heavy knowledge work, safety-oriented deployments",
    "refs": [
      "R30",
      "R31"
    ]
  },
  {
    "name": "Google",
    "use": "Cloud/startup credits, language experimentation, agriculture/geospatial, tourism/cultural content",
    "refs": [
      "R20",
      "R35",
      "R36"
    ]
  },
  {
    "name": "Microsoft",
    "use": "Government productivity, enterprise copilots, developer tooling, cloud/hybrid enterprise adoption",
    "refs": [
      "R19"
    ]
  },
  {
    "name": "AWS",
    "use": "Hybrid cloud, edge, Outposts, Bedrock-compatible multi-model strategy, migration factory",
    "refs": [
      "R17",
      "R18"
    ]
  },
  {
    "name": "Oracle",
    "use": "Databases, public back-office modernization, healthcare/enterprise systems, hybrid deployments",
    "refs": [
      "R21"
    ]
  },
  {
    "name": "Telecom Egypt / local operators",
    "use": "Connectivity, local hosting, data-center operations, 5G/edge, export-services infrastructure",
    "refs": [
      "R13",
      "R14",
      "R15"
    ]
  },
  {
    "name": "Universities / ITI / NTI / EUI / AIC",
    "use": "Talent pipeline, language resources, applied pilots, evaluator cohorts",
    "refs": [
      "R2",
      "R3"
    ]
  }
];

export const CASES = [
  {
    "country": "India",
    "built": "Bundled compute, datasets, skills and startup support in one national AI mission.",
    "lesson": "Do not separate compute access from talent and startup support; treat them as one operating system.",
    "refs": [
      "R32"
    ]
  },
  {
    "country": "UAE",
    "built": "Built a national AI strategy and pursued sovereign/open-model and compute partnerships.",
    "lesson": "Imported APIs alone are not enough; Egypt should build Arabic assets and deployment capacity.",
    "refs": [
      "R29"
    ]
  },
  {
    "country": "Singapore",
    "built": "AI Singapore 100 Experiments and AI Trailblazers created practical industry pilots.",
    "lesson": "Run many short, measurable pilots and scale only what works.",
    "refs": [
      "R33",
      "R34"
    ]
  },
  {
    "country": "Estonia (X-Road)",
    "built": "Used secure data-exchange backbones to connect public and private systems.",
    "lesson": "Reusable shared rails beat one-off digital platforms.",
    "refs": []
  },
  {
    "country": "Kenya",
    "built": "Used public agricultural data infrastructure to support farmers and observatory-style services.",
    "lesson": "Agriculture needs shared data and extension workflows more than disconnected apps.",
    "refs": []
  }
];

export const KPIS = [
  {
    "value": "$4.8B",
    "label": "Digital exports 2025",
    "sub": "Doubled from $2.4B in 2022",
    "refs": [
      "R1"
    ]
  },
  {
    "value": "30K",
    "label": "AI professionals target by 2030",
    "sub": "Plus 250+ AI startups",
    "refs": [
      "R2",
      "R3"
    ]
  },
  {
    "value": "$278M → $694M",
    "label": "Data-center market 2024 → 2030",
    "sub": "Projected growth",
    "refs": [
      "R13"
    ]
  },
  {
    "value": "19M → 30M",
    "label": "Tourism arrivals trajectory",
    "sub": "Record 2025 → annual target",
    "refs": [
      "R37"
    ]
  }
];

export const STRATEGIC_BASELINE = [
  {
    "title": "Services are the fastest revenue path",
    "body": "Digital exports doubled from $2.4B in 2022 to $4.8B in 2025, with 240+ offshoring companies and 70,000 expected new high-value jobs from 2025 agreements.",
    "refs": [
      "R1"
    ]
  },
  {
    "title": "Arabic AI is a defensible moat",
    "body": "Egypt can build language assets, dialect benchmarks, speech tools, and evaluation services. The National AI Strategy targets 30,000 AI experts and 250+ AI startups by 2030.",
    "refs": [
      "R2",
      "R3"
    ]
  },
  {
    "title": "Government demand can anchor the market",
    "body": "Digital government, data classification, open data, and responsible-AI guidance create repeatable demand if procurement is standardized and systems are source-grounded.",
    "refs": [
      "R4",
      "R5",
      "R7",
      "R38"
    ]
  },
  {
    "title": "Sector AI should solve practical bottlenecks",
    "body": "Health, agriculture, fintech, manufacturing, and tourism all have visible pain points. Best first products reduce wait times, water waste, fraud, downtime, and service backlogs.",
    "refs": [
      "R11",
      "R22",
      "R23",
      "R24",
      "R25"
    ]
  },
  {
    "title": "Cloud and data centers matter — but sequencing matters more",
    "body": "Egypt’s data-center market is projected to grow, and the country has important subsea-cable geography. Hyperscaler region lists do not show Egypt as a public region, making hybrid and anchor-tenant models more practical.",
    "refs": [
      "R13",
      "R14",
      "R19",
      "R20"
    ]
  },
  {
    "title": "Regulation is an asset if made operational",
    "body": "GAFI incorporation, CBE PSP/PSO rules, NTRA cloud/data-center frameworks, open-data policy, and AI guidelines should be turned into clear launch checklists and procurement rules.",
    "refs": [
      "R8",
      "R9",
      "R11",
      "R15",
      "R16"
    ]
  }
];

export const REF_CATEGORIES = [
  {
    "key": "policy",
    "label": "Egypt policy",
    "color": "#1F6F7A"
  },
  {
    "key": "regulator",
    "label": "Regulator",
    "color": "#0F1B2D"
  },
  {
    "key": "sector",
    "label": "Sector data",
    "color": "#2E8B97"
  },
  {
    "key": "infrastructure",
    "label": "Infrastructure",
    "color": "#5A6573"
  },
  {
    "key": "hyperscaler",
    "label": "Hyperscaler",
    "color": "#C9A24A"
  },
  {
    "key": "frontier",
    "label": "Frontier AI",
    "color": "#A88652"
  },
  {
    "key": "comparator",
    "label": "Comparator country",
    "color": "#9C7C4A"
  },
  {
    "key": "international",
    "label": "International body",
    "color": "#8B6F47"
  },
  {
    "key": "cultural",
    "label": "Cultural partnership",
    "color": "#B07F4A"
  }
];

export const ROADMAP_PERIODS = [
  {
    "key": "p0",
    "label": "Next 90 days",
    "sublabel": "Decision & pilot setup"
  },
  {
    "key": "p1",
    "label": "Year 1",
    "sublabel": "Revenue & credibility"
  },
  {
    "key": "p2",
    "label": "Year 2",
    "sublabel": "Sector scale"
  },
  {
    "key": "p3",
    "label": "Year 3",
    "sublabel": "Infrastructure scale"
  }
];

export const VENTURE_TIMELINE = {
  "export-services": {
    "entry": "p0",
    "active": [
      "p0",
      "p1",
      "p2",
      "p3"
    ]
  },
  "arabic-ai": {
    "entry": "p0",
    "active": [
      "p0",
      "p1",
      "p2",
      "p3"
    ]
  },
  "govai": {
    "entry": "p0",
    "active": [
      "p0",
      "p1",
      "p2",
      "p3"
    ]
  },
  "assurance": {
    "entry": "p0",
    "active": [
      "p0",
      "p1",
      "p2",
      "p3"
    ]
  },
  "health": {
    "entry": "p1",
    "active": [
      "p1",
      "p2",
      "p3"
    ]
  },
  "agri-water": {
    "entry": "p1",
    "active": [
      "p1",
      "p2",
      "p3"
    ]
  },
  "fintech": {
    "entry": "p1",
    "active": [
      "p1",
      "p2",
      "p3"
    ]
  },
  "industrial": {
    "entry": "p1",
    "active": [
      "p1",
      "p2",
      "p3"
    ]
  },
  "tourism": {
    "entry": "p1",
    "active": [
      "p1",
      "p2"
    ]
  },
  "talent-studio": {
    "entry": "p0",
    "active": [
      "p0",
      "p1",
      "p2",
      "p3"
    ]
  },
  "cloud-data": {
    "entry": "p2",
    "active": [
      "p2",
      "p3"
    ]
  }
};

export const NINETY_DAY = [
  "Choose first launch cohort.",
  "Name venture owners and counsel.",
  "Secure 5–10 anchor-buyer conversations and 2+ signed pilot LOIs.",
  "Confirm GAFI route and sector-license exposure.",
  "Stand up portfolio KPI dashboard."
];

export const COVER_HEADINGS = [
  "The strategic thesis",
  "Why the timing matters",
  "The execution architecture",
  "The investment ask",
  "Competitive positioning",
  "The eleven opportunity lanes",
  "Partnerships, ventures, and governance",
  "Risk management",
  "Roadmap and first 100 days",
  "Measurement and closing",
  "The closing argument",
  "Scope"
];

export const DECK_HREF = "/strategy/egypt-ai-portfolio/egypt-ai-technology-opportunity-portfolio.pdf";


export const COVER_LETTER = "Egypt has a real, time-limited window to become a serious player in artificial intelligence — but only if the country picks the right battles. This portfolio sets out an evidence-based strategy and execution proposal for doing so. It is written for a strategic-planning audience: government decision-makers, sovereign and private investors, potential partner companies, and execution teams. Every quantitative claim is grounded in cited evidence drawn from 35 numbered references.\n\nThe core argument is simple. Egypt should not try to compete with the United Arab Emirates or Saudi Arabia on raw infrastructure spending or frontier AI model development. Those countries are already pouring billions into both, and Egypt would lose that race. Instead, Egypt should occupy a different and arguably more defensible position — the “middle stack” between hardware below and frontier research above, where most of the practical and economic value of AI gets created.\n\nThe strategic thesis\nEgypt’s opportunity is framed around three coordinated pillars rather than a single grand bet.\n\nThe first is applied AI infrastructure. Egypt sits at one of the most strategically important communications chokepoints in the world. Roughly 20 submarine cables enter and exit the country, and over 90% of internet traffic between Europe and Asia physically passes through Egyptian territory. Combined with available power, cooling water near Suez, and proximity to Mediterranean and Red Sea routes, this gives Egypt a credible position to host regional AI inference capacity (the part of AI that serves users) — without trying to match Gulf-scale frontier training data centers.\n\nThe second is Arabic AI platforms. With around 100 million internet users domestically and a much larger Arabic-speaking and African-language addressable market, Egypt is well-positioned to build the trust and validation infrastructure that the entire Arabic AI ecosystem needs. Frontier Arabic models like Falcon (UAE), Jais (UAE), and ALLaM (Saudi Arabia) already exist — and Egypt should not try to compete with them. Instead, Egypt should evaluate, certify, and integrate them, becoming the trusted assurance authority that ministries, banks, hospitals, and other public-interest institutions need before deploying any AI system.\n\nThe third is sector-specific applications and exports. Rather than chase generic AI use cases, Egypt should solve its own significant domestic problems — water scarcity, healthcare bottlenecks, SME credit gaps, government service delays, tourism-experience gaps — and then export the resulting solutions to similar markets across the Middle East and Africa.\n\nWhy the timing matters\nThe evidence base establishes that Egypt is not starting from zero. Digital service exports doubled from $2.4 billion in 2022 to $4.8 billion in 2025, with over 270 global service delivery centers now operating in the country and a 70,000-job pipeline already committed through recent agreements. Internet penetration has reached 81.9% with 96.3 million users. The data-center market is on track to grow from $278 million in 2024 to $694 million in 2030. The government’s National AI Strategy 2025–2030, launched in January 2025, sets explicit targets: 30,000 AI specialists, 250+ AI startups, $42.7 billion in annual AI value, ICT contributing 7.7% of GDP, and 36% of citizens actively using AI products by 2030.\n\nThere is real momentum to channel — and competing regional bets on Gulf-scale infrastructure are still ramping, leaving a window open that will not stay open indefinitely.\n\nThe execution architecture\nA central recommendation is that Egypt should not run this through a traditional advisory committee. The execution model is an “execution catalyst” structure with three operational components. An AI Delivery Unit maintains the live portfolio of flagship projects, clears bottlenecks across ministries, and publishes outcome dashboards. A Challenge Fund co-finances 90-to-120 day prototype projects, each requiring named problem owners, named data owners, and pre-agreed evaluation plans before any money is released. A Scale Partnerships function then takes the validated prototypes and converts them into procurement contracts, joint ventures, and full sector platforms.\n\nUnderneath all three sits a shared operating layer covering data governance (consent, privacy, auditability), model assurance (Arabic benchmarks, safety testing, sector validation), and measurement (exports, jobs, water saved, patients served, capital mobilized).\n\nThe principle is simple: the unit gets measured by deployed outcomes, not by reports written or memoranda signed.\n\nThe investment ask\nThe indicative funding envelope is structured in three layers rather than as a single appropriation. About $80–120 million in public-sector and donor seed capital funds the Delivery Unit, Challenge Fund, evaluation lab, and data-governance build-out. Around $300–500 million in anchor partnership co-investment funds cloud and model credits, GPU compute access, and joint sector pilots with hyperscalers and chip vendors. And $1.0–2.5 billion in private, sovereign, and joint-venture capital funds the larger commitments — data centers, expansion of the global capability center base, venture formation, and the cyber export build.\n\nThe funding mechanics are stage-gated (money releases tied to evaluation evidence at 90, 180, and 365 days), co-financed (sector pilots require at least 50% private or partner match), structured for returns (equity, revenue share, or service-license royalties on graduating ventures), and currency-hedged (USD-denominated tranches for partner-facing commitments to insulate against Egyptian-pound depreciation).\n\nCompetitive positioning\nThe Gulf comparison is addressed head-on. On compute scale, the UAE’s Stargate UAE (1 gigawatt, with G42, OpenAI, Oracle, NVIDIA, Cisco, and SoftBank as partners) and Saudi Arabia’s HUMAIN (PIF-backed, with NVIDIA’s AI factory partnership) are simply outside what Egypt can match. Egypt’s structural edge is different: cable concentration plus power and cooling water near Suez. The strategic implication is clear — compete on regional inference capacity, not on frontier training. On frontier models, the same logic applies: Falcon, Jais, and ALLaM are already deployed at scale; Egypt’s edge is its 100M Arabic-and-African-language user base and a credible neutrality posture, so the country should win in evaluation, retrieval-augmented generation, and sector-tuned models. On capital intensity, Egypt has $15B+ in tourism foreign exchange and around $5B in offshoring exports — earned foreign currency that can underwrite investment without trying to match Gulf capex. On talent, Egypt produces around 500,000 university graduates per year, including around 50,000 with directly relevant ICT skills — talent and validation services are themselves an exportable asset. On data sovereignty, Egypt’s PDPL operationalization and neutrality posture position it as the trusted Arabic AI assurance jurisdiction.\n\nThe takeaway is captured in one line: Egypt cannot out-spend UAE or Saudi, so it must out-position them.\n\nThe eleven opportunity lanes\nThe portfolio works through eleven specific opportunity areas, organized into four execution streams.\n\nIn infrastructure and trust, the AI infrastructure and Digital Suez data-center corridor opportunity calls for AI-ready zones with land, power, licensing, and physical security, packaged as bankable projects rather than isolated announcements. The pursuit model is a telecom-plus-hyperscaler-plus-energy-plus-sovereign-compute public-private partnership. The cybersecurity, data trust, and cable resilience opportunity treats security not as a support function but as a distinct export business — a Cable Resilience Center monitoring subsea routes (informed by the March 2024 and September 2025 Red Sea cable cuts), AI Assurance Labs for testing models, and 24/7 SOC export services for European, Gulf, and African clients.\n\nIn Arabic AI and export services, the Arabic and African-language AI platforms opportunity builds out a five-pillar stack: data rights, evaluation infrastructure, government RAG (retrieval-augmented generation systems for civil servants and citizens), a curated model marketplace, and sector-tuned models. The defensible wedge is being the trusted Arabic AI assurance authority — neutral evaluation infrastructure that Falcon, Jais, GPT-class, Claude, and Gemini all need before public-sector deployment. The AI-enabled offshoring and global capability centers opportunity argues that AI compresses low-end voice-BPO work but expands demand for validation, integration, localization, and trustworthy operations — Egypt should attach incentives to this shift via four upgrade lanes (AI evaluation and safety, AI-augmented engineering, cyber and risk operations, and domain-specific operations).\n\nIn sector AI platforms, the GovTech opportunity is anchored to existing Egyptian platforms rather than invented from scratch — the Digital Egypt citizen-services portal, the live e-invoicing and tax pipelines, and the Universal Health Insurance and electronic-health-record rollout. The procurement question becomes “which measurable service outcome are we buying” rather than “which model.” The digital-health and clinical AI opportunity prioritizes high-leverage pilots first: diabetic retinopathy screening (justified by Egypt’s high diabetes prevalence), radiology and chest-X-ray triage (justified by limited radiology capacity per capita making AI directly throughput-positive rather than displacement-negative), and dermoscopy and documentation work. The fintech opportunity uses consented transaction data — e-invoicing, wallets, taxes, merchant flows, remittances — to underwrite SMEs in a market where only 4% of small businesses (5–19 employees) have bank loans versus a regional average of 20%. The agriculture, water, and climate AI opportunity centers on a four-layer stack — data commons, analytics layer, farmer channels (WhatsApp, SMS, Arabic voice), and finance linkage — measured by water saved per feddan, yield change, and farmer-income change rather than features shipped. The tourism, museums, and cultural-heritage AI opportunity rides Egypt’s 19 million tourists in 2025, the 30 million target by 2028, and the November 2025 opening of the Grand Egyptian Museum (already drawing 12,000+ daily visitors) — building multilingual concierge AI, AR site overlays, digital-preservation tools, and a privacy-preserving tourism data cooperative.\n\nIn hardware and talent base, the semiconductors and embedded systems opportunity argues Egypt should compete on fabless design, electronic-design-automation services, embedded software, and edge devices — not on advanced fabrication. Malaysia, Vietnam, and Israel are the right blend of role models, not Taiwan. The AI education and workforce opportunity rejects certificate-heavy training in favor of a four-stage pipeline (training, apprenticeship, deployment, outcomes) with anchor employers required for funding, currency-stable stipends to prevent talent loss to the Gulf, and real tooling provided (coding agents, cloud and GPU credits, model access). The AI Singapore 100E template is the closest international analogue, with explicit caveats about what needs to be true for it to translate to Egypt — anchor employer commitment, faster procurement cycles, and stable apprentice retention.\n\nPartnerships, ventures, and governance\nThe partnership strategy specifies what to ask different categories of partners for. Frontier-model providers (OpenAI, Anthropic, Google DeepMind) get asked for public-sector pilots and Arabic evaluation work, not vague memoranda. Hyperscalers (AWS, Microsoft, Google Cloud, IBM) get asked for cloud and model credit pools and government sandboxes. Hardware and cyber vendors (NVIDIA, AMD, Cisco, security firms) get asked for compute lab anchors and assurance-lab partnerships. Regional sovereigns (G42, HUMAIN) get cross-border interconnect and assurance reciprocity. Local anchors (hospitals, banks, telecoms, universities, tourism bodies) provide data, distribution, sector access, and operational deployment.\n\nThe conversion KPIs are explicit: signed term sheets, data agreements, procurement contracts, joint ventures, and deployed pilots — not MOU count.\n\nThe domestic ventures roster proposes seven concrete companies the portfolio should incubate: an Arabic AI Evaluation and Safety Lab, a GovAI Integrator, a Health AI Workflow company, an Agri-Water Intelligence platform, an SME Credit Intelligence platform, a Tourism AI and Heritage platform, and a Cyber/SOC Export company. Each requires anchor customer plus data agreement plus named operator plus funded runway plus scale gate.\n\nThe governance and regulation case is that data and AI governance is the actual investment-critical path — international partners and capital move faster when rules are predictable. Five rule areas need specific decisions: data protection (operationalizing PDPL — Personal Data Protection Law — and its executive regulations), public-sector AI procurement standards, health AI clinical validation and liability rules, fintech AI explainability and fairness rules, and AI assurance benchmarks. The summary is blunt: governance lag — not capital — is the binding constraint on hyperscaler and frontier-vendor commitment to Egypt.\n\nRisk management\nThe expanded risk register names eight failure modes with explicit probability, impact, failure pattern, and control-plus-owner-plus-trigger columns. Currency depreciation is rated High probability, High impact — Egyptian-pound volatility erodes USD-denominated commitments, controlled via USD tranches for partner contracts with a >10% FX-move-in-90-days trigger. Symbolic model spending (high cost, weak deployment) is medium probability, high impact — controlled by prioritizing retrieval, evaluation, and sector systems before any frontier training. Stranded data centers (capacity without tenants) is medium probability, high impact — controlled by requiring anchor tenants, power-purchase agreements, and licensing clarity before approval, with a <60% pre-leased trigger. Unsafe health or credit AI is medium probability, critical impact — controlled by prospective validation, explainability, human review, and an ethics board. Partnership theater (many MOUs, few systems) is high probability, medium impact — controlled by tracking conversion KPIs quarterly. Skills mismatch is medium probability, medium impact — controlled by project-based apprenticeships and retention bonuses. Cable and connectivity disruption is medium probability, critical impact — controlled by the Cable Resilience Center, route redundancy, and contractual SLAs with telecoms. Geopolitical export controls is medium probability, high impact — controlled by partner diversification across US, EU, and regional partners, and maintaining an open-source fallback stack.\n\nEach risk requires a named owner and a 90-day review cadence.\n\nRoadmap and first 100 days\nThe 24-month roadmap separates prototypes from scale decisions. Months 0–6 package the portfolio and remove immediate bottlenecks, producing the AI investment prospectus, partner pipeline, data-governance workplan, 100-use-case challenge design, and Arabic evaluation lab charter. Months 6–12 launch anchor partnerships and first prototypes — cloud and model credits, GovAI / health / fintech / water / tourism / offshoring pilots, compute-access program, and version-1 evaluation benchmarks. Months 12–24 scale only what has been validated — procurement for proven GovAI tools, sector venture launches, data-center term sheets, the SOC export center, and AI apprenticeship cohorts at scale.\n\nThree principles govern the roadmap: funding follows evidence (stop-or-scale at every gate), prototypes are not pre-commitments to scale (most should be stopped, that is the point), and every line item has a named owner with budget authority and dashboard accountability.\n\nThe first-100-days plan breaks the opening period into three windows. Days 0–30 name portfolio owners, select 10 flagship pilots, map data and governance blockers, and size the investment ask per opportunity. Days 31–60 draft term sheets, define evaluation metrics, secure cloud and model credits, design the Arabic AI benchmark prototype, and stand up Delivery Unit operations. Days 61–100 launch the first prototypes, publish the investment prospectus, start the apprenticeship cohort, and prepare procurement and venture scale decisions. The tangible 100-day deliverables are explicit: at least 5 partner term sheets, 10 named pilot designs, at least 3 data agreements, published KPI baselines, and at least 3 live prototype starts.\n\nMeasurement and closing\nThe KPI dashboard groups metrics into five domains. Capital and partnerships measures committed investment, signed term sheets, anchor tenants, cloud and model credits, joint-venture launches, and procurement conversions. AI adoption and quality measures use-case completion, Arabic benchmark accuracy, hallucination rate, audit findings, user satisfaction, and escalation rate. Exports and jobs measures digital export revenue, AI services revenue, high-skilled jobs, salary bands, retention, and employer satisfaction. Sector outcomes measures service-time reduction, patients served, claims time, SME loans and repayment, cubic meters of water saved, yield change, and tourist conversion. Trust and regulation measures security audits, incident-response exercises, data-sharing agreements, clinical validations, and credit fairness reports.\n\nEvery pilot enters the portfolio with a baseline, target, owner, data source, and scale-decision date. Without those five elements, it is not a pilot — it is a request for funding.\n\nThe closing argument\nThe closing distills the entire thesis into five qualities Egypt must hold simultaneously. Sovereign enough to protect public interest and regulated data. Open enough to partner with global model, cloud, chip, and cyber companies. Arabic-first enough to become the trusted language-AI authority in the region. Sector-specific enough to convert Egypt’s domestic needs into exportable products. Measurable enough to fund what works and stop what does not.\n\nThe recommended next decision is concrete and specific: authorize the first 100-day execution cycle and select the initial 10 flagship pilots.\n\nScope\nThis portfolio is not a venture pitch for any single product. It is not a national AI strategy document — that already exists. It is not a vendor selection plan. It is not a budget appropriation request.\n\nIt is a coordinated portfolio strategy plus an execution framework, designed to convert Egypt’s existing assets — geographic position, large bilingual workforce, growing offshoring base, established government technology platforms, regulatory readiness, and tourism-driven foreign exchange — into a defensible regional AI position that does not require Gulf-scale capital. The central claim is that the window for this position is open now but will not stay open indefinitely as UAE and Saudi infrastructure builds out. The first 100 days determine whether Egypt enters that window or watches it close.";
