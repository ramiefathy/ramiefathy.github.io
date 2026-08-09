#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(haven)
  library(dplyr)
  library(tidyr)
  library(readr)
  library(readxl)
  library(survey)
  library(ggplot2)
  library(broom)
  library(jsonlite)
  library(splines)
})

options(stringsAsFactors = FALSE)
options(survey.lonely.psu = "adjust")
set.seed(20260809)

workspace <- Sys.getenv("GITHUB_WORKSPACE", unset = getwd())
project_dir <- file.path(workspace, "research", "nhanes_mercury_psoriasis")
raw_dir <- file.path(project_dir, "raw")
out_dir <- file.path(project_dir, "output")
dir.create(raw_dir, recursive = TRUE, showWarnings = FALSE)
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

log_file <- file.path(out_dir, "analysis.log")
log_con <- file(log_file, open = "wt")nsink(log_con, type = "output", split = TRUE)
sink(log_con, type = "message", append = TRUE)
on.exit({
  sink(type = "message")
  sink(type = "output")
  close(log_con)
}, add = TRUE)

cat("NHANES mercury-psoriasis reproducibility analysis\n")
cat("Run UTC:", format(Sys.time(), tz = "UTC", usetz = TRUE), "\n")
cat("Workspace:", workspace, "\n\n")

sha256_file <- function(path) {
  x <- system2("sha256sum", path, stdout = TRUE, stderr = TRUE)
  if (length(x) == 0L) return(NA_character_)
  strsplit(x[[1]], "[[:space:]]+")[[1]][1]
}

download_with_retry <- function(url, dest, required = TRUE) {
  if (file.exists(dest) && file.info(dest)$size > 0) {
    return(TRUE)
  }
  args <- c(
    "-L", "--fail", "--silent", "--show-error",
    "--retry", "5", "--retry-all-errors", "--retry-delay", "2",
    "--connect-timeout", "30", "--max-time", "600",
    "-A", "Mozilla/5.0 (compatible; NHANES-reproducibility-study/1.0)",
    "-o", dest, url
  )
  status <- suppressWarnings(system2("curl", args = args))
  ok <- identical(status, 0L) && file.exists(dest) && file.info(dest)$size > 0
  if (!ok && required) {
    stop("Required download failed: ", url)
  }
  ok
}

manifest <- tibble(
  file = character(),
  url = character(),
  bytes = numeric(),
  sha256 = character(),
  status = character()
)

record_download <- function(path, url, status) {
  manifest <<- bind_rows(
    manifest,
    tibble(
      file = basename(path),
      url = url,
      bytes = if (file.exists(path)) file.info(path)$size else NA_real_,
      sha256 = if (file.exists(path)) sha256_file(path) else NA_character_,
      status = status
    )
  )
}

components_common <- c(
  "DEMO", "PBCD", "BMX", "DIQ", "BPQ", "SMQ", "ALQ",
  "CBC", "BIOPRO", "TCHOL", "HDL", "TRIGLY"
)
cycles <- list(
  D = list(year = "2005", label = "2005-2006", components = c("DEMO", "DEQ", setdiff(components_common, "DEMO"))),
  H = list(year = "2013", label = "2013-2014", components = c("DEMO", "MCQ", setdiff(components_common, "DEMO")))
)

load_cycle <- function(suffix, spec) {
  pieces <- list()
  for (component in spec$components) {
    filename <- paste0(component, "_", suffix, ".XPT")
    url <- sprintf(
      "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/%s/DataFiles/%s",
      spec$year, filename
    )
    dest <- file.path(raw_dir, filename)
    cat("Downloading", filename, "\n")
    ok <- download_with_retry(url, dest, required = TRUE)
    record_download(dest, url, ifelse(ok, "downloaded", "failed"))
    dat <- as.data.frame(read_xpt(dest))
    names(dat) <- toupper(names(dat))
    if (!"SEQN" %in% names(dat)) stop("SEQN missing in ", filename)
    pieces[[component]] <- dat
  }

  out <- pieces[[1]]
  if (length(pieces) > 1L) {
    for (i in 2:length(pieces)) {
      dat <- pieces[[i]]
      duplicate_vars <- intersect(setdiff(names(out), "SEQN"), setdiff(names(dat), "SEQN"))
      if (length(duplicate_vars) > 0L) {
        dat <- dat[, setdiff(names(dat), duplicate_vars), drop = FALSE]
      }
      out <- full_join(out, dat, by = "SEQN")
    }
  }
  out$CYCLE <- spec$label
  out
}

cycle_data <- lapply(names(cycles), function(suffix) load_cycle(suffix, cycles[[suffix]]))
combined <- bind_rows(cycle_data)
cat("Raw combined participants:", nrow(combined), "\n")

# Download and inventory the article's public supporting-data workbook. The
# official NHANES files remain the analysis source of truth.
supplement_urls <- c(
  "https://journals.plos.org/plosone/article/file?id=10.1371%2Fjournal.pone.0309147.s002&type=supplementary",
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC11478867/bin/pone.0309147.s002.xls"
)
supp_path <- file.path(raw_dir, "pone.0309147.s002.xls")
supp_ok <- FALSE
for (u in supplement_urls) {
  if (download_with_retry(u, supp_path, required = FALSE)) {
    record_download(supp_path, u, "downloaded")
    supp_ok <- TRUE
    break
  } else {
    record_download(supp_path, u, "failed")
  }
}

supp_inventory <- tibble(
  sheet = character(), rows = integer(), columns = integer(),
  first_columns = character(), status = character()
)
if (supp_ok) {
  supp_sheets <- tryCatch(excel_sheets(supp_path), error = function(e) character())
  for (s in supp_sheets) {
    x <- tryCatch(read_excel(supp_path, sheet = s), error = function(e) NULL)
    if (is.null(x)) {
      supp_inventory <- bind_rows(supp_inventory, tibble(
        sheet = s, rows = NA_integer_, columns = NA_integer_,
        first_columns = NA_character_, status = "read_failed"
      ))
    } else {
      supp_inventory <- bind_rows(supp_inventory, tibble(
        sheet = s, rows = nrow(x), columns = ncol(x),
        first_columns = paste(head(names(x), 20), collapse = " | "), status = "read"
      ))
      if (nrow(x) >= 1000) {
        write_csv(as.data.frame(x), file.path(out_dir, paste0("supplement_", gsub("[^A-Za-z0-9]+", "_", s), ".csv.gz")))
      }
    }
  }
} else {
  supp_inventory <- tibble(
    sheet = NA_character_, rows = NA_integer_, columns = NA_integer_,
    first_columns = NA_character_, status = "not_downloaded"
  )
}
write_csv(supp_inventory, file.path(out_dir, "supplement_inventory.csv"))

get_num <- function(df, name) {
  if (!name %in% names(df)) return(rep(NA_real_, nrow(df)))
  suppressWarnings(as.numeric(df[[name]]))
}

n <- nrow(combined)
age <- get_num(combined, "RIDAGEYR")
mercury <- get_num(combined, "LBXTHG")
psoriasis <- rep(NA_real_, n)
idx_d <- combined$CYCLE == "2005-2006"
idx_h <- combined$CYCLE == "2013-2014"
deq053 <- get_num(combined, "DEQ053")
mcq070 <- get_num(combined, "MCQ070")
psoriasis[idx_d & deq053 == 1] <- 1
psoriasis[idx_d & deq053 == 2] <- 0
psoriasis[idx_h & mcq070 == 1] <- 1
psoriasis[idx_h & mcq070 == 2] <- 0
# The 2005-2006 psoriasis item was administered only to adults 20-59.
# Apply the same age range to both cycles to define a harmonized target population.
psoriasis[is.na(age) | age < 20 | age > 59] <- NA_real_

flow <- tibble(
  step = c(
    "All NHANES participants in both cycles",
    "Excluded: missing blood total mercury",
    "Remaining after mercury requirement",
    "Excluded: missing harmonized psoriasis outcome after mercury requirement",
    "Final mercury-plus-psoriasis analytic cohort",
    "Psoriasis cases in final cohort"
  ),
  n = c(
    nrow(combined),
    sum(is.na(mercury)),
    sum(!is.na(mercury)),
    sum(!is.na(mercury) & is.na(psoriasis)),
    sum(!is.na(mercury) & !is.na(psoriasis)),
    sum(psoriasis == 1 & !is.na(mercury), na.rm = TRUE)
  )
)
write_csv(flow, file.path(out_dir, "sample_flow.csv"))
print(flow)

clean_binary <- function(x, yes = 1, no = 2) {
  out <- rep(NA_real_, length(x))
  out[x == yes] <- 1
  out[x == no] <- 0
  out
}

sex_chr <- case_when(
  get_num(combined, "RIAGENDR") == 1 ~ "Male",
  get_num(combined, "RIAGENDR") == 2 ~ "Female",
  TRUE ~ NA_character_
)
race_chr <- case_when(
  get_num(combined, "RIDRETH1") == 1 ~ "Mexican American",
  get_num(combined, "RIDRETH1") == 2 ~ "Other Hispanic",
  get_num(combined, "RIDRETH1") == 3 ~ "Non-Hispanic White",
  get_num(combined, "RIDRETH1") == 4 ~ "Non-Hispanic Black",
  get_num(combined, "RIDRETH1") == 5 ~ "Other or multiracial",
  TRUE ~ NA_character_
)
education_chr <- case_when(
  get_num(combined, "DMDEDUC2") == 1 ~ "Less than 9th grade",
  get_num(combined, "DMDEDUC2") == 2 ~ "9th-11th grade",
  get_num(combined, "DMDEDUC2") == 3 ~ "High school or GED",
  get_num(combined, "DMDEDUC2") == 4 ~ "Some college or associate degree",
  get_num(combined, "DMDEDUC2") == 5 ~ "College graduate or above",
  TRUE ~ NA_character_
)
smq020 <- get_num(combined, "SMQ020")
smq040 <- get_num(combined, "SMQ040")
smoking_chr <- case_when(
  smq020 == 2 ~ "Never",
  smq020 == 1 & smq040 %in% c(1, 2) ~ "Current",
  smq020 == 1 & smq040 == 3 ~ "Former",
  TRUE ~ NA_character_
)
current_smoker <- ifelse(smoking_chr == "Current", 1,
                          ifelse(smoking_chr %in% c("Never", "Former"), 0, NA_real_))

analytic_all <- tibble(
  SEQN = get_num(combined, "SEQN"),
  cycle = factor(combined$CYCLE, levels = c("2005-2006", "2013-2014")),
  age = age,
  psoriasis = psoriasis,
  mercury = mercury,
  log2_mercury = ifelse(!is.na(mercury) & mercury > 0, log2(mercury), NA_real_),
  sex = factor(sex_chr, levels = c("Female", "Male")),
  race = factor(race_chr, levels = c(
    "Non-Hispanic White", "Non-Hispanic Black", "Mexican American",
    "Other Hispanic", "Other or multiracial"
  )),
  education = factor(education_chr, levels = c(
    "Less than 9th grade", "9th-11th grade", "High school or GED",
    "Some college or associate degree", "College graduate or above"
  )),
  pir = get_num(combined, "INDFMPIR"),
  alcohol = clean_binary(get_num(combined, "ALQ101")),
  smoking = factor(smoking_chr, levels = c("Never", "Former", "Current")),
  current_smoker = current_smoker,
  bmi = get_num(combined, "BMXBMI"),
  waist = get_num(combined, "BMXWAIST"),
  diabetes = ifelse(get_num(combined, "DIQ010") == 1, 1,
                    ifelse(get_num(combined, "DIQ010") %in% c(2, 3), 0, NA_real_)),
  hypertension = clean_binary(get_num(combined, "BPQ020")),
  total_cholesterol = get_num(combined, "LBXTC"),
  triglycerides_full = get_num(combined, "LBXSTR"),
  triglycerides_fasting = get_num(combined, "LBXTR"),
  ldl = get_num(combined, "LBDLDL"),
  hdl = get_num(combined, "LBDHDD"),
  glucose = get_num(combined, "LBXSGL"),
  bilirubin = get_num(combined, "LBXSTB"),
  wbc = get_num(combined, "LBXWBCSI"),
  cadmium = get_num(combined, "LBXBCD"),
  lead = get_num(combined, "LBXBPB"),
  WTMEC2YR = get_num(combined, "WTMEC2YR"),
  WTSAF2YR = get_num(combined, "WTSAF2YR"),
  SDMVSTRA = get_num(combined, "SDMVSTRA"),
  SDMVPSU = get_num(combined, "SDMVPSU")
)

analytic <- analytic_all %>%
  filter(!is.na(mercury), !is.na(psoriasis), age >= 20, age <= 59)

write_csv(analytic, file.path(out_dir, "analytic_dataset_preimputation.csv.gz"))

analysis_vars <- c(
  "mercury", "age", "sex", "race", "education", "pir", "alcohol",
  "smoking", "current_smoker", "bmi", "waist", "diabetes", "hypertension",
  "total_cholesterol", "triglycerides_full", "triglycerides_fasting", "ldl",
  "hdl", "glucose", "bilirubin", "wbc", "cadmium", "lead",
  "WTMEC2YR", "WTSAF2YR", "SDMVSTRA", "SDMVPSU"
)
missingness <- bind_rows(lapply(analysis_vars, function(v) {
  tibble(
    variable = v,
    n = nrow(analytic),
    missing_n = sum(is.na(analytic[[v]])),
    missing_percent = 100 * mean(is.na(analytic[[v]]))
  )
}))
write_csv(missingness, file.path(out_dir, "missingness_before_imputation.csv"))

mode_character <- function(x) {
  x <- x[!is.na(x) & nzchar(x)]
  if (length(x) == 0L) return(NA_character_)
  names(sort(table(x), decreasing = TRUE))[1]
}
impute_mean <- function(x) {
  m <- mean(x, na.rm = TRUE)
  if (!is.finite(m)) return(x)
  x[is.na(x)] <- m
  x
}
impute_median <- function(x) {
  m <- median(x, na.rm = TRUE)
  if (!is.finite(m)) return(x)
  x[is.na(x)] <- m
  x
}
impute_factor_mode <- function(x) {
  ch <- as.character(x)
  m <- mode_character(ch)
  ch[is.na(ch) | !nzchar(ch)] <- m
  factor(ch, levels = levels(x))
}

paper_df <- analytic
numeric_mean_vars <- c(
  "bmi", "waist", "total_cholesterol", "triglycerides_full", "ldl", "hdl",
  "glucose", "bilirubin", "wbc", "pir", "cadmium", "lead"
)
for (v in numeric_mean_vars) paper_df[[v]] <- impute_mean(paper_df[[v]])
for (v in c("alcohol", "current_smoker", "diabetes", "hypertension")) {
  paper_df[[v]] <- impute_median(paper_df[[v]])
}
for (v in c("sex", "race", "education", "smoking")) {
  paper_df[[v]] <- impute_factor_mode(paper_df[[v]])
}

# If the full-sample chemistry triglyceride variable is unavailable for a row,
# use the fasting measurement when present before mean imputation.
paper_df$triglycerides_full <- ifelse(
  is.na(paper_df$triglycerides_full), paper_df$triglycerides_fasting,
  paper_df$triglycerides_full
)
paper_df$triglycerides_full <- impute_mean(paper_df$triglycerides_full)

safe_glm <- function(formula, data) {
  tryCatch(
    glm(formula, data = data, family = binomial(), control = glm.control(maxit = 100)),
    error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
  )
}

m1 <- safe_glm(psoriasis ~ mercury, paper_df)
m2 <- safe_glm(
  psoriasis ~ mercury + age + sex + race + education + pir,
  paper_df
)
m3 <- safe_glm(
  psoriasis ~ mercury + sex + age + race + alcohol + current_smoker + bmi + pir +
    education + diabetes + waist + total_cholesterol + triglycerides_full + ldl +
    hdl + glucose + bilirubin + wbc + hypertension + cadmium + lead,
  paper_df
)

extract_term <- function(model, term, model_name, source, exposure_scale, design_df = Inf) {
  if (inherits(model, "model_error")) {
    return(tibble(
      source = source, model = model_name, exposure_scale = exposure_scale,
      term = term, log_or = NA_real_, se = NA_real_, odds_ratio = NA_real_,
      ci_lower = NA_real_, ci_upper = NA_real_, p_value = NA_real_, n = NA_integer_,
      status = model$error
    ))
  }
  sm <- summary(model)$coefficients
  if (!term %in% rownames(sm)) {
    return(tibble(
      source = source, model = model_name, exposure_scale = exposure_scale,
      term = term, log_or = NA_real_, se = NA_real_, odds_ratio = NA_real_,
      ci_lower = NA_real_, ci_upper = NA_real_, p_value = NA_real_, n = nobs(model),
      status = "term_not_found"
    ))
  }
  est <- unname(sm[term, 1])
  se <- unname(sm[term, 2])
  crit <- if (is.finite(design_df) && design_df > 0) qt(0.975, design_df) else qnorm(0.975)
  p_col <- ncol(sm)
  tibble(
    source = source,
    model = model_name,
    exposure_scale = exposure_scale,
    term = term,
    log_or = est,
    se = se,
    odds_ratio = exp(est),
    ci_lower = exp(est - crit * se),
    ci_upper = exp(est + crit * se),
    p_value = unname(sm[term, p_col]),
    n = nobs(model),
    status = ifelse(isTRUE(model$converged), "ok", "not_converged")
  )
}

published_rows <- tibble(
  source = "Published PLOS One 2024",
  model = c("Published Model 1", "Published Model 2", "Published Model 3"),
  exposure_scale = "Per 1 microgram/L total mercury",
  term = "mercury",
  log_or = log(c(1.05, 1.05, 1.08)),
  se = NA_real_,
  odds_ratio = c(1.05, 1.05, 1.08),
  ci_lower = c(1.01, 1.00, 1.03),
  ci_upper = c(1.10, 1.10, 1.14),
  p_value = NA_real_,
  n = 6086L,
  status = "reported"
)

unweighted_rows <- bind_rows(
  extract_term(m1, "mercury", "Reproduced unweighted Model 1", "This analysis", "Per 1 microgram/L total mercury"),
  extract_term(m2, "mercury", "Reproduced unweighted Model 2", "This analysis", "Per 1 microgram/L total mercury"),
  extract_term(m3, "mercury", "Reproduced unweighted Model 3", "This analysis", "Per 1 microgram/L total mercury")
)

# Construct pooled NHANES complex-survey design. Each two-year MEC weight is
# divided by the number of pooled cycles. Strata and PSU identifiers are nested
# within cycle so equal numeric labels from different cycles are not conflated.
survey_df <- paper_df %>%
  filter(!is.na(WTMEC2YR), WTMEC2YR > 0, !is.na(SDMVSTRA), !is.na(SDMVPSU)) %>%
  mutate(
    mec_weight = WTMEC2YR / 2,
    strata_nested = interaction(cycle, SDMVSTRA, drop = TRUE),
    psu_nested = interaction(cycle, SDMVSTRA, SDMVPSU, drop = TRUE)
  )

design_mec <- svydesign(
  ids = ~psu_nested,
  strata = ~strata_nested,
  weights = ~mec_weight,
  nest = TRUE,
  data = survey_df
)
design_df <- degf(design_mec)
cat("MEC survey design degrees of freedom:", design_df, "\n")

primary_formula <- psoriasis ~ log2_mercury + age + sex + race + education + pir +
  smoking + alcohol + bmi + cycle + cadmium + lead
m_primary <- tryCatch(
  svyglm(primary_formula, design = design_mec, family = quasibinomial()),
  error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
)
primary_row <- extract_term(
  m_primary, "log2_mercury", "Survey-correct primary model", "This analysis",
  "Per doubling of blood total mercury", design_df
)

secondary_per_unit_formula <- psoriasis ~ mercury + age + sex + race + education + pir +
  smoking + alcohol + bmi + cycle + cadmium + lead
m_survey_unit <- tryCatch(
  svyglm(secondary_per_unit_formula, design = design_mec, family = quasibinomial()),
  error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
)
survey_unit_row <- extract_term(
  m_survey_unit, "mercury", "Survey-correct secondary model", "This analysis",
  "Per 1 microgram/L total mercury", design_df
)

# A survey-correct analogue of the paper's highly adjusted model. This retains
# its covariate set for auditability but should be interpreted cautiously given
# approximately 150 outcome events and design-based degrees of freedom.
full_survey_formula <- psoriasis ~ mercury + sex + age + race + alcohol + current_smoker +
  bmi + pir + education + diabetes + waist + total_cholesterol + triglycerides_full +
  ldl + hdl + glucose + bilirubin + wbc + hypertension + cadmium + lead + cycle
m_survey_full <- tryCatch(
  svyglm(full_survey_formula, design = design_mec, family = quasibinomial()),
  error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
)
survey_full_row <- extract_term(
  m_survey_full, "mercury", "Survey-correct analogue of published Model 3",
  "This analysis", "Per 1 microgram/L total mercury", design_df
)

# Mercury quartiles and weighted psoriasis prevalence.
weighted_cutpoints <- as.numeric(
  svyquantile(~mercury, design_mec, quantiles = c(0.25, 0.50, 0.75), ci = FALSE, na.rm = TRUE)
)
quartile_breaks <- c(-Inf, weighted_cutpoints, Inf)
survey_df$hg_quartile <- cut(
  survey_df$mercury, breaks = quartile_breaks,
  labels = c("Q1", "Q2", "Q3", "Q4"), include.lowest = TRUE
)
design_q <- svydesign(
  ids = ~psu_nested, strata = ~strata_nested, weights = ~mec_weight,
  nest = TRUE, data = survey_df
)
quartile_prevalence <- svyby(
  ~psoriasis, ~hg_quartile, design_q, svymean,
  vartype = c("se", "ci"), na.rm = TRUE, keep.names = FALSE
) %>% as.data.frame()
write_csv(quartile_prevalence, file.path(out_dir, "weighted_psoriasis_prevalence_by_mercury_quartile.csv"))

quartile_model <- tryCatch(
  svyglm(
    psoriasis ~ hg_quartile + age + sex + race + education + pir + smoking +
      alcohol + bmi + cycle + cadmium + lead,
    design = design_q, family = quasibinomial()
  ),
  error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
)
quartile_rows <- tibble()
if (!inherits(quartile_model, "model_error")) {
  qterms <- grep("^hg_quartile", rownames(summary(quartile_model)$coefficients), value = TRUE)
  quartile_rows <- bind_rows(lapply(qterms, function(t) {
    extract_term(
      quartile_model, t, paste0("Survey quartile model: ", t), "This analysis",
      "Weighted mercury quartile versus Q1", design_df
    )
  }))
}

# Cycle-specific estimates and interaction test.
cycle_rows <- tibble()
cycle_formula <- psoriasis ~ log2_mercury + age + sex + race + education + pir +
  smoking + alcohol + bmi + cadmium + lead
for (cy in levels(survey_df$cycle)) {
  dcy <- subset(design_mec, cycle == cy)
  mcy <- tryCatch(
    svyglm(cycle_formula, design = dcy, family = quasibinomial()),
    error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
  )
  cycle_rows <- bind_rows(
    cycle_rows,
    extract_term(
      mcy, "log2_mercury", paste0("Survey-correct cycle-specific: ", cy),
      "This analysis", "Per doubling of blood total mercury", degf(dcy)
    )
  )
}

interaction_formula <- psoriasis ~ log2_mercury * cycle + age + sex + race + education +
  pir + smoking + alcohol + bmi + cadmium + lead
m_interaction <- tryCatch(
  svyglm(interaction_formula, design = design_mec, family = quasibinomial()),
  error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
)
interaction_rows <- tibble()
if (!inherits(m_interaction, "model_error")) {
  iterm <- grep("log2_mercury:cycle|cycle.*:log2_mercury", rownames(summary(m_interaction)$coefficients), value = TRUE)
  if (length(iterm) > 0) {
    interaction_rows <- extract_term(
      m_interaction, iterm[[1]], "Mercury-by-cycle interaction", "This analysis",
      "Ratio of per-doubling odds ratios", design_df
    )
  }
}

# Winsorize mercury at the weighted 99th percentile.
p99 <- as.numeric(svyquantile(~mercury, design_mec, quantiles = 0.99, ci = FALSE, na.rm = TRUE))
survey_df$mercury_w99 <- pmin(survey_df$mercury, p99)
survey_df$log2_mercury_w99 <- log2(survey_df$mercury_w99)
design_w99 <- svydesign(
  ids = ~psu_nested, strata = ~strata_nested, weights = ~mec_weight,
  nest = TRUE, data = survey_df
)
m_w99 <- tryCatch(
  svyglm(
    psoriasis ~ log2_mercury_w99 + age + sex + race + education + pir + smoking +
      alcohol + bmi + cycle + cadmium + lead,
    design = design_w99, family = quasibinomial()
  ),
  error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
)
w99_row <- extract_term(
  m_w99, "log2_mercury_w99", "Survey model, mercury winsorized at weighted 99th percentile",
  "This analysis", "Per doubling of winsorized blood total mercury", design_df
)

# Correctly weighted fasting-subsample sensitivity model for variables measured
# under the fasting protocol. Unlike mean-imputing structurally absent LDL/TG,
# this model uses WTSAF2YR and only participants assigned a positive fasting weight.
fast_df <- analytic %>%
  filter(
    !is.na(WTSAF2YR), WTSAF2YR > 0,
    !is.na(triglycerides_fasting), !is.na(ldl),
    !is.na(SDMVSTRA), !is.na(SDMVPSU)
  )
if (nrow(fast_df) > 0) {
  for (v in c("bmi", "pir", "cadmium", "lead", "hdl")) fast_df[[v]] <- impute_mean(fast_df[[v]])
  for (v in c("alcohol")) fast_df[[v]] <- impute_median(fast_df[[v]])
  for (v in c("sex", "race", "education", "smoking")) fast_df[[v]] <- impute_factor_mode(fast_df[[v]])
  fast_df <- fast_df %>% mutate(
    fasting_weight = WTSAF2YR / 2,
    strata_nested = interaction(cycle, SDMVSTRA, drop = TRUE),
    psu_nested = interaction(cycle, SDMVSTRA, SDMVPSU, drop = TRUE)
  )
  design_fast <- svydesign(
    ids = ~psu_nested, strata = ~strata_nested, weights = ~fasting_weight,
    nest = TRUE, data = fast_df
  )
  m_fast <- tryCatch(
    svyglm(
      psoriasis ~ log2_mercury + age + sex + race + education + pir + smoking +
        alcohol + bmi + cycle + cadmium + lead + triglycerides_fasting + ldl + hdl,
      design = design_fast, family = quasibinomial()
    ),
    error = function(e) structure(list(error = conditionMessage(e)), class = "model_error")
  )
  fast_row <- extract_term(
    m_fast, "log2_mercury", "Properly weighted fasting-subsample model",
    "This analysis", "Per doubling of blood total mercury", degf(design_fast)
  )
  fasting_summary <- tibble(
    n = nrow(fast_df),
    psoriasis_cases = sum(fast_df$psoriasis == 1, na.rm = TRUE),
    design_df = degf(design_fast)
  )
} else {
  fast_row <- tibble(
    source = "This analysis", model = "Properly weighted fasting-subsample model",
    exposure_scale = "Per doubling of blood total mercury", term = "log2_mercury",
    log_or = NA_real_, se = NA_real_, odds_ratio = NA_real_, ci_lower = NA_real_,
    ci_upper = NA_real_, p_value = NA_real_, n = 0L, status = "no_eligible_records"
  )
  fasting_summary <- tibble(n = 0L, psoriasis_cases = 0L, design_df = NA_real_)
}
write_csv(fasting_summary, file.path(out_dir, "fasting_subsample_summary.csv"))

model_results <- bind_rows(
  published_rows, unweighted_rows, primary_row, survey_unit_row, survey_full_row,
  quartile_rows, cycle_rows, interaction_rows, w99_row, fast_row
)
write_csv(model_results, file.path(out_dir, "model_results.csv"))

# Survey-weighted descriptive estimates.
overall_prev <- svymean(~psoriasis, design_mec, na.rm = TRUE)
overall_descriptives <- tibble(
  analytic_n = nrow(survey_df),
  unweighted_cases = sum(survey_df$psoriasis == 1, na.rm = TRUE),
  unweighted_prevalence = mean(survey_df$psoriasis, na.rm = TRUE),
  weighted_prevalence = as.numeric(coef(overall_prev)[1]),
  weighted_prevalence_se = as.numeric(SE(overall_prev)[1]),
  weighted_prevalence_ci_lower = confint(overall_prev)[1, 1],
  weighted_prevalence_ci_upper = confint(overall_prev)[1, 2],
  weighted_mercury_q25 = weighted_cutpoints[1],
  weighted_mercury_median = weighted_cutpoints[2],
  weighted_mercury_q75 = weighted_cutpoints[3],
  weighted_mercury_p99 = p99,
  design_degrees_of_freedom = design_df
)
write_csv(overall_descriptives, file.path(out_dir, "overall_descriptives.csv"))

reproduction_check <- tibble(
  quantity = c("Raw participants", "Final analytic cohort", "Psoriasis cases"),
  published = c(20523, 6086, 150),
  reproduced = c(nrow(combined), nrow(analytic), sum(analytic$psoriasis == 1)),
  exact_match = published == reproduced
)
write_csv(reproduction_check, file.path(out_dir, "reproduction_check.csv"))

# Figures --------------------------------------------------------------------
forest_df <- model_results %>%
  filter(
    source == "This analysis", is.finite(odds_ratio), is.finite(ci_lower), is.finite(ci_upper),
    !grepl("quartile|interaction", model, ignore.case = TRUE)
  )
if (nrow(forest_df) > 0) {
  p_forest <- ggplot(
    forest_df,
    aes(x = odds_ratio, y = reorder(model, odds_ratio), xmin = ci_lower, xmax = ci_upper)
  ) +
    geom_vline(xintercept = 1, linetype = 2) +
    geom_pointrange() +
    scale_x_log10() +
    labs(
      title = "Blood total mercury and prevalent psoriasis",
      subtitle = "Odds ratios use the exposure scale stated in model_results.csv",
      x = "Odds ratio (log scale)", y = NULL
    ) +
    theme_minimal(base_size = 11)
  ggsave(file.path(out_dir, "forest_plot.png"), p_forest, width = 9, height = 6, dpi = 180)
  ggsave(file.path(out_dir, "forest_plot.pdf"), p_forest, width = 9, height = 6)
}

if (nrow(quartile_prevalence) > 0) {
  qprev <- quartile_prevalence
  prev_col <- intersect(c("psoriasis", "psoriasis1"), names(qprev))[1]
  lower_col <- grep("^ci_l|^ci_l\.psoriasis|^ci_l", names(qprev), value = TRUE)[1]
  upper_col <- grep("^ci_u|^ci_u\.psoriasis|^ci_u", names(qprev), value = TRUE)[1]
  if (!is.na(prev_col) && !is.na(lower_col) && !is.na(upper_col)) {
    qprev$estimate <- qprev[[prev_col]]
    qprev$lower <- qprev[[lower_col]]
    qprev$upper <- qprev[[upper_col]]
    p_prev <- ggplot(qprev, aes(x = hg_quartile, y = estimate, ymin = lower, ymax = upper)) +
      geom_pointrange() +
      scale_y_continuous(labels = scales::percent_format(accuracy = 0.1)) +
      labs(
        title = "Survey-weighted psoriasis prevalence by mercury quartile",
        x = "Weighted blood total mercury quartile", y = "Prevalence (95% CI)"
      ) +
      theme_minimal(base_size = 11)
    ggsave(file.path(out_dir, "weighted_prevalence_by_quartile.png"), p_prev, width = 7, height = 5, dpi = 180)
    ggsave(file.path(out_dir, "weighted_prevalence_by_quartile.pdf"), p_prev, width = 7, height = 5)
  }
}

# Dynamic manuscript-ready report -------------------------------------------
fmt_or <- function(row) {
  if (nrow(row) == 0 || !is.finite(row$odds_ratio[1])) return("not estimable")
  sprintf("OR %.2f (95%% CI %.2f to %.2f; p=%.3g)",
          row$odds_ratio[1], row$ci_lower[1], row$ci_upper[1], row$p_value[1])
}
get_model <- function(name) model_results %>% filter(model == name)
flow_final <- flow$n[flow$step == "Final mercury-plus-psoriasis analytic cohort"]
flow_cases <- flow$n[flow$step == "Psoriasis cases in final cohort"]
ldl_missing <- missingness$missing_percent[missingness$variable == "ldl"]
tgfast_missing <- missingness$missing_percent[missingness$variable == "triglycerides_fasting"]
primary_text <- fmt_or(get_model("Survey-correct primary model"))
unit_text <- fmt_or(get_model("Survey-correct secondary model"))
full_text <- fmt_or(get_model("Survey-correct analogue of published Model 3"))
fast_text <- fmt_or(get_model("Properly weighted fasting-subsample model"))
unw1_text <- fmt_or(get_model("Reproduced unweighted Model 1"))
unw2_text <- fmt_or(get_model("Reproduced unweighted Model 2"))
unw3_text <- fmt_or(get_model("Reproduced unweighted Model 3"))

report_lines <- c(
  "# Blood total mercury and prevalent psoriasis in NHANES 2005-2006 and 2013-2014",
  "",
  "## A reproducibility and complex-survey robustness audit",
  "",
  paste0("**Analysis date:** ", format(Sys.Date(), "%Y-%m-%d")),
  "",
  "## Abstract",
  "",
  "### Importance",
  "A 2024 cross-sectional NHANES analysis reported a positive association between blood total mercury and self-reported psoriasis. NHANES requires design-based analysis, and several covariates used in the published model are available only in protocol-specific subsamples.",
  "",
  "### Objective",
  "To reproduce the published cohort and unweighted regression estimates, then test robustness using pooled-cycle MEC survey weights, nested strata and primary sampling units, a parsimonious prespecified confounder set, weighted mercury quartiles, cycle-specific analyses, outlier winsorization, and a correctly weighted fasting-subsample analysis.",
  "",
  "### Design, setting, and participants",
  paste0("Cross-sectional analysis of NHANES 2005-2006 and 2013-2014 adults aged 20-59 years with blood total mercury and a harmonized self-reported psoriasis outcome. The analytic cohort contained ", flow_final, " participants and ", flow_cases, " psoriasis cases."),
  "",
  "### Exposure and outcome",
  "Blood total mercury (micrograms/L) and self-report of ever being told by a health professional that the participant had psoriasis.",
  "",
  "### Main results",
  paste0("The unweighted reproduced estimates were: Model 1, ", unw1_text, "; Model 2, ", unw2_text, "; and the highly adjusted Model 3, ", unw3_text, ". The survey-correct parsimonious primary estimate per mercury doubling was ", primary_text, ". On the paper's per-1-microgram/L scale, the survey-correct secondary estimate was ", unit_text, ". The survey-correct analogue of the published full model was ", full_text, ". The correctly weighted fasting-subsample sensitivity estimate was ", fast_text, "."),
  "",
  "### Conclusions and relevance",
  "The causal interpretation remains limited by cross-sectional measurement, self-reported psoriasis, residual confounding (especially diet and seafood intake), and sparse outcome events. Any difference between unweighted and design-correct estimates demonstrates that correct NHANES design handling materially affects inference; it does not by itself establish that either estimate is causal.",
  "",
  "## Introduction",
  "",
  "Blood mercury is influenced substantially by seafood consumption and other environmental or occupational sources. Psoriasis is a chronic immune-mediated disease associated with behavioral and cardiometabolic factors that may also correlate with mercury exposure. A prior NHANES analysis reported increasing odds of psoriasis with higher blood total mercury. The present study was designed as a reproducibility and statistical-validity audit rather than a new causal discovery analysis.",
  "",
  "## Methods",
  "",
  "### Data sources",
  "Official public-use NHANES XPT files were downloaded directly from the CDC for the 2005-2006 and 2013-2014 cycles. File URLs, sizes, and SHA-256 hashes are recorded in download_manifest.csv. The PLOS supporting-data workbook was separately downloaded and inventoried when reachable.",
  "",
  "### Cohort",
  "The two cycles contained 20,523 raw participants. Because the 2005-2006 psoriasis questionnaire targeted ages 20-59, the same age range was applied to both cycles. Participants required a valid blood total mercury result and a yes/no psoriasis response. Outcome and exposure values were not imputed.",
  "",
  "### Published-model reproduction",
  "Three ordinary logistic models mirrored the reported specifications: unadjusted; adjusted for age, sex, race/ethnicity, education, and family income-to-poverty ratio; and a highly adjusted model adding alcohol, smoking, BMI, diabetes, waist circumference, cholesterol measures, glucose, bilirubin, white blood cell count, hypertension, cadmium, and lead. Continuous covariates were mean-imputed and alcohol/smoking variables median-imputed to approximate the paper's stated approach.",
  "",
  "### Survey-correct primary analysis",
  "Two-year MEC examination weights were divided by two when pooling cycles. Strata and PSU identifiers were nested within cycle. The primary model estimated the odds ratio per doubling of mercury and adjusted for age, sex, race/ethnicity, education, income-to-poverty ratio, smoking, alcohol, BMI, cycle, cadmium, and lead. Taylor-series linearization was performed with the R survey package.",
  "",
  "### Sensitivity analyses",
  "Sensitivity analyses used a per-1-microgram/L exposure scale, weighted quartiles, cycle-specific models, a mercury-by-cycle interaction, weighted 99th-percentile winsorization, and a fasting-subsample model using WTSAF2YR rather than imputing structurally absent fasting measurements into the full MEC sample.",
  "",
  "## Results",
  "",
  "### Cohort reproduction",
  paste0("The final cohort contained ", flow_final, " participants and ", flow_cases, " psoriasis cases. See reproduction_check.csv for exact comparison with the published values and sample_flow.csv for sequential exclusions."),
  "",
  "### Missingness and protocol-specific measurements",
  paste0("Before imputation, LDL cholesterol was missing for ", sprintf("%.1f", ldl_missing), "% of the analytic cohort and fasting triglycerides for ", sprintf("%.1f", tgfast_missing), "%. These are protocol-driven missing values, not ordinary sporadic missingness; their correct analysis uses fasting-subsample weights."),
  "",
  "### Regression results",
  paste0("Unweighted Model 1: ", unw1_text, "."),
  paste0("Unweighted Model 2: ", unw2_text, "."),
  paste0("Unweighted Model 3: ", unw3_text, "."),
  paste0("Survey-correct primary model per doubling: ", primary_text, "."),
  paste0("Survey-correct secondary model per 1 microgram/L: ", unit_text, "."),
  paste0("Survey-correct analogue of the full published model: ", full_text, "."),
  paste0("Properly weighted fasting-subsample model: ", fast_text, "."),
  "",
  "Complete numerical results, including quartile, cycle-specific, interaction, and winsorized estimates, appear in model_results.csv.",
  "",
  "## Discussion",
  "",
  "This audit separates three questions that are often conflated: whether the published cohort can be reconstructed, whether ordinary logistic regression reproduces the reported estimate, and whether the association persists under the NHANES complex survey design. The first two assess computational reproducibility; the third assesses population-level statistical validity.",
  "",
  "The published full model is statistically fragile because roughly 150 psoriasis events support a large number of parameters. In addition, LDL and fasting triglycerides are measured under a fasting subsample protocol. Mean imputation into nonselected participants does not recreate the missing laboratory measurements and cannot replace the corresponding subsample weights.",
  "",
  "Even a design-correct association would remain noncausal. Psoriasis was self-reported, mercury and disease status were measured cross-sectionally, seafood intake was not fully controlled, and temporal ordering is unknown. Blood mercury also reflects relatively recent exposure rather than long-term cumulative exposure.",
  "",
  "## Limitations",
  "",
  "1. The outcome is self-reported rather than dermatologist-confirmed.",
  "2. Cross-sectional data do not establish whether mercury exposure preceded psoriasis.",
  "3. Residual confounding by fish and shellfish intake, occupation, geography, and health behavior is likely.",
  "4. The number of psoriasis cases limits precision and model complexity.",
  "5. Single imputation was used only to approximate the published model; it is not a preferred missing-data method.",
  "6. Estimates across two discontinuous NHANES cycles may be sensitive to secular changes.",
  "",
  "## Reproducibility",
  "",
  "The package includes the complete acquisition and analysis script, all numerical outputs, figures, source-file hashes, session information, and the public analytic dataset before imputation. Re-running analysis.R on an internet-connected R environment reconstructs the analysis from official source files.",
  "",
  "## Source articles and documentation",
  "",
  "- Zhao Y, et al. Association between blood total mercury and psoriasis: The NHANES 2005-2006 and 2013-2014. PLOS One. 2024;19:e0309147. doi:10.1371/journal.pone.0309147.",
  "- National Center for Health Statistics. NHANES Analytic Guidelines and public-use data documentation.",
  ""
)
writeLines(report_lines, file.path(out_dir, "manuscript_report.md"), useBytes = TRUE)

protocol_lines <- c(
  "# Locked analytic protocol",
  "",
  "- Population: NHANES 2005-2006 and 2013-2014 participants aged 20-59.",
  "- Exposure: blood total mercury, LBXTHG.",
  "- Outcome: DEQ053 in 2005-2006 and MCQ070 in 2013-2014; yes versus no.",
  "- Primary estimand: survey-weighted odds ratio for prevalent psoriasis per doubling of blood total mercury.",
  "- Primary adjustment: age, sex, race/ethnicity, education, family income-to-poverty ratio, smoking, alcohol, BMI, cycle, cadmium, lead.",
  "- Primary weight: WTMEC2YR divided by 2; strata and PSU nested within cycle.",
  "- Sensitivities: unweighted published-model reproduction, per-unit mercury, weighted quartiles, cycle-specific estimates, interaction, 99th-percentile winsorization, fasting-subsample WTSAF2YR model.",
  "- No imputation of exposure or outcome.",
  "- Interpretation: association only; no causal or incidence claim."
)
writeLines(protocol_lines, file.path(out_dir, "analysis_protocol.md"), useBytes = TRUE)

summary_json <- list(
  run_utc = format(Sys.time(), tz = "UTC", usetz = TRUE),
  raw_n = nrow(combined),
  analytic_n = nrow(analytic),
  cases = sum(analytic$psoriasis == 1),
  exact_published_cohort_match = all(reproduction_check$exact_match),
  survey_design_df = design_df,
  unweighted_model_1 = as.list(unweighted_rows[1, ]),
  unweighted_model_2 = as.list(unweighted_rows[2, ]),
  unweighted_model_3 = as.list(unweighted_rows[3, ]),
  survey_primary = as.list(primary_row[1, ]),
  survey_per_unit = as.list(survey_unit_row[1, ]),
  survey_full = as.list(survey_full_row[1, ]),
  fasting_model = as.list(fast_row[1, ])
)
write_json(summary_json, file.path(out_dir, "analysis_summary.json"), auto_unbox = TRUE, pretty = TRUE, na = "null")

write_csv(manifest, file.path(out_dir, "download_manifest.csv"))
writeLines(capture.output(sessionInfo()), file.path(out_dir, "session_info.txt"))

# Create a checksummed inventory of every deliverable after all files exist.
output_files <- list.files(out_dir, full.names = TRUE, recursive = FALSE)
output_files <- output_files[basename(output_files) != "artifact_manifest.sha256"]
sha_lines <- vapply(output_files, function(p) {
  paste(sha256_file(p), basename(p))
}, character(1))
writeLines(sort(sha_lines), file.path(out_dir, "artifact_manifest.sha256"))

cat("\nAnalysis completed successfully.\n")
cat("Output directory:", out_dir, "\n")
cat("Analytic N:", nrow(analytic), "Cases:", sum(analytic$psoriasis == 1), "\n")
cat("Primary survey result:", primary_text, "\n")
