// Clinical differentials for common dermatologic presentations
const CLINICAL_DIFFERENTIALS = {
    // Papulosquamous Disorders
    "papulosquamous": {
        "psoriasis": [
            "lichen planus", "pityriasis rosea", "nummular eczema", "tinea corporis", "secondary syphilis",
            "parapsoriasis", "pityriasis lichenoides", "pityriasis rubra pilaris", "seborrheic dermatitis",
            "subacute cutaneous lupus", "dermatomyositis", "tinea versicolor", "erythema annulare centrifugum",
            "granuloma annulare", "mycosis fungoides", "drug eruption", "allergic contact dermatitis"
        ],
        "lichen planus": [
            "psoriasis", "pityriasis rosea", "secondary syphilis", "lichen sclerosus", "lichen simplex chronicus",
            "lichen amyloidosis", "lichen myxedematosus", "drug eruption", "graft versus host disease",
            "mycosis fungoides", "lichen planus-like keratosis", "hypertrophic lupus erythematosus",
            "lichenoid pigmented purpura"
        ],
        "pityriasis rosea": [
            "psoriasis", "lichen planus", "nummular eczema", "tinea corporis", "secondary syphilis",
            "drug eruption", "viral exanthem", "mycosis fungoides", "parapsoriasis",
            "tinea versicolor", "erythema annulare centrifugum", "granuloma annulare",
            "allergic contact dermatitis", "seborrheic dermatitis"
        ],
        "pityriasis rubra pilaris": [
            "psoriasis", "lichen planus", "pityriasis rosea", "secondary syphilis",
            "seborrheic dermatitis", "dermatomyositis", "subacute cutaneous lupus",
            "drug eruption", "mycosis fungoides", "parapsoriasis", "tinea versicolor",
            "erythema annulare centrifugum", "granuloma annulare", "allergic contact dermatitis"
        ],
        "nummular eczema": [
            "psoriasis", "tinea corporis", "pityriasis rosea", "lichen planus",
            "atopic dermatitis", "contact dermatitis", "seborrheic dermatitis",
            "tinea versicolor", "granuloma annulare", "erythema annulare centrifugum",
            "mycosis fungoides", "drug eruption", "allergic contact dermatitis"
        ],
        "parapsoriasis": [
            "psoriasis", "pityriasis rosea", "pityriasis lichenoides", "mycosis fungoides",
            "lichen planus", "drug eruption", "viral exanthem", "tinea versicolor",
            "erythema annulare centrifugum", "granuloma annulare", "allergic contact dermatitis"
        ],
        "pityriasis lichenoides": [
            "psoriasis", "pityriasis rosea", "parapsoriasis", "mycosis fungoides",
            "lichen planus", "drug eruption", "viral exanthem", "tinea versicolor",
            "erythema annulare centrifugum", "granuloma annulare", "allergic contact dermatitis"
        ]
    },

    // Eczematous Disorders
    "eczematous": {
        "atopic dermatitis": [
            "contact dermatitis", "nummular eczema", "seborrheic dermatitis", "scabies", "tinea corporis",
            "psoriasis", "lichen planus", "pityriasis rosea", "dermatitis herpetiformis",
            "ichthyosis vulgaris", "netherton syndrome", "wiskott aldrich syndrome",
            "hyper ige syndrome", "acrodermatitis enteropathica", "biotinidase deficiency",
            "essential fatty acid deficiency", "zinc deficiency"
        ],
        "contact dermatitis": [
            "atopic dermatitis", "nummular eczema", "seborrheic dermatitis", "tinea corporis",
            "psoriasis", "lichen planus", "pityriasis rosea", "dermatitis herpetiformis",
            "scabies", "tinea versicolor", "granuloma annulare", "erythema annulare centrifugum",
            "mycosis fungoides", "drug eruption"
        ],
        "nummular eczema": [
            "atopic dermatitis", "contact dermatitis", "tinea corporis", "psoriasis",
            "lichen planus", "pityriasis rosea", "seborrheic dermatitis",
            "tinea versicolor", "granuloma annulare", "erythema annulare centrifugum",
            "mycosis fungoides", "drug eruption", "allergic contact dermatitis"
        ],
        "seborrheic dermatitis": [
            "atopic dermatitis", "contact dermatitis", "psoriasis", "tinea capitis",
            "lichen planus", "pityriasis rosea", "dermatitis herpetiformis",
            "scabies", "tinea corporis", "tinea versicolor", "granuloma annulare",
            "erythema annulare centrifugum", "mycosis fungoides", "drug eruption"
        ],
        "dyshidrotic eczema": [
            "tinea pedis", "contact dermatitis", "palmoplantar psoriasis", "scabies",
            "atopic dermatitis", "nummular eczema", "seborrheic dermatitis",
            "tinea corporis", "tinea versicolor", "granuloma annulare",
            "erythema annulare centrifugum", "mycosis fungoides", "drug eruption"
        ],
        "asteatotic eczema": [
            "atopic dermatitis", "contact dermatitis", "nummular eczema", "seborrheic dermatitis",
            "scabies", "tinea corporis", "tinea versicolor", "granuloma annulare",
            "erythema annulare centrifugum", "mycosis fungoides", "drug eruption"
        ],
        "lichen simplex chronicus": [
            "atopic dermatitis", "contact dermatitis", "nummular eczema", "seborrheic dermatitis",
            "scabies", "tinea corporis", "tinea versicolor", "granuloma annulare",
            "erythema annulare centrifugum", "mycosis fungoides", "drug eruption"
        ],
        "prurigo nodularis": [
            "atopic dermatitis", "contact dermatitis", "nummular eczema", "seborrheic dermatitis",
            "scabies", "tinea corporis", "tinea versicolor", "granuloma annulare",
            "erythema annulare centrifugum", "mycosis fungoides", "drug eruption"
        ]
    },

    // Vesiculobullous Disorders
    "vesiculobullous": {
        "pemphigus vulgaris": [
            "bullous pemphigoid", "linear iga disease", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis", "porphyria cutanea tarda"
        ],
        "bullous pemphigoid": [
            "pemphigus vulgaris", "linear iga disease", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis", "porphyria cutanea tarda"
        ],
        "dermatitis herpetiformis": [
            "linear iga disease", "bullous pemphigoid", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis", "porphyria cutanea tarda", "scabies"
        ],
        "linear iga disease": [
            "bullous pemphigoid", "dermatitis herpetiformis", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis", "porphyria cutanea tarda"
        ],
        "epidermolysis bullosa acquisita": [
            "bullous pemphigoid", "linear iga disease", "bullous lupus", "porphyria cutanea tarda",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis"
        ]
    },

    // Urticarial Disorders
    "urticarial": {
        "chronic urticaria": [
            "urticarial vasculitis", "mastocytosis", "bullous pemphigoid", "erythema multiforme", "schnitzler syndrome",
            "drug reaction", "food allergy", "insect bite reaction", "parasitic infection", "viral infection"
        ],
        "urticarial vasculitis": [
            "chronic urticaria", "mastocytosis", "bullous pemphigoid", "erythema multiforme", "schnitzler syndrome",
            "leukocytoclastic vasculitis", "polyarteritis nodosa", "granulomatosis with polyangiitis",
            "eosinophilic granulomatosis with polyangiitis", "microscopic polyangiitis",
            "cryoglobulinemic vasculitis", "igg4 related disease"
        ],
        "mastocytosis": [
            "chronic urticaria", "urticarial vasculitis", "bullous pemphigoid", "erythema multiforme", "schnitzler syndrome",
            "allergic reaction", "drug reaction", "food allergy", "insect bite reaction",
            "parasitic infection", "viral infection"
        ],
        "schnitzler syndrome": [
            "chronic urticaria", "urticarial vasculitis", "mastocytosis", "bullous pemphigoid", "erythema multiforme",
            "adult onset still disease", "familial cold autoinflammatory syndrome", "muckle wells syndrome",
            "chronic infantile neurologic cutaneous articular syndrome", "tumor necrosis factor receptor associated periodic syndrome"
        ]
    },

    // Papular/Nodular Disorders
    "papular_nodular": {
        "granuloma annulare": [
            "necrobiosis lipoidica", "rheumatoid nodule", "sarcoidosis", "tinea corporis", "annular psoriasis",
            "interstitial granulomatous dermatitis", "palisaded neutrophilic granulomatous dermatitis",
            "cutaneous tuberculosis", "cutaneous leishmaniasis", "foreign body granuloma"
        ],
        "sarcoidosis": [
            "granuloma annulare", "necrobiosis lipoidica", "rheumatoid nodule", "cutaneous tuberculosis",
            "cutaneous leishmaniasis", "foreign body granuloma", "interstitial granulomatous dermatitis",
            "palisaded neutrophilic granulomatous dermatitis"
        ],
        "necrobiosis lipoidica": [
            "granuloma annulare", "sarcoidosis", "rheumatoid nodule", "annular psoriasis",
            "diabetic dermopathy", "stasis dermatitis", "morphea", "scleroderma",
            "cutaneous tuberculosis", "cutaneous leishmaniasis", "foreign body granuloma"
        ],
        "rheumatoid nodule": [
            "granuloma annulare", "necrobiosis lipoidica", "sarcoidosis", "tophaceous gout",
            "calcinosis cutis", "foreign body granuloma", "cutaneous tuberculosis", "cutaneous leishmaniasis"
        ],
        "prurigo nodularis": [
            "nodular scabies", "lichen simplex chronicus", "hypertrophic lichen planus",
            "nodular amyloidosis", "keloid", "dermatofibroma"
        ],
        "dermatofibroma": [
            "melanoma", "dermatofibrosarcoma protuberans", "keloid", "prurigo nodularis",
            "nodular amyloidosis", "metastatic carcinoma"
        ],
        "keloid": [
            "hypertrophic scar", "dermatofibroma", "prurigo nodularis", "nodular amyloidosis",
            "dermatofibrosarcoma protuberans", "metastatic carcinoma"
        ],
        "nodular amyloidosis": [
            "prurigo nodularis", "dermatofibroma", "keloid", "hypertrophic lichen planus",
            "nodular scabies", "metastatic carcinoma"
        ],
        "cutaneous tuberculosis": [
            "sarcoidosis", "deep fungal infection", "cutaneous leishmaniasis", "foreign body granuloma",
            "interstitial granulomatous dermatitis", "palisaded neutrophilic granulomatous dermatitis"
        ],
        "cutaneous leishmaniasis": [
            "sarcoidosis", "cutaneous tuberculosis", "deep fungal infection", "foreign body granuloma",
            "interstitial granulomatous dermatitis", "palisaded neutrophilic granulomatous dermatitis"
        ]
    },

    // Pigmentary Disorders
    "pigmentary": {
        "vitiligo": [
            "postinflammatory hypopigmentation", "tinea versicolor", "pityriasis alba", "leprosy", "piebaldism",
            "chemical leukoderma", "halo nevus", "scleroderma", "morphea", "lichen sclerosus",
            "tuberous sclerosis", "nevus depigmentosus", "nevus anemicus", "albinism"
        ],
        "melasma": [
            "postinflammatory hyperpigmentation", "freckles", "lentigines", "drug induced hyperpigmentation",
            "addison disease", "acanthosis nigricans", "poikiloderma of civatte"
        ],
        "postinflammatory hyperpigmentation": [
            "melasma", "freckles", "lentigines", "drug induced hyperpigmentation",
            "addison disease", "acanthosis nigricans", "poikiloderma of civatte"
        ],
        "tinea versicolor": [
            "vitiligo", "postinflammatory hypopigmentation", "pityriasis alba", "leprosy",
            "chemical leukoderma", "halo nevus", "scleroderma", "morphea", "lichen sclerosus",
            "tuberous sclerosis", "nevus depigmentosus", "nevus anemicus", "albinism"
        ]
    },

    // Hair Disorders
    "hair": {
        "alopecia areata": [
            "trichotillomania", "tinea capitis", "telogen effluvium", "androgenetic alopecia", "traction alopecia",
            "lupus erythematosus", "lichen planopilaris", "frontal fibrosing alopecia", "central centrifugal cicatricial alopecia",
            "discoid lupus", "pseudopelade", "folliculitis decalvans", "dissecting cellulitis",
            "acne keloidalis nuchae", "secondary syphilis"
        ],
        "androgenetic alopecia": [
            "telogen effluvium", "alopecia areata", "trichotillomania", "tinea capitis",
            "lupus erythematosus", "lichen planopilaris", "frontal fibrosing alopecia", "central centrifugal cicatricial alopecia",
            "discoid lupus", "pseudopelade", "folliculitis decalvans", "dissecting cellulitis",
            "acne keloidalis nuchae", "secondary syphilis"
        ],
        "telogen effluvium": [
            "androgenetic alopecia", "alopecia areata", "trichotillomania", "tinea capitis",
            "lupus erythematosus", "lichen planopilaris", "frontal fibrosing alopecia",
            "central centrifugal cicatricial alopecia", "discoid lupus", "pseudopelade",
            "folliculitis decalvans", "dissecting cellulitis", "acne keloidalis nuchae",
            "secondary syphilis"
        ],
        "tinea capitis": [
            "alopecia areata", "trichotillomania", "telogen effluvium", "androgenetic alopecia",
            "lupus erythematosus", "lichen planopilaris", "frontal fibrosing alopecia",
            "central centrifugal cicatricial alopecia", "discoid lupus", "pseudopelade",
            "folliculitis decalvans", "dissecting cellulitis", "acne keloidalis nuchae",
            "secondary syphilis"
        ]
    },

    // Nail Disorders
    "nail": {
        "onychomycosis": [
            "psoriatic nail disease", "lichen planus", "trauma", "yellow nail syndrome", "twenty nail dystrophy",
            "alopecia areata", "eczema", "pemphigus vulgaris", "bullous pemphigoid", "darier disease",
            "hailey hailey disease", "dyskeratosis congenita", "pachyonychia congenita", "nail patella syndrome",
            "acrodermatitis continua", "paronychia", "subungual melanoma"
        ],
        "psoriatic nail disease": [
            "onychomycosis", "lichen planus", "trauma", "yellow nail syndrome", "twenty nail dystrophy",
            "alopecia areata", "eczema", "pemphigus vulgaris", "bullous pemphigoid", "darier disease",
            "hailey hailey disease", "dyskeratosis congenita", "pachyonychia congenita", "nail patella syndrome",
            "acrodermatitis continua", "paronychia", "subungual melanoma"
        ],
        "lichen planus": [
            "psoriatic nail disease", "onychomycosis", "trauma", "yellow nail syndrome", "twenty nail dystrophy",
            "alopecia areata", "eczema", "pemphigus vulgaris", "bullous pemphigoid", "darier disease",
            "hailey hailey disease", "dyskeratosis congenita", "pachyonychia congenita", "nail patella syndrome",
            "acrodermatitis continua", "paronychia", "subungual melanoma"
        ],
        "yellow nail syndrome": [
            "onychomycosis", "psoriatic nail disease", "lichen planus", "trauma", "twenty nail dystrophy",
            "alopecia areata", "eczema", "pemphigus vulgaris", "bullous pemphigoid", "darier disease",
            "hailey hailey disease", "dyskeratosis congenita", "pachyonychia congenita", "nail patella syndrome",
            "acrodermatitis continua", "paronychia", "subungual melanoma"
        ]
    },

    // Vascular Disorders
    "vascular": {
        "port wine stain": [
            "infantile hemangioma", "venous malformation", "arteriovenous malformation", "lymphatic malformation",
            "kaposi sarcoma", "angiosarcoma", "pyogenic granuloma", "cherry angioma"
        ],
        "venous malformation": [
            "port wine stain", "infantile hemangioma", "arteriovenous malformation", "lymphatic malformation",
            "kaposi sarcoma", "angiosarcoma", "pyogenic granuloma", "cherry angioma"
        ],
        "arteriovenous malformation": [
            "port wine stain", "infantile hemangioma", "venous malformation", "lymphatic malformation",
            "kaposi sarcoma", "angiosarcoma", "pyogenic granuloma", "cherry angioma"
        ],
        "lymphatic malformation": [
            "port wine stain", "infantile hemangioma", "venous malformation", "arteriovenous malformation",
            "kaposi sarcoma", "angiosarcoma", "pyogenic granuloma", "cherry angioma"
        ],
        "pyogenic granuloma": [
            "kaposi sarcoma", "angiosarcoma", "cherry angioma", "port wine stain",
            "infantile hemangioma", "venous malformation", "arteriovenous malformation", "lymphatic malformation"
        ],
        "angiokeratomas": [
            "kaposi sarcoma", "angiosarcoma", "cherry angioma", "port wine stain",
            "infantile hemangioma", "venous malformation", "arteriovenous malformation", "lymphatic malformation"
        ],
        "telangiectasias": [
            "rosacea", "systemic sclerosis", "dermatomyositis", "lupus erythematosus",
            "hereditary hemorrhagic telangiectasia", "ataxia telangiectasia", "poikiloderma of civatte"
        ]
    },

    // Metabolic/Endocrine Disorders
    "metabolic_endocrine": {
        "xanthomas": [
            "necrobiosis lipoidica", "granuloma annulare", "rheumatoid nodule", "sarcoidosis",
            "cutaneous tuberculosis", "cutaneous leishmaniasis", "foreign body granuloma"
        ],
        "necrobiosis lipoidica": [
            "xanthomas", "granuloma annulare", "rheumatoid nodule", "sarcoidosis",
            "diabetic dermopathy", "stasis dermatitis", "morphea", "scleroderma"
        ],
        "acanthosis nigricans": [
            "melasma", "postinflammatory hyperpigmentation", "freckles", "lentigines",
            "drug induced hyperpigmentation", "addison disease", "poikiloderma of civatte"
        ],
        "pretibial myxedema": [
            "necrobiosis lipoidica", "granuloma annulare", "rheumatoid nodule", "sarcoidosis",
            "cutaneous tuberculosis", "cutaneous leishmaniasis", "foreign body granuloma"
        ],
        "calciphylaxis": [
            "necrobiosis lipoidica", "granuloma annulare", "rheumatoid nodule", "sarcoidosis",
            "cutaneous tuberculosis", "cutaneous leishmaniasis", "foreign body granuloma"
        ],
        "porphyria cutanea tarda": [
            "bullous pemphigoid", "linear iga disease", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis"
        ]
    },

    // Genodermatoses
    "genodermatoses": {
        "epidermolysis bullosa": [
            "bullous pemphigoid", "linear iga disease", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous fixed drug eruption", "bullous impetigo", "staphylococcal scalded skin syndrome",
            "toxic epidermal necrolysis", "porphyria cutanea tarda"
        ],
        "ichthyosis": [
            "xerosis", "atopic dermatitis", "psoriasis", "tinea corporis",
            "seborrheic dermatitis", "contact dermatitis", "nummular eczema"
        ],
        "neurofibromatosis": [
            "multiple neurofibromas", "schwannomas", "cafe au lait macules", "axillary freckling",
            "lisch nodules", "plexiform neurofibromas", "malignant peripheral nerve sheath tumors"
        ],
        "tuberous sclerosis": [
            "angiofibromas", "shagreen patches", "ash leaf macules", "confetti skin lesions",
            "periungual fibromas", "cafe au lait macules", "melanocytic nevi"
        ],
        "incontinentia pigmenti": [
            "linear epidermal nevus", "linear lichen planus", "linear psoriasis", "linear morphea",
            "linear fixed drug eruption", "linear contact dermatitis", "linear porokeratosis"
        ],
        "darier disease": [
            "hailey hailey disease", "grover disease", "acantholytic acanthoma", "pemphigus vulgaris",
            "pemphigus foliaceus", "bullous pemphigoid", "linear iga disease"
        ],
        "hailey hailey disease": [
            "darier disease", "grover disease", "acantholytic acanthoma", "pemphigus vulgaris",
            "pemphigus foliaceus", "bullous pemphigoid", "linear iga disease"
        ]
    },

    // Drug Reactions
    "drug_reactions": {
        "drug eruptions": [
            "viral exanthem", "bacterial infection", "fungal infection", "parasitic infection",
            "allergic contact dermatitis", "atopic dermatitis", "psoriasis", "lichen planus"
        ],
        "generalized bullous fixed drug eruption": [
            "bullous pemphigoid", "linear iga disease", "epidermolysis bullosa acquisita", "bullous lupus",
            "bullous impetigo", "staphylococcal scalded skin syndrome", "toxic epidermal necrolysis"
        ],
        "stevens johnson syndrome": [
            "toxic epidermal necrolysis", "bullous pemphigoid", "linear iga disease", "epidermolysis bullosa acquisita",
            "bullous lupus", "bullous impetigo", "staphylococcal scalded skin syndrome"
        ],
        "toxic epidermal necrolysis": [
            "stevens johnson syndrome", "bullous pemphigoid", "linear iga disease", "epidermolysis bullosa acquisita",
            "bullous lupus", "bullous impetigo", "staphylococcal scalded skin syndrome"
        ],
        "drug induced lupus": [
            "systemic lupus erythematosus", "subacute cutaneous lupus", "discoid lupus", "dermatomyositis",
            "polymyositis", "mixed connective tissue disease", "undifferentiated connective tissue disease"
        ],
        "drug induced pemphigus": [
            "pemphigus vulgaris", "pemphigus foliaceus", "bullous pemphigoid", "linear iga disease",
            "epidermolysis bullosa acquisita", "bullous lupus", "bullous fixed drug eruption"
        ]
    },

    // Psychocutaneous Disorders
    "psychocutaneous": {
        "delusions of parasitosis": [
            "scabies", "pediculosis", "tinea corporis", "contact dermatitis", "atopic dermatitis",
            "psoriasis", "lichen planus", "pityriasis rosea"
        ],
        "neurotic excoriations": [
            "prurigo nodularis", "lichen simplex chronicus", "hypertrophic lichen planus",
            "nodular amyloidosis", "keloid", "dermatofibroma"
        ],
        "trichotillomania": [
            "alopecia areata", "tinea capitis", "telogen effluvium", "androgenetic alopecia",
            "traction alopecia", "lupus erythematosus", "lichen planopilaris", "frontal fibrosing alopecia"
        ],
        "factitial dermatitis": [
            "contact dermatitis", "atopic dermatitis", "psoriasis", "lichen planus",
            "pityriasis rosea", "tinea corporis", "scabies", "pediculosis"
        ],
        "body dysmorphic disorder": [
            "acne vulgaris", "rosacea", "perioral dermatitis", "seborrheic dermatitis",
            "contact dermatitis", "atopic dermatitis", "psoriasis", "lichen planus"
        ]
    },

    // Photodermatoses
    "photodermatoses": {
        "polymorphous light eruption": [
            "solar urticaria", "chronic actinic dermatitis", "photoallergic reaction", "phototoxic reaction",
            "lupus erythematosus", "dermatomyositis", "porphyria cutanea tarda", "xeroderma pigmentosum"
        ],
        "solar urticaria": [
            "polymorphous light eruption", "chronic actinic dermatitis", "photoallergic reaction", "phototoxic reaction",
            "lupus erythematosus", "dermatomyositis", "porphyria cutanea tarda", "xeroderma pigmentosum"
        ],
        "chronic actinic dermatitis": [
            "polymorphous light eruption", "solar urticaria", "photoallergic reaction", "phototoxic reaction",
            "lupus erythematosus", "dermatomyositis", "porphyria cutanea tarda", "xeroderma pigmentosum"
        ],
        "photoallergic reactions": [
            "polymorphous light eruption", "solar urticaria", "chronic actinic dermatitis", "phototoxic reaction",
            "lupus erythematosus", "dermatomyositis", "porphyria cutanea tarda", "xeroderma pigmentosum"
        ],
        "phototoxic reactions": [
            "polymorphous light eruption", "solar urticaria", "chronic actinic dermatitis", "photoallergic reaction",
            "lupus erythematosus", "dermatomyositis", "porphyria cutanea tarda", "xeroderma pigmentosum"
        ]
    },

    // Infectious Disorders
    "infectious": {
        "tinea corporis": [
            "nummular eczema", "psoriasis", "pityriasis rosea", "granuloma annulare", "erythema annulare centrifugum",
            "subacute cutaneous lupus", "discoid lupus", "tinea versicolor", "tinea faciei", "tinea cruris",
            "tinea pedis", "tinea manuum", "tinea unguium", "tinea capitis", "tinea barbae"
        ],
        "tinea capitis": [
            "alopecia areata", "trichotillomania", "telogen effluvium", "androgenetic alopecia",
            "tinea corporis", "tinea faciei", "tinea cruris", "tinea pedis", "tinea manuum",
            "tinea unguium", "tinea barbae"
        ],
        "tinea versicolor": [
            "vitiligo", "postinflammatory hypopigmentation", "pityriasis alba", "leprosy",
            "chemical leukoderma", "halo nevus", "scleroderma", "morphea", "lichen sclerosus",
            "tuberous sclerosis", "nevus depigmentosus", "nevus anemicus", "albinism",
            "tinea corporis", "tinea faciei", "tinea cruris", "tinea pedis", "tinea manuum",
            "tinea unguium", "tinea capitis", "tinea barbae"
        ],
        "impetigo": [
            "herpes simplex", "eczema herpeticum", "contact dermatitis", "allergic contact dermatitis",
            "staphylococcal scalded skin syndrome", "toxic epidermal necrolysis", "stevens johnson syndrome",
            "erythema multiforme", "fixed drug eruption", "bullous drug eruption",
            "bullous pemphigoid", "pemphigus vulgaris", "linear iga disease",
            "epidermolysis bullosa acquisita", "bullous lupus", "bullous fixed drug eruption"
        ],
        "cellulitis": [
            "erysipelas", "deep vein thrombosis", "stasis dermatitis", "contact dermatitis", "allergic contact dermatitis",
            "necrotizing fasciitis", "gas gangrene", "myonecrosis", "pyomyositis",
            "osteomyelitis", "septic arthritis", "septic bursitis", "septic tenosynovitis",
            "septic thrombophlebitis", "septic emboli", "septic shock syndrome"
        ]
    },

    // Neoplastic Disorders
    "neoplastic": {
        "basal cell carcinoma": [
            "squamous cell carcinoma", "melanoma", "seborrheic keratosis", "dermatofibroma", "actinic keratosis",
            "keratoacanthoma", "merkel cell carcinoma", "dermatofibrosarcoma protuberans", "atypical fibroxanthoma",
            "leiomyosarcoma", "angiosarcoma", "kaposi sarcoma", "metastatic carcinoma", "lymphoma"
        ],
        "squamous cell carcinoma": [
            "basal cell carcinoma", "melanoma", "actinic keratosis", "seborrheic keratosis", "keratoacanthoma",
            "merkel cell carcinoma", "dermatofibrosarcoma protuberans", "atypical fibroxanthoma",
            "leiomyosarcoma", "angiosarcoma", "kaposi sarcoma", "metastatic carcinoma", "lymphoma"
        ],
        "melanoma": [
            "basal cell carcinoma", "squamous cell carcinoma", "seborrheic keratosis", "dermatofibroma", "blue nevus",
            "merkel cell carcinoma", "dermatofibrosarcoma protuberans", "atypical fibroxanthoma",
            "leiomyosarcoma", "angiosarcoma", "kaposi sarcoma", "metastatic carcinoma", "lymphoma"
        ],
        "actinic keratosis": [
            "squamous cell carcinoma", "basal cell carcinoma", "seborrheic keratosis", "dermatofibroma",
            "keratoacanthoma", "merkel cell carcinoma", "dermatofibrosarcoma protuberans", "atypical fibroxanthoma",
            "leiomyosarcoma", "angiosarcoma", "kaposi sarcoma", "metastatic carcinoma", "lymphoma"
        ],
        "seborrheic keratosis": [
            "basal cell carcinoma", "squamous cell carcinoma", "melanoma", "actinic keratosis", "dermatofibroma",
            "keratoacanthoma", "merkel cell carcinoma", "dermatofibrosarcoma protuberans", "atypical fibroxanthoma",
            "leiomyosarcoma", "angiosarcoma", "kaposi sarcoma", "metastatic carcinoma", "lymphoma"
        ]
    },

    // Pediatric Disorders
    "pediatric": {
        "atopic dermatitis": [
            "contact dermatitis", "nummular eczema", "seborrheic dermatitis", "scabies", "tinea corporis",
            "psoriasis", "lichen planus", "pityriasis rosea", "dermatitis herpetiformis",
            "ichthyosis vulgaris", "netherton syndrome", "wiskott aldrich syndrome",
            "hyper ige syndrome", "acrodermatitis enteropathica", "biotinidase deficiency",
            "essential fatty acid deficiency", "zinc deficiency"
        ],
        "molluscum contagiosum": [
            "warts", "herpes simplex", "varicella", "impetigo", "folliculitis",
            "papular urticaria", "insect bites", "scabies", "tinea corporis"
        ],
        "hand foot mouth": [
            "herpes simplex", "varicella", "impetigo", "erythema multiforme", "stevens johnson syndrome",
            "toxic epidermal necrolysis", "fixed drug eruption", "bullous drug eruption",
            "bullous pemphigoid", "pemphigus vulgaris", "linear iga disease",
            "epidermolysis bullosa acquisita", "bullous lupus", "bullous fixed drug eruption"
        ],
        "scabies": [
            "atopic dermatitis", "contact dermatitis", "nummular eczema", "tinea corporis", "dyshidrotic eczema",
            "papular urticaria", "insect bites", "molluscum contagiosum", "folliculitis"
        ],
        "tinea capitis": [
            "alopecia areata", "trichotillomania", "telogen effluvium", "androgenetic alopecia",
            "tinea corporis", "tinea faciei", "tinea cruris", "tinea pedis", "tinea manuum",
            "tinea unguium", "tinea barbae"
        ],
        "infantile hemangioma": [
            "port wine stain", "venous malformation", "lymphatic malformation", "arteriovenous malformation",
            "kaposiform hemangioendothelioma", "tufted angioma", "pyogenic granuloma",
            "congenital hemangioma", "kaposi sarcoma", "melanoma"
        ],
        "napkin dermatitis": [
            "candidiasis", "seborrheic dermatitis", "atopic dermatitis", "contact dermatitis",
            "psoriasis", "tinea corporis", "scabies", "molluscum contagiosum"
        ],
        "langerhans cell histiocytosis": [
            "seborrheic dermatitis", "napkin dermatitis", "candidiasis", "psoriasis",
            "tinea corporis", "scabies", "molluscum contagiosum", "mastocytosis"
        ]
    },

    // Autoimmune/Connective Tissue Disorders
    "autoimmune": {
        "lupus": [
            "dermatomyositis", "scleroderma", "morphea", "lichen planus", "psoriasis",
            "graft versus host disease", "erythema multiforme", "fixed drug eruption",
            "mycosis fungoides", "polymorphous light eruption", "lichen sclerosus",
            "poikiloderma", "subacute cutaneous lupus", "discoid lupus", "hypertrophic lupus",
            "sjogren syndrome", "rheumatoid arthritis", "mixed connective tissue disease",
            "undifferentiated connective tissue disease", "overlap syndrome"
        ],
        "dermatomyositis": [
            "lupus", "scleroderma", "morphea", "lichen planus", "psoriasis",
            "graft versus host disease", "erythema multiforme", "fixed drug eruption",
            "mycosis fungoides", "polymorphous light eruption", "lichen sclerosus",
            "poikiloderma", "subacute cutaneous lupus", "discoid lupus", "hypertrophic lupus",
            "sjogren syndrome", "rheumatoid arthritis", "mixed connective tissue disease",
            "undifferentiated connective tissue disease", "overlap syndrome"
        ],
        "scleroderma": [
            "morphea", "lupus", "dermatomyositis", "lichen planus", "psoriasis",
            "graft versus host disease", "erythema multiforme", "fixed drug eruption",
            "mycosis fungoides", "polymorphous light eruption", "lichen sclerosus",
            "poikiloderma", "subacute cutaneous lupus", "discoid lupus", "hypertrophic lupus",
            "sjogren syndrome", "rheumatoid arthritis", "mixed connective tissue disease",
            "undifferentiated connective tissue disease", "overlap syndrome"
        ],
        "morphea": [
            "scleroderma", "lupus", "dermatomyositis", "lichen planus", "psoriasis",
            "graft versus host disease", "erythema multiforme", "fixed drug eruption",
            "mycosis fungoides", "polymorphous light eruption", "lichen sclerosus",
            "poikiloderma", "subacute cutaneous lupus", "discoid lupus", "hypertrophic lupus",
            "sjogren syndrome", "rheumatoid arthritis", "mixed connective tissue disease",
            "undifferentiated connective tissue disease", "overlap syndrome"
        ],
        "sjogren syndrome": [
            "lupus", "dermatomyositis", "scleroderma", "morphea", "lichen planus",
            "psoriasis", "graft versus host disease", "erythema multiforme", "fixed drug eruption",
            "mycosis fungoides", "polymorphous light eruption", "lichen sclerosus",
            "poikiloderma", "subacute cutaneous lupus", "discoid lupus", "hypertrophic lupus",
            "rheumatoid arthritis", "mixed connective tissue disease", "undifferentiated connective tissue disease",
            "overlap syndrome"
        ],
        "rheumatoid arthritis": [
            "lupus", "dermatomyositis", "scleroderma", "morphea", "lichen planus",
            "psoriasis", "graft versus host disease", "erythema multiforme", "fixed drug eruption",
            "mycosis fungoides", "polymorphous light eruption", "lichen sclerosus",
            "poikiloderma", "subacute cutaneous lupus", "discoid lupus", "hypertrophic lupus",
            "sjogren syndrome", "mixed connective tissue disease", "undifferentiated connective tissue disease",
            "overlap syndrome"
        ]
    }
};

// Helper function to get differentials for a specific condition
function getDifferentials(condition) {
    for (const category in CLINICAL_DIFFERENTIALS) {
        if (CLINICAL_DIFFERENTIALS[category][condition]) {
            return CLINICAL_DIFFERENTIALS[category][condition];
        }
    }
    return [];
}

// Helper function to get all conditions in a category
function getConditionsInCategory(category) {
    return Object.keys(CLINICAL_DIFFERENTIALS[category] || {});
}

// Helper function to get all categories
function getAllCategories() {
    return Object.keys(CLINICAL_DIFFERENTIALS);
}

// Export the functions and data
export {
    CLINICAL_DIFFERENTIALS,
    getDifferentials,
    getConditionsInCategory,
    getAllCategories
}; 