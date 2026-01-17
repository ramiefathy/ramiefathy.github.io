import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ARM_KEYS, ARM_NAMES, DATA_URL, DIAG_KEYS, DIAG_LABELS, ERROR_TYPE_META, PROVIDER_COLORS } from './dermoscopy-dashboard/constants.js';
import { clamp, formatCents, formatNumber, formatPercent, formatUSD, getProviderPalette, safeDivide, shortModelName, wilsonInterval } from './dermoscopy-dashboard/formatters.js';
import { useMountAnimationReady } from './dermoscopy-dashboard/hooks.js';

function StatCard({ value, label, tone = 'neutral', format = 'number' }) {
  const formatted = useMemo(() => {
    if (format === 'percent') return formatPercent(value, 1);
    if (format === 'currency') return typeof value === 'number' ? `$${value.toFixed(2)}` : '–';
    if (format === 'usd') return typeof value === 'number' ? formatUSD(value, 2) : '–';
    if (format === 'cents') return typeof value === 'number' ? formatCents(value, 1) : '–';
    if (format === 'seconds') return typeof value === 'number' ? `${value.toFixed(1)}s` : '–';
    return formatNumber(value);
  }, [value, format]);

  return (
    <div className={`llm-dashboard__stat llm-dashboard__stat--${tone}`}>
      <div className="llm-dashboard__stat-value">{formatted}</div>
      <div className="llm-dashboard__stat-label">{label}</div>
    </div>
  );
}

function BarList({ items, maxValue, valueFormatter = (value) => formatPercent(value, 1) }) {
  const animationReady = useMountAnimationReady();
  const derivedMax = useMemo(() => {
    if (typeof maxValue === 'number' && maxValue > 0) return maxValue;
    return Math.max(1, ...items.map((item) => (typeof item.value === 'number' ? item.value : 0)));
  }, [items, maxValue]);

  return (
    <div className="llm-dashboard__bar-list">
      {items.map((item) => {
        const width = derivedMax ? clamp((item.value / derivedMax) * 100, 0, 100) : 0;
        const animatedWidth = animationReady ? `${width}%` : '0%';
        return (
          <div key={item.key || item.label} className="llm-dashboard__bar-row">
            <div className="llm-dashboard__bar-meta">
              <span className="llm-dashboard__bar-label">{item.label}</span>
              <span className="llm-dashboard__bar-value">{valueFormatter(item.value, item)}</span>
            </div>
            <div className="llm-dashboard__bar-track" aria-hidden="true">
              <div className="llm-dashboard__bar-fill" style={{ width: animatedWidth, background: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CIBarList({
  items,
  maxValue = 1,
  valueFormatter = (value) => formatPercent(value, 1),
  showCILabel = true
}) {
  const animationReady = useMountAnimationReady();
  const derivedMax = useMemo(() => {
    if (typeof maxValue === 'number' && maxValue > 0) return maxValue;
    return Math.max(1, ...items.map((item) => (typeof item.value === 'number' ? item.value : 0)));
  }, [items, maxValue]);

  if (!items.length) {
    return (
      <div className="llm-dashboard__empty">
        <h3>No data</h3>
        <p>Adjust filters to render this figure.</p>
      </div>
    );
  }

  return (
    <div className="llm-dashboard__ci-list" role="list">
      {items.map((item) => {
        const value = typeof item.value === 'number' ? item.value : 0;
        const width = derivedMax ? clamp((value / derivedMax) * 100, 0, 100) : 0;
        const animatedWidth = animationReady ? `${width}%` : '0%';
        const ciLow = typeof item.ciLow === 'number' ? item.ciLow : null;
        const ciHigh = typeof item.ciHigh === 'number' ? item.ciHigh : null;
        const ciLeft = ciLow !== null ? clamp((ciLow / derivedMax) * 100, 0, 100) : null;
        const ciRight = ciHigh !== null ? clamp((ciHigh / derivedMax) * 100, 0, 100) : null;
        const ciWidth = ciLeft !== null && ciRight !== null ? Math.max(0, ciRight - ciLeft) : null;

        return (
          <div key={item.key || item.label} className="llm-dashboard__ci-row" role="listitem">
            <div className="llm-dashboard__ci-label">
              <span className="llm-dashboard__ci-label-main">{item.label}</span>
              {item.subtitle && <span className="llm-dashboard__ci-label-sub">{item.subtitle}</span>}
            </div>

            <div className="llm-dashboard__ci-track" aria-hidden="true">
              <div className="llm-dashboard__ci-fill" style={{ width: animatedWidth, background: item.color }} />
              {ciLeft !== null && ciWidth !== null && (
                <div className="llm-dashboard__ci-error" style={{ left: `${ciLeft}%`, width: `${ciWidth}%` }}>
                  <span className="llm-dashboard__ci-cap llm-dashboard__ci-cap--left" />
                  <span className="llm-dashboard__ci-cap llm-dashboard__ci-cap--right" />
                </div>
              )}
            </div>

            <div className="llm-dashboard__ci-value">
              <span>{valueFormatter(value, item)}</span>
              {showCILabel && ciLow !== null && ciHigh !== null && (
                <span className="llm-dashboard__ci-value-sub">
                  95% CI {valueFormatter(ciLow, item)}–{valueFormatter(ciHigh, item)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PairedBarList({
  rows,
  aLabel,
  bLabel,
  aColor = 'rgba(220,38,38,0.92)',
  bColor = 'rgba(37,99,235,0.92)',
  maxValue = 1,
  valueFormatter = (value) => formatPercent(value, 1),
  markerValue
}) {
  if (!rows.length) {
    return (
      <div className="llm-dashboard__empty">
        <h3>No data</h3>
        <p>Adjust filters to render this figure.</p>
      </div>
    );
  }

  return (
    <div className="llm-dashboard__paired">
      <div className="llm-dashboard__paired-legend">
        <span className="llm-dashboard__legend-item">
          <span className="llm-dashboard__legend-swatch" style={{ background: aColor }} /> {aLabel}
        </span>
        <span className="llm-dashboard__legend-item">
          <span className="llm-dashboard__legend-swatch" style={{ background: bColor }} /> {bLabel}
        </span>
      </div>
      <div className="llm-dashboard__paired-list">
        {rows.map((row) => (
          <div key={row.key} className="llm-dashboard__paired-row">
            <div className="llm-dashboard__paired-label">{row.label}</div>
            <div className="llm-dashboard__paired-bars">
              <div className="llm-dashboard__paired-track" aria-label={`${aLabel} ${valueFormatter(row.a)}`}>
                {typeof markerValue === 'number' && (
                  <span className="llm-dashboard__paired-marker" style={{ left: `${clamp((markerValue / maxValue) * 100, 0, 100)}%` }} />
                )}
                <div className="llm-dashboard__paired-fill" style={{ width: `${clamp((row.a / maxValue) * 100, 0, 100)}%`, background: row.aColor || aColor }} />
              </div>
              <div className="llm-dashboard__paired-track" aria-label={`${bLabel} ${valueFormatter(row.b)}`}>
                {typeof markerValue === 'number' && (
                  <span className="llm-dashboard__paired-marker" style={{ left: `${clamp((markerValue / maxValue) * 100, 0, 100)}%` }} />
                )}
                <div className="llm-dashboard__paired-fill" style={{ width: `${clamp((row.b / maxValue) * 100, 0, 100)}%`, background: row.bColor || bColor }} />
              </div>
            </div>
            <div className="llm-dashboard__paired-values">
              <span style={{ color: row.aColor || aColor }}>{valueFormatter(row.a)}</span>
              <span style={{ color: row.bColor || bColor }}>{valueFormatter(row.b)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBarList({ rows, totalLabel = 'Total', segmentLabel = 'Share', valueFormatter = (value) => formatNumber(value) }) {
  if (!rows.length) {
    return (
      <div className="llm-dashboard__empty">
        <h3>No data</h3>
        <p>Adjust filters to render this figure.</p>
      </div>
    );
  }

  return (
    <div className="llm-dashboard__stacked-list">
      {rows.map((row) => {
        const total = row.total || row.segments.reduce((sum, seg) => sum + (seg.value ?? 0), 0);
        return (
          <div key={row.key} className="llm-dashboard__stacked-row">
            <div className="llm-dashboard__stacked-head">
              <span className="llm-dashboard__stacked-label">{row.label}</span>
              <span className="llm-dashboard__stacked-total">
                {totalLabel}: <strong>{valueFormatter(total)}</strong>
              </span>
            </div>
            <div className="llm-dashboard__stacked-track" aria-label={`${segmentLabel} for ${row.label}`}>
              {row.segments.map((seg) => {
                const width = total ? clamp((seg.value / total) * 100, 0, 100) : 0;
                return <span key={seg.key} className="llm-dashboard__stacked-segment" style={{ width: `${width}%`, background: seg.color }} title={`${seg.label}: ${formatNumber(seg.value)} (${width.toFixed(1)}%)`} />;
              })}
            </div>
            <div className="llm-dashboard__stacked-legend">
              {row.segments.map((seg) => (
                <span key={seg.key} className="llm-dashboard__stacked-legend-item">
                  <span className="llm-dashboard__stacked-swatch" style={{ background: seg.color }} />
                  {seg.label}: {formatNumber(seg.value)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScatterPlot({
  points,
  xLabel,
  yLabel,
  xFormatter = (v) => String(v),
  yFormatter = (v) => String(v),
  xTooltipLabel = xLabel,
  yTooltipLabel = yLabel,
  xTooltipFormatter,
  yTooltipFormatter
}) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [activePoint, setActivePoint] = useState(null);

  const chart = useMemo(() => {
    const xValues = points.map((p) => p.x).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    const yValues = points.map((p) => p.y).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (!xValues.length || !yValues.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xPad = (xMax - xMin) * 0.12 || 1;
    const yPad = (yMax - yMin) * 0.12 || 0.01;

    return {
      xMin: xMin - xPad,
      xMax: xMax + xPad,
      yMin: Math.max(0, yMin - yPad),
      yMax: Math.min(1, yMax + yPad)
    };
  }, [points]);

  const dims = { width: 720, height: 420, padding: 54 };

  const scaleX = useMemo(() => {
    const span = chart.xMax - chart.xMin || 1;
    return (x) => dims.padding + ((x - chart.xMin) / span) * (dims.width - dims.padding * 2);
  }, [chart.xMax, chart.xMin]);

  const scaleY = useMemo(() => {
    const span = chart.yMax - chart.yMin || 1;
    return (y) => dims.height - dims.padding - ((y - chart.yMin) / span) * (dims.height - dims.padding * 2);
  }, [chart.yMax, chart.yMin]);

  const ticks = useMemo(() => {
    const count = 5;
    const xs = Array.from({ length: count }, (_, idx) => chart.xMin + (idx / (count - 1)) * (chart.xMax - chart.xMin));
    const ys = Array.from({ length: count }, (_, idx) => chart.yMin + (idx / (count - 1)) * (chart.yMax - chart.yMin));
    return { xs, ys };
  }, [chart.xMax, chart.xMin, chart.yMax, chart.yMin]);

  const tooltip = useMemo(() => {
    if (!activePoint) return null;
    const x = scaleX(activePoint.x);
    const y = scaleY(activePoint.y);
    return { x, y, point: activePoint };
  }, [activePoint, scaleX, scaleY]);

  const handleLeave = () => setActivePoint(null);

  return (
    <div className="llm-dashboard__scatter" ref={containerRef} onPointerLeave={handleLeave}>
      <svg viewBox={`0 0 ${dims.width} ${dims.height}`} role="img" aria-label={`${yLabel} vs ${xLabel}`}>
        <defs>
          <linearGradient id="llm-scatter-axis" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(56,189,248,0.75)" />
            <stop offset="100%" stopColor="rgba(15,118,110,0.65)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={dims.width} height={dims.height} rx="18" fill="rgba(255,255,255,0.55)" />

        <g stroke="rgba(148,163,184,0.22)" strokeWidth="1">
          {ticks.xs.map((tick) => {
            const x = scaleX(tick);
            return <line key={tick} x1={x} x2={x} y1={dims.padding} y2={dims.height - dims.padding} />;
          })}
          {ticks.ys.map((tick) => {
            const y = scaleY(tick);
            return <line key={tick} x1={dims.padding} x2={dims.width - dims.padding} y1={y} y2={y} />;
          })}
        </g>

        <line x1={dims.padding} x2={dims.width - dims.padding} y1={dims.height - dims.padding} y2={dims.height - dims.padding} stroke="url(#llm-scatter-axis)" strokeWidth="2" />
        <line x1={dims.padding} x2={dims.padding} y1={dims.padding} y2={dims.height - dims.padding} stroke="url(#llm-scatter-axis)" strokeWidth="2" />

        <g fill="rgba(100,116,139,0.85)" fontFamily="var(--font-body)" fontSize="12">
          {ticks.xs.map((tick) => {
            const x = scaleX(tick);
            return (
              <text key={tick} x={x} y={dims.height - dims.padding + 22} textAnchor="middle">
                {xFormatter(tick)}
              </text>
            );
          })}
          {ticks.ys.map((tick) => {
            const y = scaleY(tick);
            return (
              <text key={tick} x={dims.padding - 12} y={y + 4} textAnchor="end">
                {yFormatter(tick)}
              </text>
            );
          })}
        </g>

        <g fill="rgba(15,23,42,0.75)" fontFamily="var(--font-body)" fontSize="13" fontWeight="600">
          <text x={dims.width / 2} y={dims.height - 16} textAnchor="middle">
            {xLabel}
          </text>
          <text x="16" y={dims.height / 2} textAnchor="middle" transform={`rotate(-90 16 ${dims.height / 2})`}>
            {yLabel}
          </text>
        </g>

        <g>
          {points.map((point) => {
            const cx = scaleX(point.x);
            const cy = scaleY(point.y);
            const radius = activePoint?.id === point.id ? 9 : 7;
            return (
              <circle
                key={point.id}
                cx={cx}
                cy={cy}
                r={radius}
                fill={point.color}
                fillOpacity={0.95}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="2"
                onPointerEnter={() => setActivePoint(point)}
                style={{ transition: prefersReducedMotion ? 'none' : 'r 240ms var(--ease-spring)' }}
              />
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="llm-dashboard__tooltip"
          style={{
            left: `${(tooltip.x / dims.width) * 100}%`,
            top: `${(tooltip.y / dims.height) * 100}%`
          }}
          role="status"
          aria-live="polite"
        >
          <div className="llm-dashboard__tooltip-title" style={{ color: tooltip.point.color }}>
            {tooltip.point.label}
          </div>
          <div className="llm-dashboard__tooltip-row">
            <span>{yTooltipLabel}</span>
            <strong>{yTooltipFormatter ? yTooltipFormatter(tooltip.point.y, tooltip.point) : yFormatter(tooltip.point.y)}</strong>
          </div>
          <div className="llm-dashboard__tooltip-row">
            <span>{xTooltipLabel}</span>
            <strong>{xTooltipFormatter ? xTooltipFormatter(tooltip.point.x, tooltip.point) : xFormatter(tooltip.point.x)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ data, selectedModels }) {
  const selectedModelEntries = useMemo(
    () => data.modelSummary.filter((entry) => selectedModels.includes(entry.model)),
    [data.modelSummary, selectedModels]
  );

  const summary = useMemo(() => {
    const totalTrials = selectedModelEntries.reduce((sum, entry) => sum + (entry.n_trials || 0), 0);
    const totalCorrect = selectedModelEntries.reduce((sum, entry) => sum + (entry.correct || 0), 0);
    const accuracy = safeDivide(totalCorrect, totalTrials);
    const [accuracyCiLow, accuracyCiHigh] = wilsonInterval(totalCorrect, totalTrials);

    const malTp = selectedModelEntries.reduce((sum, entry) => sum + (entry.mal_tp || 0), 0);
    const malFn = selectedModelEntries.reduce((sum, entry) => sum + (entry.mal_fn || 0), 0);
    const malTn = selectedModelEntries.reduce((sum, entry) => sum + (entry.mal_tn || 0), 0);
    const malFp = selectedModelEntries.reduce((sum, entry) => sum + (entry.mal_fp || 0), 0);
    const malignantSensitivity = safeDivide(malTp, malTp + malFn);
    const benignSpecificity = safeDivide(malTn, malTn + malFp);
    const [sensCiLow, sensCiHigh] = wilsonInterval(malTp, malTp + malFn);
    const [specCiLow, specCiHigh] = wilsonInterval(malTn, malTn + malFp);

    const melTp = selectedModelEntries.reduce((sum, entry) => sum + (entry.mel_tp || 0), 0);
    const melFn = selectedModelEntries.reduce((sum, entry) => sum + (entry.mel_fn || 0), 0);
    const melTn = selectedModelEntries.reduce((sum, entry) => sum + (entry.mel_tn || 0), 0);
    const melFp = selectedModelEntries.reduce((sum, entry) => sum + (entry.mel_fp || 0), 0);
    const melanomaSensitivity = safeDivide(melTp, melTp + melFn);
    const melanomaSpecificity = safeDivide(melTn, melTn + melFp);

    const weightedLatency = selectedModelEntries.reduce((sum, entry) => sum + (entry.mean_latency || 0) * (entry.n_trials || 0), 0);
    const weightedTokens = selectedModelEntries.reduce((sum, entry) => sum + (entry.mean_tokens || 0) * (entry.n_trials || 0), 0);
    const totalCost = selectedModelEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
    const meanLatency = safeDivide(weightedLatency, totalTrials);
    const meanTokens = safeDivide(weightedTokens, totalTrials);
    const meanCostCents = safeDivide(totalCost, totalTrials) * 100;

    return {
      totalTrials,
      totalCorrect,
      accuracy,
      accuracyCiLow,
      accuracyCiHigh,
      malignantSensitivity,
      benignSpecificity,
      sensCiLow,
      sensCiHigh,
      specCiLow,
      specCiHigh,
      melanomaSensitivity,
      melanomaSpecificity,
      totalCost,
      meanLatency,
      meanTokens,
      meanCostCents
    };
  }, [selectedModelEntries]);

  const arms = useMemo(() => {
    const byArm = new Map();
    for (const entry of data.modelArmTradeoffs) {
      if (!selectedModels.includes(entry.model)) continue;
      const arm = Number(entry.arm);
      const current = byArm.get(arm) || { correct: 0, n: 0 };
      current.correct += entry.correct || 0;
      current.n += entry.n_trials || 0;
      byArm.set(arm, current);
    }

    return ARM_KEYS.map((arm) => {
      const agg = byArm.get(arm) || { correct: 0, n: 0 };
      const acc = safeDivide(agg.correct, agg.n);
      const color = acc > 0.7 ? 'rgba(34,197,94,0.9)' : acc > 0.6 ? 'rgba(245,158,11,0.9)' : 'rgba(239,68,68,0.9)';
      return { label: `Arm ${arm}: ${ARM_NAMES[arm]}`, value: acc, color, n: agg.n, correct: agg.correct };
    });
  }, [data.modelArmTradeoffs, selectedModels]);

  const diagnosisMeta = useMemo(() => {
    const lookup = new Map();
    for (const entry of data.diagnosisSummary) {
      lookup.set(entry.diagnosis, entry.is_malignant);
    }
    return lookup;
  }, [data.diagnosisSummary]);

  const diagnoses = useMemo(() => {
    const byDiag = new Map();
    for (const entry of data.confusionByModel) {
      if (!selectedModels.includes(entry.model)) continue;
      const gt = entry.gt_parent;
      const pred = entry.pred_parent;
      const count = entry.count || 0;
      const current = byDiag.get(gt) || { total: 0, correct: 0 };
      current.total += count;
      if (gt === pred) current.correct += count;
      byDiag.set(gt, current);
    }

    return data.diagnoses.map((diag) => {
      const agg = byDiag.get(diag) || { total: 0, correct: 0 };
      const acc = safeDivide(agg.correct, agg.total);
      const isMalignant = diagnosisMeta.get(diag);
      return {
        label: DIAG_LABELS[diag] || diag,
        value: acc,
        color: isMalignant ? 'rgba(220,38,38,0.9)' : 'rgba(15,118,110,0.9)',
        total: agg.total
      };
    });
  }, [data.confusionByModel, data.diagnoses, diagnosisMeta, selectedModels]);

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__stats-grid">
        <StatCard value={selectedModels.length} label="Models selected" />
        <StatCard value={summary.totalTrials} label="Trials in view" />
        <StatCard value={summary.accuracy} label="Accuracy" tone="success" format="percent" />
        <StatCard value={summary.malignantSensitivity} label="Sensitivity" tone="primary" format="percent" />
        <StatCard value={summary.benignSpecificity} label="Specificity" tone="success" format="percent" />
        <StatCard value={summary.meanLatency} label="Mean latency" format="seconds" />
        <StatCard value={summary.meanTokens} label="Mean tokens" />
        <StatCard value={summary.meanCostCents} label="Mean cost" format="cents" />
      </div>

      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Accuracy by prompting strategy</h2>
          <BarList items={arms} />
        </div>
        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Accuracy by diagnosis</h2>
          <BarList items={diagnoses} />
          <div className="llm-dashboard__legend">
            <span className="llm-dashboard__legend-item">
              <span className="llm-dashboard__legend-swatch" style={{ background: 'rgba(220,38,38,0.9)' }} />
              Malignant
            </span>
            <span className="llm-dashboard__legend-item">
              <span className="llm-dashboard__legend-swatch" style={{ background: 'rgba(15,118,110,0.9)' }} />
              Benign
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab({ data, selectedModels }) {
  const [rankBy, setRankBy] = useState('overall');
  const [diagFilter, setDiagFilter] = useState('all');
  const [armFilter, setArmFilter] = useState('all');
  const [sortKey, setSortKey] = useState('accuracy');
  const [sortDir, setSortDir] = useState('desc');
  const [figureMetric, setFigureMetric] = useState('accuracy');
  const [detailModel, setDetailModel] = useState('');

  const rankedData = useMemo(() => {
    let rows = data.modelSummary
      .filter((model) => selectedModels.includes(model.model))
      .map((model) => {
        let displayAccuracy = model.accuracy;
        let displayCiLow = model.accuracy_ci_low;
        let displayCiHigh = model.accuracy_ci_high;
        let displayN = model.n_trials;
        if (rankBy === 'diagnosis' && diagFilter !== 'all') {
          const byDiag = data.modelDiagCounts.find((entry) => entry.model === model.model && entry.key === diagFilter);
          displayAccuracy = byDiag ? byDiag.accuracy || 0 : 0;
          displayN = byDiag ? byDiag.n_trials : 0;
          const [low, high] = wilsonInterval(byDiag?.correct || 0, byDiag?.n_trials || 0);
          displayCiLow = low;
          displayCiHigh = high;
        }
        if (rankBy === 'arm' && armFilter !== 'all') {
          const byArm = data.modelArmTradeoffs.find((entry) => entry.model === model.model && Number(entry.arm) === Number(armFilter));
          displayAccuracy = byArm ? byArm.accuracy || 0 : 0;
          displayN = byArm ? byArm.n_trials : 0;
          const [low, high] = wilsonInterval(byArm?.correct || 0, byArm?.n_trials || 0);
          displayCiLow = low;
          displayCiHigh = high;
        }
        return { ...model, displayAccuracy, displayCiLow, displayCiHigh, displayN };
      });

    const key = sortKey === 'accuracy' ? 'displayAccuracy' : sortKey;
    rows.sort((a, b) => {
      const aValue = a[key] ?? 0;
      const bValue = b[key] ?? 0;
      return sortDir === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return rows.map((row, index) => ({ ...row, rank: index + 1 }));
  }, [armFilter, data.modelArmTradeoffs, data.modelDiagCounts, data.modelSummary, diagFilter, rankBy, selectedModels, sortDir, sortKey]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  };

  const getAriaSort = (key) => {
    if (sortKey !== key) return undefined;
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  const chartItems = useMemo(() => {
    return rankedData.slice(0, 12).map((row) => {
      const palette = getProviderPalette(row.provider);
      return {
        key: row.model,
        label: shortModelName(row.model),
        value: row.displayAccuracy,
        ciLow: row.displayCiLow,
        ciHigh: row.displayCiHigh,
        color: palette.primary
      };
    });
  }, [rankedData]);

  const metricFigureItems = useMemo(() => {
    const rows = data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        let value = entry.accuracy;
        let ciLow = entry.accuracy_ci_low;
        let ciHigh = entry.accuracy_ci_high;
        if (figureMetric === 'sensitivity') {
          value = entry.sensitivity;
          ciLow = entry.sensitivity_ci_low;
          ciHigh = entry.sensitivity_ci_high;
        } else if (figureMetric === 'specificity') {
          value = entry.specificity;
          ciLow = entry.specificity_ci_low;
          ciHigh = entry.specificity_ci_high;
        } else if (figureMetric === 'mel_sensitivity') {
          value = entry.mel_sensitivity;
          ciLow = entry.mel_sensitivity_ci_low;
          ciHigh = entry.mel_sensitivity_ci_high;
        } else if (figureMetric === 'mel_specificity') {
          value = entry.mel_specificity;
          ciLow = entry.mel_specificity_ci_low;
          ciHigh = entry.mel_specificity_ci_high;
        } else if (figureMetric === 'other_rate') {
          value = entry.other_rate;
          const [low, high] = wilsonInterval(entry.other_count || 0, entry.n_trials || 0);
          ciLow = low;
          ciHigh = high;
        }

        return {
          key: entry.model,
          label: shortModelName(entry.model),
          subtitle: getProviderPalette(entry.provider).name,
          value: typeof value === 'number' ? value : 0,
          ciLow,
          ciHigh,
          color: palette.primary
        };
      })
      .sort((a, b) => b.value - a.value);

    return rows;
  }, [data.modelSummary, figureMetric, selectedModels]);

  useEffect(() => {
    if (!rankedData.length) return;
    if (detailModel && rankedData.some((row) => row.model === detailModel)) return;
    setDetailModel(rankedData[0].model);
  }, [detailModel, rankedData]);

  const diagnosisDetailItems = useMemo(() => {
    if (!detailModel) return [];
    return data.diagnoses.map((diag) => {
      const entry = data.modelDiagCounts.find((row) => row.model === detailModel && row.diagnosis === diag);
      const [ciLow, ciHigh] = wilsonInterval(entry?.correct || 0, entry?.n_trials || 0);
      const value = entry?.accuracy || 0;
      const isMalignant = data.diagnosisSummary.find((d) => d.diagnosis === diag)?.is_malignant;
      return {
        key: diag,
        label: DIAG_LABELS[diag] || diag,
        value,
        ciLow,
        ciHigh,
        color: isMalignant ? 'rgba(220,38,38,0.9)' : 'rgba(15,118,110,0.9)'
      };
    });
  }, [data.diagnoses, data.diagnosisSummary, data.modelDiagCounts, detailModel]);

  const armUpliftRows = useMemo(() => {
    const rows = data.modelArmTradeoffs
      .filter((entry) => selectedModels.includes(entry.model))
      .reduce((acc, entry) => {
        const current = acc.get(entry.model) || { byArm: new Map() };
        current.byArm.set(Number(entry.arm), entry.accuracy || 0);
        acc.set(entry.model, current);
        return acc;
      }, new Map());

    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .map((entry) => {
        const armMap = rows.get(entry.model)?.byArm || new Map();
        const arm1 = armMap.get(1) ?? null;
        let bestArm = null;
        let bestValue = -1;
        for (const [arm, value] of armMap.entries()) {
          if (typeof value === 'number' && value > bestValue) {
            bestValue = value;
            bestArm = arm;
          }
        }
        const uplift = typeof arm1 === 'number' && bestValue >= 0 ? bestValue - arm1 : 0;
        return {
          key: entry.model,
          label: shortModelName(entry.model),
          provider: entry.provider,
          arm1: typeof arm1 === 'number' ? arm1 : 0,
          bestArm: bestArm || 1,
          bestValue: bestValue >= 0 ? bestValue : entry.accuracy,
          uplift
        };
      })
      .sort((a, b) => b.uplift - a.uplift)
      .slice(0, 12);
  }, [data.modelArmTradeoffs, data.modelSummary, selectedModels]);

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__filters">
        <div className="llm-dashboard__filter">
          <span className="llm-dashboard__filter-label">Rank by</span>
          <select
            className="llm-dashboard__select"
            value={rankBy}
            onChange={(event) => {
              setRankBy(event.target.value);
              setDiagFilter('all');
              setArmFilter('all');
            }}
          >
            <option value="overall">Overall accuracy</option>
            <option value="diagnosis">By diagnosis</option>
            <option value="arm">By prompting strategy</option>
          </select>
        </div>

        {rankBy === 'diagnosis' && (
          <div className="llm-dashboard__filter">
            <span className="llm-dashboard__filter-label">Diagnosis</span>
            <select className="llm-dashboard__select" value={diagFilter} onChange={(event) => setDiagFilter(event.target.value)}>
              <option value="all">All diagnoses</option>
              {DIAG_KEYS.map((key) => (
                <option key={key} value={key}>
                  {DIAG_LABELS[key] || key}
                </option>
              ))}
            </select>
          </div>
        )}

        {rankBy === 'arm' && (
          <div className="llm-dashboard__filter">
            <span className="llm-dashboard__filter-label">Arm</span>
            <select className="llm-dashboard__select" value={armFilter} onChange={(event) => setArmFilter(event.target.value)}>
              <option value="all">All arms</option>
              {ARM_KEYS.map((key) => (
                <option key={key} value={key}>
                  Arm {key}: {ARM_NAMES[key]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(rankBy !== 'overall' && (diagFilter !== 'all' || armFilter !== 'all')) && (
        <div className="llm-dashboard__notice">
          Rankings reflect{' '}
          <strong>
            {rankBy === 'diagnosis' ? `${DIAG_LABELS[diagFilter] || diagFilter} accuracy` : `${ARM_NAMES[Number(armFilter)]} performance`}
          </strong>
          .
        </div>
      )}

      <div className="llm-dashboard__table-shell">
        <table className="llm-dashboard__table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Model</th>
              <th scope="col">Provider</th>
              <th scope="col" className="llm-dashboard__th-sort" aria-sort={getAriaSort('accuracy')}>
                <button type="button" className="llm-dashboard__sort-button" onClick={() => handleSort('accuracy')}>
                  Accuracy
                  <span className="llm-dashboard__sort-indicator" aria-hidden="true">
                    {sortKey === 'accuracy' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </span>
                </button>
              </th>
              <th scope="col" className="llm-dashboard__th-sort" aria-sort={getAriaSort('sensitivity')}>
                <button type="button" className="llm-dashboard__sort-button" onClick={() => handleSort('sensitivity')}>
                  Sensitivity
                </button>
              </th>
              <th scope="col" className="llm-dashboard__th-sort" aria-sort={getAriaSort('specificity')}>
                <button type="button" className="llm-dashboard__sort-button" onClick={() => handleSort('specificity')}>
                  Specificity
                </button>
              </th>
              <th scope="col" className="llm-dashboard__th-sort" aria-sort={getAriaSort('mean_latency')}>
                <button type="button" className="llm-dashboard__sort-button" onClick={() => handleSort('mean_latency')}>
                  Latency
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedData.map((row) => {
              const palette = getProviderPalette(row.provider);
              return (
                <tr key={row.model} className={row.rank <= 3 ? 'llm-dashboard__row-top' : ''}>
                  <td>
                    <span className="llm-dashboard__rank">{row.rank}</span>
                  </td>
                  <td style={{ color: palette.primary, fontWeight: 700 }}>{shortModelName(row.model)}</td>
                  <td>
                    <span className="llm-dashboard__badge" style={{ background: palette.surface, borderColor: palette.border, color: palette.primary }}>
                      {palette.name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: palette.primary }}>{formatPercent(row.displayAccuracy, 1)}</td>
                  <td>{formatPercent(row.sensitivity, 1)}</td>
                  <td>{formatPercent(row.specificity, 1)}</td>
                  <td>{typeof row.mean_latency === 'number' ? `${row.mean_latency.toFixed(1)}s` : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Model-level accuracy (95% CI)</h2>
        <p className="llm-dashboard__card-subtitle">Paper-style ranked figure for the current leaderboard view (top 12 entries).</p>
        <CIBarList items={chartItems} maxValue={1} valueFormatter={(value) => formatPercent(value, 1)} />
      </div>

      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card llm-dashboard__card--tight">
          <h2 className="llm-dashboard__card-title">Metric ranking (95% CI)</h2>
          <p className="llm-dashboard__card-subtitle">Switch the metric to compare models on performance and safety-relevant endpoints.</p>
          <div className="llm-dashboard__filters">
            <div className="llm-dashboard__filter">
              <span className="llm-dashboard__filter-label">Metric</span>
              <select className="llm-dashboard__select" value={figureMetric} onChange={(event) => setFigureMetric(event.target.value)}>
                <option value="accuracy">8-class accuracy</option>
                <option value="sensitivity">Malignant sensitivity</option>
                <option value="specificity">Benign specificity</option>
                <option value="mel_sensitivity">Melanoma sensitivity</option>
                <option value="mel_specificity">Melanoma specificity</option>
                <option value="other_rate">Non-diagnostic rate</option>
              </select>
            </div>
          </div>
          <CIBarList items={metricFigureItems} maxValue={1} valueFormatter={(value) => formatPercent(value, 1)} />
        </div>

        <div className="llm-dashboard__card llm-dashboard__card--tight">
          <h2 className="llm-dashboard__card-title">Diagnosis accuracy (selected model)</h2>
          <p className="llm-dashboard__card-subtitle">Per-diagnosis breakdown for a chosen model (aggregated over all prompting arms).</p>
          <div className="llm-dashboard__filters">
            <div className="llm-dashboard__filter">
              <span className="llm-dashboard__filter-label">Model</span>
              <select className="llm-dashboard__select" value={detailModel} onChange={(event) => setDetailModel(event.target.value)}>
                {rankedData.map((row) => (
                  <option key={row.model} value={row.model}>
                    {shortModelName(row.model)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <CIBarList items={diagnosisDetailItems} maxValue={1} valueFormatter={(value) => formatPercent(value, 1)} showCILabel={false} />
        </div>
      </div>

      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Prompting uplift (best arm vs Arm 1)</h2>
        <p className="llm-dashboard__card-subtitle">Quick summary of how much each model improves when using its best prompting arm compared to Arm 1.</p>
        <div className="llm-dashboard__table-shell">
          <table className="llm-dashboard__table llm-dashboard__table--compact">
            <thead>
              <tr>
                <th>Model</th>
                <th style={{ textAlign: 'right' }}>Arm 1</th>
                <th style={{ textAlign: 'right' }}>Best arm</th>
                <th style={{ textAlign: 'right' }}>Uplift</th>
              </tr>
            </thead>
            <tbody>
              {armUpliftRows.map((row) => (
                <tr key={row.key}>
                  <td style={{ fontWeight: 700 }}>{row.label}</td>
                  <td style={{ textAlign: 'right' }}>{formatPercent(row.arm1, 1)}</td>
                  <td style={{ textAlign: 'right' }}>
                    Arm {row.bestArm} ({formatPercent(row.bestValue, 1)})
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: row.uplift >= 0 ? 'rgba(15,118,110,0.92)' : 'rgba(220,38,38,0.92)' }}>
                    {row.uplift >= 0 ? '+' : ''}
                    {(row.uplift * 100).toFixed(1)}pp
                  </td>
                </tr>
              ))}
              {!armUpliftRows.length && (
                <tr>
                  <td colSpan={4} className="llm-dashboard__table-empty">
                    No prompting-arm data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeatmapsTab({ data, selectedModels }) {
  const prefersReducedMotion = useReducedMotion();
  const [view, setView] = useState('arm');

  const filteredArm = useMemo(
    () => data.modelArmMatrix.filter((entry) => selectedModels.includes(entry.model)),
    [data.modelArmMatrix, selectedModels]
  );

  const filteredDiag = useMemo(
    () => data.modelDiagMatrix.filter((entry) => selectedModels.includes(entry.model)),
    [data.modelDiagMatrix, selectedModels]
  );

  const getCellColor = (value, min, max) => {
    if (typeof value !== 'number') return 'rgba(148,163,184,0.12)';
    const normalized = clamp((value - min) / (max - min), 0, 1);
    if (normalized < 0.33) return 'rgba(239,68,68,0.78)';
    if (normalized < 0.66) return 'rgba(245,158,11,0.8)';
    return 'rgba(34,197,94,0.8)';
  };

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__filters llm-dashboard__filters--tabs" role="tablist" aria-label="Heatmap view">
        <button
          type="button"
          className={`llm-dashboard__pill ${view === 'arm' ? 'is-active' : ''}`}
          onClick={() => setView('arm')}
        >
          Model × Arm
        </button>
        <button
          type="button"
          className={`llm-dashboard__pill ${view === 'diagnosis' ? 'is-active' : ''}`}
          onClick={() => setView('diagnosis')}
        >
          Model × Diagnosis
        </button>
      </div>

      <div className="llm-dashboard__table-shell llm-dashboard__table-shell--scroll">
        {view === 'arm' ? (
          <table className="llm-dashboard__table llm-dashboard__heat-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Model</th>
                {ARM_KEYS.map((arm) => (
                  <th key={arm} style={{ textAlign: 'center', minWidth: 110 }}>
                    Arm {arm}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredArm.map((row) => {
                const meta = data.modelSummary.find((model) => model.model === row.model);
                const palette = getProviderPalette(meta?.provider);
                return (
                  <tr key={row.model}>
                    <td style={{ fontWeight: 700, color: palette.primary }}>{shortModelName(row.model)}</td>
                    {ARM_KEYS.map((arm) => {
                      const value = row[`arm${arm}`];
                      return (
                        <td key={arm}>
                          <div
                            className="llm-dashboard__heat-cell"
                            style={{
                              background: getCellColor(value, 0.35, 0.92),
                              transition: prefersReducedMotion ? 'none' : 'transform 200ms var(--ease-spring)'
                            }}
                          >
                            {typeof value === 'number' ? formatPercent(value, 0) : '–'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="llm-dashboard__table llm-dashboard__heat-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Model</th>
                {DIAG_KEYS.map((key) => (
                  <th key={key} style={{ textAlign: 'center', minWidth: 110 }}>
                    {DIAG_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDiag.map((row) => {
                const meta = data.modelSummary.find((model) => model.model === row.model);
                const palette = getProviderPalette(meta?.provider);
                return (
                  <tr key={row.model}>
                    <td style={{ fontWeight: 700, color: palette.primary }}>{shortModelName(row.model)}</td>
                    {DIAG_KEYS.map((key) => {
                      const value = row[key];
                      return (
                        <td key={key}>
                          <div
                            className="llm-dashboard__heat-cell"
                            style={{
                              background: getCellColor(value, 0.1, 1.0),
                              transition: prefersReducedMotion ? 'none' : 'transform 200ms var(--ease-spring)'
                            }}
                          >
                            {typeof value === 'number' ? formatPercent(value, 0) : '–'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="llm-dashboard__legend llm-dashboard__legend--heat">
        <span className="llm-dashboard__legend-item">
          <span className="llm-dashboard__legend-swatch" style={{ background: 'rgba(239,68,68,0.78)' }} />
          &lt;50%
        </span>
        <span className="llm-dashboard__legend-item">
          <span className="llm-dashboard__legend-swatch" style={{ background: 'rgba(245,158,11,0.8)' }} />
          50–70%
        </span>
        <span className="llm-dashboard__legend-item">
          <span className="llm-dashboard__legend-swatch" style={{ background: 'rgba(34,197,94,0.8)' }} />
          &gt;70%
        </span>
      </div>
    </div>
  );
}

function ErrorsTab({ data, selectedModels }) {
  const [matrixView, setMatrixView] = useState('percent');
  const [heatmapNormalization, setHeatmapNormalization] = useState('errors');

  const totalTrialsInView = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .reduce((sum, entry) => sum + (entry.n_trials || 0), 0);
  }, [data.modelSummary, selectedModels]);

  const errorCounts = useMemo(() => {
    const counts = new Map();
    for (const entry of data.errorByModel) {
      if (!selectedModels.includes(entry.model)) continue;
      counts.set(entry.type, (counts.get(entry.type) || 0) + (entry.count || 0));
    }
    return counts;
  }, [data.errorByModel, selectedModels]);

  const errorItems = useMemo(() => {
    const items = Object.keys(ERROR_TYPE_META).map((type) => {
      const count = errorCounts.get(type) || 0;
      return {
        key: type,
        label: ERROR_TYPE_META[type]?.label || type,
        value: count,
        color: ERROR_TYPE_META[type]?.color || 'rgba(100,116,139,0.85)',
        percent: totalTrialsInView ? (count / totalTrialsInView) * 100 : 0
      };
    });
    return items.sort((a, b) => b.value - a.value);
  }, [errorCounts, totalTrialsInView]);

  const missedMalignancies = errorItems.find((entry) => entry.key === 'malignant_to_benign');
  const falseAlarms = errorItems.find((entry) => entry.key === 'benign_to_malignant');
  const cancerConfusions = errorItems.find((entry) => entry.key === 'within_malignant');
  const nonDiagnostic = errorItems.find((entry) => entry.key === 'pred_other');

  const confusion = useMemo(() => {
    const rows = Array.isArray(data.diagnoses) && data.diagnoses.length ? data.diagnoses : [];
    const selected = data.confusionByModel.filter((entry) => selectedModels.includes(entry.model));
    if (!selected.length || !rows.length) return null;

    const predValues = new Set(selected.map((entry) => entry.pred_parent));
    const cols = [...rows];
    if (predValues.has('other')) cols.push('other');
    for (const pred of predValues) {
      if (pred === 'other') continue;
      if (!cols.includes(pred)) cols.push(pred);
    }

    const lookup = new Map();
    for (const entry of selected) {
      lookup.set(`${entry.gt_parent}||${entry.pred_parent}`, (lookup.get(`${entry.gt_parent}||${entry.pred_parent}`) || 0) + (entry.count || 0));
    }

    const formatLabel = (value) => {
      if (!value) return '–';
      if (value === 'other') return 'Other';
      return DIAG_LABELS[value] || value;
    };

    const matrixRows = rows.map((gt) => {
      const counts = cols.map((pred) => lookup.get(`${gt}||${pred}`) ?? 0);
      const rowTotal = counts.reduce((sum, value) => sum + value, 0);
      const rowMax = Math.max(...counts, 1);
      return {
        gt,
        gtLabel: formatLabel(gt),
        total: rowTotal,
        cells: cols.map((pred, idx) => {
          const count = counts[idx] ?? 0;
          const isCorrect = pred === gt;
          const share = rowTotal ? count / rowTotal : 0;
          const intensity = rowMax ? count / rowMax : 0;
          const alpha = isCorrect ? 0.1 + 0.5 * intensity : 0.08 + 0.45 * intensity;
          const background = isCorrect ? `rgba(34,197,94,${alpha})` : `rgba(239,68,68,${alpha})`;
          return {
            pred,
            predLabel: formatLabel(pred),
            count,
            share,
            intensity,
            isCorrect,
            background
          };
        })
      };
    });

    return { cols: cols.map(formatLabel), rawCols: cols, matrixRows, lookup };
  }, [data.confusionByModel, data.diagnoses, selectedModels]);

  const topConfusions = useMemo(() => {
    if (!confusion) return [];
    const entries = [];
    for (const row of confusion.matrixRows) {
      for (const cell of row.cells) {
        if (cell.pred === row.gt) continue;
        if (!cell.count) continue;
        entries.push({
          key: `${row.gt}::${cell.pred}`,
          gt: row.gtLabel,
          pred: cell.predLabel,
          count: cell.count,
          rowShare: cell.share
        });
      }
    }
    return entries.sort((a, b) => b.count - a.count).slice(0, 12);
  }, [confusion]);

  const errorHeatmap = useMemo(() => {
    const modelSet = new Set(selectedModels);
    const byModel = new Map();
    for (const entry of data.errorByModel) {
      if (!modelSet.has(entry.model)) continue;
      const current = byModel.get(entry.model) || {};
      current[entry.type] = (current[entry.type] || 0) + (entry.count || 0);
      byModel.set(entry.model, current);
    }

    const types = ['malignant_to_benign', 'benign_to_malignant', 'within_malignant', 'within_benign', 'pred_other'];
    const rows = data.modelSummary
      .filter((entry) => modelSet.has(entry.model))
      .map((model) => {
        const counts = byModel.get(model.model) || {};
        const total = Object.values(counts).reduce((sum, v) => sum + (v || 0), 0);
        const correct = counts.correct || 0;
        const errorTotal = Math.max(1, total - correct);
        const denom = heatmapNormalization === 'trials' ? Math.max(1, total) : errorTotal;

        const values = {};
        for (const type of types) {
          values[type] = safeDivide(counts[type] || 0, denom);
        }

        return {
          model: model.model,
          provider: model.provider,
          total,
          correct,
          errorTotal,
          values
        };
      })
      .sort((a, b) => {
        const aTotal = safeDivide(a.correct, a.total);
        const bTotal = safeDivide(b.correct, b.total);
        return bTotal - aTotal;
      });

    return { rows, types };
  }, [data.errorByModel, data.modelSummary, heatmapNormalization, selectedModels]);

  const diagnosisErrorStacks = useMemo(() => {
    const modelSet = new Set(selectedModels);
    const byDiag = new Map();
    for (const entry of data.errorByModelDiagnosis) {
      if (!modelSet.has(entry.model)) continue;
      const gt = entry.gt_parent;
      const current = byDiag.get(gt) || {};
      current[entry.type] = (current[entry.type] || 0) + (entry.count || 0);
      byDiag.set(gt, current);
    }

    const types = ['malignant_to_benign', 'benign_to_malignant', 'within_malignant', 'within_benign', 'pred_other'];
    const rows = data.diagnoses
      .map((diag) => {
        const counts = byDiag.get(diag) || {};
        const totalErrors = types.reduce((sum, type) => sum + (counts[type] || 0), 0);
        return {
          key: diag,
          label: DIAG_LABELS[diag] || diag,
          total: totalErrors,
          segments: types.map((type) => ({
            key: type,
            label: ERROR_TYPE_META[type]?.label || type,
            value: counts[type] || 0,
            color: ERROR_TYPE_META[type]?.color || 'rgba(100,116,139,0.85)'
          }))
        };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
    return rows;
  }, [data.diagnoses, data.errorByModelDiagnosis, selectedModels]);

  const otherRateByModel = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .slice()
      .sort((a, b) => (b.other_rate || 0) - (a.other_rate || 0))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          key: entry.model,
          label: shortModelName(entry.model),
          value: entry.other_rate || 0,
          color: palette.primary
        };
      });
  }, [data.modelSummary, selectedModels]);

  const selectedTotalErrors = useMemo(() => {
    const correct = errorCounts.get('correct') || 0;
    const total = Array.from(errorCounts.values()).reduce((sum, value) => sum + value, 0);
    return Math.max(0, total - correct);
  }, [errorCounts]);

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Error type distribution</h2>
          <p className="llm-dashboard__card-subtitle">Counts and shares are computed for the currently selected models.</p>
          <BarList
            items={errorItems.map((entry) => ({
              key: entry.key,
              label: entry.label,
              value: entry.value,
              color: entry.color,
              percent: entry.percent
            }))}
            maxValue={Math.max(...errorItems.map((entry) => entry.value), 1)}
            valueFormatter={(value, item) => `${formatNumber(value)} (${item.percent.toFixed(1)}%)`}
          />
        </div>

        <div className="llm-dashboard__card llm-dashboard__card--alert">
          <h2 className="llm-dashboard__card-title">Clinical impact summary</h2>
          <p className="llm-dashboard__impact">
            <strong>{formatNumber(missedMalignancies?.value)}</strong> missed malignancies ({missedMalignancies?.percent.toFixed(1)}%)
          </p>
          <p className="llm-dashboard__impact">
            <strong>{formatNumber(falseAlarms?.value)}</strong> false alarms ({falseAlarms?.percent.toFixed(1)}%)
          </p>
          <p className="llm-dashboard__impact">
            <strong>{formatNumber(cancerConfusions?.value)}</strong> cancer type confusions ({cancerConfusions?.percent.toFixed(1)}%)
          </p>
          <p className="llm-dashboard__impact">
            <strong>{formatNumber(nonDiagnostic?.value)}</strong> non-diagnostic outputs ({nonDiagnostic?.percent.toFixed(1)}%)
          </p>
          <p className="llm-dashboard__impact-note">
            These are aggregate error counts over the selected models and prompting arms, intended for research discussion rather than clinical deployment decisions.
          </p>
        </div>
      </div>

      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Top confusions</h2>
          <p className="llm-dashboard__card-subtitle">Most frequent GT → Pred mistakes across selected models.</p>
          <div className="llm-dashboard__table-shell">
            <table className="llm-dashboard__table llm-dashboard__table--compact">
              <thead>
                <tr>
                  <th>Ground truth</th>
                  <th>Predicted</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Row %</th>
                </tr>
              </thead>
              <tbody>
                {topConfusions.map((entry) => (
                  <tr key={entry.key}>
                    <td style={{ fontWeight: 700 }}>{entry.gt}</td>
                    <td>{entry.pred}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(entry.count)}</td>
                    <td style={{ textAlign: 'right' }}>{formatPercent(entry.rowShare, 1)}</td>
                  </tr>
                ))}
                {!topConfusions.length && (
                  <tr>
                    <td colSpan={4} className="llm-dashboard__table-empty">
                      No confusions available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Non-diagnostic rate by model</h2>
          <p className="llm-dashboard__card-subtitle">Fraction of predictions emitted as "other".</p>
          <BarList items={otherRateByModel} maxValue={Math.max(...otherRateByModel.map((entry) => entry.value), 0.01)} />
        </div>
      </div>

      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Error type heatmap</h2>
        <p className="llm-dashboard__card-subtitle">
          Each cell shows the share of a given error type. Switch normalization between “of all errors” (paper figure style) and “of all trials”.
        </p>

        <div className="llm-dashboard__filters llm-dashboard__filters--tabs" role="tablist" aria-label="Error heatmap normalization">
          <button
            type="button"
            className={`llm-dashboard__pill ${heatmapNormalization === 'errors' ? 'is-active' : ''}`}
            onClick={() => setHeatmapNormalization('errors')}
          >
            % of errors
          </button>
          <button
            type="button"
            className={`llm-dashboard__pill ${heatmapNormalization === 'trials' ? 'is-active' : ''}`}
            onClick={() => setHeatmapNormalization('trials')}
          >
            % of trials
          </button>
        </div>

        <div className="llm-dashboard__table-shell llm-dashboard__table-shell--scroll">
          <table className="llm-dashboard__table llm-dashboard__heat-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Model</th>
                {errorHeatmap.types.map((type) => (
                  <th key={type} style={{ textAlign: 'center', minWidth: 140 }}>
                    {ERROR_TYPE_META[type]?.label || type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errorHeatmap.rows.map((row) => {
                const palette = getProviderPalette(row.provider);
                return (
                  <tr key={row.model}>
                    <td style={{ fontWeight: 700, color: palette.primary }}>{shortModelName(row.model)}</td>
                    {errorHeatmap.types.map((type) => {
                      const value = row.values[type] || 0;
                      const intensity = heatmapNormalization === 'errors' ? clamp(value / 0.5, 0, 1) : clamp(value / 0.2, 0, 1);
                      const background = `rgba(245,158,11,${0.08 + intensity * 0.65})`;
                      return (
                        <td key={type}>
                          <div className="llm-dashboard__heat-cell" style={{ background }}>
                            {formatPercent(value, 1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {!errorHeatmap.rows.length && (
                <tr>
                  <td colSpan={1 + errorHeatmap.types.length} className="llm-dashboard__table-empty">
                    Select one or more models to view the heatmap.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="llm-dashboard__notice">
          Total errors in view: <strong>{formatNumber(selectedTotalErrors)}</strong>
        </div>
      </div>

      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Error composition by diagnosis</h2>
        <p className="llm-dashboard__card-subtitle">Stacked bars show how each diagnosis tends to fail (excluding correct predictions).</p>
        <StackedBarList rows={diagnosisErrorStacks} totalLabel="Errors" segmentLabel="Error mix" />
      </div>

      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Confusion matrix</h2>
        <p className="llm-dashboard__card-subtitle">Rows are ground truth diagnosis, columns are predicted diagnosis (aggregated over selected models and prompting arms).</p>

        <div className="llm-dashboard__filters llm-dashboard__filters--tabs" role="tablist" aria-label="Confusion matrix view">
          <button
            type="button"
            className={`llm-dashboard__pill ${matrixView === 'percent' ? 'is-active' : ''}`}
            onClick={() => setMatrixView('percent')}
          >
            Row %
          </button>
          <button
            type="button"
            className={`llm-dashboard__pill ${matrixView === 'count' ? 'is-active' : ''}`}
            onClick={() => setMatrixView('count')}
          >
            Counts
          </button>
        </div>

        {confusion ? (
          <div className="llm-dashboard__table-shell llm-dashboard__table-shell--scroll">
            <table className="llm-dashboard__table llm-dashboard__matrix-table">
              <thead>
                <tr>
                  <th>GT \\ Pred</th>
                  {confusion.cols.map((label) => (
                    <th key={label} style={{ textAlign: 'center', minWidth: 110 }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confusion.matrixRows.map((row) => (
                  <tr key={row.gt}>
                    <td style={{ fontWeight: 800 }}>{row.gtLabel}</td>
                    {row.cells.map((cell) => (
                      <td key={`${row.gt}::${cell.pred}`}>
                        <div
                          className="llm-dashboard__matrix-cell"
                          style={{
                            background: cell.background
                          }}
                          title={`${row.gtLabel} → ${cell.predLabel}: ${formatNumber(cell.count)} (${(cell.share * 100).toFixed(1)}%)`}
                        >
                          <span className="llm-dashboard__matrix-primary">
                            {matrixView === 'count' ? formatNumber(cell.count) : formatPercent(cell.share, 1)}
                          </span>
                          <span className="llm-dashboard__matrix-secondary">
                            {matrixView === 'count' ? formatPercent(cell.share, 1) : `${formatNumber(cell.count)} trials`}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="llm-dashboard__empty">
            <h3>No confusion matrix available</h3>
            <p>Select models to render the confusion matrix.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({ data, selectedModels }) {
  const [tradeoffArm, setTradeoffArm] = useState(1);
  const [tradeoffAxis, setTradeoffAxis] = useState('latency');
  const [safetyView, setSafetyView] = useState('malignant');

  const points = useMemo(() => {
    return data.costPerformance
      .filter((entry) => selectedModels.includes(entry.model))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          id: entry.model,
          label: shortModelName(entry.model),
          provider: entry.provider,
          x: entry.cost,
          y: entry.accuracy,
          costLabel: `${entry.cost.toFixed(2)}¢/trial`,
          color: palette.primary
        };
      });
  }, [data.costPerformance, selectedModels]);

  const accuracyLatencyPoints = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          id: entry.model,
          label: shortModelName(entry.model),
          provider: entry.provider,
          x: entry.mean_latency,
          y: entry.accuracy,
          color: palette.primary
        };
      });
  }, [data.modelSummary, selectedModels]);

  const accuracyTokenPoints = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          id: entry.model,
          label: shortModelName(entry.model),
          provider: entry.provider,
          x: entry.mean_tokens,
          y: entry.accuracy,
          color: palette.primary
        };
      });
  }, [data.modelSummary, selectedModels]);

  const clinicalPoints = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          id: entry.model,
          label: shortModelName(entry.model),
          provider: entry.provider,
          x: entry.sensitivity,
          y: entry.specificity,
          color: palette.primary
        };
      });
  }, [data.modelSummary, selectedModels]);

  const safetyRows = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .slice()
      .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        const a = safetyView === 'melanoma' ? entry.mel_sensitivity : entry.sensitivity;
        const b = safetyView === 'melanoma' ? entry.mel_specificity : entry.specificity;
        return {
          key: entry.model,
          label: shortModelName(entry.model),
          a: typeof a === 'number' ? a : 0,
          b: typeof b === 'number' ? b : 0,
          aColor: palette.primary,
          bColor: 'rgba(148,163,184,0.8)'
        };
      });
  }, [data.modelSummary, safetyView, selectedModels]);

  const latencyItems = useMemo(() => {
    return data.latencyData
      .filter((entry) => selectedModels.includes(entry.model))
      .slice()
      .sort((a, b) => a.mean - b.mean)
      .map((entry) => {
        const meta = data.modelSummary.find((model) => model.model === entry.model);
        const palette = getProviderPalette(meta?.provider);
        return {
          key: entry.model,
          label: shortModelName(entry.model),
          value: entry.mean,
          color: palette.primary,
          median: entry.median
        };
      });
  }, [data.latencyData, data.modelSummary, selectedModels]);

  const tokenItems = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .slice()
      .sort((a, b) => (a.mean_tokens || 0) - (b.mean_tokens || 0))
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          key: entry.model,
          label: shortModelName(entry.model),
          value: entry.mean_tokens || 0,
          color: palette.primary
        };
      });
  }, [data.modelSummary, selectedModels]);

  const costPerCorrectItems = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .filter((entry) => typeof entry.cost_per_correct_usd === 'number' && entry.cost_per_correct_usd > 0)
      .slice()
      .sort((a, b) => a.cost_per_correct_usd - b.cost_per_correct_usd)
      .map((entry) => {
        const palette = getProviderPalette(entry.provider);
        return {
          key: entry.model,
          label: shortModelName(entry.model),
          value: entry.cost_per_correct_usd,
          color: palette.primary
        };
      });
  }, [data.modelSummary, selectedModels]);

  const armTradeoffPoints = useMemo(() => {
    const axisLabelMap = {
      latency: { label: 'Mean latency (s)', tooltip: 'Latency', formatter: (v) => `${v.toFixed(2)}s` },
      tokens: { label: 'Mean total tokens', tooltip: 'Tokens', formatter: (v) => `${Math.round(v)} tokens` },
      cost: { label: 'Mean cost (¢/trial)', tooltip: 'Cost', formatter: (v) => `${v.toFixed(2)}¢/trial` }
    };

    const axis = axisLabelMap[tradeoffAxis];
    const rows = data.modelArmTradeoffs
      .filter((entry) => selectedModels.includes(entry.model))
      .filter((entry) => Number(entry.arm) === Number(tradeoffArm))
      .map((entry) => {
        const meta = data.modelSummary.find((model) => model.model === entry.model);
        const palette = getProviderPalette(meta?.provider);
        const x =
          tradeoffAxis === 'latency'
            ? entry.mean_latency
            : tradeoffAxis === 'tokens'
              ? entry.mean_tokens
              : (entry.mean_cost || 0) * 100;
        return {
          id: entry.model,
          label: shortModelName(entry.model),
          provider: meta?.provider,
          x,
          y: entry.accuracy,
          color: palette.primary
        };
      });

    return { axis, rows };
  }, [data.modelArmTradeoffs, data.modelSummary, selectedModels, tradeoffArm, tradeoffAxis]);

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__card">
        <h2 className="llm-dashboard__card-title">Cost-efficiency frontier</h2>
        <p className="llm-dashboard__card-subtitle">Each point is a model, plotted by cost per trial and overall accuracy.</p>
        <ScatterPlot
          points={points}
          xLabel="Cost per trial (¢)"
          yLabel="Accuracy"
          xFormatter={(tick) => tick.toFixed(0)}
          yFormatter={(tick) => `${Math.round(tick * 100)}%`}
          xTooltipLabel="Cost"
          yTooltipLabel="Accuracy"
          xTooltipFormatter={(value) => `${value.toFixed(2)}¢/trial`}
          yTooltipFormatter={(value) => formatPercent(value, 1)}
        />
        <div className="llm-dashboard__legend">
          {Object.entries(PROVIDER_COLORS).map(([provider, palette]) => (
            <span key={provider} className="llm-dashboard__legend-item">
              <span className="llm-dashboard__legend-swatch" style={{ background: palette.primary }} />
              {palette.name}
            </span>
          ))}
        </div>
      </div>

      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Accuracy vs mean latency</h2>
          <p className="llm-dashboard__card-subtitle">Model-level tradeoff between response time and diagnostic accuracy.</p>
          <ScatterPlot
            points={accuracyLatencyPoints}
            xLabel="Mean latency (s)"
            yLabel="Accuracy"
            xFormatter={(tick) => tick.toFixed(0)}
            yFormatter={(tick) => `${Math.round(tick * 100)}%`}
            xTooltipLabel="Latency"
            yTooltipLabel="Accuracy"
            xTooltipFormatter={(value) => `${value.toFixed(2)}s`}
            yTooltipFormatter={(value) => formatPercent(value, 1)}
          />
        </div>

        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Accuracy vs mean total tokens</h2>
          <p className="llm-dashboard__card-subtitle">Model-level tradeoff between token usage and diagnostic accuracy.</p>
          <ScatterPlot
            points={accuracyTokenPoints}
            xLabel="Mean tokens"
            yLabel="Accuracy"
            xFormatter={(tick) => tick.toFixed(0)}
            yFormatter={(tick) => `${Math.round(tick * 100)}%`}
            xTooltipLabel="Tokens"
            yTooltipLabel="Accuracy"
            xTooltipFormatter={(value) => `${Math.round(value)} tokens`}
            yTooltipFormatter={(value) => formatPercent(value, 1)}
          />
        </div>
      </div>

      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Per-arm accuracy tradeoffs</h2>
        <p className="llm-dashboard__card-subtitle">Compare models within a specific prompting arm, switching the x-axis to latency, tokens, or cost.</p>

        <div className="llm-dashboard__filters">
          <div className="llm-dashboard__filter">
            <span className="llm-dashboard__filter-label">Arm</span>
            <select className="llm-dashboard__select" value={tradeoffArm} onChange={(event) => setTradeoffArm(Number(event.target.value))}>
              {ARM_KEYS.map((arm) => (
                <option key={arm} value={arm}>
                  Arm {arm}: {ARM_NAMES[arm]}
                </option>
              ))}
            </select>
          </div>
          <div className="llm-dashboard__filter">
            <span className="llm-dashboard__filter-label">X-axis</span>
            <select className="llm-dashboard__select" value={tradeoffAxis} onChange={(event) => setTradeoffAxis(event.target.value)}>
              <option value="latency">Latency</option>
              <option value="tokens">Tokens</option>
              <option value="cost">Cost</option>
            </select>
          </div>
        </div>

        <ScatterPlot
          points={armTradeoffPoints.rows}
          xLabel={armTradeoffPoints.axis.label}
          yLabel="Accuracy"
          xFormatter={(tick) => (tradeoffAxis === 'latency' ? tick.toFixed(0) : tick.toFixed(0))}
          yFormatter={(tick) => `${Math.round(tick * 100)}%`}
          xTooltipLabel={armTradeoffPoints.axis.tooltip}
          yTooltipLabel="Accuracy"
          xTooltipFormatter={(value) => armTradeoffPoints.axis.formatter(value)}
          yTooltipFormatter={(value) => formatPercent(value, 1)}
        />
      </div>

      <div className="llm-dashboard__card">
        <h2 className="llm-dashboard__card-title">Sensitivity vs specificity</h2>
        <p className="llm-dashboard__card-subtitle">Each point is a model, plotted by malignant sensitivity and benign specificity.</p>
        <ScatterPlot
          points={clinicalPoints}
          xLabel="Sensitivity"
          yLabel="Specificity"
          xFormatter={(tick) => `${Math.round(tick * 100)}%`}
          yFormatter={(tick) => `${Math.round(tick * 100)}%`}
          xTooltipLabel="Sensitivity"
          yTooltipLabel="Specificity"
          xTooltipFormatter={(value) => formatPercent(value, 1)}
          yTooltipFormatter={(value) => formatPercent(value, 1)}
        />
        <div className="llm-dashboard__legend">
          {Object.entries(PROVIDER_COLORS).map(([provider, palette]) => (
            <span key={provider} className="llm-dashboard__legend-item">
              <span className="llm-dashboard__legend-swatch" style={{ background: palette.primary }} />
              {palette.name}
            </span>
          ))}
        </div>
      </div>

      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Mean response latency</h2>
          <BarList
            items={latencyItems}
            maxValue={Math.max(...latencyItems.map((entry) => entry.value), 1)}
            valueFormatter={(value, item) => `${value.toFixed(2)}s (median ${item.median.toFixed(2)}s)`}
          />
        </div>

        <div className="llm-dashboard__card">
          <h2 className="llm-dashboard__card-title">Mean total tokens</h2>
          <BarList items={tokenItems} maxValue={Math.max(...tokenItems.map((entry) => entry.value), 1)} valueFormatter={(value) => `${Math.round(value)} tokens`} />
        </div>
      </div>

      <div className="llm-dashboard__grid-two">
        <div className="llm-dashboard__card llm-dashboard__card--tight">
          <h2 className="llm-dashboard__card-title">Cost per correct classification</h2>
          <p className="llm-dashboard__card-subtitle">Lower is better. Computed as total cost ÷ correct trials (across all arms).</p>
          <BarList
            items={costPerCorrectItems}
            maxValue={Math.max(...costPerCorrectItems.map((entry) => entry.value), 0.01)}
            valueFormatter={(value) => `${formatUSD(value, 2)}/correct`}
          />
        </div>

        <div className="llm-dashboard__card llm-dashboard__card--tight">
          <h2 className="llm-dashboard__card-title">Safety metrics (paired bars)</h2>
          <p className="llm-dashboard__card-subtitle">Bar pairs compare sensitivity vs specificity per model.</p>
          <div className="llm-dashboard__filters llm-dashboard__filters--tabs" role="tablist" aria-label="Safety metric view">
            <button type="button" className={`llm-dashboard__pill ${safetyView === 'malignant' ? 'is-active' : ''}`} onClick={() => setSafetyView('malignant')}>
              Malignant
            </button>
            <button type="button" className={`llm-dashboard__pill ${safetyView === 'melanoma' ? 'is-active' : ''}`} onClick={() => setSafetyView('melanoma')}>
              Melanoma
            </button>
          </div>
          <PairedBarList
            rows={safetyRows}
            aLabel="Sensitivity"
            bLabel="Specificity"
            aColor="rgba(220,38,38,0.92)"
            bColor="rgba(37,99,235,0.92)"
            maxValue={1}
            valueFormatter={(value) => formatPercent(value, 1)}
            markerValue={0.9}
          />
        </div>
      </div>
    </div>
  );
}

function HeadToHeadTab({ data, selectedModels }) {
  const prefersReducedMotion = useReducedMotion();
  const [arm, setArm] = useState(1);

  const models = useMemo(() => {
    return data.modelSummary
      .filter((entry) => selectedModels.includes(entry.model))
      .slice()
      .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
  }, [data.modelSummary, selectedModels]);

  const limitedModels = useMemo(() => {
    const max = 6;
    return models.slice(0, max);
  }, [models]);

  const bitsByModel = useMemo(() => {
    const lookup = new Map();
    for (const entry of data.cases?.correctByModelArm || []) {
      if (Number(entry.arm) !== Number(arm)) continue;
      lookup.set(entry.model, entry.correct_bits);
    }
    return lookup;
  }, [arm, data.cases]);

  const matrix = useMemo(() => {
    const items = limitedModels.map((entry) => ({
      model: entry.model,
      label: shortModelName(entry.model),
      provider: entry.provider,
      accuracy: entry.accuracy
    }));

    const results = items.map((row) => {
      const rowBits = bitsByModel.get(row.model);
      return {
        ...row,
        cells: items.map((col) => {
          if (row.model === col.model) {
            return { key: `${row.model}::${col.model}`, winRate: null, wins: 0, losses: 0, ties: 0, background: 'rgba(148,163,184,0.08)' };
          }
          const colBits = bitsByModel.get(col.model);
          if (!rowBits || !colBits) {
            return { key: `${row.model}::${col.model}`, winRate: null, wins: 0, losses: 0, ties: 0, background: 'rgba(148,163,184,0.08)' };
          }

          let wins = 0;
          let losses = 0;
          let ties = 0;
          const len = Math.min(rowBits.length, colBits.length);
          for (let i = 0; i < len; i += 1) {
            const a = rowBits[i] === '1';
            const b = colBits[i] === '1';
            if (a === b) {
              ties += 1;
            } else if (a && !b) {
              wins += 1;
            } else if (!a && b) {
              losses += 1;
            }
          }
          const denom = wins + losses;
          const winRate = denom ? wins / denom : 0.5;
          const diff = winRate - 0.5;
          const intensity = clamp(Math.abs(diff) / 0.25, 0, 1);
          const alpha = 0.08 + intensity * 0.58;
          const background = diff >= 0 ? `rgba(15,118,110,${alpha})` : `rgba(220,38,38,${alpha})`;

          return { key: `${row.model}::${col.model}`, winRate, wins, losses, ties, background };
        })
      };
    });

    return { items, results };
  }, [bitsByModel, limitedModels]);

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__card llm-dashboard__card--tight">
        <h2 className="llm-dashboard__card-title">Head-to-head win-rate matrix</h2>
        <p className="llm-dashboard__card-subtitle">
          Compares models image-by-image within a single prompting arm. Cells show the win-rate of the row model vs the column model (ties ignored).
        </p>

        {models.length > limitedModels.length && (
          <div className="llm-dashboard__notice">
            Showing <strong>{limitedModels.length}</strong> models (top by overall accuracy). Use the model selector above to compare a different subset.
          </div>
        )}

        <div className="llm-dashboard__filters">
          <div className="llm-dashboard__filter">
            <span className="llm-dashboard__filter-label">Arm</span>
            <select className="llm-dashboard__select" value={arm} onChange={(event) => setArm(Number(event.target.value))}>
              {ARM_KEYS.map((key) => (
                <option key={key} value={key}>
                  Arm {key}: {ARM_NAMES[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="llm-dashboard__table-shell llm-dashboard__table-shell--scroll">
          <table className="llm-dashboard__table llm-dashboard__h2h-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Model</th>
                {matrix.items.map((col) => (
                  <th key={col.model} style={{ textAlign: 'center', minWidth: 140 }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.results.map((row) => {
                const palette = getProviderPalette(row.provider);
                return (
                  <tr key={row.model}>
                    <td style={{ fontWeight: 800, color: palette.primary }}>
                      <div className="llm-dashboard__h2h-rowhead">
                        <span>{row.label}</span>
                        <span className="llm-dashboard__h2h-rowmeta">{formatPercent(row.accuracy, 1)} acc</span>
                      </div>
                    </td>
                    {row.cells.map((cell) => (
                      <td key={cell.key}>
                        <div
                          className="llm-dashboard__h2h-cell"
                          style={{
                            background: cell.background,
                            transition: prefersReducedMotion ? 'none' : 'transform 200ms var(--ease-spring)'
                          }}
                          title={
                            cell.winRate === null
                              ? '—'
                              : `Win-rate: ${(cell.winRate * 100).toFixed(1)}% (wins ${cell.wins}, losses ${cell.losses}, ties ${cell.ties})`
                          }
                        >
                          {cell.winRate === null ? (
                            <span className="llm-dashboard__h2h-dash">—</span>
                          ) : (
                            <>
                              <span className="llm-dashboard__h2h-primary">{formatPercent(cell.winRate, 1)}</span>
                              <span className="llm-dashboard__h2h-secondary">
                                {cell.wins}-{cell.losses}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ModelSelector({ data, selectedModels, setSelectedModels }) {
  const [providerFilter, setProviderFilter] = useState('all');

  const visibleModels = useMemo(() => {
    if (providerFilter === 'all') return data.modelSummary;
    return data.modelSummary.filter((entry) => entry.provider === providerFilter);
  }, [data.modelSummary, providerFilter]);

  const toggleModel = (modelId) => {
    setSelectedModels((current) => {
      if (current.includes(modelId)) return current.filter((id) => id !== modelId);
      return [...current, modelId];
    });
  };

  const selectAllVisible = () => {
    setSelectedModels((current) => {
      const visible = visibleModels.map((entry) => entry.model);
      const next = new Set([...current, ...visible]);
      return Array.from(next);
    });
  };

  const clearAll = () => setSelectedModels([]);

  return (
    <div className="llm-dashboard__selector">
      <div className="llm-dashboard__selector-head">
        <div className="llm-dashboard__filter">
          <span className="llm-dashboard__filter-label">Provider</span>
          <select className="llm-dashboard__select" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        <div className="llm-dashboard__selector-actions">
          <button type="button" className="llm-dashboard__ghost" onClick={selectAllVisible}>
            Select all
          </button>
          <button type="button" className="llm-dashboard__ghost" onClick={clearAll}>
            Clear
          </button>
        </div>
      </div>

      <div className="llm-dashboard__selector-grid">
        {visibleModels.map((entry) => {
          const palette = getProviderPalette(entry.provider);
          const checked = selectedModels.includes(entry.model);
          return (
            <label
              key={entry.model}
              className={`llm-dashboard__checkbox ${checked ? 'is-checked' : ''}`}
              style={{
                borderColor: checked ? palette.border : 'rgba(148,163,184,0.25)',
                background: checked ? palette.surface : 'rgba(255,255,255,0.35)'
              }}
            >
              <input type="checkbox" checked={checked} onChange={() => toggleModel(entry.model)} />
              <span className="llm-dashboard__checkbox-label" style={{ color: palette.primary }}>
                {shortModelName(entry.model)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function DermoscopyLLMEvaluationDashboard() {
  const prefersReducedMotion = useReducedMotion();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loadState, setLoadState] = useState({ status: 'loading', error: null });
  const [selectedModels, setSelectedModels] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadState({ status: 'loading', error: null });
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`Failed to load data (${response.status})`);
        const payload = await response.json();
        if (cancelled) return;
        setData(payload);
        setLoadState({ status: 'ready', error: null });
        setSelectedModels(payload.modelSummary.map((entry) => entry.model));
      } catch (error) {
        if (cancelled) return;
        setLoadState({ status: 'error', error: error instanceof Error ? error : new Error('Unknown error') });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'leaderboard', label: 'Leaderboard' },
      { id: 'heatmaps', label: 'Heatmaps' },
      { id: 'errors', label: 'Error analysis' },
      { id: 'performance', label: 'Tradeoffs' },
      { id: 'headtohead', label: 'Head-to-head' }
    ],
    []
  );

  const content = useMemo(() => {
    if (!data) return null;
    const requiresSelection = tab !== 'overview';
    if (requiresSelection && !selectedModels.length) {
      return (
        <div className="llm-dashboard__empty">
          <h2>No models selected</h2>
          <p>Choose one or more models to render the dashboard figures.</p>
        </div>
      );
    }

    if (tab === 'leaderboard') return <LeaderboardTab data={data} selectedModels={selectedModels} />;
    if (tab === 'heatmaps') return <HeatmapsTab data={data} selectedModels={selectedModels} />;
    if (tab === 'errors') return <ErrorsTab data={data} selectedModels={selectedModels} />;
    if (tab === 'performance') return <PerformanceTab data={data} selectedModels={selectedModels} />;
    if (tab === 'headtohead') return <HeadToHeadTab data={data} selectedModels={selectedModels} />;
    return <OverviewTab data={data} selectedModels={selectedModels} />;
  }, [data, selectedModels, tab]);

  return (
    <section className="llm-dashboard">
      <header className="llm-dashboard__header">
        <div className="llm-dashboard__header-title">
          <h2>Dermoscopy LLM Evaluation Dashboard</h2>
          <p>Filter models, compare prompting arms, and explore cost vs accuracy tradeoffs.</p>
        </div>
        <div className="llm-dashboard__chips" aria-label="Providers included">
          {Object.entries(PROVIDER_COLORS).map(([provider, palette]) => (
            <span
              key={provider}
              className="llm-dashboard__badge"
              style={{
                background: palette.surface,
                borderColor: palette.border,
                color: palette.primary
              }}
            >
              {palette.name}
            </span>
          ))}
        </div>
      </header>

      {loadState.status === 'loading' && (
        <div className="llm-dashboard__loading" role="status" aria-live="polite">
          Loading dashboard…
        </div>
      )}

      {loadState.status === 'error' && (
        <div className="llm-dashboard__loading llm-dashboard__loading--error" role="alert">
          <strong>Unable to load dashboard data.</strong>
          <span>{loadState.error?.message}</span>
          <button type="button" className="llm-dashboard__retry" onClick={() => setReloadToken((value) => value + 1)}>
            Retry loading
          </button>
        </div>
      )}

      {data && (
        <>
          <nav className="llm-dashboard__nav" role="tablist" aria-label="Dashboard sections">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`llm-dashboard__tab-btn ${tab === entry.id ? 'is-active' : ''}`}
                onClick={() => setTab(entry.id)}
                role="tab"
                aria-selected={tab === entry.id}
                aria-controls={`llm-panel-${entry.id}`}
                id={`llm-tab-${entry.id}`}
              >
                {entry.label}
              </button>
            ))}
          </nav>

          <ModelSelector data={data} selectedModels={selectedModels} setSelectedModels={setSelectedModels} />

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              id={`llm-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`llm-tab-${tab}`}
              className="llm-dashboard__panel"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <footer className="llm-dashboard__footer">
        <span>
          Dataset: Dermoscopy LLM evaluation summary.
        </span>
        <span>
          Total trials: <strong>{data ? formatNumber(data.overallStats.totalTrials) : '–'}</strong>
        </span>
      </footer>

      <style>{`
        .llm-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--surface-border);
          background: var(--surface-bg);
          padding: 1.5rem 1.35rem;
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }

        .llm-dashboard__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .llm-dashboard__header-title h2 {
          margin: 0;
          font-size: 1.45rem;
          letter-spacing: -0.02em;
          color: var(--text-color);
        }

        .llm-dashboard__header-title p {
          margin: 0.35rem 0 0;
          color: var(--muted-text);
          max-width: 46rem;
        }

        .llm-dashboard__chips {
          display: inline-flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .llm-dashboard__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          font-size: 0.8rem;
          font-weight: 650;
        }

        .llm-dashboard__nav {
          display: flex;
          gap: 0.25rem;
          padding: 0.3rem;
          background: rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          flex-wrap: wrap;
        }

        .llm-dashboard__tab-btn {
          flex: 1;
          min-width: 140px;
          border: 0;
          background: transparent;
          padding: 0.7rem 0.9rem;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 650;
          color: var(--muted-text);
          transition: transform 160ms var(--ease-out), box-shadow 160ms var(--ease-out), background 160ms var(--ease-out), color 160ms var(--ease-out);
        }

        .llm-dashboard__tab-btn:hover {
          transform: translateY(-1px);
          color: var(--text-color);
        }

        .llm-dashboard__tab-btn.is-active {
          background: rgba(255, 255, 255, 0.9);
          color: rgba(15, 23, 42, 0.9);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        html[data-theme='dark'] .llm-dashboard__tab-btn.is-active {
          background: rgba(15, 23, 42, 0.65);
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__selector {
          border-radius: var(--radius-lg);
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.55);
          padding: 1rem;
        }

        html[data-theme='dark'] .llm-dashboard__selector {
          background: rgba(12, 26, 41, 0.6);
          border-color: rgba(148, 163, 184, 0.16);
        }

        .llm-dashboard__selector-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 0.9rem;
        }

        .llm-dashboard__selector-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .llm-dashboard__filter {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .llm-dashboard__filter-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(56, 189, 248, 0.9);
        }

        .llm-dashboard__select {
          padding: 0.55rem 0.75rem;
          border-radius: 0.85rem;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-color);
          font-weight: 600;
        }

        html[data-theme='dark'] .llm-dashboard__select {
          background: rgba(15, 23, 42, 0.55);
          border-color: rgba(148, 163, 184, 0.2);
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__ghost {
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(255, 255, 255, 0.75);
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
          font-weight: 650;
          cursor: pointer;
          transition: transform 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
        }

        html[data-theme='dark'] .llm-dashboard__ghost {
          background: rgba(15, 23, 42, 0.45);
          border-color: rgba(148, 163, 184, 0.18);
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__ghost:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
        }

        .llm-dashboard__selector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 0.5rem;
        }

        .llm-dashboard__checkbox {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.75rem;
          border-radius: 0.95rem;
          border: 1px solid rgba(148, 163, 184, 0.25);
          cursor: pointer;
          transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out);
        }

        .llm-dashboard__checkbox:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
        }

        .llm-dashboard__checkbox input {
          accent-color: rgba(37, 99, 235, 0.9);
        }

        .llm-dashboard__checkbox-label {
          font-weight: 650;
          font-size: 0.92rem;
        }

        .llm-dashboard__panel {
          min-height: 440px;
          padding-top: 0.35rem;
        }

        .llm-dashboard__tab {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .llm-dashboard__stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }

        .llm-dashboard__stat {
          border-radius: var(--radius-lg);
          border: 1px solid rgba(148, 163, 184, 0.18);
          padding: 0.9rem 1rem;
          background: rgba(255, 255, 255, 0.6);
        }

        html[data-theme='dark'] .llm-dashboard__stat {
          background: rgba(15, 23, 42, 0.55);
          border-color: rgba(148, 163, 184, 0.14);
        }

        .llm-dashboard__stat-value {
          font-size: 1.6rem;
          font-weight: 780;
          letter-spacing: -0.02em;
          color: rgba(15, 23, 42, 0.88);
        }

        html[data-theme='dark'] .llm-dashboard__stat-value {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__stat-label {
          margin-top: 0.35rem;
          font-size: 0.72rem;
          font-weight: 750;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted-text);
        }

        .llm-dashboard__stat--primary .llm-dashboard__stat-value {
          color: rgba(37, 99, 235, 0.92);
        }

        .llm-dashboard__stat--success .llm-dashboard__stat-value {
          color: rgba(15, 118, 110, 0.92);
        }

        .llm-dashboard__grid-two {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.25rem;
        }

        .llm-dashboard__card {
          border-radius: var(--radius-xl);
          border: 1px solid rgba(148, 163, 184, 0.18);
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.6);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
        }

        html[data-theme='dark'] .llm-dashboard__card {
          background: rgba(12, 26, 41, 0.62);
          border-color: rgba(148, 163, 184, 0.14);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
        }

        .llm-dashboard__card--tight {
          padding: 1rem 1.1rem;
        }

        .llm-dashboard__card--alert {
          background: rgba(254, 226, 226, 0.55);
          border-color: rgba(220, 38, 38, 0.18);
        }

        html[data-theme='dark'] .llm-dashboard__card--alert {
          background: rgba(76, 5, 25, 0.4);
          border-color: rgba(248, 113, 113, 0.22);
        }

        .llm-dashboard__card-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 750;
          color: rgba(15, 23, 42, 0.9);
        }

        html[data-theme='dark'] .llm-dashboard__card-title {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__card-subtitle {
          margin: 0.4rem 0 0.9rem;
          color: var(--muted-text);
          font-size: 0.92rem;
        }

        .llm-dashboard__bar-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .llm-dashboard__bar-row {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .llm-dashboard__bar-meta {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 650;
          color: rgba(15, 23, 42, 0.84);
        }

        html[data-theme='dark'] .llm-dashboard__bar-meta {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__bar-label {
          color: inherit;
        }

        .llm-dashboard__bar-value {
          color: rgba(100, 116, 139, 0.85);
          font-weight: 750;
        }

        html[data-theme='dark'] .llm-dashboard__bar-value {
          color: rgba(148, 185, 209, 0.78);
        }

        .llm-dashboard__bar-track {
          height: 12px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.18);
          overflow: hidden;
        }

        .llm-dashboard__bar-fill {
          height: 100%;
          border-radius: 999px;
          width: 0;
          transition: width 520ms var(--ease-spring);
        }

        @media (prefers-reduced-motion: reduce) {
          .llm-dashboard__bar-fill,
          .llm-dashboard__ci-fill {
            transition: none;
          }
        }

        .llm-dashboard__legend {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.9rem;
          font-size: 0.85rem;
          color: var(--muted-text);
        }

        .llm-dashboard__legend--heat {
          margin-top: 1.25rem;
        }

        .llm-dashboard__legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 650;
        }

        .llm-dashboard__legend-swatch {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.15);
        }

        .llm-dashboard__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          align-items: flex-end;
        }

        .llm-dashboard__filters--tabs {
          justify-content: flex-start;
        }

        .llm-dashboard__notice {
          padding: 0.8rem 1rem;
          border-radius: var(--radius-lg);
          background: rgba(254, 243, 199, 0.65);
          border: 1px solid rgba(245, 158, 11, 0.18);
          color: rgba(146, 64, 14, 0.92);
          font-weight: 600;
        }

        html[data-theme='dark'] .llm-dashboard__notice {
          background: rgba(92, 45, 10, 0.55);
          border-color: rgba(251, 191, 36, 0.2);
          color: rgba(253, 230, 138, 0.92);
        }

        .llm-dashboard__table-shell {
          overflow: hidden;
          border-radius: var(--radius-xl);
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.55);
        }

        html[data-theme='dark'] .llm-dashboard__table-shell {
          background: rgba(12, 26, 41, 0.62);
          border-color: rgba(148, 163, 184, 0.14);
        }

        .llm-dashboard__table-shell--scroll {
          overflow-x: auto;
        }

        .llm-dashboard__table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.9rem;
        }

        .llm-dashboard__table th {
          text-align: left;
          padding: 0.85rem 0.9rem;
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(100, 116, 139, 0.9);
          background: rgba(148, 163, 184, 0.16);
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .llm-dashboard__table td {
          padding: 0.85rem 0.9rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
          color: rgba(15, 23, 42, 0.85);
        }

        html[data-theme='dark'] .llm-dashboard__table td {
          color: rgba(226, 242, 254, 0.9);
          border-bottom-color: rgba(148, 163, 184, 0.12);
        }

        .llm-dashboard__table--compact th,
        .llm-dashboard__table--compact td {
          padding: 0.65rem 0.75rem;
        }

        .llm-dashboard__table-empty {
          text-align: center;
          padding: 1.1rem 0.9rem;
          color: var(--muted-text);
          font-weight: 650;
        }

        .llm-dashboard__ci-list {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .llm-dashboard__ci-row {
          display: grid;
          grid-template-columns: minmax(190px, 240px) minmax(0, 1fr) minmax(130px, 190px);
          gap: 0.95rem;
          align-items: center;
          padding: 0.25rem 0;
        }

        @media (max-width: 720px) {
          .llm-dashboard__ci-row {
            grid-template-columns: 1fr;
          }
        }

        .llm-dashboard__ci-label-main {
          font-weight: 850;
          color: rgba(15, 23, 42, 0.9);
        }

        html[data-theme='dark'] .llm-dashboard__ci-label-main {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__ci-label-sub {
          display: block;
          margin-top: 0.2rem;
          font-size: 0.78rem;
          font-weight: 650;
          color: var(--muted-text);
        }

        .llm-dashboard__ci-track {
          position: relative;
          height: 14px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.18);
          overflow: hidden;
        }

        html[data-theme='dark'] .llm-dashboard__ci-track {
          background: rgba(148, 163, 184, 0.12);
        }

        .llm-dashboard__ci-fill {
          position: absolute;
          inset: 0 auto 0 0;
          height: 100%;
          border-radius: 999px;
          width: 0;
          transition: width 520ms var(--ease-spring);
        }

        .llm-dashboard__ci-error {
          position: absolute;
          top: 50%;
          height: 0;
          border-top: 2px solid rgba(15, 23, 42, 0.68);
          transform: translateY(-50%);
        }

        html[data-theme='dark'] .llm-dashboard__ci-error {
          border-top-color: rgba(226, 242, 254, 0.72);
        }

        .llm-dashboard__ci-cap {
          position: absolute;
          top: -6px;
          width: 2px;
          height: 12px;
          background: rgba(15, 23, 42, 0.68);
        }

        html[data-theme='dark'] .llm-dashboard__ci-cap {
          background: rgba(226, 242, 254, 0.72);
        }

        .llm-dashboard__ci-cap--left {
          left: 0;
        }

        .llm-dashboard__ci-cap--right {
          right: 0;
        }

        .llm-dashboard__ci-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
          font-weight: 850;
          color: rgba(15, 23, 42, 0.9);
        }

        html[data-theme='dark'] .llm-dashboard__ci-value {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__ci-value-sub {
          font-size: 0.78rem;
          font-weight: 650;
          color: var(--muted-text);
        }

        .llm-dashboard__paired-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.9rem;
        }

        .llm-dashboard__paired-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .llm-dashboard__paired-row {
          display: grid;
          grid-template-columns: minmax(190px, 240px) minmax(0, 1fr) minmax(110px, 140px);
          gap: 0.95rem;
          align-items: center;
        }

        @media (max-width: 720px) {
          .llm-dashboard__paired-row {
            grid-template-columns: 1fr;
          }
        }

        .llm-dashboard__paired-label {
          font-weight: 850;
        }

        .llm-dashboard__paired-bars {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .llm-dashboard__paired-track {
          position: relative;
          height: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.18);
          overflow: hidden;
        }

        html[data-theme='dark'] .llm-dashboard__paired-track {
          background: rgba(148, 163, 184, 0.12);
        }

        .llm-dashboard__paired-marker {
          position: absolute;
          top: -6px;
          bottom: -6px;
          width: 2px;
          background: rgba(15, 23, 42, 0.22);
        }

        html[data-theme='dark'] .llm-dashboard__paired-marker {
          background: rgba(226, 242, 254, 0.22);
        }

        .llm-dashboard__paired-fill {
          height: 100%;
          border-radius: 999px;
        }

        .llm-dashboard__paired-values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
          font-weight: 800;
        }

        .llm-dashboard__stacked-list {
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
        }

        .llm-dashboard__stacked-row {
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        html[data-theme='dark'] .llm-dashboard__stacked-row {
          border-bottom-color: rgba(148, 163, 184, 0.12);
        }

        .llm-dashboard__stacked-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: baseline;
          margin-bottom: 0.55rem;
        }

        .llm-dashboard__stacked-label {
          font-weight: 900;
        }

        .llm-dashboard__stacked-total {
          color: var(--muted-text);
          font-weight: 650;
          font-size: 0.85rem;
        }

        .llm-dashboard__stacked-track {
          height: 14px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(148, 163, 184, 0.14);
          display: flex;
        }

        html[data-theme='dark'] .llm-dashboard__stacked-track {
          background: rgba(148, 163, 184, 0.1);
        }

        .llm-dashboard__stacked-segment {
          height: 100%;
        }

        .llm-dashboard__stacked-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem 0.9rem;
          margin-top: 0.65rem;
          color: var(--muted-text);
          font-size: 0.82rem;
          font-weight: 650;
        }

        .llm-dashboard__stacked-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .llm-dashboard__stacked-swatch {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }

        .llm-dashboard__h2h-rowhead {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .llm-dashboard__h2h-rowmeta {
          font-size: 0.78rem;
          color: var(--muted-text);
          font-weight: 650;
        }

        .llm-dashboard__h2h-cell {
          padding: 0.55rem 0.6rem;
          border-radius: 0.85rem;
          text-align: center;
          font-weight: 850;
          color: rgba(15, 23, 42, 0.92);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
          min-height: 3.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.18rem;
        }

        html[data-theme='dark'] .llm-dashboard__h2h-cell {
          color: rgba(226, 242, 254, 0.92);
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.35);
        }

        .llm-dashboard__h2h-cell:hover {
          transform: translateY(-1px);
        }

        .llm-dashboard__h2h-secondary {
          font-size: 0.72rem;
          font-weight: 750;
          opacity: 0.85;
        }

        .llm-dashboard__h2h-dash {
          opacity: 0.55;
          font-weight: 800;
        }

        .llm-dashboard__row-top td {
          background: rgba(226, 232, 240, 0.22);
        }

        html[data-theme='dark'] .llm-dashboard__row-top td {
          background: rgba(15, 23, 42, 0.35);
        }

        .llm-dashboard__rank {
          display: inline-flex;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          align-items: center;
          justify-content: center;
          background: rgba(148, 163, 184, 0.18);
          font-weight: 800;
        }

        .llm-dashboard__th-sort {
          user-select: none;
        }

        .llm-dashboard__sort-button {
          appearance: none;
          border: 0;
          background: transparent;
          font: inherit;
          color: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          width: 100%;
          padding: 0;
          text-align: left;
        }

        .llm-dashboard__sort-button:focus-visible {
          outline: 2px solid rgba(56, 189, 248, 0.6);
          outline-offset: 3px;
          border-radius: 0.6rem;
        }

        .llm-dashboard__sort-indicator {
          font-weight: 900;
          opacity: 0.78;
        }

        .llm-dashboard__pill {
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255, 255, 255, 0.65);
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-weight: 750;
          cursor: pointer;
          transition: transform 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
        }

        html[data-theme='dark'] .llm-dashboard__pill {
          background: rgba(15, 23, 42, 0.55);
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__pill.is-active {
          background: rgba(37, 99, 235, 0.16);
          border-color: rgba(37, 99, 235, 0.25);
        }

        .llm-dashboard__pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
        }

        .llm-dashboard__heat-cell {
          padding: 0.65rem 0.6rem;
          border-radius: 0.85rem;
          text-align: center;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.9);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
        }

        html[data-theme='dark'] .llm-dashboard__heat-cell {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__matrix-cell {
          padding: 0.55rem 0.6rem;
          border-radius: 0.85rem;
          text-align: center;
          font-weight: 850;
          color: rgba(15, 23, 42, 0.92);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
          min-height: 3.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.18rem;
        }

        html[data-theme='dark'] .llm-dashboard__matrix-cell {
          color: rgba(226, 242, 254, 0.92);
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.35);
        }

        .llm-dashboard__matrix-secondary {
          font-size: 0.72rem;
          font-weight: 700;
          opacity: 0.85;
        }

        .llm-dashboard__scatter {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: var(--radius-xl);
          margin-top: 1rem;
        }

        .llm-dashboard__scatter svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .llm-dashboard__tooltip {
          position: absolute;
          min-width: 190px;
          transform: translate(12px, -105%);
          padding: 0.75rem 0.85rem;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.28);
          box-shadow: 0 22px 38px rgba(15, 23, 42, 0.18);
          pointer-events: none;
          color: rgba(15, 23, 42, 0.9);
          font-size: 0.85rem;
        }

        html[data-theme='dark'] .llm-dashboard__tooltip {
          background: rgba(15, 23, 42, 0.92);
          border-color: rgba(148, 163, 184, 0.22);
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__tooltip-title {
          font-weight: 850;
          margin-bottom: 0.55rem;
        }

        .llm-dashboard__tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.2rem;
        }

        .llm-dashboard__loading {
          padding: 1rem 1.1rem;
          border-radius: var(--radius-lg);
          background: rgba(148, 163, 184, 0.14);
          color: var(--muted-text);
          font-weight: 650;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .llm-dashboard__loading--error {
          background: rgba(254, 226, 226, 0.55);
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .llm-dashboard__link {
          font-weight: 750;
          text-decoration: underline;
        }

        .llm-dashboard__retry {
          border: 0;
          padding: 0;
          background: none;
          font: inherit;
          color: inherit;
          font-weight: 750;
          text-decoration: underline;
          cursor: pointer;
          align-self: flex-start;
        }

        .llm-dashboard__retry:hover {
          color: rgba(37, 99, 235, 0.9);
        }

        .llm-dashboard__empty {
          padding: 1.1rem;
          border-radius: var(--radius-lg);
          border: 1px dashed rgba(148, 163, 184, 0.35);
          color: var(--muted-text);
        }

        .llm-dashboard__empty h2 {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          color: rgba(15, 23, 42, 0.88);
        }

        html[data-theme='dark'] .llm-dashboard__empty h2 {
          color: rgba(226, 242, 254, 0.92);
        }

        .llm-dashboard__impact {
          margin: 0.65rem 0 0;
          font-size: 1.05rem;
          color: rgba(127, 29, 29, 0.9);
          font-weight: 650;
        }

        html[data-theme='dark'] .llm-dashboard__impact {
          color: rgba(254, 202, 202, 0.92);
        }

        .llm-dashboard__impact strong {
          display: inline-block;
          min-width: 4rem;
          font-size: 1.7rem;
          margin-right: 0.35rem;
        }

        .llm-dashboard__impact-note {
          margin: 1rem 0 0;
          color: rgba(127, 29, 29, 0.8);
        }

        html[data-theme='dark'] .llm-dashboard__impact-note {
          color: rgba(254, 202, 202, 0.78);
        }

        .llm-dashboard__footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--muted-text);
          border-top: 1px solid rgba(148, 163, 184, 0.18);
          padding-top: 1rem;
          margin-top: 0.5rem;
        }

        .llm-dashboard__footer a {
          text-decoration: underline;
          font-weight: 650;
        }

        @media (max-width: 720px) {
          .llm-dashboard {
            padding: 1.2rem 1rem;
          }

          .llm-dashboard__tab-btn {
            min-width: 120px;
          }

          .llm-dashboard__selector-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
