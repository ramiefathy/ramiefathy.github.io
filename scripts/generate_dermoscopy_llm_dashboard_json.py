#!/usr/bin/env python3
"""
Generate `site/public/data/dermoscopy-llm-eval.json` from the per-trial CSV.

This script intentionally emits an *aggregated* summary for the public dashboard
and does NOT copy raw per-trial fields like image paths, prompts, or rationales.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd


ARM_NAMES = {
    1: "Zero-shot with label list",
    2: "Few-shot with exemplars",
    3: "Primer board (exemplar per label)",
    4: "Few-shot with anti-anchoring",
    5: "Zero-shot free-form",
    6: "Few-shot free-form",
}


def wilson_interval(successes: int, n: int, z: float = 1.96) -> Tuple[Optional[float], Optional[float]]:
    if n <= 0:
        return None, None
    phat = successes / n
    denom = 1.0 + (z * z) / n
    center = (phat + (z * z) / (2.0 * n)) / denom
    half = (z * math.sqrt((phat * (1.0 - phat) + (z * z) / (4.0 * n)) / n)) / denom
    return max(0.0, center - half), min(1.0, center + half)


def snake_key(label: str) -> str:
    return label.strip().lower().replace(" ", "_").replace("-", "_")


def truthy(series: pd.Series) -> pd.Series:
    if series.dtype == bool:
        return series
    if pd.api.types.is_numeric_dtype(series.dtype):
        return series.fillna(0).astype(int) != 0
    return series.astype(str).str.lower().isin(["true", "1", "yes"])


def safe_mean(series: pd.Series) -> float:
    value = float(series.mean()) if len(series) else float("nan")
    return 0.0 if math.isnan(value) else value


def safe_sum(series: pd.Series) -> float:
    value = float(series.sum()) if len(series) else 0.0
    return value


def summarize_binary_rate(successes: int, n: int) -> Dict[str, Any]:
    rate = (successes / n) if n else 0.0
    low, high = wilson_interval(successes, n)
    return {"n": int(n), "successes": int(successes), "rate": round(rate, 6), "ci_low": low, "ci_high": high}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        default="/Users/ramiefathy/Desktop/dermoscopy_GPT/***JAAD_reply_package_optionB_AKrule_v3/all_trials_merged_scored.csv",
        help="Path to the per-trial scored CSV.",
    )
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parents[1] / "site/public/data/dermoscopy-llm-eval.json"),
        help="Output JSON path (dashboard summary).",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv).expanduser()
    out_path = Path(args.out).expanduser()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    usecols = [
        "provider",
        "model",
        "arm",
        "image_id",
        "image_key",
        "gt_parent",
        "pred_parent",
        "correct_parent",
        "error_type_parent",
        "gt_malignant_parent",
        "pred_malignant_parent",
        "gt_is_mel",
        "pred_is_mel",
        "latency_seconds",
        "total_tokens",
        "cost_estimate_usd",
    ]

    df = pd.read_csv(csv_path, usecols=usecols)

    # Normalize / coerce booleans.
    df["correct_parent"] = truthy(df["correct_parent"]).astype(bool)
    df["gt_malignant_parent"] = truthy(df["gt_malignant_parent"]).astype(bool)
    df["pred_malignant_parent"] = truthy(df["pred_malignant_parent"]).astype(bool)
    df["gt_is_mel"] = truthy(df["gt_is_mel"]).astype(bool)
    df["pred_is_mel"] = truthy(df["pred_is_mel"]).astype(bool)

    # Basic counts.
    total_trials = int(len(df))
    unique_images = int(df["image_id"].nunique())
    unique_models = int(df["model"].nunique())
    prompting_arms = int(df["arm"].nunique())

    # Overall stats.
    total_correct = int(df["correct_parent"].sum())
    overall_accuracy = total_correct / total_trials if total_trials else 0.0

    # Malignant sensitivity / benign specificity (binary).
    mal = df["gt_malignant_parent"]
    pred_mal = df["pred_malignant_parent"]
    tp = int(((mal == True) & (pred_mal == True)).sum())
    fn = int(((mal == True) & (pred_mal == False)).sum())
    tn = int(((mal == False) & (pred_mal == False)).sum())
    fp = int(((mal == False) & (pred_mal == True)).sum())

    malignant_sens = tp / (tp + fn) if (tp + fn) else 0.0
    benign_spec = tn / (tn + fp) if (tn + fp) else 0.0

    total_cost_usd = safe_sum(df["cost_estimate_usd"])
    mean_latency = safe_mean(df["latency_seconds"])
    mean_tokens = safe_mean(df["total_tokens"])

    # By-model summary.
    model_summary: List[Dict[str, Any]] = []

    for (provider, model), group in df.groupby(["provider", "model"], sort=False):
        n = int(len(group))
        correct = int(group["correct_parent"].sum())
        acc = correct / n if n else 0.0
        acc_ci_low, acc_ci_high = wilson_interval(correct, n)

        g_mal = group["gt_malignant_parent"]
        g_pred_mal = group["pred_malignant_parent"]
        tp_m = int(((g_mal == True) & (g_pred_mal == True)).sum())
        fn_m = int(((g_mal == True) & (g_pred_mal == False)).sum())
        tn_m = int(((g_mal == False) & (g_pred_mal == False)).sum())
        fp_m = int(((g_mal == False) & (g_pred_mal == True)).sum())
        sens = tp_m / (tp_m + fn_m) if (tp_m + fn_m) else 0.0
        spec = tn_m / (tn_m + fp_m) if (tn_m + fp_m) else 0.0
        sens_ci_low, sens_ci_high = wilson_interval(tp_m, tp_m + fn_m)
        spec_ci_low, spec_ci_high = wilson_interval(tn_m, tn_m + fp_m)

        g_mel = group["gt_is_mel"]
        g_pred_mel = group["pred_is_mel"]
        tp_mel = int(((g_mel == True) & (g_pred_mel == True)).sum())
        fn_mel = int(((g_mel == True) & (g_pred_mel == False)).sum())
        tn_mel = int(((g_mel == False) & (g_pred_mel == False)).sum())
        fp_mel = int(((g_mel == False) & (g_pred_mel == True)).sum())
        mel_sens = tp_mel / (tp_mel + fn_mel) if (tp_mel + fn_mel) else 0.0
        mel_spec = tn_mel / (tn_mel + fp_mel) if (tn_mel + fp_mel) else 0.0
        mel_ppv = tp_mel / (tp_mel + fp_mel) if (tp_mel + fp_mel) else 0.0
        mel_npv = tn_mel / (tn_mel + fn_mel) if (tn_mel + fn_mel) else 0.0
        mel_sens_ci_low, mel_sens_ci_high = wilson_interval(tp_mel, tp_mel + fn_mel)
        mel_spec_ci_low, mel_spec_ci_high = wilson_interval(tn_mel, tn_mel + fp_mel)

        mean_latency_s = safe_mean(group["latency_seconds"])
        mean_cost_usd = safe_mean(group["cost_estimate_usd"])
        total_cost_model = safe_sum(group["cost_estimate_usd"])
        mean_tokens_model = safe_mean(group["total_tokens"])
        other_count = int((group["pred_parent"].astype(str) == "other").sum())
        other_rate = other_count / n if n else 0.0
        cost_per_correct_usd = (total_cost_model / correct) if correct else None
        total_tokens_model = int(group["total_tokens"].sum()) if len(group) else 0

        model_summary.append(
            {
                "model": model,
                "provider": provider,
                "n_trials": n,
                "correct": correct,
                "accuracy": round(acc, 6),
                "accuracy_ci_low": acc_ci_low,
                "accuracy_ci_high": acc_ci_high,
                "sensitivity": round(sens, 6),
                "sensitivity_ci_low": sens_ci_low,
                "sensitivity_ci_high": sens_ci_high,
                "specificity": round(spec, 6),
                "specificity_ci_low": spec_ci_low,
                "specificity_ci_high": spec_ci_high,
                "mal_tp": tp_m,
                "mal_fn": fn_m,
                "mal_tn": tn_m,
                "mal_fp": fp_m,
                "mel_sensitivity": round(mel_sens, 6),
                "mel_sensitivity_ci_low": mel_sens_ci_low,
                "mel_sensitivity_ci_high": mel_sens_ci_high,
                "mel_specificity": round(mel_spec, 6),
                "mel_specificity_ci_low": mel_spec_ci_low,
                "mel_specificity_ci_high": mel_spec_ci_high,
                "mel_ppv": round(mel_ppv, 6),
                "mel_npv": round(mel_npv, 6),
                "mel_tp": tp_mel,
                "mel_fn": fn_mel,
                "mel_tn": tn_mel,
                "mel_fp": fp_mel,
                "other_count": other_count,
                "other_rate": round(other_rate, 6),
                "mean_latency": round(mean_latency_s, 6),
                "mean_cost": round(mean_cost_usd, 8),
                "total_cost": round(total_cost_model, 2),
                "mean_tokens": int(round(mean_tokens_model)),
                "total_tokens": total_tokens_model,
                "cost_per_correct_usd": round(cost_per_correct_usd, 8) if isinstance(cost_per_correct_usd, float) else None,
            }
        )

    model_summary.sort(key=lambda row: row.get("accuracy", 0.0), reverse=True)

    # Arm summary (across all models).
    arm_summary: List[Dict[str, Any]] = []
    for arm, group in df.groupby("arm", sort=True):
        arm_int = int(arm)
        n = int(len(group))
        correct = int(group["correct_parent"].sum())
        acc = correct / n if n else 0.0
        low, high = wilson_interval(correct, n)
        arm_summary.append(
            {"arm": arm_int, "name": ARM_NAMES.get(arm_int, f"Arm {arm_int}"), "accuracy": round(acc, 6), "n_trials": n, "accuracy_ci_low": low, "accuracy_ci_high": high}
        )

    # Diagnosis summaries (ground truth parent labels).
    diagnosis_summary: List[Dict[str, Any]] = []
    diagnoses: List[str] = []

    for gt_parent, group in df.groupby("gt_parent", sort=False):
        gt = str(gt_parent)
        diagnoses.append(gt)
        n = int(len(group))
        correct = int(group["correct_parent"].sum())
        acc = correct / n if n else 0.0

        is_malignant = bool(group["gt_malignant_parent"].iloc[0]) if len(group) else False
        low, high = wilson_interval(correct, n)
        diagnosis_summary.append(
            {
                "diagnosis": gt,
                "is_malignant": is_malignant,
                "n_samples": n,
                "accuracy": round(acc, 6),
                "accuracy_ci_low": low,
                "accuracy_ci_high": high,
            }
        )

    # Keep diagnosis order stable (use existing expected order if present).
    diagnoses_sorted = sorted(diagnoses)

    # Model × Arm accuracy matrix (for heatmap).
    model_arm_matrix: List[Dict[str, Any]] = []
    model_arm_tradeoffs: List[Dict[str, Any]] = []

    for model, group_model in df.groupby("model", sort=False):
        row: Dict[str, Any] = {"model": model}
        for arm, group_arm in group_model.groupby("arm", sort=True):
            arm_int = int(arm)
            n = int(len(group_arm))
            correct = int(group_arm["correct_parent"].sum())
            acc = correct / n if n else 0.0
            row[f"arm{arm_int}"] = round(acc, 6)

            model_arm_tradeoffs.append(
                {
                    "model": model,
                    "arm": arm_int,
                    "n_trials": n,
                    "correct": correct,
                    "accuracy": round(acc, 6),
                    "mean_latency": round(safe_mean(group_arm["latency_seconds"]), 6),
                    "mean_tokens": int(round(safe_mean(group_arm["total_tokens"]))),
                    "mean_cost": round(safe_mean(group_arm["cost_estimate_usd"]), 8),
                }
            )
        model_arm_matrix.append(row)

    # Model × Diagnosis accuracy matrix (snake_case keys) + also emit counts-by-model-diagnosis for CI.
    model_diag_matrix: List[Dict[str, Any]] = []
    model_diag_counts: List[Dict[str, Any]] = []
    diag_key_map = {diag: snake_key(diag) for diag in diagnoses_sorted}

    for model, group_model in df.groupby("model", sort=False):
        row: Dict[str, Any] = {"model": model}
        for gt_parent, group_diag in group_model.groupby("gt_parent", sort=False):
            gt = str(gt_parent)
            key = diag_key_map.get(gt, snake_key(gt))
            n = int(len(group_diag))
            correct = int(group_diag["correct_parent"].sum())
            acc = correct / n if n else 0.0
            row[key] = round(acc, 6)
            model_diag_counts.append({"model": model, "diagnosis": gt, "key": key, "n_trials": n, "correct": correct, "accuracy": round(acc, 6)})
        model_diag_matrix.append(row)

    # Error distributions.
    error_distribution = [{"type": str(k), "count": int(v)} for k, v in df["error_type_parent"].value_counts().items()]
    error_by_model: List[Dict[str, Any]] = []
    error_by_model_diag: List[Dict[str, Any]] = []

    for (model, err_type), group in df.groupby(["model", "error_type_parent"], sort=False):
        error_by_model.append({"model": model, "type": str(err_type), "count": int(len(group))})

    for (model, gt_parent, err_type), group in df.groupby(["model", "gt_parent", "error_type_parent"], sort=False):
        error_by_model_diag.append({"model": model, "gt_parent": str(gt_parent), "type": str(err_type), "count": int(len(group))})

    # Confusion matrices.
    confusion_matrix = (
        df.groupby(["gt_parent", "pred_parent"], sort=False)
        .size()
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    confusion_by_model = (
        df.groupby(["model", "gt_parent", "pred_parent"], sort=False)
        .size()
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    # Latency distribution per model.
    latency_data: List[Dict[str, Any]] = []
    for model, group in df.groupby("model", sort=False):
        series = group["latency_seconds"]
        latency_data.append(
            {
                "model": model,
                "mean": round(float(series.mean()), 6),
                "std": round(float(series.std(ddof=0)), 6) if len(series) else 0.0,
                "min": round(float(series.min()), 6) if len(series) else 0.0,
                "max": round(float(series.max()), 6) if len(series) else 0.0,
                "median": round(float(series.median()), 6) if len(series) else 0.0,
            }
        )

    # Cost vs performance (use cents for the dashboard axis).
    cost_performance: List[Dict[str, Any]] = []
    for row in model_summary:
        cost_cents = float(row["mean_cost"]) * 100.0
        cost_performance.append(
            {
                "model": row["model"],
                "provider": row["provider"],
                "accuracy": row["accuracy"],
                "cost": round(cost_cents, 6),
                "latency": row["mean_latency"],
            }
        )

    overall_stats = {
        "totalTrials": total_trials,
        "uniqueImages": unique_images,
        "uniqueModels": unique_models,
        "promptingArms": prompting_arms,
        "overallAccuracy": round(overall_accuracy, 4),
        "overallAccuracy_ci_low": wilson_interval(total_correct, total_trials)[0],
        "overallAccuracy_ci_high": wilson_interval(total_correct, total_trials)[1],
        "malignantSensitivity": round(malignant_sens, 4),
        "malignantSensitivity_ci_low": wilson_interval(tp, tp + fn)[0],
        "malignantSensitivity_ci_high": wilson_interval(tp, tp + fn)[1],
        "benignSpecificity": round(benign_spec, 4),
        "benignSpecificity_ci_low": wilson_interval(tn, tn + fp)[0],
        "benignSpecificity_ci_high": wilson_interval(tn, tn + fp)[1],
        "totalCost": round(total_cost_usd, 2),
        "meanLatency": round(mean_latency, 2),
        "meanTokens": int(round(mean_tokens)),
    }

    # Case-level correctness bitmasks per model×arm for head-to-head comparisons.
    # We only keep per-image correctness (no identifiers beyond ordered indices).
    image_order = sorted(df["image_id"].unique().tolist())
    image_index = {img: idx for idx, img in enumerate(image_order)}

    correct_by_model_arm: List[Dict[str, Any]] = []
    for (model, arm), group in df.groupby(["model", "arm"], sort=False):
        arr = ["0"] * len(image_order)
        for _, row in group.iterrows():
            idx = image_index.get(row["image_id"])
            if idx is None:
                continue
            arr[idx] = "1" if bool(row["correct_parent"]) else "0"
        correct_by_model_arm.append({"model": model, "arm": int(arm), "correct_bits": "".join(arr)})

    payload: Dict[str, Any] = {
        "overallStats": overall_stats,
        "diagnoses": diagnoses_sorted,
        "diagnosisSummary": diagnosis_summary,
        "armSummary": arm_summary,
        "modelSummary": model_summary,
        "modelArmMatrix": model_arm_matrix,
        "modelArmTradeoffs": model_arm_tradeoffs,
        "modelDiagMatrix": model_diag_matrix,
        "modelDiagCounts": model_diag_counts,
        "errorDistribution": error_distribution,
        "errorByModel": error_by_model,
        "errorByModelDiagnosis": error_by_model_diag,
        "confusionMatrix": confusion_matrix,
        "confusionByModel": confusion_by_model,
        "costPerformance": cost_performance,
        "latencyData": latency_data,
        "cases": {
            "count": len(image_order),
            "correctByModelArm": correct_by_model_arm,
        },
    }

    out_path.write_text(json.dumps(payload, indent=2, sort_keys=False))
    print(f"Wrote {out_path} ({out_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
