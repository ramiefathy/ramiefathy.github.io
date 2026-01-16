import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const DATA_URL = '/data/dermoscopy-llm-eval.json';

const PROVIDER_COLORS = {
  openai: {
    name: 'OpenAI',
    primary: '#2563eb',
    surface: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.25)'
  },
  gemini: {
    name: 'Gemini',
    primary: '#16a34a',
    surface: 'rgba(22, 163, 74, 0.12)',
    border: 'rgba(22, 163, 74, 0.25)'
  }
};

const ARM_NAMES = {
  1: 'Zero-shot (label list)',
  2: 'Few-shot (exemplars)',
  3: 'Primer board',
  4: 'Anti-anchoring',
  5: 'Zero-shot (free-form)',
  6: 'Few-shot (free-form)'
};

const ARM_KEYS = [1, 2, 3, 4, 5, 6];

const DIAG_KEYS = [
  'basal_cell_carcinoma',
  'melanoma',
  'squamous_cell_carcinoma',
  'seborrheic_keratosis',
  'melanocytic_nevus',
  'dermatofibroma',
  'verruca_vulgaris',
  'lichen_planus'
];

const DIAG_LABELS = {
  basal_cell_carcinoma: 'BCC',
  melanoma: 'Melanoma',
  squamous_cell_carcinoma: 'SCC',
  seborrheic_keratosis: 'Seb. Keratosis',
  melanocytic_nevus: 'Nevus',
  dermatofibroma: 'Dermatofibroma',
  verruca_vulgaris: 'Verruca',
  lichen_planus: 'Lichen Planus',
  'basal cell carcinoma': 'BCC',
  'squamous cell carcinoma': 'SCC',
  'seborrheic keratosis': 'Seb. Keratosis',
  'melanocytic nevus': 'Nevus',
  'verruca vulgaris': 'Verruca',
  'lichen planus': 'Lichen Planus'
};

const MODEL_SHORT_NAMES = {
  'gemini-3-pro-preview-low-thinking-media-high': 'G3P-LT-HiMed',
  'gemini-3-pro-preview-high-thinking-media-high': 'G3P-HT-HiMed',
  'gemini-3-pro-preview-high-thinking': 'G3P-HT',
  'gemini-3-pro-preview-low-thinking': 'G3P-LT',
  'gemini-3-pro-image-preview': 'G3P-Img',
  'gemini-2.5-pro': 'Gemini-2.5-Pro',
  'gemini-2.5-flash': 'Gemini-2.5-Flash',
  'gemini-2.5-flash-lite': 'Gemini-2.5-FL',
  'gemini-2.0-flash': 'Gemini-2.0-Flash',
  'gemini-2.0-flash-lite': 'Gemini-2.0-FL',
  'o4-mini-2025-04-16': 'o4-mini'
};

function shortModelName(name) {
  return MODEL_SHORT_NAMES[name] || name;
}

function getProviderPalette(provider) {
  return PROVIDER_COLORS[provider] || { name: provider, primary: 'var(--primary-600)', surface: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' };
}

function formatPercent(value, digits = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(digits)}%`;
}

function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return value.toLocaleString();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function StatCard({ value, label, tone = 'neutral', format = 'number' }) {
  const formatted = useMemo(() => {
    if (format === 'percent') return formatPercent(value, 1);
    if (format === 'currency') return typeof value === 'number' ? `$${value.toFixed(2)}` : '–';
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
  const derivedMax = useMemo(() => {
    if (typeof maxValue === 'number' && maxValue > 0) return maxValue;
    return Math.max(1, ...items.map((item) => (typeof item.value === 'number' ? item.value : 0)));
  }, [items, maxValue]);

  return (
    <div className="llm-dashboard__bar-list">
      {items.map((item) => {
        const width = derivedMax ? clamp((item.value / derivedMax) * 100, 0, 100) : 0;
        return (
          <div key={item.key || item.label} className="llm-dashboard__bar-row">
            <div className="llm-dashboard__bar-meta">
              <span className="llm-dashboard__bar-label">{item.label}</span>
              <span className="llm-dashboard__bar-value">{valueFormatter(item.value, item)}</span>
            </div>
            <div className="llm-dashboard__bar-track" aria-hidden="true">
              <div className="llm-dashboard__bar-fill" style={{ width: `${width}%`, background: item.color }} />
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
  yFormatter = (v) => String(v)
}) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [activePoint, setActivePoint] = useState(null);

  const chart = useMemo(() => {
    const xValues = points.map((p) => p.x).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    const yValues = points.map((p) => p.y).filter((v) => typeof v === 'number' && !Number.isNaN(v));
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
            <stop offset="100%" stopColor="rgba(217,70,239,0.55)" />
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
            <span>Accuracy</span>
            <strong>{formatPercent(tooltip.point.y, 1)}</strong>
          </div>
          <div className="llm-dashboard__tooltip-row">
            <span>Cost</span>
            <strong>{tooltip.point.costLabel}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ data }) {
  const stats = data.overallStats;

  const arms = useMemo(() => {
    return data.armSummary.map((entry) => {
      const color = entry.accuracy > 0.7 ? 'rgba(34,197,94,0.9)' : entry.accuracy > 0.6 ? 'rgba(245,158,11,0.9)' : 'rgba(239,68,68,0.9)';
      return { label: entry.name, value: entry.accuracy, color };
    });
  }, [data.armSummary]);

  const diagnoses = useMemo(() => {
    return data.diagnosisSummary.map((entry) => {
      return {
        label: DIAG_LABELS[entry.diagnosis] || entry.diagnosis,
        value: entry.accuracy,
        color: entry.is_malignant ? 'rgba(220,38,38,0.9)' : 'rgba(22,163,74,0.9)'
      };
    });
  }, [data.diagnosisSummary]);

  return (
    <div className="llm-dashboard__tab">
      <div className="llm-dashboard__stats-grid">
        <StatCard value={stats.totalTrials} label="Total trials" />
        <StatCard value={stats.uniqueModels} label="Models" />
        <StatCard value={stats.promptingArms} label="Prompt arms" />
        <StatCard value={stats.overallAccuracy} label="Accuracy" tone="success" format="percent" />
        <StatCard value={stats.malignantSensitivity} label="Sensitivity" tone="primary" format="percent" />
        <StatCard value={stats.benignSpecificity} label="Specificity" tone="success" format="percent" />
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
              <span className="llm-dashboard__legend-swatch" style={{ background: 'rgba(22,163,74,0.9)' }} />
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

  const rankedData = useMemo(() => {
    let rows = data.modelSummary
      .filter((model) => selectedModels.includes(model.model))
      .map((model) => {
        let displayAccuracy = model.accuracy;
        if (rankBy === 'diagnosis' && diagFilter !== 'all') {
          const byDiag = data.modelDiagMatrix.find((entry) => entry.model === model.model);
          displayAccuracy = byDiag ? byDiag[diagFilter] || 0 : 0;
        }
        if (rankBy === 'arm' && armFilter !== 'all') {
          const byArm = data.modelArmMatrix.find((entry) => entry.model === model.model);
          displayAccuracy = byArm ? byArm[`arm${armFilter}`] || 0 : 0;
        }
        return { ...model, displayAccuracy };
      });

    const key = sortKey === 'accuracy' ? 'displayAccuracy' : sortKey;
    rows.sort((a, b) => {
      const aValue = a[key] ?? 0;
      const bValue = b[key] ?? 0;
      return sortDir === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return rows.map((row, index) => ({ ...row, rank: index + 1 }));
  }, [armFilter, data.modelArmMatrix, data.modelDiagMatrix, data.modelSummary, diagFilter, rankBy, selectedModels, sortDir, sortKey]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  };

  const chartItems = useMemo(() => {
    return rankedData.slice(0, 12).map((row) => {
      const palette = getProviderPalette(row.provider);
      return {
        key: row.model,
        label: shortModelName(row.model),
        value: row.displayAccuracy,
        color: palette.primary
      };
    });
  }, [rankedData]);

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
              <th>Rank</th>
              <th>Model</th>
              <th>Provider</th>
              <th className="llm-dashboard__th-sort" onClick={() => handleSort('accuracy')} role="button" tabIndex={0}>
                Accuracy {sortKey === 'accuracy' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th className="llm-dashboard__th-sort" onClick={() => handleSort('sensitivity')} role="button" tabIndex={0}>
                Sensitivity
              </th>
              <th className="llm-dashboard__th-sort" onClick={() => handleSort('specificity')} role="button" tabIndex={0}>
                Specificity
              </th>
              <th className="llm-dashboard__th-sort" onClick={() => handleSort('mean_latency')} role="button" tabIndex={0}>
                Latency
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
        <h2 className="llm-dashboard__card-title">Top model accuracy comparison</h2>
        <p className="llm-dashboard__card-subtitle">Visual summary of the top 12 entries in the current ranking view.</p>
        <BarList items={chartItems} />
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

function ErrorsTab({ data }) {
  const total = data.overallStats.totalTrials;

  const items = useMemo(() => {
    const palette = {
      correct: 'rgba(22,163,74,0.9)',
      within_malignant: 'rgba(245,158,11,0.9)',
      malignant_to_benign: 'rgba(220,38,38,0.9)',
      benign_to_malignant: 'rgba(124,58,237,0.9)',
      within_benign: 'rgba(37,99,235,0.9)',
      pred_other: 'rgba(100,116,139,0.85)'
    };

    return data.errorDistribution.map((entry) => {
      const label = entry.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        key: entry.type,
        label,
        value: entry.count,
        color: palette[entry.type] || 'rgba(100,116,139,0.85)',
        percent: total ? (entry.count / total) * 100 : 0
      };
    });
  }, [data.errorDistribution, total]);

  const missedMalignancies = items.find((entry) => entry.key === 'malignant_to_benign');
  const falseAlarms = items.find((entry) => entry.key === 'benign_to_malignant');
  const cancerConfusions = items.find((entry) => entry.key === 'within_malignant');

  return (
    <div className="llm-dashboard__tab llm-dashboard__grid-two">
      <div className="llm-dashboard__card">
        <h2 className="llm-dashboard__card-title">Error type distribution</h2>
        <BarList
          items={items.map((entry) => ({
            key: entry.key,
            label: entry.label,
            value: entry.value,
            color: entry.color,
            percent: entry.percent
          }))}
          maxValue={Math.max(...items.map((entry) => entry.value), 1)}
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
        <p className="llm-dashboard__impact-note">
          These are aggregate error counts over all models and prompting arms, intended for research discussion rather than clinical deployment decisions.
        </p>
      </div>
    </div>
  );
}

function PerformanceTab({ data, selectedModels }) {
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

      <div className="llm-dashboard__card">
        <h2 className="llm-dashboard__card-title">Mean response latency</h2>
        <BarList
          items={latencyItems}
          maxValue={Math.max(...latencyItems.map((entry) => entry.value), 1)}
          valueFormatter={(value, item) => `${value.toFixed(2)}s (median ${item.median.toFixed(2)}s)`}
        />
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
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
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'leaderboard', label: 'Leaderboard' },
      { id: 'heatmaps', label: 'Heatmaps' },
      { id: 'errors', label: 'Error analysis' },
      { id: 'performance', label: 'Cost & latency' }
    ],
    []
  );

  const content = useMemo(() => {
    if (!data) return null;
    const requiresSelection = tab === 'leaderboard' || tab === 'heatmaps' || tab === 'performance';
    if (requiresSelection && !selectedModels.length) {
      return (
        <div className="llm-dashboard__empty">
          <h2>No models selected</h2>
          <p>Choose one or more models to render the leaderboard, heatmaps, and performance views.</p>
        </div>
      );
    }

    if (tab === 'leaderboard') return <LeaderboardTab data={data} selectedModels={selectedModels} />;
    if (tab === 'heatmaps') return <HeatmapsTab data={data} selectedModels={selectedModels} />;
    if (tab === 'errors') return <ErrorsTab data={data} />;
    if (tab === 'performance') return <PerformanceTab data={data} selectedModels={selectedModels} />;
    return <OverviewTab data={data} />;
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
          <a href={DATA_URL} className="llm-dashboard__link">
            View raw JSON
          </a>
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
          Loaded from <a href={DATA_URL}>study summary JSON</a>.
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
          color: rgba(22, 163, 74, 0.92);
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
          cursor: pointer;
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
