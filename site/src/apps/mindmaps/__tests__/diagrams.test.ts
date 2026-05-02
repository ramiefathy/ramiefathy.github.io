import { describe, expect, it } from 'vitest';
import { validateDiagram, validateComparison } from '../schema';
import type { Diagram, Comparison } from '../types';

const TEST_CITATIONS = [{ url: 'https://example.test/reference', quote: 'Test evidence locator.' }];

describe('validateDiagram', () => {
  it('accepts a minimal decision-tree diagram', () => {
    const diagram: Diagram = {
      id: 'd1', topic: 'alopecia', title: 'Test', type: 'decision-tree',
      citations: TEST_CITATIONS,
      data: {
        start: 's1',
        steps: [{ id: 's1', type: 'terminal', prompt: 'Done' }]
      }
    };
    const result = validateDiagram(diagram);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(diagram);
  });

  it('rejects a diagram with an unknown type', () => {
    const bad = { id: 'd1', topic: 'alopecia', title: 'X', type: 'sankey', data: {} } as unknown as Diagram;
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/unknown diagram type/i);
  });

  it('rejects a decision-tree where start does not match any step id', () => {
    const bad: Diagram = {
      id: 'd1', topic: 'alopecia', title: 'X', type: 'decision-tree',
      citations: TEST_CITATIONS,
      data: { start: 'missing', steps: [{ id: 's1', type: 'terminal' }] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/start.*not found/i);
  });

  it('rejects a swimlane row that references a missing lane id', () => {
    const bad: Diagram = {
      id: 'd1', topic: 'alopecia', title: 'X', type: 'swimlane',
      citations: TEST_CITATIONS,
      data: {
        lanes: [{ id: 'first', name: 'First-line' }],
        rows: [{ id: 'aga', name: 'AGA', cells: { unknown: { text: '...' } } }]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/lane.*unknown/i);
  });

  it('rejects a concept-map edge that references a missing node id', () => {
    const bad: Diagram = {
      id: 'd1', topic: 'alopecia', title: 'X', type: 'concept-map',
      data: {
        nodes: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
        edges: [{ from: 'a', to: 'ghost', kind: 'causes' }]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => /edge.*ghost/i.test(e))).toBe(true);
  });

  it('rejects a concept-map with duplicate node ids', () => {
    const bad: Diagram = {
      id: 'd1', topic: 'alopecia', title: 'X', type: 'concept-map',
      data: {
        nodes: [{ id: 'a', name: 'A' }, { id: 'a', name: 'A again' }],
        edges: []
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => /duplicate node ids/i.test(e))).toBe(true);
  });

  it('rejects a lifecycle with duplicate phase ids', () => {
    const bad: Diagram = {
      id: 'd1', topic: 'alopecia', title: 'X', type: 'lifecycle',
      data: { phases: [{ id: 'p', name: 'P' }, { id: 'p', name: 'P again' }] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => /duplicate phase ids/i.test(e))).toBe(true);
  });

  // Array-type guards: malformed JSON where an expected array is the wrong type
  // must produce a structured error, not a TypeError. (Codex adversarial review #2.)
  it('does not throw when decision-tree steps is a non-array', () => {
    const bad = { id: 'd1', topic: 't', title: 'X', type: 'decision-tree',
      data: { start: 's1', steps: 'not-an-array' } } as unknown as Diagram;
    expect(() => validateDiagram(bad)).not.toThrow();
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => /steps.*must be an array/i.test(e))).toBe(true);
  });

  it('does not throw when swimlane lanes/rows are non-arrays', () => {
    const bad = { id: 'd1', topic: 't', title: 'X', type: 'swimlane',
      data: { lanes: 5, rows: { not: 'an array' } } } as unknown as Diagram;
    expect(() => validateDiagram(bad)).not.toThrow();
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /lanes.*must be an array/i.test(e))).toBe(true);
      expect(result.errors.some((e) => /rows.*must be an array/i.test(e))).toBe(true);
    }
  });

  it('does not throw when concept-map nodes/edges are non-arrays', () => {
    const bad = { id: 'd1', topic: 't', title: 'X', type: 'concept-map',
      data: { nodes: null, edges: 'oops' } } as unknown as Diagram;
    expect(() => validateDiagram(bad)).not.toThrow();
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => /edges.*must be an array/i.test(e))).toBe(true);
  });
});

describe('validateComparison — array-type guards', () => {
  it('does not throw when entities/features are non-arrays', () => {
    const bad = { id: 'c1', topic: 't', title: 'X',
      entities: 'string-not-array', features: 42 } as unknown as Comparison;
    expect(() => validateComparison(bad)).not.toThrow();
    const result = validateComparison(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /entities.*must be an array/i.test(e))).toBe(true);
      expect(result.errors.some((e) => /features.*must be an array/i.test(e))).toBe(true);
    }
  });
});

describe('validateComparison', () => {
  it('accepts a minimal comparison', () => {
    const c: Comparison = {
      id: 'c1', topic: 'alopecia', title: 'X',
      entities: [{ id: 'lpp', name: 'LPP' }, { id: 'ffa', name: 'FFA' }],
      features: [{ id: 'age', name: 'Age', values: { lpp: '40-60', ffa: 'postmenop' } }]
    };
    const result = validateComparison(c);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(c);
  });

  it('rejects a feature with values referencing a missing entity', () => {
    const bad: Comparison = {
      id: 'c1', topic: 'alopecia', title: 'X',
      entities: [{ id: 'lpp', name: 'LPP' }],
      features: [{ id: 'age', name: 'Age', values: { lpp: 'X', missing: 'Y' } }]
    };
    const result = validateComparison(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/entity.*missing/i);
  });
});

// R1: Narrowed `Result<T>` + `unknown` inputs + `Array.isArray` guards (F1/F4/F5/F8/F30)
describe('R1: validateDiagram narrowed Result and unknown-input behaviour', () => {
  it('returns { ok: true, value } with the validated Diagram on the happy path', () => {
    const input: unknown = {
      id: 'd1',
      topic: 'alopecia',
      title: 'Test',
      type: 'decision-tree',
      citations: TEST_CITATIONS,
      data: { start: 's1', steps: [{ id: 's1', type: 'terminal', prompt: 'Done' }] }
    };
    const result = validateDiagram(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(input);
      // value is strongly typed as Diagram (compile-time check, runtime-equivalent to input)
      expect(result.value.id).toBe('d1');
    }
  });

  it('returns { ok: false } for undefined input without throwing', () => {
    expect(() => validateDiagram(undefined)).not.toThrow();
    const result = validateDiagram(undefined);
    expect(result.ok).toBe(false);
  });

  it('returns { ok: false } for null input without throwing', () => {
    expect(() => validateDiagram(null)).not.toThrow();
    const result = validateDiagram(null);
    expect(result.ok).toBe(false);
  });

  it('returns structured error when decision-tree.steps is a string (no throw)', () => {
    const bad: unknown = { type: 'decision-tree', data: { start: 's', steps: 'oops' } };
    expect(() => validateDiagram(bad)).not.toThrow();
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /steps.*must be an array/i.test(e))).toBe(true);
    }
  });

  it('decision-tree with duplicate step ids fails', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'decision-tree',
      data: {
        start: 's1',
        steps: [
          { id: 's1', type: 'terminal' },
          { id: 's1', type: 'terminal' }
        ]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /duplicate step ids/i.test(e))).toBe(true);
    }
  });

  it('decision-tree with branch nextStepId pointing nowhere fails', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'decision-tree',
      data: {
        start: 's1',
        steps: [
          { id: 's1', type: 'decision', branches: [{ label: 'Yes', nextStepId: 'ghost' }] }
        ]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /branch.*not found/i.test(e))).toBe(true);
    }
  });

  it('swimlane with duplicate lane ids fails', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'swimlane',
      data: {
        lanes: [{ id: 'a', name: 'A' }, { id: 'a', name: 'A2' }],
        rows: []
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /duplicate lane ids/i.test(e))).toBe(true);
    }
  });

  it('swimlane with duplicate row ids fails', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'swimlane',
      data: {
        lanes: [{ id: 'a', name: 'A' }],
        rows: [
          { id: 'r1', name: 'R', cells: {} },
          { id: 'r1', name: 'R2', cells: {} }
        ]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /duplicate row ids/i.test(e))).toBe(true);
    }
  });

  it('workup-pathway with stages: [] fails with "at least one stage"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'workup-pathway',
      data: { stages: [] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /at least one stage/i.test(e))).toBe(true);
    }
  });

  it('workup-pathway stage with no items fails with "items ... must be an array" (F1 array guard)', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'workup-pathway',
      data: { stages: [{ id: 'x', name: 'X' }] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /items.*must be an array/i.test(e))).toBe(true);
    }
  });

  it('workup-pathway stage with items as array succeeds', () => {
    const good: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'workup-pathway',
      citations: TEST_CITATIONS,
      data: { stages: [{ id: 'x', name: 'X', items: [{ id: 'i', label: 'L' }] }] }
    };
    const result = validateDiagram(good);
    expect(result.ok).toBe(true);
  });

  it('classification with no root fails with "root ... required"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'classification', data: {}
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /root.*required/i.test(e))).toBe(true);
    }
  });

  it('lifecycle with phases: [] fails with "at least one phase"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'lifecycle', data: { phases: [] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /at least one phase/i.test(e))).toBe(true);
    }
  });

  it('concept-map with nodes: [] fails with "at least one node"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'concept-map',
      data: { nodes: [], edges: [] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /at least one node/i.test(e))).toBe(true);
    }
  });
});

// R5: F21 (swimlane: at least one lane) + F34 (decision-tree: orphan step reachability)
describe('R5: schema extensions for swimlane non-empty lanes and decision-tree reachability', () => {
  it('F21: swimlane with lanes: [] fails with "at least one lane"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'swimlane',
      data: { lanes: [], rows: [] }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /at least one lane/i.test(e))).toBe(true);
    }
  });

  it('F34: decision-tree with an orphan step fails with "orphan step ... not reachable"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'decision-tree',
      data: {
        start: 's1',
        steps: [
          { id: 's1', type: 'decision', branches: [{ label: 'Yes', nextStepId: 's2' }] },
          { id: 's2', type: 'terminal' },
          // s3 is declared but never referenced by start/branches → orphan
          { id: 's3', type: 'terminal' }
        ]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /orphan step.*not reachable/i.test(e))).toBe(true);
    }
  });

  it('F34: decision-tree with all steps reachable from start passes', () => {
    const good: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'decision-tree',
      citations: TEST_CITATIONS,
      data: {
        start: 's1',
        steps: [
          { id: 's1', type: 'decision', branches: [
            { label: 'Yes', nextStepId: 's2' },
            { label: 'No', nextStepId: 's3' }
          ]},
          { id: 's2', type: 'terminal' },
          { id: 's3', type: 'terminal' }
        ]
      }
    };
    const result = validateDiagram(good);
    expect(result.ok).toBe(true);
  });
});

describe('R1: validateComparison narrowed Result', () => {
  it('returns { ok: true, value } with the validated Comparison on the happy path', () => {
    const input: unknown = {
      id: 'c1', topic: 'alopecia', title: 'X',
      entities: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      features: [{ id: 'f', name: 'F', values: { a: '1', b: '2' } }]
    };
    const result = validateComparison(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('c1');
    }
  });

  it('comparison with no features fails with "features ... must be an array"', () => {
    const bad: unknown = {
      id: 'c', topic: 't', title: 'T',
      entities: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
    };
    const result = validateComparison(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /features.*must be an array/i.test(e))).toBe(true);
    }
  });

  it('comparison feature with no values fails with "values ... must be (an array|object)"', () => {
    const bad: unknown = {
      id: 'c', topic: 't', title: 'T',
      entities: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      features: [{ id: 'f', name: 'F' }]
    };
    const result = validateComparison(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /values.*must be (an array|object)/i.test(e))).toBe(true);
    }
  });
});

// N1: null entries in branches/edges arrays must not throw (Codex adversarial review R9)
describe('N1: null entries in nested arrays must not throw', () => {
  it('decision-tree with null entry in branches returns {ok:false} without throwing', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'decision-tree',
      data: {
        start: 's1',
        steps: [
          { id: 's1', type: 'decision', branches: [null, { label: 'Yes', nextStepId: 's1' }] }
        ]
      }
    };
    expect(() => validateDiagram(bad)).not.toThrow();
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
  });

  it('concept-map with null entry in edges returns {ok:false} without throwing', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'concept-map',
      data: {
        nodes: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
        edges: [null, { from: 'a', to: 'b', kind: 'causes' }]
      }
    };
    expect(() => validateDiagram(bad)).not.toThrow();
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
  });
});

describe('R-follow-up: swimlane + comparison reject non-object array members', () => {
  it('swimlane with a primitive lane fails "every lane must be an object"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'swimlane',
      data: {
        lanes: ['oops', { id: 'a', name: 'A' }],
        rows: [{ id: 'r1', name: 'R1', cells: {} }]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /every lane must be an object/i.test(e))).toBe(true);
    }
  });

  it('swimlane with a primitive row fails "every row must be an object"', () => {
    const bad: unknown = {
      id: 'd', topic: 't', title: 'T', type: 'swimlane',
      data: {
        lanes: [{ id: 'a', name: 'A' }],
        rows: ['bad-row', { id: 'r', name: 'R', cells: {} }]
      }
    };
    const result = validateDiagram(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /every row must be an object/i.test(e))).toBe(true);
    }
  });

  it('comparison with a primitive entity fails "every entity must be an object"', () => {
    const bad: unknown = {
      id: 'c', topic: 't', title: 'T',
      entities: ['oops', { id: 'a', name: 'A' }],
      features: [{ id: 'f', name: 'F', values: { a: '1' } }]
    };
    const result = validateComparison(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /every entity must be an object/i.test(e))).toBe(true);
    }
  });

  it('comparison with a primitive feature fails "every feature must be an object"', () => {
    const bad: unknown = {
      id: 'c', topic: 't', title: 'T',
      entities: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      features: ['oops', { id: 'f', name: 'F', values: { a: '1', b: '2' } }]
    };
    const result = validateComparison(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => /every feature must be an object/i.test(e))).toBe(true);
    }
  });
});
