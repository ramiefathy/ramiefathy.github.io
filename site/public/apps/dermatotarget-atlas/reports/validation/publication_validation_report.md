# Publication Validation Report

## Purpose

This validation layer tests whether DermatoTarget Atlas rankings are robust to evidence-source ablation, whether top scores exceed a within-disease empirical null, and whether known anchors and negative controls behave as expected.

## Key Metrics

| metric | value |
| --- | --- |
| scored target-disease pairs | 600 |
| ablation profiles | 6 |
| null permutations per disease | 500 |
| empirical p<=0.05 pairs | 62 |
| clinical-precedence-sensitive top candidates | 29 |
| negative controls in top 25 | 3 |

## Anchor Recovery

| disease_key | disease_name | configured_anchor_count | anchors_present | anchors_top10 | anchors_top25 | anchor_recall_top25 | median_anchor_rank | anchor_ranks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| psoriasis | Psoriasis | 9 | 9 | 4 | 7 | 0.778 | 16.000 | 1,2,4,5,16,17,20,32,48 |
| atopic_dermatitis | Atopic dermatitis | 9 | 7 | 2 | 7 | 0.778 | 14.000 | 1,9,13,14,16,17,21 |
| hidradenitis_suppurativa | Hidradenitis suppurativa | 6 | 6 | 5 | 6 | 1.000 | 6.000 | 3,4,5,7,10,14 |
| vitiligo | Vitiligo | 6 | 3 | 1 | 3 | 0.500 | 11.000 | 1,11,14 |
| alopecia_areata | Alopecia areata | 6 | 5 | 5 | 5 | 0.833 | 6.000 | 1,2,6,8,10 |
| cutaneous_lupus_erythematosus | Cutaneous lupus erythematosus | 6 | 4 | 2 | 4 | 0.667 | 13.000 | 3,4,22,24 |

## Strongest Empirical Null Signals

| disease_name | rank | gene_symbol | composite_score | empirical_percentile_within_disease | empirical_p_upper |
| --- | --- | --- | --- | --- | --- |
| Vitiligo | 1 | TYR | 0.816 | 1.000 | 0.000 |
| Atopic dermatitis | 1 | IL13 | 0.776 | 1.000 | 0.000 |
| Alopecia areata | 1 | CTLA4 | 0.698 | 1.000 | 0.000 |
| Alopecia areata | 2 | IL2RA | 0.691 | 0.990 | 0.000 |
| Psoriasis | 1 | IL12B | 0.814 | 1.000 | 0.000 |
| Hidradenitis suppurativa | 1 | PSEN1 | 0.663 | 1.000 | 0.001 |
| Cutaneous lupus erythematosus | 1 | SAMHD1 | 0.626 | 1.000 | 0.001 |
| Hidradenitis suppurativa | 2 | NCSTN | 0.626 | 0.990 | 0.001 |
| Alopecia areata | 3 | IL13 | 0.601 | 0.980 | 0.002 |
| Cutaneous lupus erythematosus | 2 | TREX1 | 0.563 | 0.990 | 0.003 |
| Psoriasis | 2 | TYK2 | 0.764 | 0.990 | 0.003 |
| Atopic dermatitis | 2 | IL6R | 0.694 | 0.990 | 0.003 |
| Alopecia areata | 4 | ITK | 0.575 | 0.970 | 0.003 |
| Alopecia areata | 5 | TEC | 0.575 | 0.970 | 0.003 |
| Cutaneous lupus erythematosus | 3 | TLR7 | 0.544 | 0.980 | 0.004 |
| Vitiligo | 2 | IL2RA | 0.635 | 0.990 | 0.005 |
| Hidradenitis suppurativa | 3 | PSENEN | 0.574 | 0.980 | 0.005 |
| Psoriasis | 3 | TRAF3IP2 | 0.747 | 0.980 | 0.006 |
| Hidradenitis suppurativa | 4 | TNF | 0.560 | 0.970 | 0.007 |
| Atopic dermatitis | 3 | IL22 | 0.669 | 0.980 | 0.007 |

## Candidate Leakage Flags

| disease_name | gene_symbol | baseline | no_clinical_precedence | clinical_precedence_rank_delta | repurposing_category |
| --- | --- | --- | --- | --- | --- |
| Atopic dermatitis | TYK2 | 15 | 61 | 46 | validated_or_late_stage |
| Atopic dermatitis | JAK3 | 14 | 57 | 43 | validated_or_late_stage |
| Atopic dermatitis | JAK2 | 13 | 55 | 42 | validated_or_late_stage |
| Vitiligo | TYK2 | 15 | 54 | 39 | validated_or_late_stage |
| Vitiligo | JAK1 | 14 | 52 | 38 | validated_or_late_stage |
| Atopic dermatitis | PDE4D | 12 | 50 | 38 | validated_or_late_stage |
| Atopic dermatitis | IL31RA | 10 | 45 | 35 | validated_or_late_stage |
| Vitiligo | JAK2 | 11 | 44 | 33 | validated_or_late_stage |
| Atopic dermatitis | IL4R | 9 | 42 | 33 | validated_or_late_stage |
| Psoriasis | AHR | 13 | 45 | 32 | validated_or_late_stage |
| Vitiligo | JAK3 | 9 | 40 | 31 | validated_or_late_stage |
| Psoriasis | NR3C1 | 10 | 40 | 30 | validated_or_late_stage |
| Cutaneous lupus erythematosus | CLEC4C | 12 | 39 | 27 | validated_or_late_stage |
| Alopecia areata | TYK2 | 11 | 38 | 27 | validated_or_late_stage |
| Atopic dermatitis | NR3C1 | 6 | 33 | 27 | validated_or_late_stage |
| Atopic dermatitis | TNFSF4 | 4 | 31 | 27 | validated_or_late_stage |
| Cutaneous lupus erythematosus | PDE4A | 15 | 41 | 26 | validated_or_late_stage |
| Alopecia areata | JAK1 | 10 | 36 | 26 | validated_or_late_stage |
| Psoriasis | PDE4A | 8 | 31 | 23 | validated_or_late_stage |
| Psoriasis | IL1RL2 | 11 | 34 | 23 | validated_or_late_stage |

## Negative-Control Check

| control_type | gene_symbol | present_in_scored_targets | best_disease | best_rank | best_composite_score | appears_in_top25 | interpretation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| housekeeping_gene | ACTB | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | GAPDH | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | RPLP0 | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | RPS18 | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | TUBB | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | B2M | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | HPRT1 | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | PGK1 | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | LDHA | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| housekeeping_gene | HSP90AA1 | False |  | nan | nan | False | not retrieved among scored target-disease pairs |
| low_prior_internal | 85 low-prior targets | True | Alopecia areata | 12.000 | 0.492 | True | internal low-prior targets should rarely dominate top ranks |
| low_prior_internal | 29 low-prior targets | True | Atopic dermatitis | 30.000 | 0.453 | False | internal low-prior targets should rarely dominate top ranks |
| low_prior_internal | 66 low-prior targets | True | Cutaneous lupus erythematosus | 9.000 | 0.462 | True | internal low-prior targets should rarely dominate top ranks |
| low_prior_internal | 15 low-prior targets | True | Hidradenitis suppurativa | 64.000 | 0.290 | False | internal low-prior targets should rarely dominate top ranks |
| low_prior_internal | 7 low-prior targets | True | Psoriasis | 63.000 | 0.389 | False | internal low-prior targets should rarely dominate top ranks |
| low_prior_internal | 50 low-prior targets | True | Vitiligo | 23.000 | 0.460 | True | internal low-prior targets should rarely dominate top ranks |

## Interpretation

A candidate is more submission-ready when it remains high ranked after removing clinical/literature precedence, has a low empirical upper-tail p-value under permuted evidence components, and is supported by anchor recovery without recurrent high-ranked negative controls. Sensitive candidates are retained as hypotheses but should be described as evidence-source dependent.
