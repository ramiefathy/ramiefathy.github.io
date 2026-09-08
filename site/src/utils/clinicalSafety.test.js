import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as data from '../../public/apps/biologic-monitoring-dashboard/data.js';
import { CHECKLIST_SCOPE, CLINICAL_SCOPE, clinicalExport, csvCell, highlightSafe, referenceLink, reviewSummary, validateMonitoringData } from '../../public/apps/biologic-monitoring-dashboard/safety.js';
import * as XLSX from '../../public/apps/vendor/xlsx.mjs';
const entry = (id) => data.monitoringEntries.find((item) => item.id === id);
const textOf = (id) => JSON.stringify(entry(id));
const copy = () => JSON.parse(JSON.stringify(data));

describe('clinical reference contract (not clinical validation)', () => {
  it('validates every published entry without changing the original dataset date', () => {
    expect(validateMonitoringData(data)).toBe(true);
    expect(data.monitoringEntries).toHaveLength(23);
    expect(data.dataVersion).toBe('2025-09-23');
    expect(data.safetyRevision).toBe('2026-09-07');
  });
  it.each([
    ['duplicate entries', (d) => d.monitoringEntries.push(d.monitoringEntries[0])],
    ['impossible date', (d) => { d.dataVersion = '2026-02-30'; }],
    ['unknown condition', (d) => d.monitoringEntries[0].conditions.push('made-up')],
    ['unknown warning', (d) => d.monitoringEntries[0].warningFlags.push('made-up')],
    ['empty task', (d) => { d.monitoringEntries[0].baselineTasks[0].label = ''; }],
    ['duplicate task', (d) => d.monitoringEntries[0].baselineTasks.push(d.monitoringEntries[0].baselineTasks[0])],
    ['missing references', (d) => { d.monitoringEntries[0].references = []; }],
    ['script source', (d) => { d.monitoringEntries[0].references[0].url = 'javascript:alert(1)'; }],
    ['credential source', (d) => { d.monitoringEntries[0].references[0].url = 'https://user:pass@example.com/'; }],
    ['negative timing', (d) => { d.monitoringEntries[0].monitoringSchedule[0].relativeWeeks = -1; }],
    ['malformed review', (d) => { d.monitoringEntries[0].safetyReview.date = 'yesterday'; }],
    ['null review', (d) => { d.monitoringEntries[0].safetyReview = null; }],
    ['future review date', (d) => { d.monitoringEntries[0].safetyReview.date = '2999-01-01'; }],
    ['empty conditions', (d) => { d.monitoringEntries[0].conditions = []; }],
    ['timing beyond ten years', (d) => { d.monitoringEntries[0].monitoringSchedule[0].relativeWeeks = 521; }],
    ['fractional timing overflow', (d) => { d.monitoringEntries[0].monitoringSchedule[0].relativeWeeks = Infinity; }],
    ['unknown badge note', (d) => { d.monitoringEntries[0].warningFlagNotes = { 'made-up': 'text' }; }],
    ['empty badge note', (d) => { d.monitoringEntries[0].warningFlagNotes = { [d.monitoringEntries[0].warningFlags[0]]: '' }; }],
  ])('rejects %s', (_, mutate) => { const changed = copy(); mutate(changed); expect(() => validateMonitoringData(changed)).toThrow(); });
  it.each(data.monitoringEntries)('keeps risk context and sources in $id exports', (item) => {
    const output = clinicalExport(item, data.dataVersion, {});
    for (const value of [CLINICAL_SCOPE, CHECKLIST_SCOPE, item.contraindications, item.interactions, item.dosing, ...item.holdCriteria]) expect(output).toContain(value);
    for (const ref of item.references) expect(output).toContain(ref.url);
    for (const task of item.baselineTasks) { expect(output).toContain(task.label); if (task.notes) expect(output).toContain(task.notes); }
    expect(output).toContain('Original dataset: 2025-09-23');
  });
  it('does not invent a complete review for unchanged entries', () => {
    expect(entry('acitretin').safetyReview).toBeUndefined();
    expect(reviewSummary(entry('acitretin'), data.dataVersion)).toContain('has not received a complete current-label validation');
    expect(reviewSummary(entry('il17-inhibitors'), data.dataVersion)).toContain('not a complete monograph validation');
  });
  it('accepts review dates up to today and keeps the ten-year timing ceiling inclusive', () => {
    const changed = copy();
    changed.monitoringEntries[0].safetyReview.date = new Date().toISOString().slice(0, 10);
    changed.monitoringEntries[0].monitoringSchedule[0].relativeWeeks = 520;
    expect(validateMonitoringData(changed)).toBe(true);
  });
  it('retains checked/unchecked marks only with an explicit unverified-record warning', () => {
    const item = data.monitoringEntries[0];
    const output = clinicalExport(item, data.dataVersion, { baseline: { [item.baselineTasks[0].id]: true } });
    expect(output).toContain(`[x] ${item.baselineTasks[0].label}`);
    expect(output).toContain('[ ]');
    expect(output).toContain('not a patient record');
  });
  it('does not advertise Crohn disease as an IL-17 indication and preserves agent-specific risks', () => {
    expect(entry('il17-inhibitors').conditions).not.toContain('crohns-disease');
    expect(textOf('il17-inhibitors')).toMatch(/bimekizumab[\s\S]*bilirubin/i);
    expect(textOf('il17-inhibitors')).toMatch(/brodalumab[\s\S]*Crohn/i);
  });
  it('distinguishes IL-23 liver windows instead of applying a class-wide schedule', () => {
    expect(textOf('il23-inhibitors')).toMatch(/16 weeks/);
    expect(textOf('il23-inhibitors')).toMatch(/12 weeks/);
    expect(textOf('il23-inhibitors')).toMatch(/24 weeks/);
  });
  it('uses the correct abrocitinib label and CBC timing', () => {
    expect(textOf('abrocitinib')).toContain('id=16652');
    expect(textOf('abrocitinib')).not.toContain('id=15544');
    expect(textOf('abrocitinib')).toMatch(/4 weeks/);
    expect(textOf('abrocitinib')).toMatch(/81 mg/);
    expect(textOf('abrocitinib')).not.toContain('Week 8');
  });
  it('removes apremilast AD indication and does not make depression an absolute contraindication', () => {
    expect(entry('apremilast').conditions).not.toContain('atopic-dermatitis');
    expect(entry('apremilast').contraindications).toMatch(/hypersensitiv/i);
    expect(textOf('apremilast')).not.toContain('>10%');
  });
  it('includes updated HCQ OCT/FAF screening and conditional deferral', () => {
    expect(textOf('hydroxychloroquine')).toContain('FAF');
    expect(textOf('hydroxychloroquine')).toMatch(/5 years/);
    expect(textOf('hydroxychloroquine')).toContain('41232611');
  });
  it('does not confuse future iPLEDGE implementation with current requirements', () => {
    const iso = textOf('isotretinoin');
    expect(iso).toContain('November 15, 2026');
    // Program status is stated only as dated, attributed history—never as a present-tense status that expires.
    expect(iso).toMatch(/FDA announced on June 16, 2026 that implementation of the iPLEDGE REMS modifications approved in February 2026/);
    expect(iso).toContain('was delayed to November 15, 2026');
    expect(iso).toMatch(/Confirm the currently enforced requirements in the iPLEDGE program/);
    expect(iso).not.toMatch(/as of/i);
    expect(iso).not.toMatch(/is delayed/i);
    expect(entry('isotretinoin').references.some((ref) => ref.label.includes('June 16, 2026'))).toBe(true);
    expect(iso).toContain('pre-treatment pregnancy tests in a medical setting');
    expect(iso).not.toContain('one in-office');
    expect(entry('isotretinoin').holdCriteria.join(' ')).not.toContain('800');
  });
  it('preserves IVIG boxed warnings, qualified IgA contraindication and dose-dependent vaccination spacing', () => {
    expect(entry('ivig').warningFlags).toContain('boxed-warning');
    expect(entry('ivig').contraindications).toContain('AND a history of hypersensitivity');
    expect(entry('ivig').interactions).toContain('11 months');
    expect(entry('ivig').interactions).toContain('not a universal 3-month interval');
  });
  it('does not manufacture class-wide TNF laboratory stop thresholds', () => {
    expect(entry('tnf-inhibitors').contraindications).toContain('>5 mg/kg');
    expect(textOf('tnf-inhibitors')).not.toContain('ALT or AST >3');
    expect(textOf('tnf-inhibitors')).toContain('2010');
  });
});

describe('2026-09-07 targeted clinical corrections', () => {
  const reviewed = ['ustekinumab', 'ivig', 'mycophenolate', 'methotrexate', 'baricitinib', 'hydroxychloroquine', 'cyclosporine', 'il4-13-blockers', 'tnf-inhibitors', 'il17-inhibitors'];
  it.each(reviewed)('%s carries the dated targeted-correction summary', (id) => {
    expect(entry(id).safetyReview.date).toBe('2026-09-07');
    expect(reviewSummary(entry(id), data.dataVersion)).toMatch(/^Targeted safety correction 2026-09-07: /);
    expect(reviewSummary(entry(id), data.dataVersion)).toContain('Original dataset: 2025-09-23');
  });
  it('replaces invented ustekinumab laboratory schedules with label-consistent guidance', () => {
    const text = textOf('ustekinumab');
    expect(text).not.toMatch(/3 ?× ?ULN/);
    expect(text).not.toMatch(/every 3–6 months/i);
    expect(text).not.toMatch(/annual TB and hepatitis/i);
    expect(text).toMatch(/no routine laboratory monitoring schedule/i);
    expect(text).toMatch(/active TB/i);
    expect(text).toMatch(/latent TB/i);
    expect(text).toMatch(/reversible posterior leukoencephalopathy/i);
    expect(text).toMatch(/noninfectious pneumonia/i);
    expect(entry('ustekinumab').references.some((ref) => ref.url.includes('STELARA-pi.pdf'))).toBe(true);
  });
  it('adds the IVIG aseptic meningitis, TRALI, hemolysis and hyperproteinemia warnings with an appropriate badge', () => {
    const text = textOf('ivig');
    expect(text).toMatch(/aseptic meningitis/i);
    expect(text).toMatch(/2 g\/kg/);
    expect(text).toMatch(/TRALI/);
    expect(text).toMatch(/non-O blood group/i);
    expect(text).toMatch(/pseudohyponatremia/i);
    expect(entry('ivig').warningFlags).not.toContain('infection');
    expect(entry('ivig').warningFlags).toContain('boxed-warning');
    expect(entry('ivig').warningFlags).toContain('thrombosis');
    expect(entry('ivig').warningFlags).toContain('renal');
    expect(data.RISK_BADGE_LABELS.thrombosis).toBeTruthy();
    expect(data.RISK_BADGE_LABELS.renal).toBeTruthy();
  });
  it('flags the mycophenolate boxed warning and REMS with contraception and testing requirements', () => {
    expect(entry('mycophenolate').warningFlags).toContain('boxed-warning');
    expect(entry('mycophenolate').warningFlags).toContain('rems');
    const text = textOf('mycophenolate');
    expect(text).toMatch(/embryofetal toxicity/i);
    expect(text).toMatch(/two (acceptable|reliable) (forms|methods) of contraception/i);
    expect(text).toMatch(/REMS/);
  });
  it('states once-weekly methotrexate dosing and the fatal daily-dosing error', () => {
    const text = textOf('methotrexate');
    expect(text).toContain('ONCE WEEKLY');
    expect(text).toMatch(/daily dosing has caused fatal toxicity/i);
    expect(text).toMatch(/confirm dosing frequency at every prescription/i);
  });
  it('does not list atopic dermatitis as an FDA-approved baricitinib indication', () => {
    expect(entry('baricitinib').conditions).not.toContain('atopic-dermatitis');
    const text = textOf('baricitinib');
    expect(text).toMatch(/not FDA-approved/i);
    expect(text).toMatch(/EU/);
    expect(text).toMatch(/Japan/);
    expect(text).toMatch(/COVID-19/);
  });
  it('adds SLE to hydroxychloroquine and the AAO 2025 obesity dosing ceiling', () => {
    expect(entry('hydroxychloroquine').conditions).toContain('systemic-lupus-erythematosus');
    const text = textOf('hydroxychloroquine');
    expect(text).toMatch(/real body weight/i);
    expect(text).toMatch(/under 400 mg\/day/i);
    expect(text).toMatch(/severely obese/i);
  });
  it('replaces the unsourced cyclosporine blood-pressure rule with AAD framing and the 1-year psoriasis limit', () => {
    const text = textOf('cyclosporine');
    expect(text).not.toContain('160/90');
    expect(text).toMatch(/140\/90/);
    expect(text).toMatch(/two occasions/i);
    expect(text).toMatch(/25–50%/);
    expect(text).toMatch(/1 year/i);
    expect(entry('cyclosporine').references.some((ref) => ref.url.includes('10.1016/j.jaad.2020.02.044'))).toBe(true);
  });
  it('cites the actual AAD 2024 atopic dermatitis guideline and adds prurigo nodularis for dupilumab', () => {
    const refs = entry('il4-13-blockers').references;
    expect(refs.some((ref) => ref.url.includes('ajmc.com'))).toBe(false);
    expect(refs.some((ref) => ref.url.includes('10.1016/j.jaad.2023.08.102'))).toBe(true);
    expect(entry('il4-13-blockers').conditions).toContain('prurigo-nodularis');
  });
  it('uses an individualized monitoring frequency for TNF inhibitors and labels it', () => {
    expect(entry('tnf-inhibitors').monitoringFrequency).toBe('individualized');
    expect(data.MONITORING_FREQUENCY_LABELS.individualized).toMatch(/individualized/i);
  });
  it('scopes IL-17 boxed-warning and REMS badges to brodalumab in the badge notes', () => {
    const notes = entry('il17-inhibitors').warningFlagNotes;
    expect(notes['boxed-warning']).toMatch(/brodalumab only/i);
    expect(notes.rems).toMatch(/brodalumab only/i);
  });
});

describe('safe rendering and export primitives', () => {
  it('escapes reference labels and rejects unsafe reference URLs when building chips', () => {
    const chip = referenceLink({ label: '<img src=x onerror=alert(1)> "quoted"', url: 'https://example.org/path?a=1&b="2"' });
    expect(chip).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(chip).toContain('href="https://example.org/path?a=1&amp;b=%222%22"');
    expect(chip).not.toContain('onerror=alert(1)>');
    expect(referenceLink({ label: 'bad', url: 'javascript:alert(1)' })).toBe('');
    expect(referenceLink({ label: 'bad', url: 'not a url' })).toBe('');
  });
  it.each(['=WEBSERVICE("https://evil")', '+1+1', '-1+1', '@SUM(1,2)', '\t=1', '  =1'])('neutralizes spreadsheet formula prefix %s', (value) => {
    expect(csvCell(value)).toMatch(/^"'/);
  });
  it('quotes CSV fields and preserves ordinary clinical text', () => { expect(csvCell('ANC < 500, "hold"')).toBe('"ANC < 500, ""hold"""'); });
  it('highlights literal regex metacharacters only after HTML escaping', () => {
    expect(highlightSafe('<img src=x onerror=alert(1)> [x]', '[x]')).toBe('&lt;img src=x onerror=alert(1)&gt; <mark class="highlight">[x]</mark>');
    expect(highlightSafe('ANC <500 & LFT >3', '<500')).toContain('<mark class="highlight">&lt;500</mark>');
  });
  it('uses the supported vendored SheetJS release and verifies its recorded digest', () => {
    expect(XLSX.version).toBe('0.20.3');
    const root = new URL('../../public/apps/vendor/', import.meta.url);
    const provenance = JSON.parse(readFileSync(new URL('xlsx.provenance.json', root), 'utf8'));
    expect(provenance.version).toBe(XLSX.version);
    for (const [name, digest] of Object.entries(provenance.files)) expect(createHash('sha256').update(readFileSync(new URL(name, root))).digest('hex')).toBe(digest);
  });
  it('round-trips workbook export, including non-ASCII text and literal formula-like strings', () => {
    const rows = [['Diagnosis', 'Detail'], ['Sézary', 'ANC <500/µL'], ['Literal', '=1+1']];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Reference');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const decoded = XLSX.read(bytes, { type: 'array' });
    expect(XLSX.utils.sheet_to_json(decoded.Sheets.Reference, { header: 1 })).toEqual(rows);
    expect(decoded.Sheets.Reference.B3.f).toBeUndefined();
  });
});
