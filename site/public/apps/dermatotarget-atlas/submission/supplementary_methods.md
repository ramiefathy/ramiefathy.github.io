# Supplementary Methods

Generated: 2026-06-03T19:48:29.468329+00:00

## Disease Configuration

| disease_key | disease_name | opentargets_id | gwas_trait | clinicaltrials_condition | aliases | known_anchor_targets |
| --- | --- | --- | --- | --- | --- | --- |
| psoriasis | Psoriasis | EFO_0000676 | psoriasis | psoriasis | plaque psoriasis; psoriasis vulgaris | IL17A; IL17RA; IL23A; IL23R; IL12B; TNF; TYK2; JAK1; PDE4B |
| atopic_dermatitis | Atopic dermatitis | EFO_0000274 | atopic dermatitis | atopic dermatitis | atopic eczema; eczema | FLG; IL4R; IL13; JAK1; JAK2; JAK3; PDE4B; OX40; TSLP |
| hidradenitis_suppurativa | Hidradenitis suppurativa | EFO_1000710 | hidradenitis suppurativa | hidradenitis suppurativa | acne inversa; hidradenitis | TNF; IL17A; IL17RA; IL1B; JAK1; PSENEN |
| vitiligo | Vitiligo | EFO_0004208 | vitiligo | vitiligo | nonsegmental vitiligo; non-segmental vitiligo | JAK1; JAK2; IFNG; CXCL10; NLRP1; TYR |
| alopecia_areata | Alopecia areata | EFO_0004192 | alopecia areata | alopecia areata | alopecia totalis; alopecia universalis | JAK1; JAK2; JAK3; IL2RA; IFNG; CTLA4 |
| cutaneous_lupus_erythematosus | Cutaneous lupus erythematosus | EFO_0003834 | cutaneous lupus erythematosus | cutaneous lupus erythematosus | cutaneous lupus; discoid lupus; subacute cutaneous lupus; chronic cutaneous lupus | IFNAR1; TLR7; TLR9; TNFSF13B; CD20; JAK1 |

## Run Configuration

| parameter | value |
| --- | --- |
| top_targets_per_disease | 100 |
| target_metadata_limit | 360 |
| gwas_records_per_disease | 75 |
| clinical_trials_per_disease | 80 |
| literature_pairs_per_disease | 20 |
| pubmed_records_per_pair | 5 |
| systematic_literature_records_per_candidate | 12 |
| publication_null_iterations | 500 |
| request_sleep_seconds | 0.360 |

## Source URLs

| source | url |
| --- | --- |
| Open Targets Platform | https://platform.opentargets.org/ |
| GWAS Catalog | https://www.ebi.ac.uk/gwas/ |
| Human Protein Atlas | https://www.proteinatlas.org/ |
| ClinicalTrials.gov | https://clinicaltrials.gov/ |
| PubMed Entrez | https://www.ncbi.nlm.nih.gov/books/NBK25501/ |
| STROBE | https://www.strobe-statement.org/ |
| RECORD | https://www.record-statement.org/ |

## Row Counts

| table | rows |
| --- | --- |
| associated_targets | 600 |
| target_scores | 600 |
| gwas_studies | 131 |
| gwas_associations | 263 |
| clinical_trials | 480 |
| target_clinical_reports | 2736 |
| target_drug_candidates | 54468 |
| literature_support | 379 |
| systematic_literature_candidates | 98 |
| systematic_literature_records | 583 |
| evidence_rows | 6390 |

## Scoring Formula

The composite score is a weighted component sum minus a capped safety penalty. Component weights are:

| component | weight |
| --- | --- |
| genetics_score | 0.220 |
| opentargets_score | 0.180 |
| skin_relevance_score | 0.140 |
| clinical_maturity_score | 0.140 |
| druggability_score | 0.140 |
| literature_score | 0.070 |
| evidence_breadth_score | 0.060 |
| novelty_gap_score | 0.050 |

## Validation Analyses

Validation analyses include:

- **Score ablation profiles**: Each evidence component is individually removed and the change in composite score and rank is measured, detecting feature dominance and information leakage across data sources.
- **Within-disease empirical null calibration**: Component scores are permuted within each disease to generate a null distribution; calibrated p-values and percentile ranks are computed against this null to assess whether observed scores exceed chance expectation.
- **Known anchor recovery**: Pre-specified positive-control targets (genes with established therapeutic relevance for each disease) are tested for recovery in the top-ranked shortlist, measuring sensitivity.
- **Negative-control checks**: Targets with no known biological relevance to a given disease are tested for specificity; high-ranking negatives indicate potential scoring artifacts.
- **Curated module summaries**: Biological coherence of co-expression or pathway modules is summarized to verify that gene groupings reflect meaningful biology rather than technical noise.
- **Systematic PubMed screening**: For selected shortlisted targets, automated PubMed/Entrez queries with structured inclusion/exclusion criteria grade the published evidence (A–D) across clinical, genetic, mechanistic, and therapeutic domains.
