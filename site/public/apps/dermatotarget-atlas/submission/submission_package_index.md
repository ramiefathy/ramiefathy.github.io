# Web Dashboard Package Index

This index describes the static DermatoTarget Atlas dashboard bundle deployed with `ramiefathy.github.io` at `/apps/dermatotarget-atlas/`. It does not claim to be the complete reproducible analysis repository; it contains derived dashboard data and publication materials suitable for web review.

## Core Submission Files

| artifact | relative_path | artifact_type | description |
| --- | --- | --- | --- |
| title page | submission/title_page.md | manuscript_material | Title page and author metadata |
| manuscript | submission/manuscript.md | manuscript_material | Main manuscript text |
| cover letter | submission/cover_letter.md | manuscript_material | Journal cover letter draft |
| data/code availability | submission/data_code_availability.md | manuscript_material | Web-bundle-aware data/code availability statement |
| data dictionary | submission/data_dictionary.md | manuscript_material | Field definitions for source-study tables |
| reporting checklist | submission/reporting_checklist.md | manuscript_material | Reporting checklist |
| supplementary methods | submission/supplementary_methods.md | manuscript_material | Supplementary methods |
| validation report | reports/validation/publication_validation_report.md | report | Publication validation report |
| publication PDF | publication_pdf/DermatoTarget_Atlas_publication_package_2026-06-03.pdf | pdf | Compiled publication-ready package |

## Dashboard Data Bundles

| artifact | relative_path | artifact_type | description |
| --- | --- | --- | --- |
| meta | data/meta.json | dashboard_json | Study metadata, row counts, scoring weights, source URLs, validation flags, figure captions |
| diseases | data/diseases.json | dashboard_json | Disease summaries and disease-module signals |
| targets | data/targets.json | dashboard_json | Scored target-disease pairs with component scores and readiness caveats |
| validation | data/validation.json | dashboard_json | Anchor recovery, empirical null signals, leakage sensitivity, and negative controls |
| modules | data/modules.json | dashboard_json | Curated module registry and target-module assignments |
| shortlists | data/shortlists.json | dashboard_json | White-space, near-field, and validated/late-stage candidate tables |
| literature | data/literature.json | dashboard_json | Systematic PubMed shortlist evidence grades |
| drug candidates | data/drug_candidates.json | dashboard_json | Interned target-drug candidate table for virtualized browsing |

## Figure Assets

| artifact | relative_path | artifact_type | description |
| --- | --- | --- | --- |
| ablation rank stability | figures/ablation_rank_stability.png | figure | Rank stability under evidence-source ablations |
| anchor recovery by disease | figures/anchor_recovery_by_disease.png | figure | Known-anchor recovery within top-10 and top-25 by disease |
| clinical trial mechanism landscape | figures/clinical_trial_mechanism_landscape.png | figure | Clinical-trial mechanism landscape across diseases |
| composite score distribution | figures/composite_score_distribution.png | figure | Composite score distribution within each disease |
| cross-disease target heatmap | figures/cross_disease_target_heatmap.png | figure | Cross-disease composite scores for recurrent top targets |
| disease module heatmap | figures/disease_module_heatmap.png | figure | Curated dermatology module signal by disease |
| null score calibration | figures/null_score_calibration.png | figure | Observed top scores vs. permutation-derived empirical null |
| repurposing opportunity quadrant | figures/repurposing_opportunity_quadrant.png | figure | Druggability/clinical maturity vs. genetic/skin support |
| sensitivity rank robustness | figures/sensitivity_rank_robustness.png | figure | Rank robustness under leakage/sensitivity perturbations |
| top target evidence components | figures/top_target_evidence_components.png | figure | Score decomposition for top targets per disease |

## Not Bundled Here

The static website app intentionally omits the source-study Python package, request cache, raw source extracts, normalized CSV/Parquet tables, and generated report tables. Those belong to the reproducible study workspace, while this directory is the deployed web presentation bundle.
