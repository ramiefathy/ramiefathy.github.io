import fs from 'fs';
import path from 'path';
import vm from 'vm';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

const apps = [
  {
    id: 'alopecia',
    source: 'apps/AlopeciaMindMaps/Alopecia/js/data.js',
    defaultTab: 'approach',
    title: 'Alopecia Mind Map',
    theme: 'teal'
  },
  {
    id: 'ctcl',
    source: 'apps/CTCLMindMaps/CTCL/js/data.js',
    defaultTab: 'question',
    title: 'CTCL Mind Map',
    theme: 'indigo'
  },
  {
    id: 'pruritus',
    source: 'apps/PruritusMindMaps/js/data.js',
    defaultTab: 'approach',
    title: 'Pruritus Mind Map',
    theme: 'sky'
  },
  {
    id: 'psoriasis',
    source: 'apps/PsoriasisMindMaps/Psoriasis/js/data.js',
    defaultTab: 'patho',
    title: 'Psoriasis Mind Map',
    theme: 'rose'
  },
  {
    id: 'autoimmune-bullous',
    source: 'apps/AutoimmuneBullousMindMaps/AutoimmuneBullous/js/data.js',
    defaultTab: 'classification',
    title: 'Autoimmune Bullous Mind Map',
    theme: 'emerald'
  }
];

function loadData(file) {
  const abs = path.resolve(file);
  const code = fs.readFileSync(abs, 'utf8');
  const sandbox = { module: { exports: {} }, exports: {}, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    code +
      '\nthis.__EXPORT__ = typeof mindMapData !== "undefined" ? mindMapData : (typeof dataMap !== "undefined" ? dataMap : undefined);',
    sandbox
  );
  const data = sandbox.__EXPORT__ || sandbox.window.mindMapData || sandbox.window.dataMap;
  if (!data) {
    throw new Error(`Unable to locate mind map data in ${file}`);
  }
  return data;
}

function convertTooltip(raw) {
  if (!raw) return undefined;
  const markdown = raw.content ? turndown.turndown(raw.content) : '';
  return {
    title: raw.title || '',
    markdown
  };
}

function convertNode(node) {
  const base = {
    id: node.id,
    name: node.name,
    tooltip: convertTooltip(node.tooltip)
  };
  if (node.children && node.children.length) {
    return {
      ...base,
      children: node.children.map(convertNode)
    };
  }
  return base;
}

for (const app of apps) {
  const data = loadData(app.source);
  const rootDir = path.resolve('site/src/data/mindmaps', app.id);
  fs.mkdirSync(rootDir, { recursive: true });
  const manifest = {
    id: app.id,
    title: app.title,
    defaultTab: app.defaultTab,
    theme: app.theme,
    tabs: []
  };
  for (const [tab, value] of Object.entries(data)) {
    manifest.tabs.push({
      id: tab,
      name: value.name || tab
    });
    const outPath = path.join(rootDir, `${tab}.json`);
    fs.writeFileSync(outPath, JSON.stringify(convertNode(value), null, 2));
  }
  fs.writeFileSync(path.join(rootDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}
