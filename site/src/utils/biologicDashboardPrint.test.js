import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../public/apps/biologic-monitoring-dashboard/styles.css', import.meta.url), 'utf8');

/** Return the bodies of every `@media print { ... }` block (brace-balanced, comments stripped). */
function printBlocks(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [];
  const pattern = /@media\s+print\s*\{/g;
  let match;
  while ((match = pattern.exec(text))) {
    let depth = 1;
    let index = pattern.lastIndex;
    while (index < text.length && depth > 0) {
      if (text[index] === '{') depth += 1;
      else if (text[index] === '}') depth -= 1;
      index += 1;
    }
    blocks.push(text.slice(pattern.lastIndex, index - 1));
  }
  return blocks;
}

function printRules(source) {
  return printBlocks(source).flatMap((block) =>
    [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
      selectors: selector.split(',').map((part) => part.trim()),
      body: body.replace(/\s+/g, ' ').trim()
    }))
  );
}

describe('biologic dashboard print stylesheet', () => {
  it('hides hero copy in print but keeps the clinical safety notice paragraphs visible', () => {
    const rules = printRules(css);
    expect(rules.some((rule) => rule.selectors.includes('.hero p') && /display:\s*none\s*!important/.test(rule.body))).toBe(true);
    const notice = rules.filter((rule) => rule.selectors.includes('.clinical-safety-notice p'));
    expect(notice.length).toBeGreaterThan(0);
    expect(notice.some((rule) => /display:\s*block\s*!important/.test(rule.body))).toBe(true);
    expect(notice.some((rule) => /color:\s*(#000|black)/.test(rule.body))).toBe(true);
  });
});
