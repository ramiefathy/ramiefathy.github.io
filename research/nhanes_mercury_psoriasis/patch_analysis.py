#!/usr/bin/env python3
"""Apply transparent source corrections before the auditable workflow run.

The GitHub contents transport introduced one newline typo. A subsequent official
NHANES documentation audit also established that PBCD_H uses the blood-metals
subsample weight WTSH2YR, while PBCD_D uses the general MEC examination weight.
This patch is assertion-guarded so a future source change cannot silently bypass
those corrections.
"""
from pathlib import Path

path = Path("research/nhanes_mercury_psoriasis/analysis.R")
text = path.read_text(encoding="utf-8")

replacements = [
    (
        'file(log_file, open = "wt")nsink(',
        'file(log_file, open = "wt")\nsink(',
        "contents-transport newline",
    ),
    (
        '  WTMEC2YR = get_num(combined, "WTMEC2YR"),\n  WTSAF2YR = get_num(combined, "WTSAF2YR"),',
        '  WTMEC2YR = get_num(combined, "WTMEC2YR"),\n  WTSH2YR = get_num(combined, "WTSH2YR"),\n  WTSAF2YR = get_num(combined, "WTSAF2YR"),',
        "blood-metals weight variable",
    ),
    (
        '  "WTMEC2YR", "WTSAF2YR", "SDMVSTRA", "SDMVPSU"',
        '  "WTMEC2YR", "WTSH2YR", "WTSAF2YR", "SDMVSTRA", "SDMVPSU"',
        "weight missingness inventory",
    ),
    (
        '# Construct pooled NHANES complex-survey design. Each two-year MEC weight is\n# divided by the number of pooled cycles. Strata and PSU identifiers are nested\n# within cycle so equal numeric labels from different cycles are not conflated.\nsurvey_df <- paper_df %>%\n  filter(!is.na(WTMEC2YR), WTMEC2YR > 0, !is.na(SDMVSTRA), !is.na(SDMVPSU)) %>%\n  mutate(\n    mec_weight = WTMEC2YR / 2,\n    strata_nested = interaction(cycle, SDMVSTRA, drop = TRUE),\n    psu_nested = interaction(cycle, SDMVSTRA, SDMVPSU, drop = TRUE)\n  )',
        '# Construct the pooled NHANES complex-survey design with the correct\n# cycle-specific blood-mercury weight: WTMEC2YR for 2005-2006, when PBCD_D\n# was a full MEC component, and WTSH2YR for 2013-2014, when PBCD_H was a\n# one-half subsample. Divide each two-year population weight by two when\n# pooling the two cycles. Nest strata and PSU identifiers within cycle.\nsurvey_df <- paper_df %>%\n  mutate(\n    metal_weight_2yr = ifelse(cycle == "2005-2006", WTMEC2YR, WTSH2YR)\n  ) %>%\n  filter(!is.na(metal_weight_2yr), metal_weight_2yr > 0, !is.na(SDMVSTRA), !is.na(SDMVPSU)) %>%\n  mutate(\n    mec_weight = metal_weight_2yr / 2,\n    strata_nested = interaction(cycle, SDMVSTRA, drop = TRUE),\n    psu_nested = interaction(cycle, SDMVSTRA, SDMVPSU, drop = TRUE)\n  )',
        "pooled blood-mercury survey weights",
    ),
    (
        'cat("MEC survey design degrees of freedom:", design_df, "\\n")',
        'cat("Blood-mercury survey design degrees of freedom:", design_df, "\\n")',
        "design label",
    ),
    (
        'fast_df <- analytic %>%\n  filter(\n    !is.na(WTSAF2YR), WTSAF2YR > 0,',
        'fast_df <- analytic %>%\n  filter(\n    cycle == "2005-2006",\n    !is.na(WTSAF2YR), WTSAF2YR > 0,',
        "identifiable fasting-weight cycle",
    ),
    (
        '    fasting_weight = WTSAF2YR / 2,',
        '    fasting_weight = WTSAF2YR,',
        "single-cycle fasting weight scaling",
    ),
    (
        '"Properly weighted fasting-subsample model"',
        '"Properly weighted 2005-2006 fasting-subsample model"',
        "fasting model label",
    ),
    (
        '"Correctly weighted fasting-subsample sensitivity model for variables measured\n# under the fasting protocol. Unlike mean-imputing structurally absent LDL/TG,\n# this model uses WTSAF2YR and only participants assigned a positive fasting weight."',
        '"Correctly weighted 2005-2006 fasting-subsample sensitivity model for variables measured\n# under the fasting protocol. Unlike mean-imputing structurally absent LDL/TG,\n# this model uses WTSAF2YR and only participants assigned a positive fasting weight.\n# The 2013-2014 intersection of the blood-metals and morning-fasting subsamples\n# has no supplied joint public-use weight and is therefore excluded."',
        "fasting model rationale",
    ),
    (
        '"Two-year MEC examination weights were divided by two when pooling cycles. Strata and PSU identifiers were nested within cycle. The primary model estimated the odds ratio per doubling of mercury and adjusted for age, sex, race/ethnicity, education, income-to-poverty ratio, smoking, alcohol, BMI, cycle, cadmium, and lead. Taylor-series linearization was performed with the R survey package."',
        '"Cycle-specific blood-metals weights were used: WTMEC2YR in 2005-2006 and WTSH2YR in 2013-2014; each was divided by two when pooling cycles. Strata and PSU identifiers were nested within cycle. The primary model estimated the odds ratio per doubling of mercury and adjusted for age, sex, race/ethnicity, education, income-to-poverty ratio, smoking, alcohol, BMI, cycle, cadmium, and lead. Taylor-series linearization was performed with the R survey package."',
        "report weighting methods",
    ),
    (
        '"Sensitivity analyses used a per-1-microgram/L exposure scale, weighted quartiles, cycle-specific models, a mercury-by-cycle interaction, weighted 99th-percentile winsorization, and a fasting-subsample model using WTSAF2YR rather than imputing structurally absent fasting measurements into the full MEC sample."',
        '"Sensitivity analyses used a per-1-microgram/L exposure scale, weighted quartiles, cycle-specific models, a mercury-by-cycle interaction, weighted 99th-percentile winsorization, and a 2005-2006 fasting-subsample model using WTSAF2YR rather than imputing structurally absent fasting measurements into the full MEC sample. The 2013-2014 overlap of the metal and fasting subsamples was not modeled because no joint public-use weight is supplied."',
        "report fasting methods",
    ),
]

for old, new, label in replacements:
    if old not in text:
        raise SystemExit(f"Required patch target not found: {label}")
    text = text.replace(old, new)

path.write_text(text, encoding="utf-8")
print(f"Patched {path} with {len(replacements)} assertion-guarded corrections.")
