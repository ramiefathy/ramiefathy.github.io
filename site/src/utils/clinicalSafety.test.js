import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as data from '../../public/apps/biologic-monitoring-dashboard/data.js';
import { CHECKLIST_SCOPE, CLINICAL_SCOPE, clinicalExport, csvCell, highlightSafe, reviewSummary, validateMonitoringData } from '../../public/apps/biologic-monitoring-dashboard/safety.js';
import * as XLSX from '../../public/apps/vendor/xlsx.mjs';
const entry = (id) => data.monitoringEntries.find((item) => item.id === id);
const textOf = (id) => JSON.stringify(entry(id));
const copy = () => JSON.parse(JSON.stringify(data));

describe('clinical reference contract (not clinical validation)', () => {
  it('validates every published entry without changing the original dataset date', () => {
    expect(validateMonitoringData(data)).toBe(true);
    expect(data.monitoringEntries).toHaveLength(23);
    expect(data.dataVersion).toBe('2025-09-23');
    expect(data.safetyRevision).toBe('2026-09-04');
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
  ])('rejects %s', (_, mutate) => { const changed = copy(); mutate(changed); expect(() => validateMonitoringData(changed)).toThrow(); });
  it.each(data.monitoringEntries)('keeps risk context and sources in $id exports', (item) => {
    const output = clinicalExport(item, data.dataVersion, {});
    for (const value of [CLINICAL_SCOPE, CHECKLIST_SCOPE, item.contraindications, item.interactions, item.dosing, ...item.holdCriteria]) expect(output).toContain(value);
    for (const ref of item.references) expect(output).toContain(ref.url);
    for (const task of item.baselineTasks) { expect(output).toContain(task.label); if (task.notes) expect(output).toContain(task.notes); }
    expect(output).toContain('Original dataset: 2025-09-23');
  });
  it('does not invent a complete review for unchanged entries', () => {
    expect(reviewSummary(entry('methotrexate'), data.dataVersion)).toContain('has not received a complete current-label validation');
    expect(reviewSummary(entry('il17-inhibitors'), data.dataVersion)).toContain('not a complete monograph validation');
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

describe('safe rendering and export primitives', () => {
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
