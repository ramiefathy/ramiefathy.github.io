# Data Dictionary

This dictionary is generated from normalized CSV outputs and report tables. Column descriptions are compact, schema-oriented descriptions intended to support reviewer navigation; source-specific field semantics remain defined by the originating public database.

## `data/normalized/clinical_trials.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| nct_id | ClinicalTrials.gov identifier. |
| trial_title | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| overall_status | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| phase | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| study_type | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| enrollment | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| start_date | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| completion_date | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| lead_sponsor | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| sponsor_class | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| conditions | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| intervention_names | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| intervention_types | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| mechanism_category | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| has_results | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| source_url | Public URL for the source record or source database. |

## `data/normalized/evidence_rows.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| evidence_source | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| evidence_type | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| evidence_value | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| evidence_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| source_url | Public URL for the source record or source database. |
| source_date | Date the evidence row was generated or source was accessed. |
| notes | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `data/normalized/gwas_associations.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| association_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| accession_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| mapped_genes | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| locations | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| risk_allele | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| p_value | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| pvalue_mantissa | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| pvalue_exponent | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| or_value | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| beta | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| reported_trait | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| efo_traits | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| source_url | Public URL for the source record or source database. |

## `data/normalized/gwas_studies.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| accession_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| disease_trait | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| pubmed_id | PubMed identifier. |
| publication | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| initial_sample_size | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| replication_sample_size | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| ancestry_initial | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| ancestry_replication | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| full_summary_stats_available | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| source_url | Public URL for the source record or source database. |

## `data/normalized/literature_support.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| gene_symbol | Approved or source-returned gene symbol. |
| pubmed_id | PubMed identifier. |
| title | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| journal | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| year | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| publication_date | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| publication_types | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| source_url | Public URL for the source record or source database. |
| query_url | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `data/normalized/target_clinical_reports.csv`

| column | description |
| --- | --- |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| drug_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| drug_name | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| drug_type | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| candidate_max_stage | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| clinical_report_id | Clinical development, trial, or Open Targets clinical-candidate field. |
| clinical_report_source | Clinical development, trial, or Open Targets clinical-candidate field. |
| trial_title | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| trial_url | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| clinical_stage | Clinical development, trial, or Open Targets clinical-candidate field. |
| phase_from_source | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| trial_status | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| trial_start_date | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| match_type | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `data/normalized/target_drug_candidates.csv`

| column | description |
| --- | --- |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| drug_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| drug_name | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| drug_type | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| drug_maximum_clinical_stage | Clinical development, trial, or Open Targets clinical-candidate field. |
| candidate_max_stage | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| disease_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| disease_name | Human-readable disease name. |
| disease_from_source | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| clinical_report_count | Count of records or events represented by this row. |

## `data/normalized/target_scores.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| disease_id | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| source_disease_name | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| target_biotype | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| opentargets_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| opentargets_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| novelty_direct | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| novelty_indirect | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| genetics_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| skin_relevance_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| clinical_maturity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| druggability_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| literature_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| evidence_breadth_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| novelty_gap_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| safety_penalty | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| datatype_genetic_association | Open Targets datatype-specific evidence score. |
| datatype_genetic_literature | Open Targets datatype-specific evidence score. |
| datatype_clinical | Open Targets datatype-specific evidence score. |
| datatype_rna_expression | Open Targets datatype-specific evidence score. |
| datatype_literature | Open Targets datatype-specific evidence score. |
| gwas_hit_count | Count of records or events represented by this row. |
| gwas_min_p_value | GWAS Catalog or genetics-derived field. |
| gwas_min_neg_log10_p | GWAS Catalog or genetics-derived field. |
| pubmed_pair_count | Count of records or events represented by this row. |
| disease_specific_trial_report_count | Count of records or events represented by this row. |
| max_disease_clinical_stage | Clinical development, trial, or Open Targets clinical-candidate field. |
| approved_drug | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| advanced_clinical | Clinical development, trial, or Open Targets clinical-candidate field. |
| phase1_clinical | Clinical development, trial, or Open Targets clinical-candidate field. |
| true_tractability_count | Count of records or events represented by this row. |
| tractability_modalities | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| is_essential | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| candidate_count | Count of records or events represented by this row. |
| max_any_clinical_stage | Clinical development, trial, or Open Targets clinical-candidate field. |
| prioritisation | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_available | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_gene_symbol | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_skin_or_adnexal_signal | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_immune_signal | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_drug_target_class | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_secreted_or_membrane | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| hpa_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| known_anchor_target | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| datatype_scores_json | JSON-serialized source metadata retained for auditability. |
| datasource_scores_json | JSON-serialized source metadata retained for auditability. |
| rank | Within-disease rank ordered by descending composite score. |

## `reports/tables/anchor_recovery_metrics.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| configured_anchor_count | Count of records or events represented by this row. |
| anchors_present | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| anchors_top10 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| anchors_top25 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| anchor_recall_top25 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| median_anchor_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| anchor_ranks | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/anchor_validation.csv`

| column | description |
| --- | --- |
| disease_name | Human-readable disease name. |
| anchor_gene | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| present_in_scored_targets | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| rank | Within-disease rank ordered by descending composite score. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| in_top25 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |

## `reports/tables/candidate_literature_grades.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| direct_pubmed_records | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| clinical_or_interventional_records | Clinical development, trial, or Open Targets clinical-candidate field. |
| genetic_or_omic_records | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| mechanistic_records | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| therapeutic_or_pharmacologic_records | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| recent_records_2020_or_later | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| literature_grade | A-D systematic shortlist literature grade. | Systematic evidence grade (A = strong multi-domain support with clinical evidence; B = moderate support across 2+ domains; C = limited or single-domain evidence; D = minimal or no direct literature support). Derived from automated PubMed/Entrez screening.
| literature_interpretation | PubMed/Entrez literature-derived field. | Natural-language summary of the literature evidence basis, auto-generated from PubMed/Entrez systematic screening. Describes the strength, recency, and domain coverage of published evidence linking this gene to the disease.

## `reports/tables/disease_module_summary.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| module_key | Stable key for curated dermatology biology module. |
| module_label | Human-readable dermatology biology module label. |
| member_count | Count of records or events represented by this row. |
| top_gene | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| top_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| max_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| mean_top5_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| anchor_member_count | Count of records or events represented by this row. |
| white_space_count | Count of records or events represented by this row. |
| near_field_count | Count of records or events represented by this row. |
| validated_or_late_stage_count | Count of records or events represented by this row. |

## `reports/tables/disease_summary.csv`

| column | description |
| --- | --- |
| disease_name | Human-readable disease name. |
| scored_target_count | Count of records or events represented by this row. |
| top_gene | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| top_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| top_white_space_gene | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| top_near_field_gene | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| known_anchors_configured | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| known_anchors_present | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| known_anchors_top25 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| white_space_count | Count of records or events represented by this row. |
| near_field_count | Count of records or events represented by this row. |
| validated_late_stage_count | Count of records or events represented by this row. |

## `reports/tables/leakage_sensitivity.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| baseline | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| biology_only | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| genetics_skin_only | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| no_clinical_precedence | Clinical development, trial, or Open Targets clinical-candidate field. |
| no_opentargets_association | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| translation_only | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| baseline_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| biology_only_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| genetics_skin_only_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| no_clinical_precedence_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| no_opentargets_association_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| translation_only_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| clinical_precedence_rank_delta | Clinical development, trial, or Open Targets clinical-candidate field. |
| opentargets_rank_delta | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| biology_only_rank_delta | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| clinical_precedence_sensitive | Clinical development, trial, or Open Targets clinical-candidate field. |
| opentargets_sensitive | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| biology_sensitive | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/near_field_repurposing_shortlist.csv`

| column | description |
| --- | --- |
| disease_name | Human-readable disease name. |
| rank | Within-disease rank ordered by descending composite score. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| genetics_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| skin_relevance_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| clinical_maturity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| druggability_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| novelty_gap_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| gwas_hit_count | Count of records or events represented by this row. |
| pubmed_pair_count | Count of records or events represented by this row. |
| disease_specific_trial_report_count | Count of records or events represented by this row. |

## `reports/tables/negative_control_check.csv`

| column | description |
| --- | --- |
| control_type | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| gene_symbol | Approved or source-returned gene symbol. |
| present_in_scored_targets | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| best_disease | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| best_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| best_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| appears_in_top25 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| interpretation | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/null_score_calibration.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| rank | Within-disease rank ordered by descending composite score. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| empirical_percentile_within_disease | Pipeline-derived or source-derived field; see table-specific methods and source manifest. | Percentile rank of observed score within disease-specific permutation null distribution.
| empirical_p_upper | Upper-tail empirical p-value from within-disease permuted evidence-component null scores. | Upper-tail p-value from permutation null (proportion of null scores >= observed score).
| null_iterations | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| null_score_mean | Pipeline-derived or source-derived field; see table-specific methods and source manifest. | Mean of the null distribution generated from component permutations.
| null_score_p95 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. | 95th percentile of the null distribution (threshold for significance at p < 0.05).
| passes_empirical_p05 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. | Boolean: true if observed score exceeds the 95th percentile of the null distribution (empirical p < 0.05).

## `reports/tables/rank_robustness.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| baseline_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| baseline_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| min_sensitivity_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| median_sensitivity_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| max_sensitivity_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| rank_range | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| mean_sensitivity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| robust_top10 | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| volatile_top_candidate | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/score_ablation_rankings.csv`

| column | description |
| --- | --- |
| profile | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| baseline_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| baseline_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| ablation_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| ablation_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| active_components | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/sensitivity_rankings.csv`

| column | description |
| --- | --- |
| profile | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| baseline_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| baseline_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| sensitivity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| sensitivity_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/systematic_literature_candidates.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| rank | Within-disease rank ordered by descending composite score. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| genetics_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| skin_relevance_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| clinical_maturity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| druggability_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| literature_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| novelty_gap_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |

## `reports/tables/systematic_literature_evidence.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| gene_symbol | Approved or source-returned gene symbol. |
| pubmed_id | PubMed identifier. |
| title | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| journal | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| year | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| publication_date | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| publication_types | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| source_url | Public URL for the source record or source database. |
| query_url | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| target_id | Target identifier, typically Ensembl ID when available. |
| target_name | Human-readable target name. |
| candidate_rank | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| candidate_composite_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| candidate_repurposing_category | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| evidence_class | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/target_module_assignments.csv`

| column | description |
| --- | --- |
| disease_key | Stable configured disease identifier used across tables. |
| disease_name | Human-readable disease name. |
| target_id | Target identifier, typically Ensembl ID when available. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| rank | Within-disease rank ordered by descending composite score. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| repurposing_category | Rule-based opportunity class assigned from biology, clinical maturity, druggability, and novelty. |
| known_anchor_target | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| module_key | Stable key for curated dermatology biology module. |
| module_label | Human-readable dermatology biology module label. |
| module_rationale | Curated disease-module analysis field. |

## `reports/tables/target_module_registry.csv`

| column | description |
| --- | --- |
| module_key | Stable key for curated dermatology biology module. |
| module_label | Human-readable dermatology biology module label. |
| gene_count | Count of records or events represented by this row. |
| genes | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |
| rationale | Pipeline-derived or source-derived field; see table-specific methods and source manifest. |

## `reports/tables/validated_or_late_stage_shortlist.csv`

| column | description |
| --- | --- |
| disease_name | Human-readable disease name. |
| rank | Within-disease rank ordered by descending composite score. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| genetics_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| skin_relevance_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| clinical_maturity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| druggability_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| novelty_gap_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| gwas_hit_count | Count of records or events represented by this row. |
| pubmed_pair_count | Count of records or events represented by this row. |
| disease_specific_trial_report_count | Count of records or events represented by this row. |

## `reports/tables/white_space_shortlist.csv`

| column | description |
| --- | --- |
| disease_name | Human-readable disease name. |
| rank | Within-disease rank ordered by descending composite score. |
| gene_symbol | Approved or source-returned gene symbol. |
| target_name | Human-readable target name. |
| composite_score | Primary weighted target-disease prioritization score after safety penalty. |
| genetics_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| skin_relevance_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| clinical_maturity_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| druggability_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| novelty_gap_score | Normalized score component or derived score in the 0-1 range unless otherwise specified. |
| gwas_hit_count | Count of records or events represented by this row. |
| pubmed_pair_count | Count of records or events represented by this row. |
| disease_specific_trial_report_count | Count of records or events represented by this row. |
