#!/usr/bin/env python3
"""Assertion-guarded corrections applied before executing analysis.R."""
from pathlib import Path

path = Path("research/nhanes_mercury_psoriasis/analysis.R")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Patch target {label!r} occurred {count} times; expected exactly 1")
    text = text.replace(old, new, 1)


replace_once(
    'file(log_file, open = "wt")nsink(',
    'file(log_file, open = "wt")\nsink(',
    "contents-transport newline",
)
replace_once(
    '  WTMEC2YR = get_num(combined, "WTMEC2YR"),\n  WTSAF2YR = get_num(combined, "WTSAF2YR"),',
    '  WTMEC2YR = get_num(combined, "WTMEC2YR"),\n  WTSH2YR = get_num(combined, "WTSH2YR"),\n  WTSAF2YR = get_num(combined, "WTSAF2YR"),',
    "blood-metals weight field",
)
replace_once(
    '  "WTMEC2YR", "WTSAF2YR", "SDMVSTRA", "SDMVPSU"',
    '  "WTMEC2YR", "WTSH2YR", "WTSAF2YR", "SDMVSTRA", "SDMVPSU"',
    "weight inventory",
)
replace_once(
    '''# Construct pooled NHANES complex-survey design. Each two-year MEC weight is
# divided by the number of pooled cycles. Strata and PSU identifiers are nested
# within cycle so equal numeric labels from different cycles are not conflated.
survey_df <- paper_df %>%
  filter(!is.na(WTMEC2YR), WTMEC2YR > 0, !is.na(SDMVSTRA), !is.na(SDMVPSU)) %>%
  mutate(
    mec_weight = WTMEC2YR / 2,
    strata_nested = interaction(cycle, SDMVSTRA, drop = TRUE),
    psu_nested = interaction(cycle, SDMVSTRA, SDMVPSU, drop = TRUE)
  )''',
    '''# Construct the pooled NHANES complex-survey design with the correct
# cycle-specific blood-mercury weight: WTMEC2YR for 2005-2006, when PBCD_D
# was a full MEC component, and WTSH2YR for 2013-2014, when PBCD_H was a
# one-half subsample. Divide each two-year population weight by two when
# pooling the two cycles. Nest strata and PSU identifiers within cycle.
survey_df <- paper_df %>%
  mutate(
    metal_weight_2yr = ifelse(cycle == "2005-2006", WTMEC2YR, WTSH2YR)
  ) %>%
  filter(!is.na(metal_weight_2yr), metal_weight_2yr > 0, !is.na(SDMVSTRA), !is.na(SDMVPSU)) %>%
  mutate(
    mec_weight = metal_weight_2yr / 2,
    strata_nested = interaction(cycle, SDMVSTRA, drop = TRUE),
    psu_nested = interaction(cycle, SDMVSTRA, SDMVPSU, drop = TRUE)
  )''',
    "pooled mercury-weight block",
)
replace_once(
    'cat("MEC survey design degrees of freedom:", design_df, "\\n")',
    'cat("Blood-mercury survey design degrees of freedom:", design_df, "\\n")',
    "design label",
)
replace_once(
    '''# Correctly weighted fasting-subsample sensitivity model for variables measured
# under the fasting protocol. Unlike mean-imputing structurally absent LDL/TG,
# this model uses WTSAF2YR and only participants assigned a positive fasting weight.''',
    '''# Correctly weighted 2005-2006 fasting-subsample sensitivity model.
# Unlike mean-imputing structurally absent LDL/TG, this model uses WTSAF2YR
# and only participants assigned a positive fasting weight. The 2013-2014
# intersection of the blood-metals and morning-fasting subsamples has no
# supplied joint public-use weight and is therefore excluded.''',
    "fasting rationale",
)
replace_once(
    '''fast_df <- analytic %>%
  filter(
    !is.na(WTSAF2YR), WTSAF2YR > 0,''',
    '''fast_df <- analytic %>%
  filter(
    cycle == "2005-2006",
    !is.na(WTSAF2YR), WTSAF2YR > 0,''',
    "fasting cycle restriction",
)
replace_once(
    '    fasting_weight = WTSAF2YR / 2,',
    '    fasting_weight = WTSAF2YR,',
    "fasting weight scaling",
)
replace_once(
    '''        alcohol + bmi + cycle + cadmium + lead + triglycerides_fasting + ldl + hdl,''',
    '''        alcohol + bmi + cadmium + lead + triglycerides_fasting + ldl + hdl,''',
    "single-cycle fasting formula",
)
text = text.replace(
    'Properly weighted fasting-subsample model',
    'Properly weighted 2005-2006 fasting-subsample model',
)
replace_once(
    '"Two-year MEC examination weights were divided by two when pooling cycles. Strata and PSU identifiers were nested within cycle. The primary model estimated the odds ratio per doubling of mercury and adjusted for age, sex, race/ethnicity, education, income-to-poverty ratio, smoking, alcohol, BMI, cycle, cadmium, and lead. Taylor-series linearization was performed with the R survey package."',
    '"Cycle-specific blood-metals weights were used: WTMEC2YR in 2005-2006 and WTSH2YR in 2013-2014; each was divided by two when pooling cycles. Strata and PSU identifiers were nested within cycle. The primary model estimated the odds ratio per doubling of mercury and adjusted for age, sex, race/ethnicity, education, income-to-poverty ratio, smoking, alcohol, BMI, cycle, cadmium, and lead. Taylor-series linearization was performed with the R survey package."',
    "report pooled weights",
)
replace_once(
    '"Sensitivity analyses used a per-1-microgram/L exposure scale, weighted quartiles, cycle-specific models, a mercury-by-cycle interaction, weighted 99th-percentile winsorization, and a fasting-subsample model using WTSAF2YR rather than imputing structurally absent fasting measurements into the full MEC sample."',
    '"Sensitivity analyses used a per-1-microgram/L exposure scale, weighted quartiles, cycle-specific models, a mercury-by-cycle interaction, weighted 99th-percentile winsorization, and a 2005-2006 fasting-subsample model using WTSAF2YR rather than imputing structurally absent fasting measurements into the full MEC sample. The 2013-2014 overlap of the metal and fasting subsamples was not modeled because no joint public-use weight is supplied."',
    "report fasting sensitivity",
)
replace_once(
    '"- Primary weight: WTMEC2YR divided by 2; strata and PSU nested within cycle."',
    '"- Primary weight: cycle-specific blood-metals weight (WTMEC2YR in 2005-2006; WTSH2YR in 2013-2014), divided by 2; strata and PSU nested within cycle."',
    "protocol weight",
)

path.write_text(text, encoding="utf-8")
print("Applied NHANES weighting and source-normalization corrections successfully.")
