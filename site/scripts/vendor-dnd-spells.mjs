import { readFile, writeFile } from 'node:fs/promises';

const [catalogPath, dataPath] = process.argv.slice(2);
if (!catalogPath || !dataPath) throw new Error('Usage: node vendor-dnd-spells.mjs <srd-spells.json> <data.js>');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const sourceText = await readFile(dataPath, 'utf8');
const prefix = 'window.TABLE_LEDGER_DATA=';
if (!sourceText.startsWith(prefix) || !sourceText.trimEnd().endsWith(';')) throw new Error('Unexpected data.js wrapper');
const data = JSON.parse(sourceText.slice(prefix.length).trim().replace(/;$/, ''));
const spells = Object.values(catalog.spells).map((spell) => ({
  id: spell.id,
  name: spell.name,
  level: spell.level,
  school: spell.school,
  classes: spell.classes || [],
  time: spell.casting_time?.raw || 'Action',
  ritual: Boolean(spell.casting_time?.ritual),
  range: spell.range,
  concentration: Boolean(spell.duration?.concentration),
  duration: spell.duration?.raw || '',
  components: [spell.components?.v && 'V', spell.components?.s && 'S', spell.components?.m && 'M'].filter(Boolean).join(', '),
  material: spell.components?.material || '',
  damage: spell.damage?.dice || '',
  damageType: spell.damage?.type || '',
  description: spell.description || '',
})).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
if (spells.length !== 337) throw new Error(`Expected 337 SRD spells; received ${spells.length}`);
data.spells = spells;
data.spellCatalogSource = {
  title: 'SRD 5.2.1 structured spell catalog',
  upstream: 'howard-branch/ai-dm',
  commit: 'a7dcb41743c046e9ab7ceb031c45962f946951ff',
  count: spells.length,
};
await writeFile(dataPath, `${prefix}${JSON.stringify(data)};\n`);
console.log(`Vendored ${spells.length} spells into ${dataPath}`);
