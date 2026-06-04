// DermatoTarget Atlas — research workbench frontend.
// Dependency-free ES module. Consumes the JSON bundles built by
// dashboard/build_data.py. All language is hypothesis-generating.

// ---------------------------------------------------------------------------
// Tiny DOM + format helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(n.dataset, v);
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
};
const fmt = (x, d = 3) => (x == null || Number.isNaN(x) ? "—" : Number(x).toFixed(d));
const pct = (x) => (x == null ? "—" : `${(x * 100).toFixed(0)}%`);
const num = (x) => (x == null ? "—" : x.toLocaleString());
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const titleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const oppLabel = (s) => titleCase(s);

const OPP_COLORS = {
  validated_or_late_stage: "#5ec98a",
  near_field_repurposing: "#4aa3df",
  white_space: "#b88ce0",
  hypothesis_generating: "#e8a13a",
  crowded: "#6b7b8d",
};
const COMP_COLORS = {
  genetics_score: "#4aa3df",
  opentargets_score: "#5ad1b4",
  skin_relevance_score: "#b88ce0",
  clinical_maturity_score: "#e8a13a",
  druggability_score: "#e06c5e",
  literature_score: "#7fb5d6",
  evidence_breadth_score: "#8fd0a8",
  novelty_gap_score: "#c9a96a",
};

// ---------------------------------------------------------------------------
// Data layer (lazy, cached)
// ---------------------------------------------------------------------------
const cache = {};
async function load(name) {
  if (!cache[name]) {
    cache[name] = fetch(`data/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${name}: ${r.status}`);
      return r.json();
    });
  }
  return cache[name];
}
const DB = {}; // populated with the always-needed bundles at boot

function targetsForDisease(key) {
  return DB.targets.filter((t) => t.disease_key === key).sort((a, b) => a.rank - b.rank);
}
function targetsForGene(gene) {
  return DB.targets.filter((t) => t.gene === gene).sort((a, b) => b.composite - a.composite);
}

// ---------------------------------------------------------------------------
// SVG chart helpers
// ---------------------------------------------------------------------------
const SVGNS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, ...kids) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
  for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return n;
};

// Horizontal bar chart. data: [{label, value, color}], domain max optional.
function barChart(data, { w = 460, barH = 26, gap = 9, max = null, fmtVal = (v) => fmt(v, 2), unit = "", padL = 150 } = {}) {
  const padR = 54, padT = 6, padB = 6;
  const m = max ?? Math.max(...data.map((d) => d.value), 1e-9);
  const h = padT + padB + data.length * (barH + gap);
  const innerW = w - padL - padR;
  const svg = svgEl("svg", { class: "chart", viewBox: `0 0 ${w} ${h}`, role: "img", "aria-hidden": "true" });
  data.forEach((d, i) => {
    const y = padT + i * (barH + gap);
    const bw = Math.max(2, (d.value / m) * innerW);
    svg.append(
      svgEl("text", { x: padL - 8, y: y + barH / 2 + 4, "text-anchor": "end" }, d.label),
      svgEl("rect", { x: padL, y, width: innerW, height: barH, rx: 4, fill: "#1b232d" }),
      svgEl("rect", { x: padL, y, width: bw, height: barH, rx: 4, fill: d.color || "#4aa3df" }),
      svgEl("text", { x: padL + bw + 7, y: y + barH / 2 + 4, fill: "#9bacbf" }, fmtVal(d.value) + unit)
    );
  });
  return svg;
}

// Scatter: composite vs empirical p (log-ish). points:[{x,y,label,color,r}]
function scatterChart(points, { w = 560, h = 320, xLabel = "", yLabel = "", xMax = 1, yMax = 1, invertY = false } = {}) {
  const padL = 54, padR = 16, padT = 14, padB = 40;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const sx = (x) => padL + (x / xMax) * innerW;
  const sy = (y) => padT + (invertY ? (y / yMax) * innerH : innerH - (y / yMax) * innerH);
  const svg = svgEl("svg", { class: "chart", viewBox: `0 0 ${w} ${h}`, role: "img" });
  // gridlines
  for (let i = 0; i <= 4; i++) {
    const gy = padT + (i / 4) * innerH;
    svg.append(svgEl("line", { class: "gridline", x1: padL, x2: w - padR, y1: gy, y2: gy }));
    const val = invertY ? (i / 4) * yMax : yMax - (i / 4) * yMax;
    svg.append(svgEl("text", { x: padL - 8, y: gy + 4, "text-anchor": "end" }, fmt(val, 2)));
  }
  for (let i = 0; i <= 4; i++) {
    const gx = padL + (i / 4) * innerW;
    svg.append(svgEl("text", { x: gx, y: h - padB + 18, "text-anchor": "middle" }, fmt((i / 4) * xMax, 2)));
  }
  points.forEach((p) => {
    const c = svgEl("circle", { cx: sx(p.x), cy: sy(p.y), r: p.r || 4.5, fill: p.color || "#4aa3df", "fill-opacity": .82, stroke: "#0f1419", "stroke-width": .8 });
    c.append(svgEl("title", {}, p.label));
    svg.append(c);
  });
  svg.append(
    svgEl("text", { x: padL + innerW / 2, y: h - 4, "text-anchor": "middle" }, xLabel),
    svgEl("text", { x: 14, y: padT + innerH / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${padT + innerH / 2})` }, yLabel)
  );
  return svg;
}

// Stacked decomposition bar (component weights × scores)
function decompBar(target, labels) {
  const comps = target.components;
  const weights = DB.meta.scoring.weights;
  const parts = Object.keys(weights).map((k) => ({
    key: k, label: labels[k] || k,
    contribution: weights[k] * (comps[k] ?? 0),
    raw: comps[k] ?? 0, weight: weights[k], color: COMP_COLORS[k],
  }));
  const total = parts.reduce((s, p) => s + p.contribution, 0) || 1;
  const bar = el("div", { class: "decomp-bar" });
  parts.forEach((p) => {
    const span = el("span", { style: `width:${(p.contribution / total) * 100}%;background:${p.color}` });
    span.title = `${p.label}: raw ${fmt(p.raw, 2)} × weight ${fmt(p.weight, 2)} = ${fmt(p.contribution, 3)}`;
    bar.append(span);
  });
  const legend = el("div", { class: "decomp-legend" });
  parts.sort((a, b) => b.contribution - a.contribution).forEach((p) => {
    legend.append(el("div", { class: "k" },
      el("span", { class: "sw", style: `background:${p.color}` }),
      `${p.label}`,
      el("span", { class: "v" }, `${fmt(p.raw, 2)}·${fmt(p.weight, 2)}`)));
  });
  const wrap = el("div", {}, bar, legend);
  if (target.safety_penalty > 0) {
    wrap.append(el("p", { class: "muted", style: "margin-top:10px;font-size:12px" },
      `Safety penalty applied: −${fmt(target.safety_penalty, 3)} (capped at 0.25). Composite = ${fmt(target.composite, 3)}.`));
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Generic sortable table
// ---------------------------------------------------------------------------
function dataTable(rows, columns, { onRowClick = null, initialSort = null } = {}) {
  let sortKey = initialSort?.key ?? null;
  let sortDir = initialSort?.dir ?? -1;
  const wrap = el("div", { class: "tbl-wrap" });
  const table = el("table", { class: "data" });
  const thead = el("thead");
  const tbody = el("tbody");
  table.append(thead, tbody);
  wrap.append(table);

  function renderHead() {
    thead.innerHTML = "";
    const tr = el("tr");
    columns.forEach((c) => {
      const th = el("th", { class: (c.num ? "num " : "") + (c.sort !== false ? "sortable" : "") },
        c.label,
        sortKey === c.key ? el("span", { class: "arrow" }, sortDir < 0 ? " ▼" : " ▲") : "");
      if (c.sort !== false) th.addEventListener("click", () => {
        if (sortKey === c.key) sortDir = -sortDir; else { sortKey = c.key; sortDir = c.num ? -1 : 1; }
        renderBody();
        renderHead();
      });
      tr.append(th);
    });
    thead.append(tr);
  }
  function renderBody() {
    let data = rows.slice();
    if (sortKey) {
      data.sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        if (va == null) return 1; if (vb == null) return -1;
        return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
      });
    }
    tbody.innerHTML = "";
    data.forEach((r) => {
      const tr = el("tr", onRowClick ? { class: "clickable", onclick: () => onRowClick(r) } : {});
      columns.forEach((c) => tr.append(el("td", { class: c.num ? "num" : "" }, c.render ? c.render(r) : r[c.key] ?? "—")));
      tbody.append(tr);
    });
  }
  renderHead(); renderBody();
  return wrap;
}

function miniScore(v) {
  return el("span", {},
    el("span", { class: "minibar" }, el("span", { style: `width:${Math.max(0, Math.min(1, v)) * 100}%` })),
    fmt(v, 3));
}
function oppBadge(o) { return el("span", { class: `opp opp-${o}` }, oppLabel(o)); }
function tierBadge(t) { return el("span", { class: `tier tier-${t.tier}` }, t.tier); }

// ---------------------------------------------------------------------------
// VIEWS
// ---------------------------------------------------------------------------
const views = {};

views.overview = () => {
  const m = DB.meta, rc = m.row_counts;
  const v = el("div");
  v.append(el("div", { class: "page-head" },
    el("h1", {}, "DermatoTarget Atlas"),
    el("p", {}, "A reproducible, public-data prioritization atlas across six immune-mediated skin diseases. " +
      "Every score is a prioritization hypothesis derived from public evidence — not a causal estimate, efficacy claim, or clinical recommendation.")));

  const stats = [
    { num: "600", lbl: "Target–disease pairs", sub: "505 unique targets" },
    { num: "6", lbl: "Diseases", sub: "immune-mediated skin" },
    { num: num(rc.gwas_associations), lbl: "GWAS associations", sub: `${num(rc.gwas_studies)} studies` },
    { num: num(rc.clinical_trials), lbl: "Clinical trials", sub: `${num(rc.target_clinical_reports)} target reports` },
    { num: num(rc.target_drug_candidates), lbl: "Drug candidates", sub: "interned & lazy-loaded" },
    { num: num(m.request_records), lbl: "Cached API calls", sub: "request-level provenance" },
  ];
  v.append(el("div", { class: "grid cards section" }, stats.map((s) =>
    el("div", { class: "card stat" }, el("div", { class: "num" }, s.num), el("div", { class: "lbl" }, s.lbl), el("div", { class: "sub" }, s.sub)))));

  // opportunity distribution + validation snapshot
  const oc = m.opportunity_counts;
  const oppData = Object.keys(OPP_COLORS).filter((k) => oc[k]).map((k) => ({ label: oppLabel(k), value: oc[k], color: OPP_COLORS[k] }));
  const left = el("div", { class: "panel" }, el("h2", {}, "Opportunity-class distribution"),
    barChart(oppData, { max: Math.max(...oppData.map((d) => d.value)), fmtVal: (x) => num(x), w: 480 }),
    el("p", { class: "muted", style: "margin:10px 0 0;font-size:12px" }, "Classes separate validated/late-stage targets from near-field repurposing and underexplored white-space."));

  const val = DB.validation;
  const meanRecall = val.anchors.reduce((s, a) => s + a.recall_top25, 0) / val.anchors.length;
  const negTop = val.negatives.filter((n) => n.in_top25).length;
  const right = el("div", { class: "panel" }, el("h2", {}, "Validation snapshot"),
    el("div", { class: "kv" },
      el("dt", {}, "Mean anchor recall (top-25)"), el("dd", {}, pct(meanRecall)),
      el("dt", {}, "Pairs clearing empirical p≤0.05"), el("dd", {}, String(val.null_signals.filter((s) => s.passes).length)),
      el("dt", {}, "Clinical-precedence-sensitive"), el("dd", {}, String(val.leakage.length)),
      el("dt", {}, "Negative controls in top-25"), el("dd", {}, String(negTop))),
    el("div", { class: "callout" + (negTop ? "" : " info") },
      el("strong", {}, "Read scores with uncertainty. "),
      `Anchor recovery is strong, but ${negTop} low-prior negative-control group(s) still reach a disease top-25, and `,
      `${val.leakage.length} candidates depend on clinical/literature precedence. Use the Validation view before acting on any single rank.`));
  v.append(el("div", { class: "grid two-col section" }, left, right));

  // top signal per disease
  v.append(el("div", { class: "section" },
    el("h2", { class: "title" }, "Top signal by disease"),
    dataTable(DB.diseases.summaries.map((d) => ({ ...d })), [
      { key: "disease_name", label: "Disease", render: (r) => el("a", { href: `#/disease/${r.disease_key}` }, r.disease_name) },
      { key: "top_gene", label: "Top gene", render: (r) => el("span", { class: "gene" }, r.top_gene) },
      { key: "top_score", label: "Top score", num: true, render: (r) => miniScore(r.top_score) },
      { key: "white_space", label: "White-space", num: true },
      { key: "near_field", label: "Near-field", num: true },
      { key: "validated_late_stage", label: "Validated/late", num: true },
      { key: "anchors_top25", label: "Anchors top-25", num: true, render: (r) => `${r.anchors_top25}/${r.anchors_configured}` },
    ], { initialSort: { key: "top_score", dir: -1 } })));
  return v;
};

views.disease = (key) => {
  const summary = DB.diseases.summaries.find((d) => d.disease_key === key) || DB.diseases.summaries[0];
  key = summary.disease_key;
  const ts = targetsForDisease(key);
  const v = el("div");

  // selector chips
  const selector = el("div", { class: "chips section" }, DB.diseases.summaries.map((d) =>
    el("a", { class: "chip btn" + (d.disease_key === key ? " active" : ""), href: `#/disease/${d.disease_key}` }, d.disease_name)));

  v.append(el("div", { class: "page-head" },
    el("h1", {}, summary.disease_name),
    el("p", {}, `${summary.scored} scored targets · top signal `,
      el("strong", {}, summary.top_gene), ` (${fmt(summary.top_score)}). `,
      `${summary.white_space} white-space · ${summary.near_field} near-field · ${summary.validated_late_stage} validated/late-stage.`)),
    selector);

  // modules for this disease + anchor recovery
  const mods = DB.diseases.modules.filter((mm) => mm.disease_key === key).sort((a, b) => b.max_composite - a.max_composite);
  const anchor = DB.validation.anchors.find((a) => a.disease_key === key);
  const left = el("div", { class: "panel" }, el("h2", {}, "Module programs"),
    mods.length ? dataTable(mods, [
      { key: "module_label", label: "Module" },
      { key: "members", label: "Genes", num: true },
      { key: "top_gene", label: "Top gene", render: (r) => el("span", { class: "gene" }, r.top_gene) },
      { key: "max_composite", label: "Max score", num: true, render: (r) => fmt(r.max_composite) },
      { key: "anchor_members", label: "Anchors", num: true },
    ], { initialSort: { key: "max_composite", dir: -1 } }) : el("p", { class: "muted" }, "No module assignments."));
  const right = el("div", { class: "panel" }, el("h2", {}, "Anchor recovery"),
    anchor ? el("div", {},
      el("div", { class: "kv" },
        el("dt", {}, "Configured anchors"), el("dd", {}, String(anchor.configured)),
        el("dt", {}, "Present in scored set"), el("dd", {}, String(anchor.present)),
        el("dt", {}, "In top-10 / top-25"), el("dd", {}, `${anchor.top10} / ${anchor.top25}`),
        el("dt", {}, "Recall (top-25)"), el("dd", {}, pct(anchor.recall_top25)),
        el("dt", {}, "Median anchor rank"), el("dd", {}, fmt(anchor.median_rank, 0)),
        el("dt", {}, "Ranks"), el("dd", {}, anchor.ranks)),
      el("p", { class: "muted", style: "margin-top:10px;font-size:12px" },
        "Recovery of pre-specified therapeutic/biologic anchors is a face-validity check, not proof of correctness.")) : el("p", { class: "muted" }, "No anchor data."));
  v.append(el("div", { class: "grid two-col section" }, left, right));

  // top targets table
  v.append(el("div", { class: "section" },
    el("h2", { class: "title" }, "Ranked targets"),
    dataTable(ts, targetColumns(), { onRowClick: (r) => go(`#/target/${encodeURIComponent(r.gene)}`), initialSort: { key: "composite", dir: -1 } })));
  return v;
};

function targetColumns() {
  return [
    { key: "rank", label: "#", num: true, render: (r) => r.rank },
    { key: "gene", label: "Gene", render: (r) => el("span", { class: "gene" }, r.gene, r.is_anchor ? el("span", { class: "anchor-flag", title: "Known anchor" }, " ✦") : "") },
    { key: "target_name", label: "Target", render: (r) => el("span", { title: r.target_name }, r.target_name.length > 38 ? r.target_name.slice(0, 37) + "…" : r.target_name) },
    { key: "composite", label: "Composite", num: true, render: (r) => miniScore(r.composite) },
    { key: "opportunity", label: "Class", render: (r) => oppBadge(r.opportunity) },
    { key: "genetics_score", label: "Genetics", num: true, render: (r) => fmt(r.components.genetics_score, 2), sort: false },
    { key: "_readiness", label: "Readiness", sort: false, render: (r) => tierBadge(r.readiness) },
  ];
}

views.targets = () => {
  const v = el("div");
  v.append(el("div", { class: "page-head" },
    el("h1", {}, "Target explorer"),
    el("p", {}, "Search and filter all 600 target–disease pairs. Click any row for full score decomposition, evidence, trials, drugs, and literature.")));

  const state = { q: "", disease: "", opp: "", anchorOnly: false };
  const toolbar = el("div", { class: "toolbar" });
  const search = el("input", { type: "search", placeholder: "Filter by gene or target name…" });
  const diseaseSel = el("select", {}, el("option", { value: "" }, "All diseases"),
    DB.diseases.summaries.map((d) => el("option", { value: d.disease_key }, d.disease_name)));
  const oppSel = el("select", {}, el("option", { value: "" }, "All classes"),
    Object.keys(OPP_COLORS).map((k) => el("option", { value: k }, oppLabel(k))));
  const anchorBtn = el("button", { class: "btn-sm" }, "✦ Anchors only");
  const count = el("span", { class: "count" });
  toolbar.append(search, diseaseSel, oppSel, anchorBtn, el("span", { class: "spacer" }), count);

  const tableHost = el("div");
  function apply() {
    const q = state.q.toLowerCase();
    let rows = DB.targets.filter((t) =>
      (!q || t.gene.toLowerCase().includes(q) || t.target_name.toLowerCase().includes(q)) &&
      (!state.disease || t.disease_key === state.disease) &&
      (!state.opp || t.opportunity === state.opp) &&
      (!state.anchorOnly || t.is_anchor));
    count.textContent = `${rows.length} pairs`;
    tableHost.innerHTML = "";
    tableHost.append(dataTable(rows, [
      { key: "gene", label: "Gene", render: (r) => el("span", { class: "gene" }, r.gene, r.is_anchor ? el("span", { class: "anchor-flag" }, " ✦") : "") },
      { key: "disease_name", label: "Disease" },
      { key: "rank", label: "Rank", num: true },
      { key: "composite", label: "Composite", num: true, render: (r) => miniScore(r.composite) },
      { key: "opportunity", label: "Class", render: (r) => oppBadge(r.opportunity) },
      { key: "_t", label: "Readiness", render: (r) => tierBadge(r.readiness) },
    ], { onRowClick: (r) => go(`#/target/${encodeURIComponent(r.gene)}?d=${r.disease_key}`), initialSort: { key: "composite", dir: -1 } }));
  }
  search.addEventListener("input", () => { state.q = search.value; apply(); });
  diseaseSel.addEventListener("change", () => { state.disease = diseaseSel.value; apply(); });
  oppSel.addEventListener("change", () => { state.opp = oppSel.value; apply(); });
  anchorBtn.addEventListener("click", () => { state.anchorOnly = !state.anchorOnly; anchorBtn.classList.toggle("active"); apply(); });
  v.append(toolbar, tableHost);
  apply();
  return v;
};

views.target = (gene, query) => {
  gene = decodeURIComponent(gene);
  const pairs = targetsForGene(gene);
  const v = el("div");
  v.append(el("a", { class: "back-link", onclick: () => history.back() }, "← back"));
  if (!pairs.length) { v.append(el("div", { class: "callout" }, `No scored pairs for ${esc(gene)}.`)); return v; }

  const preferredDisease = query?.get("d");
  let active = preferredDisease ? pairs.find((p) => p.disease_key === preferredDisease) : pairs[0];
  if (!active) active = pairs[0];
  const t0 = pairs[0];

  v.append(el("div", { class: "page-head" },
    el("h1", {}, el("span", { class: "gene", style: "font-family:var(--mono)" }, gene), t0.is_anchor ? el("span", { class: "anchor-flag" }, " ✦ anchor") : ""),
    el("p", {}, t0.target_name + (t0.biotype ? ` · ${t0.biotype.replace(/_/g, " ")}` : ""))));

  // disease selector for this gene
  v.append(el("div", { class: "chips section" }, pairs.map((p) =>
    el("button", { class: "chip btn" + (p === active ? " active" : ""), onclick: () => { active = p; rerender(); } },
      `${p.disease_name} · #${p.rank} · ${fmt(p.composite, 2)}`))));

  const body = el("div");
  v.append(body);
  function rerender() {
    body.innerHTML = "";
    // refresh chip active state
    v.querySelectorAll(".chips.section .chip").forEach((c, i) => c.classList.toggle("active", pairs[i] === active));
    body.append(renderTargetDetail(active));
  }
  rerender();
  return v;
};

function renderTargetDetail(t) {
  const wrap = el("div");
  const head = el("div", { class: "grid two-col section" });
  // decomposition
  head.append(el("div", { class: "panel" },
    el("h2", {}, `Score decomposition — ${t.disease_name}`),
    el("div", { class: "kv", style: "margin-bottom:14px" },
      el("dt", {}, "Composite"), el("dd", {}, `${fmt(t.composite)} (rank #${t.rank})`),
      el("dt", {}, "Opportunity class"), el("dd", {}, oppBadge(t.opportunity)),
      el("dt", {}, "Open Targets rank"), el("dd", {}, t.ot_rank ?? "—")),
    decompBar(t, DB.meta.component_labels)));

  // readiness + evidence
  const r = t.readiness;
  const ev = el("div", { class: "panel" },
    el("h2", {}, "Submission-readiness & evidence"),
    el("p", {}, tierBadge(r), " ",
      el("span", { class: "muted", style: "font-size:12.5px" }, ` empirical p(upper) = ${t.empirical_p_upper == null ? "n/a" : fmt(t.empirical_p_upper, 3)}`)),
    el("ul", { style: "margin:8px 0 14px;padding-left:18px;color:var(--text-dim);font-size:13px" },
      r.caveats.length ? r.caveats.map((c) => el("li", {}, c)) : [el("li", {}, "No specific caveats flagged.")]),
    el("div", { class: "kv" },
      el("dt", {}, "GWAS hits"), el("dd", {}, `${t.gwas_hits}${t.gwas_min_neg_log10_p ? ` (−log₁₀p ${fmt(t.gwas_min_neg_log10_p, 1)})` : ""}`),
      el("dt", {}, "PubMed pair records"), el("dd", {}, String(t.pubmed_pairs)),
      el("dt", {}, "Disease trial reports"), el("dd", {}, String(t.trial_reports)),
      el("dt", {}, "Max clinical stage"), el("dd", {}, t.max_clinical_stage ? t.max_clinical_stage.replace(/_/g, " ") : "—"),
      el("dt", {}, "Approved drug"), el("dd", {}, t.approved_drug ? "yes" : "no"),
      el("dt", {}, "Tractability"), el("dd", {}, t.tractability.length ? t.tractability.join(", ") : "—"),
      el("dt", {}, "Drug candidates"), el("dd", {}, String(t.candidate_count)),
      el("dt", {}, "HPA skin / immune"), el("dd", {}, `${t.hpa_skin ? "skin" : "—"} / ${t.hpa_immune ? "immune" : "—"}`)));
  head.append(ev);
  wrap.append(head);

  // cross-disease scores for this gene
  const cross = targetsForGene(t.gene);
  if (cross.length > 1) {
    wrap.append(el("div", { class: "section" }, el("h2", { class: "title" }, "Cross-disease profile"),
      dataTable(cross, [
        { key: "disease_name", label: "Disease" },
        { key: "rank", label: "Rank", num: true },
        { key: "composite", label: "Composite", num: true, render: (x) => miniScore(x.composite) },
        { key: "opportunity", label: "Class", render: (x) => oppBadge(x.opportunity) },
        { key: "_t", label: "Readiness", render: (x) => tierBadge(x.readiness) },
      ], { initialSort: { key: "composite", dir: -1 } })));
  }

  // lazy literature + trials + drugs for this gene/disease
  const litHost = el("div", { class: "section" });
  wrap.append(litHost);
  renderTargetExtras(t, litHost);
  return wrap;
}

async function renderTargetExtras(t, host) {
  host.append(el("div", { class: "loading" }, el("div", { class: "spinner" }), "Loading evidence detail…"));
  let lit, modules;
  try {
    [lit, modules] = await Promise.all([load("literature"), Promise.resolve(DB.modules)]);
  } catch (e) {
    console.error("Failed to load evidence detail", e);
    host.innerHTML = "";
    host.append(el("div", { class: "callout" }, "Could not load evidence detail: " + esc(e.message)));
    return;
  }
  host.innerHTML = "";

  // module membership
  const assigns = modules.assignments.filter((a) => a.gene === t.gene && a.disease_key === t.disease_key);
  if (assigns.length) {
    host.append(el("div", { class: "callout info" }, el("strong", {}, "Module: "),
      assigns.map((a) => a.module_label).join(", ")));
  }

  // literature grade
  const grade = lit.find((l) => l.gene === t.gene && l.disease_key === t.disease_key);
  if (grade) {
    host.append(el("div", { class: "panel", style: "margin-bottom:16px" },
      el("h2", {}, `Systematic literature — grade ${grade.grade}`),
      el("p", { class: "muted", style: "font-size:13px;margin:0 0 10px" }, grade.interpretation),
      el("div", { class: "kv" },
        el("dt", {}, "Direct PubMed"), el("dd", {}, String(grade.direct)),
        el("dt", {}, "Clinical/interventional"), el("dd", {}, String(grade.clinical)),
        el("dt", {}, "Genetic/omic"), el("dd", {}, String(grade.genetic)),
        el("dt", {}, "Mechanistic"), el("dd", {}, String(grade.mechanistic)),
        el("dt", {}, "Therapeutic/pharmacologic"), el("dd", {}, String(grade.therapeutic)),
        el("dt", {}, "Recent (≥2020)"), el("dd", {}, String(grade.recent)))));
  }

  // drug candidates for this gene (from lazy columnar)
  const drugHost = el("div");
  host.append(drugHost);
  const col = await load("drug_candidates");
  const gi = col.dims.genes.indexOf(t.gene);
  if (gi < 0) { drugHost.append(el("p", { class: "muted" }, "No drug candidates recorded for this target.")); return; }
  const rows = [];
  for (let i = 0; i < col.n; i++) if (col.cols.genes[i] === gi) rows.push(reconstructDrug(col, i));
  // dedupe by drug + stage, keep max report count
  const byDrug = new Map();
  rows.forEach((d) => {
    const k = d.drug_name + "|" + d.candidate_max_stage;
    const cur = byDrug.get(k);
    if (!cur || d.clinical_report_count > cur.clinical_report_count) byDrug.set(k, d);
  });
  const uniq = [...byDrug.values()].sort((a, b) => b.clinical_report_count - a.clinical_report_count).slice(0, 60);
  drugHost.append(el("h2", { class: "title" }, `Drug candidates (${byDrug.size} unique, top 60 shown)`),
    dataTable(uniq, [
      { key: "drug_name", label: "Drug", render: (d) => el("span", { class: "gene" }, d.drug_name) },
      { key: "drug_type", label: "Type" },
      { key: "candidate_max_stage", label: "Max stage", render: (d) => (d.candidate_max_stage || "—").replace(/_/g, " ") },
      { key: "clinical_report_count", label: "Reports", num: true },
    ], { initialSort: { key: "clinical_report_count", dir: -1 } }));
}

function reconstructDrug(col, i) {
  const o = {};
  const map = { genes: "gene_symbol", targets: "target_name", drugs: "drug_name", drug_types: "drug_type", stages: "drug_maximum_clinical_stage", cand_stages: "candidate_max_stage", diseases: "disease_name" };
  for (const [dim, field] of Object.entries(map)) o[field] = col.dims[dim][col.cols[dim][i]];
  o.clinical_report_count = col.report_count[i];
  return o;
}

views.shortlists = () => {
  const v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Candidate shortlists"),
    el("p", {}, "Curated opportunity classes. White-space = biologically supported but underdeveloped; near-field = repurposing from adjacent indications; validated/late-stage = clinically mature anchors.")));
  const which = (query.get("c") || "white_space");
  const tabs = el("div", { class: "chips section" }, [["white_space", "White-space"], ["near_field", "Near-field repurposing"], ["validated_late_stage", "Validated / late-stage"]].map(([k, lbl]) =>
    el("a", { class: "chip btn" + (k === which ? " active" : ""), href: `#/shortlists?c=${k}` }, lbl)));
  v.append(tabs);
  const rows = DB.shortlists[which] || [];
  v.append(dataTable(rows, [
    { key: "disease_name", label: "Disease" },
    { key: "rank", label: "#", num: true },
    { key: "gene", label: "Gene", render: (r) => el("a", { href: `#/target/${encodeURIComponent(r.gene)}`, class: "gene" }, r.gene) },
    { key: "target_name", label: "Target", render: (r) => r.target_name.length > 34 ? r.target_name.slice(0, 33) + "…" : r.target_name },
    { key: "composite", label: "Composite", num: true, render: (r) => miniScore(r.composite) },
    { key: "genetics", label: "Genetics", num: true, render: (r) => fmt(r.genetics, 2) },
    { key: "skin", label: "Skin", num: true, render: (r) => fmt(r.skin, 2) },
    { key: "druggability", label: "Drug.", num: true, render: (r) => fmt(r.druggability, 2) },
    { key: "novelty_gap", label: "Novelty", num: true, render: (r) => fmt(r.novelty_gap, 2) },
    { key: "gwas_hits", label: "GWAS", num: true },
    { key: "pubmed_pairs", label: "PubMed", num: true },
  ], { onRowClick: (r) => go(`#/target/${encodeURIComponent(r.gene)}`), initialSort: { key: "composite", dir: -1 } }));
  v.append(el("p", { style: "margin-top:16px" },
    el("button", { class: "btn-sm", onclick: () => exportCsv(rows, `${which}_shortlist.csv`) }, "⤓ Export this shortlist (CSV)")));
  return v;
};

views.validation = () => {
  const val = DB.validation;
  const v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Validation & robustness"),
    el("p", {}, "Does a high rank survive scrutiny? Anchor recovery, empirical null calibration, evidence-leakage sensitivity, and negative-control behavior together define how submission-ready a candidate is.")));

  // anchor recovery bar
  const anchorData = val.anchors.map((a) => ({ label: a.disease_name, value: a.recall_top25, color: "#5ad1b4" }));
  v.append(el("div", { class: "grid two-col section" },
    el("div", { class: "panel" }, el("h2", {}, "Anchor recall (top-25)"),
      barChart(anchorData, { max: 1, fmtVal: (x) => pct(x), w: 540, padL: 230 })),
    el("div", { class: "panel" }, el("h2", {}, "Empirical null — top signals (composite vs p-upper)"),
      scatterChart(val.null_signals.slice(0, 80).map((s) => ({
        x: s.composite, y: s.p_upper ?? 1, label: `${s.gene} (${s.disease_name}) p=${fmt(s.p_upper, 3)}`,
        color: s.passes ? "#5ec98a" : "#e8a13a", r: 4.5,
      })), { w: 520, h: 300, xLabel: "Composite score", yLabel: "Empirical p (upper)", xMax: 1, yMax: 1, invertY: true }),
      el("p", { class: "muted", style: "font-size:11.5px;margin-top:6px" }, "Lower-left (high score, low p) is stronger. Green clears p≤0.05."))));

  // negative controls
  v.append(el("div", { class: "section" }, el("h2", { class: "title" }, "Negative-control check"),
    el("div", { class: "callout" }, "Housekeeping genes should never appear; internal low-prior targets should rarely dominate top ranks. Rows reaching a top-25 are the residual uncertainty in this atlas."),
    dataTable(val.negatives, [
      { key: "control_type", label: "Control type", render: (r) => titleCase(r.control_type) },
      { key: "gene", label: "Group / gene" },
      { key: "present", label: "Present", render: (r) => r.present ? "yes" : "no" },
      { key: "best_disease", label: "Best disease", render: (r) => r.best_disease || "—" },
      { key: "best_rank", label: "Best rank", num: true, render: (r) => r.best_rank ?? "—" },
      { key: "in_top25", label: "In top-25", render: (r) => r.in_top25 ? el("span", { class: "tier tier-caution" }, "yes") : "no" },
    ])));

  // leakage sensitivity
  v.append(el("div", { class: "section" }, el("h2", { class: "title" }, "Clinical-precedence leakage sensitivity"),
    el("p", { class: "muted", style: "font-size:13px" }, "Candidates whose rank drops sharply when clinical/literature precedence is removed are evidence-source dependent and should be described as such."),
    dataTable(val.leakage.slice(0, 40), [
      { key: "disease_name", label: "Disease" },
      { key: "gene", label: "Gene", render: (r) => el("a", { class: "gene", href: `#/target/${encodeURIComponent(r.gene)}` }, r.gene) },
      { key: "baseline", label: "Baseline rank", num: true },
      { key: "no_clinical_precedence", label: "No-precedence rank", num: true },
      { key: "delta", label: "Δ rank", num: true },
      { key: "opportunity", label: "Class", render: (r) => oppBadge(r.opportunity) },
    ], { initialSort: { key: "delta", dir: -1 } })));
  return v;
};

views.modules = () => {
  const v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Module map"),
    el("p", {}, "Curated dermatology pathway modules. Each groups target genes into known inflammatory, barrier, interferon, melanocyte, B-cell, chemokine, and innate-immune programs.")));
  const reg = DB.modules.registry;
  v.append(el("div", { class: "section" },
    dataTable(reg, [
      { key: "module_label", label: "Module" },
      { key: "gene_count", label: "Genes", num: true },
      { key: "genes", label: "Members", render: (r) => el("span", { class: "muted", style: "font-family:var(--mono);font-size:12px" }, r.genes.join(", ")) },
      { key: "rationale", label: "Rationale", render: (r) => el("span", { title: r.rationale }, r.rationale.length > 60 ? r.rationale.slice(0, 59) + "…" : r.rationale) },
    ], { initialSort: { key: "gene_count", dir: -1 } })));
  v.append(el("h2", { class: "title" }, "Disease × module signal"));
  v.append(dataTable(DB.diseases.modules, [
    { key: "disease_name", label: "Disease" },
    { key: "module_label", label: "Module" },
    { key: "members", label: "Genes", num: true },
    { key: "top_gene", label: "Top gene", render: (r) => el("a", { class: "gene", href: `#/target/${encodeURIComponent(r.top_gene)}` }, r.top_gene) },
    { key: "max_composite", label: "Max score", num: true, render: (r) => miniScore(r.max_composite) },
    { key: "anchor_members", label: "Anchors", num: true },
  ], { initialSort: { key: "max_composite", dir: -1 } }));
  return v;
};

views.literature = () => {
  const v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Literature evidence"),
    el("p", {}, "Systematic PubMed/Entrez shortlist grades (A–D) for selected white-space, near-field, and validated candidates. Title/abstract screening — not a substitute for full-text review.")));
  const rows = DB.literature.slice();
  const state = { grade: "", disease: "" };
  const toolbar = el("div", { class: "toolbar" });
  const gradeSel = el("select", {}, el("option", { value: "" }, "All grades"), ["A", "B", "C", "D"].map((g) => el("option", { value: g }, `Grade ${g}`)));
  const diseaseSel = el("select", {}, el("option", { value: "" }, "All diseases"), DB.diseases.summaries.map((d) => el("option", { value: d.disease_key }, d.disease_name)));
  const count = el("span", { class: "count" });
  toolbar.append(gradeSel, diseaseSel, el("span", { class: "spacer" }), count);
  const host = el("div");
  function apply() {
    const r = rows.filter((x) => (!state.grade || x.grade === state.grade) && (!state.disease || x.disease_key === state.disease));
    count.textContent = `${r.length} candidates`;
    host.innerHTML = "";
    host.append(dataTable(r, [
      { key: "disease_name", label: "Disease" },
      { key: "gene", label: "Gene", render: (x) => el("a", { class: "gene", href: `#/target/${encodeURIComponent(x.gene)}` }, x.gene) },
      { key: "opportunity", label: "Class", render: (x) => oppBadge(x.opportunity) },
      { key: "grade", label: "Grade", render: (x) => el("span", { class: "tier tier-" + ({ A: "robust", B: "supported", C: "tentative", D: "caution" }[x.grade] || "tentative") }, x.grade) },
      { key: "direct", label: "Direct", num: true },
      { key: "clinical", label: "Clinical", num: true },
      { key: "genetic", label: "Genetic", num: true },
      { key: "recent", label: "≥2020", num: true },
    ], { initialSort: { key: "direct", dir: -1 } }));
  }
  gradeSel.addEventListener("change", () => { state.grade = gradeSel.value; apply(); });
  diseaseSel.addEventListener("change", () => { state.disease = diseaseSel.value; apply(); });
  v.append(toolbar, host); apply();
  return v;
};

views.drugs = () => {
  const v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Drug-candidate explorer"),
    el("p", {}, "Target–drug / clinical candidate extracts from Open Targets — 54,468 rows, interned and virtualized. Filter by gene, drug, type, or stage; only visible rows are in the DOM.")));
  const host = el("div", { class: "loading" }, el("div", { class: "spinner" }), "Loading drug-candidate index (1.5 MB)…");
  v.append(host);
  load("drug_candidates").then((col) => { host.replaceWith(drugExplorer(col)); }).catch((e) => {
    console.error("Failed to load drug candidates", e);
    host.innerHTML = "";
    host.append(el("div", { class: "callout" }, "Could not load drug-candidate data: " + esc(e.message)));
  });
  return v;
};

function drugExplorer(col) {
  const wrap = el("div");
  const state = { gene: "", drug: "", type: "", stage: "", q: "" };
  // build a filtered index of row ids
  let ids = [];

  const toolbar = el("div", { class: "toolbar" });
  const geneSel = el("select", {}, el("option", { value: "" }, "All genes"),
    col.dims.genes.map((g, i) => ({ g, i })).sort((a, b) => a.g.localeCompare(b.g)).map((x) => el("option", { value: x.i }, x.g)));
  const typeSel = el("select", {}, el("option", { value: "" }, "All types"),
    col.dims.drug_types.map((t, i) => el("option", { value: i }, t || "—")));
  const stageSel = el("select", {}, el("option", { value: "" }, "All stages"),
    col.dims.cand_stages.map((s, i) => el("option", { value: i }, (s || "—").replace(/_/g, " "))));
  const search = el("input", { type: "search", placeholder: "Filter drug or indication…" });
  const count = el("span", { class: "count" });
  toolbar.append(geneSel, typeSel, stageSel, search, el("span", { class: "spacer" }), count);
  wrap.append(toolbar);

  // virtualized table
  const ROW_H = 38, BUF = 6;
  const head = el("div", { class: "vhead" },
    el("div", {}, "Gene"), el("div", {}, "Drug"), el("div", {}, "Target"), el("div", {}, "Type"), el("div", {}, "Max stage"), el("div", {}, "Indication"), el("div", { class: "num" }, "Reports"));
  const body = el("div", { class: "vbody" });
  const spacer = el("div", { class: "vspacer" });
  body.append(spacer);
  const vt = el("div", { class: "vtable" }, head, body);
  wrap.append(vt);

  function recompute() {
    const gi = geneSel.value === "" ? -1 : +geneSel.value;
    const ti = typeSel.value === "" ? -1 : +typeSel.value;
    const si = stageSel.value === "" ? -1 : +stageSel.value;
    const q = state.q.toLowerCase();
    ids = [];
    for (let i = 0; i < col.n; i++) {
      if (gi >= 0 && col.cols.genes[i] !== gi) continue;
      if (ti >= 0 && col.cols.drug_types[i] !== ti) continue;
      if (si >= 0 && col.cols.cand_stages[i] !== si) continue;
      if (q) {
        const drug = col.dims.drugs[col.cols.drugs[i]].toLowerCase();
        const ind = col.dims.diseases[col.cols.diseases[i]].toLowerCase();
        if (!drug.includes(q) && !ind.includes(q)) continue;
      }
      ids.push(i);
    }
    count.textContent = `${ids.length.toLocaleString()} rows`;
    spacer.style.height = ids.length * ROW_H + "px";
    body.scrollTop = 0;
    renderWindow();
  }
  function renderWindow() {
    const top = body.scrollTop;
    const start = Math.max(0, Math.floor(top / ROW_H) - BUF);
    const end = Math.min(ids.length, Math.ceil((top + body.clientHeight) / ROW_H) + BUF);
    [...body.querySelectorAll(".vrow")].forEach((r) => r.remove());
    for (let k = start; k < end; k++) {
      const i = ids[k];
      const d = reconstructDrug(col, i);
      const row = el("div", { class: "vrow", style: `top:${k * ROW_H}px;height:${ROW_H}px` },
        el("div", { class: "gene" }, d.gene_symbol),
        el("div", { title: d.drug_name }, d.drug_name),
        el("div", { class: "muted", title: d.target_name }, d.target_name),
        el("div", {}, d.drug_type || "—"),
        el("div", {}, (d.candidate_max_stage || "—").replace(/_/g, " ")),
        el("div", { class: "muted", title: d.disease_name }, d.disease_name),
        el("div", { class: "num" }, d.clinical_report_count.toLocaleString()));
      body.append(row);
    }
  }
  body.addEventListener("scroll", () => requestAnimationFrame(renderWindow));
  [geneSel, typeSel, stageSel].forEach((s) => s.addEventListener("change", recompute));
  search.addEventListener("input", () => { state.q = search.value; recompute(); });
  recompute();
  return wrap;
}

views.methods = () => {
  const m = DB.meta, v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Methods & provenance"),
    el("p", {}, "Scoring formula, weights, data sources, run metadata, and reproducibility notes. The full request-level provenance is cached in the study's source manifest.")));

  const w = m.scoring.weights;
  const wData = Object.keys(w).map((k) => ({ label: m.component_labels[k] || k, value: w[k], color: COMP_COLORS[k] }));
  v.append(el("div", { class: "grid two-col section" },
    el("div", { class: "panel" }, el("h2", {}, "Composite weights"),
      barChart(wData, { max: Math.max(...wData.map((d) => d.value)), fmtVal: (x) => fmt(x, 2), w: 480 }),
      el("p", { class: "muted", style: "font-size:12px;margin-top:8px" }, `Formula: ${esc(m.scoring.formula)}. Safety penalty capped at ${m.scoring.safety_penalty_cap}, final clamped to [0,1].`)),
    el("div", { class: "panel" }, el("h2", {}, "Run metadata"),
      el("div", { class: "kv" },
        el("dt", {}, "Study"), el("dd", {}, m.study),
        el("dt", {}, "Run started"), el("dd", {}, m.run_started_at),
        el("dt", {}, "Run completed"), el("dd", {}, m.run_completed_at),
        el("dt", {}, "Cached API calls"), el("dd", {}, num(m.request_records)),
        el("dt", {}, "Scored pairs"), el("dd", {}, num(m.row_counts.target_scores))))));

  v.append(el("div", { class: "section" }, el("h2", { class: "title" }, "Data sources"),
    el("div", { class: "tbl-wrap" }, (() => {
      const t = el("table", { class: "data" });
      t.append(el("thead", {}, el("tr", {}, el("th", {}, "Source"), el("th", {}, "URL"))));
      const tb = el("tbody");
      Object.entries(m.sources).forEach(([k, url]) => tb.append(el("tr", {}, el("td", {}, k), el("td", {}, el("a", { href: url, target: "_blank", rel: "noopener" }, url)))));
      t.append(tb); return t;
    })())));

  v.append(el("div", { class: "section" }, el("h2", { class: "title" }, "Output validation flags"),
    el("div", { class: "kv" }, Object.entries(m.validation).filter(([k]) => !k.includes("anchor_hits")).map(([k, val]) =>
      [el("dt", {}, titleCase(k)), el("dd", {}, String(val))]).flat())));

  v.append(el("div", { class: "callout" }, el("strong", {}, "Reproducibility. "),
    "API responses are content-addressed and cached by method, URL, params, and body. No API keys are used. ",
    el("a", { href: "#/media" }, "Manuscript & data dictionary →")));
  return v;
};

views.media = () => {
  const v = el("div");
  v.append(el("div", { class: "page-head" }, el("h1", {}, "Figures, manuscript & package"),
    el("p", {}, "Publication figures and submission materials. Click any figure to enlarge.")));

  v.append(el("div", { class: "chips section" },
    el("a", { class: "pill-link", href: "publication_pdf/DermatoTarget_Atlas_publication_package_2026-06-03.pdf", target: "_blank", rel: "noopener" }, "⤓ Publication PDF"),
    el("a", { class: "pill-link", href: "submission/manuscript.md", target: "_blank", rel: "noopener" }, "Manuscript (md)"),
    el("a", { class: "pill-link", href: "submission/data_dictionary.md", target: "_blank", rel: "noopener" }, "Data dictionary"),
    el("a", { class: "pill-link", href: "submission/supplementary_methods.md", target: "_blank", rel: "noopener" }, "Supplementary methods"),
    el("a", { class: "pill-link", href: "reports/validation/publication_validation_report.md", target: "_blank", rel: "noopener" }, "Validation report")));

  const gallery = el("div", { class: "gallery" });
  DB.meta.figures.forEach((f) => {
    const fc = el("figure", { class: "figure-card" },
      el("img", { src: `figures/${f.file}`, alt: f.caption, loading: "lazy" }),
      el("figcaption", {}, f.caption));
    fc.addEventListener("click", () => openLightbox(`figures/${f.file}`, f.caption));
    gallery.append(fc);
  });
  v.append(gallery);
  return v;
};

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function exportCsv(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  rows.forEach((r) => lines.push(keys.map((k) => {
    const v = r[k] ?? "";
    return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v;
  }).join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: filename });
  document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------
function openLightbox(src, cap) {
  $("#lightbox-img").src = src; $("#lightbox-img").alt = cap; $("#lightbox-cap").textContent = cap;
  $("#lightbox").hidden = false;
}
$("#lightbox-close").addEventListener("click", () => ($("#lightbox").hidden = true));
$("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") $("#lightbox").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#lightbox").hidden = true; });

// ---------------------------------------------------------------------------
// Navigation + router
// ---------------------------------------------------------------------------
const NAV = [
  { group: "Explore" },
  { id: "overview", label: "Overview", ico: "◎", route: "#/overview" },
  { id: "disease", label: "Disease explorer", ico: "▣", route: "#/disease" },
  { id: "targets", label: "Target explorer", ico: "⌕", route: "#/targets" },
  { id: "shortlists", label: "Candidate shortlists", ico: "☑", route: "#/shortlists" },
  { group: "Evidence" },
  { id: "validation", label: "Validation", ico: "✓", route: "#/validation" },
  { id: "modules", label: "Module map", ico: "⬡", route: "#/modules" },
  { id: "literature", label: "Literature", ico: "❡", route: "#/literature" },
  { id: "drugs", label: "Drug candidates", ico: "⚕", route: "#/drugs" },
  { group: "Reference" },
  { id: "methods", label: "Methods & provenance", ico: "ƒ", route: "#/methods" },
  { id: "media", label: "Figures & manuscript", ico: "▦", route: "#/media" },
];
const TITLES = Object.fromEntries(NAV.filter((n) => n.id).map((n) => [n.id, n.label]));

let query = new URLSearchParams();
function go(hash) { location.hash = hash; }

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "") || "overview";
  const [path, qs] = raw.split("?");
  query = new URLSearchParams(qs || "");
  const parts = path.split("/");
  return { view: parts[0] || "overview", arg: parts[1] ? decodeURIComponent(parts[1]) : null, query };
}

function renderNav(active) {
  const nav = $("#nav");
  nav.innerHTML = "";
  NAV.forEach((n) => {
    if (n.group) { nav.append(el("div", { class: "nav-group" }, n.group)); return; }
    nav.append(el("a", { href: n.route, class: active === n.id ? "active" : "" },
      el("span", { class: "ico" }, n.ico), n.label));
  });
}

function route() {
  const { view, arg } = parseHash();
  const host = $("#view");
  renderNav(view);
  $("#topbar-title").textContent = TITLES[view] || titleCase(view);
  $("#app").classList.remove("nav-open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $("#app").setAttribute("aria-busy", "false");
  host.innerHTML = "";
  try {
    const fn = views[view] || views.overview;
    host.append(fn(arg, query));
  } catch (e) {
    console.error(e);
    host.append(el("div", { class: "callout" }, "Render error: ", String(e.message)));
  }
  $("#main").scrollTo?.(0, 0);
  window.scrollTo(0, 0);
}

// global gene search
function initSearch() {
  const input = $("#global-search"), box = $("#search-results");
  let cursor = -1, matches = [];
  function render() {
    if (!matches.length) { box.innerHTML = `<div class="sr-empty">No gene matches.</div>`; box.hidden = false; return; }
    box.innerHTML = "";
    matches.forEach((g, i) => {
      const item = el("div", { class: "sr-item" + (i === cursor ? " cursor" : "") },
        el("span", { class: "sr-gene" }, g.gene),
        el("span", {}, g.target_name.length > 30 ? g.target_name.slice(0, 29) + "…" : g.target_name),
        el("span", { class: "sr-meta" }, `${g.n} disease${g.n > 1 ? "s" : ""}`));
      item.addEventListener("click", () => pick(g.gene));
      box.append(item);
    });
    box.hidden = false;
  }
  function pick(gene) { input.value = ""; box.hidden = true; go(`#/target/${encodeURIComponent(gene)}`); }
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { box.hidden = true; return; }
    const seen = new Map();
    DB.targets.forEach((t) => {
      if (t.gene.toLowerCase().includes(q) || t.target_name.toLowerCase().includes(q)) {
        const e = seen.get(t.gene) || { gene: t.gene, target_name: t.target_name, n: 0 };
        e.n++; seen.set(t.gene, e);
      }
    });
    matches = [...seen.values()].sort((a, b) => a.gene.localeCompare(b.gene)).slice(0, 12);
    cursor = -1; render();
  });
  input.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "ArrowDown") { cursor = Math.min(cursor + 1, matches.length - 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { cursor = Math.max(cursor - 1, 0); render(); e.preventDefault(); }
    else if (e.key === "Enter" && matches[cursor]) pick(matches[cursor].gene);
    else if (e.key === "Escape") box.hidden = true;
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".topbar-search")) box.hidden = true; });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot() {
  $("#menu-toggle").addEventListener("click", () => {
    $("#app").classList.toggle("nav-open");
    $("#menu-toggle").setAttribute("aria-expanded", $("#app").classList.contains("nav-open") ? "true" : "false");
  });
  try {
    const [meta, targets, diseases, validation, modules, shortlists] = await Promise.all([
      load("meta"), load("targets"), load("diseases"), load("validation"), load("modules"), load("shortlists"),
    ]);
    Object.assign(DB, { meta, targets, diseases, validation, modules, shortlists });
    DB.literature = await load("literature");
    $("#run-stamp").textContent = "run " + (meta.run_completed_at || "").slice(0, 10);
    initSearch();
    window.addEventListener("hashchange", route);
    route();
  } catch (e) {
    console.error(e);
    $("#view").innerHTML = `<div class="callout">Failed to load dashboard data. Run <code>PYTHONPATH=src python3 -m dashboard.build_data</code> and serve from the repo root. (${esc(e.message)})</div>`;
    $("#app").setAttribute("aria-busy", "false");
  }
}
boot();
