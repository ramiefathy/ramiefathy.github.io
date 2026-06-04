# DermatoTarget Atlas: A reproducible public-data target prioritization study across immune-mediated skin diseases

## Abstract

**Importance:** Dermatology drug development increasingly depends on selecting targets from fragmented genetics, omics, pharmacology, and clinical-trial evidence. A reproducible cross-disease target atlas can help distinguish validated pathways, repurposing opportunities, and underexplored biologic hypotheses.

**Objective:** To build and validate a public-data therapeutic target prioritization atlas for six immune-mediated skin diseases.

**Design, Setting, and Data Sources:** Computational evidence-integration study using public Open Targets Platform, GWAS Catalog, Human Protein Atlas, ClinicalTrials.gov, and PubMed/Entrez data. Source queries were cached with request-level provenance.

**Main Outcomes and Measures:** Target-disease composite scores across 8 interpretable components, opportunity class assignments, anchor recovery, score-ablation stability, empirical null calibration, module-level signals, and shortlist literature grades.

**Results:** The analysis scored 600 target-disease pairs across 505 unique targets and 6 diseases. The run integrated 263 GWAS associations, 480 ClinicalTrials.gov disease-level studies, 379 initial PubMed pair records, and 583 systematic shortlist PubMed records. Known therapeutic or biologic anchors were recovered in the top-ranked target sets for face validity. The atlas separated validated or late-stage targets from near-field repurposing and white-space candidates and generated module-level disease program summaries.

**Conclusions and Relevance:** DermatoTarget Atlas provides an auditable hypothesis-generation framework for dermatology target selection. Results should be interpreted as prioritization hypotheses, not clinical guidance or causal proof, and require expert biologic review before translational investment.

## Introduction

Immune-mediated skin diseases share inflammatory circuits but differ in tissue context, genetics, clinical-trial maturity, and druggability. Current target selection often occurs within individual diseases or evidence streams, which can obscure cross-disease opportunities and overstate isolated signals. A transparent public-data atlas can make evidence convergence, uncertainty, and novelty explicit.

This study created DermatoTarget Atlas, a reproducible target-disease prioritization map across psoriasis, atopic dermatitis, hidradenitis suppurativa, vitiligo, alopecia areata, and cutaneous lupus erythematosus.

## Methods

### Study Design

This was a computational evidence-integration and target-prioritization study using only public, non-PHI data. The unit of analysis was the target-disease pair.

### Disease Scope and Ontology Mapping

Disease entities were configured with Open Targets EFO identifiers, GWAS trait strings, ClinicalTrials.gov conditions, PubMed title/abstract aliases, and known anchor targets. The disease configuration is stored in `config/diseases.yml`.

### Data Sources

| source | url |
| --- | --- |
| Open Targets Platform | https://platform.opentargets.org/ |
| GWAS Catalog | https://www.ebi.ac.uk/gwas/ |
| Human Protein Atlas | https://www.proteinatlas.org/ |
| ClinicalTrials.gov | https://clinicaltrials.gov/ |
| PubMed Entrez | https://www.ncbi.nlm.nih.gov/books/NBK25501/ |
| STROBE | https://www.strobe-statement.org/ |
| RECORD | https://www.record-statement.org/ |

### Scoring

Each target-disease pair was scored with a weighted, interpretable component model. Components included genetics, Open Targets association strength, skin or immune tissue context, clinical maturity, druggability, literature support, evidence breadth, novelty gap, and a capped safety penalty.

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

### Validation and Sensitivity Analyses

The publication validation layer assessed anchor recovery, score decomposition, ablation profiles that remove clinical/literature precedence or Open Targets association scores, permutation-derived empirical null calibration, and negative-control behavior. Disease-module analyses grouped target genes into curated dermatology pathways. A systematic shortlist literature screen queried PubMed/Entrez for selected white-space, near-field, and validated target-disease pairs and assigned A-D evidence grades.

## Results

### Dataset Yield

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

### Disease-Level Summary

| disease_name | scored_pairs | unique_targets | top_gene | top_score | white_space_pairs | near_field_pairs | validated_late_stage_pairs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alopecia areata | 100 | 100 | CTLA4 | 0.698 | 7 | 8 | 9 |
| Atopic dermatitis | 100 | 100 | IL13 | 0.776 | 26 | 7 | 18 |
| Cutaneous lupus erythematosus | 100 | 100 | SAMHD1 | 0.626 | 8 | 6 | 13 |
| Hidradenitis suppurativa | 100 | 100 | PSEN1 | 0.663 | 0 | 4 | 69 |
| Psoriasis | 100 | 100 | IL12B | 0.814 | 23 | 9 | 31 |
| Vitiligo | 100 | 100 | TYR | 0.816 | 15 | 12 | 13 |

### Opportunity Classes

| opportunity_class | target_disease_pairs |
| --- | --- |
| hypothesis_generating | 320 |
| validated_or_late_stage | 153 |
| white_space | 79 |
| near_field_repurposing | 46 |
| crowded | 2 |

### Top Target-Disease Pairs

| disease_name | rank | gene_symbol | target_name | composite_score | genetics_score | skin_relevance_score | clinical_maturity_score | druggability_score | repurposing_category |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vitiligo | 1 | TYR | tyrosinase | 0.816 | 1.000 | 1.000 | 0.608 | 1.000 | hypothesis_generating |
| Psoriasis | 1 | IL12B | interleukin 12B | 0.814 | 0.940 | 0.550 | 1.000 | 1.000 | validated_or_late_stage |
| Atopic dermatitis | 1 | IL13 | interleukin 13 | 0.776 | 0.889 | 0.550 | 1.000 | 1.000 | validated_or_late_stage |
| Psoriasis | 2 | TYK2 | tyrosine kinase 2 | 0.764 | 0.921 | 0.400 | 1.000 | 1.000 | validated_or_late_stage |
| Psoriasis | 3 | TRAF3IP2 | TRAF3 interacting protein 2 | 0.747 | 1.000 | 1.000 | 0.000 | 0.820 | near_field_repurposing |
| Psoriasis | 4 | IL17RA | interleukin 17 receptor A | 0.710 | 0.403 | 0.850 | 1.000 | 1.000 | validated_or_late_stage |
| Alopecia areata | 1 | CTLA4 | cytotoxic T-lymphocyte associated protein 4 | 0.698 | 0.985 | 1.000 | 0.000 | 1.000 | near_field_repurposing |
| Atopic dermatitis | 2 | IL6R | interleukin 6 receptor | 0.694 | 0.877 | 1.000 | 0.000 | 1.000 | near_field_repurposing |
| Alopecia areata | 2 | IL2RA | interleukin 2 receptor subunit alpha | 0.691 | 1.000 | 0.550 | 0.500 | 1.000 | hypothesis_generating |
| Atopic dermatitis | 3 | IL22 | interleukin 22 | 0.669 | 0.890 | 0.400 | 0.700 | 0.820 | hypothesis_generating |
| Psoriasis | 5 | IL23A | interleukin 23 subunit alpha | 0.664 | 0.387 | 0.550 | 1.000 | 1.000 | validated_or_late_stage |
| Hidradenitis suppurativa | 1 | PSEN1 | presenilin 1 | 0.663 | 0.914 | 0.550 | 0.000 | 0.820 | near_field_repurposing |

### Anchor and Output Validation

| validation_check | value |
| --- | --- |
| non_empty_target_scores | True |
| all_diseases_present | True |
| scores_decomposable | True |
| scores_in_range | True |
| nct_ids_have_urls | True |
| pubmed_ids_have_urls | True |
| psoriasis_anchor_hits_top25 | IL12B, IL17A, IL17RA, IL23A, PDE4B, TNF, TYK2 |
| atopic_dermatitis_anchor_hits_top25 | FLG, IL13, IL4R, JAK1, JAK2, JAK3, PDE4B |
| hidradenitis_suppurativa_anchor_hits_top25 | IL17A, IL17RA, IL1B, JAK1, PSENEN, TNF |
| vitiligo_anchor_hits_top25 | JAK1, JAK2, TYR |
| alopecia_areata_anchor_hits_top25 | CTLA4, IL2RA, JAK1, JAK2, JAK3 |
| cutaneous_lupus_erythematosus_anchor_hits_top25 | IFNAR1, JAK1, TLR7, TLR9 |
| known_anchor_any_top25 | True |

Anchor hits in top 25 by disease:

| disease_check | anchor_hits |
| --- | --- |
| psoriasis_anchor_hits_top25 | IL12B, IL17A, IL17RA, IL23A, PDE4B, TNF, TYK2 |
| atopic_dermatitis_anchor_hits_top25 | FLG, IL13, IL4R, JAK1, JAK2, JAK3, PDE4B |
| hidradenitis_suppurativa_anchor_hits_top25 | IL17A, IL17RA, IL1B, JAK1, PSENEN, TNF |
| vitiligo_anchor_hits_top25 | JAK1, JAK2, TYR |
| alopecia_areata_anchor_hits_top25 | CTLA4, IL2RA, JAK1, JAK2, JAK3 |
| cutaneous_lupus_erythematosus_anchor_hits_top25 | IFNAR1, JAK1, TLR7, TLR9 |

## Discussion

DermatoTarget Atlas integrates public evidence into a ranked, auditable dermatology target map. The strongest use case is comparative prioritization: identifying which targets are already clinically mature, which are near-field repurposing candidates, and which appear biologically supported but underdeveloped. The module layer supports clinical interpretation by grouping genes into known inflammatory, barrier, interferon, melanocyte, B-cell, chemokine, and innate immune programs.

The study is intentionally conservative. Scores are not causal estimates, and high rank should not be interpreted as therapeutic efficacy. Genetic evidence is limited by available studies and locus-to-gene mapping; Human Protein Atlas context is compact and does not replace disease-lesional single-cell or spatial transcriptomics; clinical maturity reflects public trial and Open Targets records, not complete commercial pipelines; and PubMed title/abstract screening does not replace manual full-text review.

## Conclusions

A reproducible public-data dermatology target atlas can organize therapeutic hypotheses across diseases, expose evidence-source dependence, and create a submission-ready framework for expert review and future validation.
