/* HTML shell for the Rheum–Derm Immune Atlas systems explorer.
 * Kept separate so the explorer can be reviewed and evolved as an isolated unit.
 */
(() => {
  const mount = document.getElementById('systemsExplorerMount')
  if (!mount) throw new Error('Systems explorer mount was not found')
  mount.outerHTML = `  <section id="network" class="view">
    <div class="panel network-panel">
      <div class="panel-head network-titlebar"><div><h3>Mechanistically structured 3D systems explorer</h3><div class="panel-sub">Placement, geometry and visual encoding are semantic: causal stage, clinical domain, entity type, target direction, benefit, evidence and cross-condition sharedness.</div></div>
        <div class="network-mode-switch" role="group" aria-label="Network mode"><button class="active" data-network-mode="condition">Condition cascade</button><button data-network-mode="unified">Unified cross-condition atlas</button></div>
      </div>
      <div class="local-mode-switch" role="tablist" aria-label="Network representation"><button role="tab" aria-selected="true" aria-controls="freeSpacePanel" class="active" data-network-representation="free">Free-space</button><button role="tab" aria-selected="false" aria-controls="triptychPanel" data-network-representation="triptych">Provenance triptych</button></div>
      <div id="freeSpacePanel" role="tabpanel">
      <div class="network-toolbar">
        <select id="networkCondition" class="control"></select>
        <input id="networkSearch" class="control" list="networkSearchList" placeholder="Find a node…" autocomplete="off"><datalist id="networkSearchList"></datalist>
        <select id="networkEvidence" class="control"><option value="D">Evidence A–D</option><option value="C">Evidence A–C</option><option value="B" selected>Evidence A–B</option><option value="A">Evidence A only</option></select>
        <select id="networkDensity" class="control"><option value="focused" selected>Backbone / focused</option><option value="core">Core evidence</option><option value="expanded">Expanded network</option></select>
        <select id="networkSharedMin" class="control" disabled><option value="1">Sharedness: any</option><option value="2" selected>Shared by ≥2 conditions</option><option value="4">Shared by ≥4 conditions</option><option value="6">Shared by ≥6 conditions</option></select>
        <select id="networkEdgeFamily" class="control"><option value="all">Relations: all layers</option><option value="pathogenesis">Pathogenesis only</option><option value="therapy">Pharmacology only</option><option value="phenotype">Phenotype links only</option></select>
        <select id="networkLabels" class="control"><option value="selected">Labels: selected + key</option><option value="important" selected>Labels: important</option><option value="all">Labels: all</option></select>
        <button id="networkTour" class="btn sm primary">Trace supported chain</button><button id="networkIsolate" class="btn sm">Isolate 1-hop</button><button id="networkReset" class="btn sm">Reset</button>
      </div>
      <div id="networkAxisNote" class="network-axis-note"></div>
      <div class="network-workspace">
        <div class="network-shell">
          <canvas id="network3d" aria-label="Interactive three-dimensional rheumatology dermatology knowledge graph"></canvas>
          <div class="network-view-controls"><button class="btn sm" data-view-preset="iso">Isometric</button><button class="btn sm" data-view-preset="front">Causal front</button><button class="btn sm" data-view-preset="therapy">Intervention plane</button><button class="btn sm" data-view-preset="side">Layer side</button></div>
          <div id="networkStats" class="network-stats"></div>
          <div class="network-help">Drag: rotate · Shift-drag: pan · Wheel/pinch: zoom · Hover: preview · Click: lock node/edge · Isolate: one-hop subgraph · Double-click: recenter</div>
        </div>
        <aside class="network-sidebar">
          <section id="nodeInfo" class="node-info"><h4>Network ready</h4><p>Select a node or edge to inspect its mechanistic meaning and evidence.</p></section>
          <section><div class="eyebrow">Connected relationships</div><div id="networkRelations" class="network-relations"></div></section>
          <section><div class="eyebrow">Visual grammar</div><div id="networkLegend" class="network-legend"></div></section>
        </aside>
      </div>
      </div>
      <div id="triptychPanel" role="tabpanel" hidden>
        <div class="triptych-toolbar"><div class="controls"><label>Condition <select id="triptychConditionSelect" class="control"></select></label><label>Right facet <select id="triptychRightFacet" class="control"><option value="medication">Treatments</option><option value="feature">Features</option></select></label></div><div id="triptychDenominator" class="comparison-denominator"></div></div>
        <div class="triptych-frame">
          <div class="triptych-headings"><div class="triptych-facet"><span>Facet I</span><b>Pathways</b></div><div id="triptychCondition" class="triptych-facet"><span>Facet II</span><b>Condition</b></div><div id="triptychRightHeading" class="triptych-facet"><span>Facet III</span><b>Treatments</b></div></div>
          <div class="triptych-svg-shell"><svg id="triptychSvg" role="img" aria-label="Fixed pathway condition treatment provenance triptych"></svg></div>
        </div>
        <div class="triptych-legend"><span><i class="triptych-line direct"></i>Direct source row</span><span><i class="triptych-line derived"></i>Derived through declared target</span><span><i class="triptych-waypoint-demo"></i>Named waypoint / relation</span><span>Unknown coordinates remain omitted from the focused trace, not reclassified as absent.</span></div>
        <section class="storyboard" aria-label="Guided supported story">
          <div class="storyboard-head"><div><div class="eyebrow">Four-class storyboard</div><h4>Supported chain</h4></div><div class="story-controls"><button id="storyStart" class="btn sm primary">Start guided story</button><button id="storyNext" class="btn sm" disabled>Next story step</button><button id="storyStop" class="btn sm" disabled>Stop story</button></div></div>
          <div id="storySteps" class="story-steps"></div>
          <div id="storyStatus" class="story-status" aria-live="polite">Ready. Steps are drawn only from visible source-backed entities.</div>
        </section>
      </div>
    </div>
  </section>`
})()
