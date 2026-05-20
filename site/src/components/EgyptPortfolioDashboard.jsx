import { useEffect, useMemo, useState } from 'react';
import {
  CASES,
  COVER_HEADINGS,
  COVER_LETTER,
  DECK_HREF,
  KPIS,
  NINETY_DAY,
  PARTNERS,
  PHASES,
  REFERENCES,
  REF_CATEGORIES,
  ROADMAP_PERIODS,
  STRATEGIC_BASELINE,
  VENTURES,
  VENTURE_TIMELINE
} from '../data/strategy/egypt-portfolio.js';

const NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'matrix', label: 'Matrix' },
  { key: 'ventures', label: 'Ventures' },
  { key: 'roadmap', label: 'Roadmap' },
  { key: 'partners', label: 'Partners' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'sources', label: 'Source materials' }
];

const LIGHT_TEXT_COLORS = new Set(['#C9A24A', '#A88652', '#7A8A6F']);

function getPhase(key) {
  return PHASES.find((phase) => phase.key === key) ?? PHASES[0];
}

function getReferenceMap() {
  return Object.fromEntries(REFERENCES.map(([id, text, url, cat]) => [id, { id, text, url, cat }]));
}

function isLightPhase(color) {
  return LIGHT_TEXT_COLORS.has(color);
}

export default function EgyptPortfolioDashboard() {
  const [view, setView] = useState('overview');
  const [selectedVenture, setSelectedVenture] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [firstCohortOnly, setFirstCohortOnly] = useState(false);

  const refsById = useMemo(getReferenceMap, []);
  const refToVentures = useMemo(() => {
    const map = {};
    for (const venture of VENTURES) {
      for (const refId of venture.evidence) {
        if (!map[refId]) map[refId] = [];
        map[refId].push(venture);
      }
    }
    return map;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const nextView = params.get('view');
    const ventureId = params.get('venture');
    if (NAV.some((item) => item.key === nextView)) setView(nextView);
    if (ventureId) {
      const venture = VENTURES.find((item) => item.id === ventureId);
      if (venture) setSelectedVenture(venture);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('view', view);
    if (selectedVenture) params.set('venture', selectedVenture.id);
    window.history.replaceState(null, '', `#${params.toString()}`);
  }, [view, selectedVenture]);

  const openReference = (id) => {
    const ref = typeof id === 'string' ? refsById[id] : id;
    if (ref) setSelectedReference(ref);
  };

  return (
    <div className="egypt-app">
      <style>{styles}</style>
      <aside className="egypt-sidebar" aria-label="Dashboard navigation">
        <div className="egypt-brand">
          <div className="egypt-brand__seal">EG</div>
          <div>
            <strong>Egypt AI & Tech</strong>
            <span>Opportunity portfolio</span>
          </div>
        </div>
        <p className="egypt-brand__line">Export first, infrastructure second, sovereignty by design.</p>
        <nav className="egypt-nav">
          {NAV.map((item) => (
            <button key={item.key} type="button" className={view === item.key ? 'is-active' : ''} onClick={() => setView(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button className={`cohort-toggle ${firstCohortOnly ? 'is-on' : ''}`} type="button" onClick={() => setFirstCohortOnly((value) => !value)}>
          <span>First-cohort highlight</span>
          <small>{firstCohortOnly ? 'Showing launch wave only' : 'Show launch wave only'}</small>
        </button>
      </aside>

      <section className="egypt-panel">
        <Hero setView={setView} />
        <div className="egypt-mobile-tabs" role="tablist" aria-label="Dashboard sections">
          {NAV.map((item) => (
            <button key={item.key} type="button" aria-selected={view === item.key} onClick={() => setView(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        {view === 'overview' && <OverviewView refsById={refsById} openReference={openReference} setView={setView} setSelectedVenture={setSelectedVenture} />}
        {view === 'matrix' && <MatrixView firstCohortOnly={firstCohortOnly} setSelectedVenture={setSelectedVenture} />}
        {view === 'ventures' && <VenturesView firstCohortOnly={firstCohortOnly} setSelectedVenture={setSelectedVenture} />}
        {view === 'roadmap' && <RoadmapView firstCohortOnly={firstCohortOnly} setSelectedVenture={setSelectedVenture} />}
        {view === 'partners' && <PartnersView refsById={refsById} openReference={openReference} />}
        {view === 'evidence' && <EvidenceView refToVentures={refToVentures} setSelectedVenture={setSelectedVenture} />}
        {view === 'sources' && <SourceMaterials />}
      </section>

      {selectedVenture && <VentureDrawer venture={selectedVenture} onClose={() => setSelectedVenture(null)} refsById={refsById} openReference={openReference} />}
      {selectedReference && (
        <ReferenceModal
          refItem={selectedReference}
          ventures={refToVentures[selectedReference.id] ?? []}
          onClose={() => setSelectedReference(null)}
          setSelectedVenture={setSelectedVenture}
        />
      )}
    </div>
  );
}

function Hero({ setView }) {
  return (
    <header className="egypt-hero2">
      <div className="eyebrow">Strategy dashboard · May 2026 · unlisted</div>
      <h1>Egypt’s applied-AI window, organized as an execution portfolio.</h1>
      <p>
        A unified dashboard for the opportunity model, venture slate, evidence base, source deck, and cover letter. The deck is a source artifact;
        the dashboard is the decision surface.
      </p>
      <div className="hero-actions">
        <button type="button" onClick={() => setView('matrix')}>Explore matrix</button>
        <button type="button" className="secondary" onClick={() => setView('sources')}>View deck + cover letter</button>
        <a className="secondary" href="/strategy/egypt-ai-portfolio/podcast">Listen to podcast series</a>
      </div>
    </header>
  );
}

function OverviewView({ refsById, openReference, setView, setSelectedVenture }) {
  const firstCohort = VENTURES.filter((venture) => venture.firstCohort);
  return (
    <div className="view-stack">
      <section className="kpi-grid" aria-label="Headline metrics">
        {KPIS.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} refsById={refsById} openReference={openReference} />)}
      </section>
      <section className="split-grid">
        <div>
          <SectionHeading eyebrow="Strategic baseline" title="Why Egypt, why now" />
          <div className="baseline-list">
            {STRATEGIC_BASELINE.map((item, index) => (
              <article className="baseline-card" key={item.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <RefList refs={item.refs} refsById={refsById} openReference={openReference} />
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="first-cohort-box">
          <SectionHeading eyebrow="Recommended first cohort" title="Best immediate launch wave" light />
          <p>The cleanest first wave combines speed, strategic leverage, modest public cost, and cross-portfolio value.</p>
          <div className="cohort-list">
            {firstCohort.map((venture) => (
              <button type="button" key={venture.id} onClick={() => setSelectedVenture(venture)}>
                <span>#{venture.num}</span>
                <strong>{venture.name}</strong>
                <small>{venture.tag}</small>
              </button>
            ))}
          </div>
          <button type="button" className="text-link" onClick={() => setView('ventures')}>Open all ventures →</button>
        </aside>
      </section>
      <section className="phase-card">
        <SectionHeading eyebrow="Portfolio shape" title="Eleven ventures across six phases" />
        <PhaseDistribution />
      </section>
    </div>
  );
}

function KpiCard({ kpi, refsById, openReference }) {
  return (
    <article className="kpi-card">
      <strong>{kpi.value}</strong>
      <span>{kpi.label}</span>
      <p>{kpi.sub}</p>
      <RefList refs={kpi.refs} refsById={refsById} openReference={openReference} />
    </article>
  );
}

function MatrixView({ firstCohortOnly, setSelectedVenture }) {
  const ventures = firstCohortOnly ? VENTURES.filter((venture) => venture.firstCohort) : VENTURES;
  const width = 900;
  const height = 520;
  const pad = 62;
  const x = (value) => pad + (value / 11) * (width - pad * 2);
  const y = (value) => height - pad - ((value - 4) / 6) * (height - pad * 2);
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="Portfolio matrix" title="Cost-to-launch versus expected impact" />
      <p className="section-copy">Each venture is plotted by relative cost to stand up and expected portfolio impact. Bubble size reflects the number of first products. The upper-left field is the strategic sweet spot.</p>
      <div className="legend-row"><PhaseLegend /></div>
      <div className="matrix-wrap">
        <svg className="matrix-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter plot of cost score and impact for eleven ventures">
          <rect x={pad} y={pad} width={(5 / 11) * (width - pad * 2)} height={((10 - 7) / 6) * (height - pad * 2)} className="sweet-spot" />
          {Array.from({ length: 8 }, (_, i) => i + 1).map((tick) => <line key={`x-${tick}`} x1={x(tick)} x2={x(tick)} y1={pad} y2={height - pad} className="gridline" />)}
          {[4, 5, 6, 7, 8, 9, 10].map((tick) => <line key={`y-${tick}`} x1={pad} x2={width - pad} y1={y(tick)} y2={y(tick)} className="gridline" />)}
          <text x={width / 2} y={height - 18} className="axis-label">Relative cost to launch →</text>
          <text x={-height / 2} y={22} transform="rotate(-90)" className="axis-label">Expected impact →</text>
          {ventures.map((venture) => {
            const phase = getPhase(venture.phaseKey);
            const radius = Math.min(28, 13 + venture.products.length * 1.5);
            return (
              <g key={venture.id} className="matrix-node" onClick={() => setSelectedVenture(venture)} tabIndex={0} role="button" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedVenture(venture); }} aria-label={`${venture.name}: impact ${venture.impact} of 10, cost score ${venture.costscore} of 10`}>
                {venture.firstCohort && <circle cx={x(venture.costscore)} cy={y(venture.impact)} r={radius + 5} className="matrix-ring" />}
                <circle cx={x(venture.costscore)} cy={y(venture.impact)} r={radius} fill={phase.color} />
                <text x={x(venture.costscore)} y={y(venture.impact) + 4} textAnchor="middle" className={isLightPhase(phase.color) ? 'node-text dark' : 'node-text'}>{venture.num}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="quadrant-grid">
        <QuadrantNote title="Sweet spot" tone="#1F6F7A" body="High impact, modest cost. Launch first, regardless of phase." examples={VENTURES.filter((v) => v.impact >= 7 && v.costscore <= 5).map((v) => v.num)} />
        <QuadrantNote title="High-leverage trust" tone="#C9A24A" body="Very low cost and a multiplier on the rest." examples={VENTURES.filter((v) => v.costscore <= 2).map((v) => v.num)} />
        <QuadrantNote title="Sector scale" tone="#2E8B97" body="Higher cost, strong impact, longer to anchor." examples={VENTURES.filter((v) => v.costscore >= 5 && v.costscore <= 6).map((v) => v.num)} />
        <QuadrantNote title="Capital-heavy" tone="#0F1B2D" body="High impact and high cost. Anchor-tenant gated." examples={VENTURES.filter((v) => v.costscore >= 7).map((v) => v.num)} />
      </div>
    </div>
  );
}

function VenturesView({ firstCohortOnly, setSelectedVenture }) {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState(new Set());
  const [costFilter, setCostFilter] = useState(new Set());
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VENTURES.filter((venture) => {
      if (firstCohortOnly && !venture.firstCohort) return false;
      if (phaseFilter.size && !phaseFilter.has(venture.phaseKey)) return false;
      if (costFilter.size && !costFilter.has(venture.costTier)) return false;
      if (!q) return true;
      return [venture.name, venture.tag, venture.plain, venture.why, ...venture.products, ...venture.buyers].join(' ').toLowerCase().includes(q);
    });
  }, [search, phaseFilter, costFilter, firstCohortOnly]);
  const toggleSet = (set, setter, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    setter(next);
  };
  const clear = () => { setSearch(''); setPhaseFilter(new Set()); setCostFilter(new Set()); };
  const hasFilters = Boolean(search) || phaseFilter.size > 0 || costFilter.size > 0;
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="Venture one-pagers" title="Filter, search, and brief" />
      <p className="section-copy">Each card is a one-pager: idea, why now, first products, buyers, first moves, compliance, risks, and source-archive pointers.</p>
      <div className="filter-box">
        <label className="search-line"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Products, buyers, sectors…" /></label>
        <FilterGroup label="Phase">{PHASES.map((phase) => <Chip key={phase.key} active={phaseFilter.has(phase.key)} onClick={() => toggleSet(phaseFilter, setPhaseFilter, phase.key)} color={phase.color}>{phase.label}</Chip>)}</FilterGroup>
        <FilterGroup label="Cost tier">{[1,2,3,4,5].map((tier) => <Chip key={tier} active={costFilter.has(tier)} onClick={() => toggleSet(costFilter, setCostFilter, tier)} color="#1F6F7A">{tier}</Chip>)}</FilterGroup>
        {hasFilters && <button className="reset-button" type="button" onClick={clear}>Reset filters</button>}
      </div>
      <p className="result-count">Showing <strong>{filtered.length}</strong> of {VENTURES.length} ventures{firstCohortOnly ? ' · first cohort only' : ''}</p>
      {filtered.length ? <div className="venture-grid">{filtered.map((venture) => <VentureCard key={venture.id} venture={venture} onSelect={() => setSelectedVenture(venture)} />)}</div> : <div className="empty-state">No ventures match the current filters.</div>}
    </div>
  );
}

function VentureCard({ venture, onSelect }) {
  const phase = getPhase(venture.phaseKey);
  return (
    <button type="button" className={`venture-card ${venture.firstCohort ? 'is-cohort' : ''}`} onClick={onSelect}>
      <div className="venture-card__head">
        <span className="venture-num" style={{ backgroundColor: phase.color, color: isLightPhase(phase.color) ? '#0F1B2D' : '#F4EDE0' }}>{venture.num}</span>
        <div><h3>{venture.name}</h3><p>{phase.label} · {venture.cost} cost · impact {venture.impact}/10</p></div>
      </div>
      <p>{venture.plain}</p>
      <div className="tag-list">{venture.products.slice(0,3).map((product) => <span key={product}>{product}</span>)}{venture.products.length > 3 && <span>+{venture.products.length - 3} more</span>}</div>
      <div className="card-footer"><span>{venture.evidence.slice(0,4).join(' · ')}</span><strong>Open detail →</strong></div>
    </button>
  );
}

function RoadmapView({ firstCohortOnly, setSelectedVenture }) {
  const ventures = firstCohortOnly ? VENTURES.filter((venture) => venture.firstCohort) : VENTURES;
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="Execution path" title="90-day decisions and a three-year sequencing plan" />
      <p className="section-copy">Revenue and proof first, then sector scale, then infrastructure. Each lane is a venture; the bar shows when it becomes active.</p>
      <div className="ninety-card"><span>Pre-pilot · next 90 days</span><ol>{NINETY_DAY.map((item) => <li key={item}>{item}</li>)}</ol></div>
      <div className="roadmap-table">
        <div className="roadmap-head"><span>Venture</span>{ROADMAP_PERIODS.map((period) => <span key={period.key}>{period.label}<small>{period.sublabel}</small></span>)}</div>
        {ventures.map((venture) => <RoadmapLane key={venture.id} venture={venture} setSelectedVenture={setSelectedVenture} />)}
      </div>
      <div className="year-grid"><YearCard year="Year 1" tone="#1F6F7A" body="Revenue and credibility: export services, Arabic AI commons, government pilots, and assurance lab." /><YearCard year="Year 2" tone="#2E8B97" body="Sector scale: health operations, smart agriculture, fintech vendor products, industrial AI factories." /><YearCard year="Year 3" tone="#0F1B2D" body="Infrastructure scale: sovereign cloud and data-center capacity around signed workloads." /></div>
    </div>
  );
}

function RoadmapLane({ venture, setSelectedVenture }) {
  const tl = VENTURE_TIMELINE[venture.id];
  const phase = getPhase(venture.phaseKey);
  return (
    <button type="button" className="roadmap-lane" onClick={() => setSelectedVenture(venture)}>
      <span className="roadmap-venture"><b style={{ backgroundColor: phase.color, color: isLightPhase(phase.color) ? '#0F1B2D' : '#F4EDE0' }}>{venture.num}</b>{venture.name}</span>
      {ROADMAP_PERIODS.map((period) => {
        const active = tl.active.includes(period.key);
        const entry = tl.entry === period.key;
        return <span key={period.key} className={entry ? 'entry' : ''} style={{ backgroundColor: active ? phase.color : '#F4EDE0', color: active && !isLightPhase(phase.color) ? '#F4EDE0' : '#0F1B2D', opacity: active ? (entry ? 1 : 0.55) : 1 }}>{entry ? 'Entry' : ''}</span>;
      })}
    </button>
  );
}

function PartnersView({ refsById, openReference }) {
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="Partnership strategy" title="Match partners to workloads; do not pick a single winner" />
      <div className="partner-table">{PARTNERS.map((partner) => <article key={partner.name}><h3>{partner.name}</h3><p>{partner.use}</p><RefList refs={partner.refs} refsById={refsById} openReference={openReference} /></article>)}</div>
      <SectionHeading eyebrow="Comparable examples" title="What other countries show" />
      <div className="case-grid">{CASES.map((item) => <article key={item.country}><h3>{item.country}</h3><p><strong>What was built:</strong> {item.built}</p><p><strong>Lesson for Egypt:</strong> {item.lesson}</p><RefList refs={item.refs} refsById={refsById} openReference={openReference} /></article>)}</div>
    </div>
  );
}

function EvidenceView({ refToVentures, setSelectedVenture }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(new Set());
  const filtered = REFERENCES.filter(([id, text, , cat]) => (!catFilter.size || catFilter.has(cat)) && (!search || `${id} ${text}`.toLowerCase().includes(search.toLowerCase())));
  const toggle = (cat) => { const next = new Set(catFilter); if (next.has(cat)) next.delete(cat); else next.add(cat); setCatFilter(next); };
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="Evidence base" title="Sources carried forward from the detailed library" />
      <div className="filter-box"><label className="search-line"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search references…" /></label><FilterGroup label="Category">{REF_CATEGORIES.map((cat) => <Chip key={cat.key} active={catFilter.has(cat.key)} onClick={() => toggle(cat.key)} color={cat.color}>{cat.label}</Chip>)}</FilterGroup></div>
      <p className="result-count">Showing <strong>{filtered.length}</strong> of {REFERENCES.length} references</p>
      <div className="reference-list">{filtered.map(([id, text, url, cat]) => <ReferenceRow key={id} id={id} text={text} url={url} cat={cat} ventures={refToVentures[id] ?? []} setSelectedVenture={setSelectedVenture} />)}</div>
    </div>
  );
}

function SourceMaterials() {
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="Source materials" title="The deck and cover letter are part of the dashboard, not separate centerpieces" />
      <p className="section-copy">This tab keeps the supporting narrative and PDF attached to the same unlisted decision surface.</p>
      <div className="source-layout">
        <details className="cover-letter" open><summary>Cover letter / overview document</summary><div>{COVER_LETTER.split('\n\n').map((paragraph) => COVER_HEADINGS.includes(paragraph) ? <h3 key={paragraph}>{paragraph}</h3> : <p key={paragraph.slice(0,80)}>{paragraph}</p>)}</div></details>
        <aside className="deck-box"><span>Attached PDF</span><h3>Egypt AI & Technology Opportunity Portfolio</h3><p>28-page evidence-based strategy and execution proposal shipped locally with this unlisted dashboard.</p><div className="deck-actions"><a href={DECK_HREF}>Open deck</a><a href={DECK_HREF} download>Download PDF</a></div><iframe src={DECK_HREF} title="Egypt AI and Technology Opportunity Portfolio PDF preview"></iframe></aside>
      </div>
    </div>
  );
}

function VentureDrawer({ venture, onClose, refsById, openReference }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  const phase = getPhase(venture.phaseKey);
  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="venture-title">
      <button type="button" className="drawer-backdrop" aria-label="Close detail panel" onClick={onClose}></button>
      <aside className="venture-drawer">
        <header><span style={{ backgroundColor: phase.color, color: isLightPhase(phase.color) ? '#0F1B2D' : '#F4EDE0' }}>{venture.num}</span><div><small>{phase.label}{venture.firstCohort ? ' · first cohort' : ''}</small><h2 id="venture-title">{venture.name}</h2><p>{venture.tag}</p></div><button type="button" onClick={onClose}>×</button></header>
        <div className="drawer-stats"><b>{venture.cost}<small>Cost</small></b><b>{venture.impact}/10<small>Impact</small></b><b>{venture.evidence.length}<small>Refs</small></b></div>
        <DrawerSection title="In plain English"><p>{venture.plain}</p></DrawerSection>
        <DrawerSection title="Why now"><p>{venture.why}</p><RefList refs={venture.evidence} refsById={refsById} openReference={openReference} /></DrawerSection>
        <div className="drawer-two"><DrawerSection title="First products"><List items={venture.products} /></DrawerSection><DrawerSection title="Anchor buyers"><List items={venture.buyers} /></DrawerSection></div>
        <DrawerSection title="First 100 days"><ol className="moves-list">{venture.first_moves.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></DrawerSection>
        <DrawerSection title="Compliance focus"><p>{venture.compliance}</p></DrawerSection>
        <div className="drawer-two"><DrawerSection title="Main risks"><List items={venture.risks} tone="#A85432" /></DrawerSection><DrawerSection title="Mitigation"><List items={venture.mitigation} /></DrawerSection></div>
        <DrawerSection title="Source archive pointers"><code>{venture.docs}</code></DrawerSection>
      </aside>
    </div>
  );
}

function ReferenceModal({ refItem, ventures, onClose, setSelectedVenture }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="ref-title">
      <button type="button" className="drawer-backdrop" aria-label="Close reference modal" onClick={onClose}></button>
      <article className="ref-modal"><button type="button" className="modal-close" onClick={onClose}>×</button><h2 id="ref-title">{refItem.id}</h2><p>{refItem.text}</p><a href={refItem.url} target="_blank" rel="noopener noreferrer">Open source ↗</a>{ventures.length > 0 && <div><h3>Cited by</h3>{ventures.map((venture) => <button key={venture.id} type="button" onClick={() => { onClose(); setSelectedVenture(venture); }}>#{venture.num} {venture.name}</button>)}</div>}</article>
    </div>
  );
}

function PhaseDistribution() {
  const counts = Object.fromEntries(PHASES.map((phase) => [phase.key, VENTURES.filter((venture) => venture.phaseKey === phase.key).length]));
  return <div><div className="phase-bar">{PHASES.map((phase) => counts[phase.key] ? <span key={phase.key} style={{ width: `${(counts[phase.key] / VENTURES.length) * 100}%`, backgroundColor: phase.color, color: isLightPhase(phase.color) ? '#0F1B2D' : '#F4EDE0' }}>{counts[phase.key]}</span> : null)}</div><div className="phase-list">{PHASES.map((phase) => <span key={phase.key}><b style={{ backgroundColor: phase.color }} />{phase.label} · {counts[phase.key]}<small>{phase.description}</small></span>)}</div></div>;
}
function PhaseLegend() { return <div className="phase-legend">{PHASES.map((phase) => <span key={phase.key}><b style={{ backgroundColor: phase.color }} />{phase.label}</span>)}</div>; }
function QuadrantNote({ title, tone, body, examples }) { return <article className="quadrant-note"><b style={{ backgroundColor: tone }} /><h3>{title}</h3><p>{body}</p><small>Ventures: {examples.length ? examples.map((n) => `#${n}`).join(' ') : '—'}</small></article>; }
function SectionHeading({ eyebrow, title, light = false }) { return <div className="section-heading"><span>{eyebrow}</span><h2 className={light ? 'light' : ''}>{title}</h2></div>; }
function RefList({ refs, refsById, openReference }) { return <div className="ref-list">{refs.map((id) => <button key={id} type="button" onClick={() => openReference(refsById[id] ?? id)}>{id}</button>)}</div>; }
function FilterGroup({ label, children }) { return <div className="filter-group"><span>{label}</span><div>{children}</div></div>; }
function Chip({ active, onClick, color, children }) { return <button type="button" className="chip" onClick={onClick} style={{ backgroundColor: active ? color : 'transparent', color: active && !isLightPhase(color) ? '#F4EDE0' : '#0F1B2D', borderColor: active ? color : '#E8DECF' }}>{children}</button>; }
function YearCard({ year, tone, body }) { return <article className="year-card"><b style={{ backgroundColor: tone }} /><h3>{year}</h3><p>{body}</p></article>; }
function ReferenceRow({ id, text, url, cat, ventures, setSelectedVenture }) { const catObj = REF_CATEGORIES.find((item) => item.key === cat); return <article className="reference-row"><b>{id}</b><div><p>{text}</p><span style={{ color: catObj?.color }}>{catObj?.label}</span><a href={url} target="_blank" rel="noopener noreferrer">Source link ↗</a>{ventures.map((venture) => <button key={venture.id} type="button" onClick={() => setSelectedVenture(venture)}>#{venture.num}</button>)}</div></article>; }
function DrawerSection({ title, children }) { return <section className="drawer-section"><h3>{title}</h3>{children}</section>; }
function List({ items, tone = '#1F6F7A' }) { return <ul className="drawer-list">{items.map((item) => <li key={item}><span style={{ backgroundColor: tone }} />{item}</li>)}</ul>; }

const styles = `
.egypt-app{--bg:#F4EDE0;--paper:#FFFDF8;--line:#E8DECF;--ink:#0F1B2D;--muted:#5A6573;--teal:#1F6F7A;--gold:#C9A24A;display:grid;grid-template-columns:280px minmax(0,1fr);background:var(--bg);color:var(--ink);min-height:100vh;font-family:var(--font-body)}
.egypt-sidebar{position:sticky;top:0;height:100vh;background:var(--ink);color:var(--bg);padding:28px 20px;display:flex;flex-direction:column;gap:22px}.egypt-brand{display:flex;gap:12px;align-items:center}.egypt-brand__seal{width:46px;height:46px;background:var(--gold);color:var(--ink);display:grid;place-items:center;font-family:var(--font-display);font-weight:700}.egypt-brand strong{display:block;font-family:var(--font-display);font-size:18px}.egypt-brand span,.egypt-brand__line{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.72}.egypt-brand__line{font-family:var(--font-body);font-style:italic;text-transform:none;letter-spacing:0;font-size:14px}.egypt-nav{display:grid;gap:4px}.egypt-nav button,.cohort-toggle{border:1px solid transparent;background:transparent;color:rgba(244,237,224,.78);text-align:left;padding:10px 12px;font:600 13px var(--font-mono);text-transform:uppercase;letter-spacing:.08em;cursor:pointer}.egypt-nav button.is-active{background:var(--teal);color:var(--bg)}.cohort-toggle{margin-top:auto;border-color:rgba(244,237,224,.12);background:rgba(255,255,255,.04);text-transform:none;letter-spacing:0}.cohort-toggle span{display:block}.cohort-toggle small{display:block;opacity:.7;margin-top:4px}.cohort-toggle.is-on{border-color:var(--gold);color:var(--gold)}
.egypt-panel{min-width:0}.egypt-hero2,.view-stack{width:min(1180px,calc(100vw - 340px));margin:0 auto}.egypt-hero2{padding:56px 0 28px;border-bottom:1px solid var(--ink)}.eyebrow,.section-heading span{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:var(--teal);font-weight:700}.egypt-hero2 h1{font-family:var(--font-display);font-size:clamp(44px,7vw,86px);line-height:.88;letter-spacing:-.06em;margin:20px 0 18px;max-width:980px}.egypt-hero2 p,.section-copy{font-size:18px;line-height:1.45;color:var(--muted);max-width:820px}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.hero-actions button,.hero-actions a,.deck-actions a{border:1px solid var(--ink);background:var(--ink);color:var(--bg);padding:12px 15px;font:700 11px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-decoration:none}.hero-actions .secondary,.deck-actions a+ a{background:var(--paper);color:var(--ink)}.egypt-mobile-tabs{display:none}.view-stack{padding:42px 0 80px;display:grid;gap:32px}.section-heading h2{font-family:var(--font-display);font-size:clamp(30px,4vw,56px);line-height:.95;letter-spacing:-.045em;margin:8px 0 0}.section-heading h2.light{color:var(--bg)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.kpi-card,.baseline-card,.phase-card,.matrix-wrap,.filter-box,.empty-state,.ninety-card,.roadmap-table,.partner-table article,.case-grid article,.reference-list,.cover-letter,.deck-box,.year-card,.quadrant-note{background:var(--paper);border:1px solid var(--line)}.kpi-card{padding:18px}.kpi-card strong{display:block;font-family:var(--font-display);font-size:34px;line-height:1}.kpi-card span{display:block;font-weight:700;margin-top:10px}.kpi-card p{color:var(--muted);font-size:13px}.ref-list{display:flex;gap:4px;flex-wrap:wrap;margin-top:10px}.ref-list button{border:0;background:rgba(31,111,122,.1);color:var(--teal);font:700 10px var(--font-mono);padding:3px 6px;cursor:pointer}.split-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(320px,.75fr);gap:24px}.baseline-list{display:grid;gap:10px;margin-top:18px}.baseline-card{display:flex;gap:16px;padding:18px}.baseline-card>span{font-family:var(--font-display);font-size:26px;color:var(--gold)}.baseline-card h3,.first-cohort-box h3,.venture-card h3{font-family:var(--font-display);margin:0;font-size:19px}.baseline-card p{color:var(--muted);font-size:14px;line-height:1.55}.first-cohort-box{background:var(--ink);color:var(--bg);padding:24px}.cohort-list{display:grid;gap:8px;margin:18px 0}.cohort-list button{display:grid;grid-template-columns:38px 1fr;text-align:left;gap:8px;border:0;border-left:2px solid var(--gold);background:rgba(255,255,255,.04);color:var(--bg);padding:12px;cursor:pointer}.cohort-list small{grid-column:2;opacity:.65}.text-link{border:0;background:transparent;color:var(--gold);font-weight:700;cursor:pointer}.phase-bar{display:flex;height:34px;overflow:hidden;background:var(--bg);margin:18px 0}.phase-bar span{display:grid;place-items:center;font:700 11px var(--font-mono)}.phase-list,.phase-legend{display:flex;gap:12px;flex-wrap:wrap}.phase-list span,.phase-legend span{display:flex;gap:7px;align-items:flex-start;font-size:12px;color:var(--muted)}.phase-list b,.phase-legend b{width:11px;height:11px;margin-top:4px}.phase-list small{display:block;max-width:170px}.legend-row{display:flex;justify-content:flex-end}.matrix-wrap{overflow:auto}.matrix-svg{display:block;min-width:720px;width:100%;height:auto;background:var(--paper)}.sweet-spot{fill:#1F6F7A;fill-opacity:.07;stroke:#1F6F7A;stroke-opacity:.24;stroke-dasharray:4 4}.gridline{stroke:var(--line);stroke-dasharray:2 5}.axis-label{font:700 12px var(--font-mono);fill:var(--ink);letter-spacing:.04em}.matrix-node{cursor:pointer;outline:none}.matrix-node circle:not(.matrix-ring){stroke:var(--ink);stroke-width:1}.matrix-ring{fill:none;stroke:var(--gold);stroke-width:4}.node-text{fill:var(--bg);font:700 12px var(--font-display);pointer-events:none}.node-text.dark{fill:var(--ink)}.quadrant-grid,.year-grid,.case-grid,.venture-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.quadrant-note,.year-card{padding:16px}.quadrant-note>b,.year-card>b{display:block;width:8px;height:28px}.quadrant-note h3,.year-card h3{font-family:var(--font-display);margin:8px 0 4px}.quadrant-note p,.year-card p{font-size:13px;color:var(--muted)}.quadrant-note small{font:700 10px var(--font-mono);color:var(--muted)}
.filter-box{padding:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:center}.search-line{display:flex;gap:10px;align-items:center;flex:1 1 280px}.search-line span,.filter-group>span{font:700 10px var(--font-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}.search-line input{border:0;border-bottom:1px solid var(--line);background:transparent;padding:8px;flex:1;color:var(--ink)}.filter-group{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.filter-group>div{display:flex;gap:6px;flex-wrap:wrap}.chip,.reset-button{border:1px solid var(--line);border-radius:99px;background:transparent;padding:6px 9px;font:700 11px var(--font-body);cursor:pointer}.reset-button{border-radius:0;text-transform:uppercase;color:var(--teal)}.result-count{color:var(--muted);font-size:14px}.venture-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.venture-card{text-align:left;padding:20px;border:1px solid var(--line);background:var(--paper);cursor:pointer}.venture-card.is-cohort{border-color:var(--gold)}.venture-card:hover{border-color:var(--teal);box-shadow:0 8px 24px rgba(15,27,45,.08)}.venture-card__head{display:flex;gap:14px}.venture-num{width:42px;height:42px;display:grid;place-items:center;font:700 16px var(--font-display)}.venture-card p{color:var(--muted);font-size:14px;line-height:1.5}.venture-card__head p{font-size:12px;margin:5px 0 0}.tag-list{display:flex;gap:6px;flex-wrap:wrap}.tag-list span{background:var(--bg);padding:4px 8px;font-size:11px}.card-footer{display:flex;justify-content:space-between;border-top:1px solid var(--line);margin-top:16px;padding-top:12px;font-size:11px;color:var(--teal)}.empty-state{padding:36px;text-align:center;color:var(--muted)}
.ninety-card{background:var(--ink);color:var(--bg);padding:20px}.ninety-card>span{font:700 11px var(--font-mono);text-transform:uppercase;color:var(--gold);letter-spacing:.15em}.ninety-card ol{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:0;margin:16px 0 0;list-style-position:inside}.ninety-card li{background:rgba(255,255,255,.05);padding:12px;font-size:12px}.roadmap-head,.roadmap-lane{display:grid;grid-template-columns:minmax(260px,340px) repeat(4,1fr);gap:8px;align-items:center}.roadmap-head{background:var(--bg);padding:12px;font:700 10px var(--font-mono);text-transform:uppercase;color:var(--muted)}.roadmap-head small{display:block;text-transform:none;letter-spacing:0;font:400 11px var(--font-body)}.roadmap-lane{width:100%;border:0;border-top:1px solid var(--line);background:var(--paper);padding:10px 12px;text-align:left;cursor:pointer}.roadmap-venture{display:flex;gap:10px;align-items:center;font-weight:700}.roadmap-venture b{width:30px;height:30px;display:grid;place-items:center}.roadmap-lane>span:not(.roadmap-venture){height:28px;display:flex;align-items:center;padding:0 8px;border-radius:4px;font:700 10px var(--font-mono);text-transform:uppercase}.roadmap-lane .entry{outline:2px solid var(--gold)}
.partner-table,.case-grid,.source-layout{display:grid;gap:12px}.partner-table article,.case-grid article{padding:18px}.partner-table h3,.case-grid h3{font-family:var(--font-display);margin:0 0 6px}.source-layout{grid-template-columns:minmax(0,1fr) 360px}.cover-letter summary{padding:16px;border-bottom:1px solid var(--line);cursor:pointer;font:700 11px var(--font-mono);text-transform:uppercase;letter-spacing:.14em}.cover-letter div{padding:20px;max-height:760px;overflow:auto}.cover-letter h3{font-family:var(--font-display);font-size:26px;border-top:1px solid var(--line);padding-top:16px}.cover-letter p{line-height:1.65;color:var(--muted)}.deck-box{padding:20px;position:sticky;top:24px}.deck-box span{font:700 11px var(--font-mono);text-transform:uppercase;color:var(--teal)}.deck-box h3{font-family:var(--font-display);font-size:24px}.deck-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.deck-box iframe{width:100%;height:420px;border:1px solid var(--line)}.reference-row{display:grid;grid-template-columns:60px 1fr;gap:12px;border-bottom:1px solid var(--line);padding:14px}.reference-row b{color:var(--teal);font-family:var(--font-mono)}.reference-row p{margin:0 0 6px}.reference-row a,.reference-row button{margin-right:8px;border:0;background:var(--bg);padding:4px 7px;color:var(--teal);font-size:11px;cursor:pointer}
.drawer-layer,.modal-layer{position:fixed;inset:0;z-index:100;display:flex;justify-content:flex-end}.modal-layer{align-items:center;justify-content:center}.drawer-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.42);border:0}.venture-drawer{position:relative;width:min(720px,100%);height:100%;overflow:auto;background:var(--bg);box-shadow:-20px 0 60px rgba(0,0,0,.25)}.venture-drawer header{position:sticky;top:0;background:var(--ink);color:var(--bg);display:flex;gap:16px;padding:22px;z-index:2}.venture-drawer header>span{width:54px;height:54px;display:grid;place-items:center;font:700 22px var(--font-display)}.venture-drawer header h2{font-family:var(--font-display);margin:2px 0;font-size:28px}.venture-drawer header small{color:var(--gold);font:700 10px var(--font-mono);text-transform:uppercase}.venture-drawer header button{margin-left:auto;align-self:start;border:0;background:rgba(255,255,255,.08);color:var(--bg);font-size:28px;line-height:1;cursor:pointer}.drawer-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--ink);padding:0 22px 22px}.drawer-stats b{background:rgba(255,255,255,.06);color:var(--bg);padding:10px;font-family:var(--font-display)}.drawer-stats small{display:block;font:700 9px var(--font-mono);text-transform:uppercase;opacity:.6}.drawer-section{padding:20px 26px}.drawer-section h3{font:700 11px var(--font-mono);text-transform:uppercase;letter-spacing:.16em;color:var(--teal)}.drawer-section p{color:var(--muted);line-height:1.6}.drawer-two{display:grid;grid-template-columns:1fr 1fr}.drawer-list{list-style:none;padding:0;margin:0;display:grid;gap:8px}.drawer-list li{display:flex;gap:8px;color:var(--ink);font-size:14px}.drawer-list span{width:5px;height:5px;margin-top:8px;flex:none}.moves-list{display:grid;gap:10px;padding:0;list-style:none}.moves-list li{display:flex;gap:10px}.moves-list span{width:26px;height:26px;display:grid;place-items:center;background:rgba(31,111,122,.1);color:var(--teal);font-weight:700}.drawer-section code{display:block;background:var(--paper);border:1px solid var(--line);padding:12px;white-space:normal;color:var(--muted)}.ref-modal{position:relative;background:var(--bg);width:min(520px,calc(100vw - 32px));padding:24px;border:1px solid var(--ink);box-shadow:0 20px 70px rgba(0,0,0,.28)}.ref-modal h2{font-family:var(--font-mono);color:var(--teal)}.ref-modal a{color:var(--teal);font-weight:700}.ref-modal button:not(.modal-close){border:1px solid var(--line);background:var(--paper);padding:6px;margin:4px;cursor:pointer}.modal-close{position:absolute;right:12px;top:12px;border:0;background:transparent;font-size:24px;cursor:pointer}
@media(max-width:980px){.egypt-app{display:block}.egypt-sidebar{display:none}.egypt-hero2,.view-stack{width:min(100% - 32px,1180px)}.egypt-mobile-tabs{display:flex;overflow:auto;gap:6px;width:min(100% - 32px,1180px);margin:18px auto 0}.egypt-mobile-tabs button{white-space:nowrap;border:1px solid var(--line);background:var(--paper);padding:8px 10px;font:700 11px var(--font-mono);text-transform:uppercase}.egypt-mobile-tabs button[aria-selected=true]{background:var(--ink);color:var(--bg)}.kpi-grid,.split-grid,.venture-grid,.source-layout,.drawer-two,.ninety-card ol{grid-template-columns:1fr}.quadrant-grid,.year-grid,.case-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.roadmap-head{display:none}.roadmap-lane{grid-template-columns:1fr repeat(4,1fr)}.roadmap-venture{grid-column:1/-1}.source-layout{display:grid}.deck-box{position:static}.metric-strip{grid-template-columns:1fr}}@media(max-width:640px){.kpi-grid,.quadrant-grid,.year-grid,.case-grid{grid-template-columns:1fr}.egypt-hero2 h1{font-size:42px}.roadmap-lane{grid-template-columns:repeat(4,1fr)}.roadmap-venture{grid-column:1/-1}.drawer-stats{grid-template-columns:1fr}}
`;
