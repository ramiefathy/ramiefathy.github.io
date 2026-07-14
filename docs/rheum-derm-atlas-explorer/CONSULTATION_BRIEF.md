# Systems Explorer — GPT 5.6 Pro consultation brief

## Purpose

Review an interactive 3D relationship explorer as an information-design and interaction-design system. The source package is deliberately isolated under:

`site/public/apps/rheum-derm-immune-atlas/explorer/`

Use domain-neutral language in the consultation. Treat the graph as a structured knowledge system with these entity classes:

- contexts
- mechanisms
- interventions
- observable features
- intermediate signals and targets

The goal is to make overlaps, differences, supported causal chains, and coverage gaps easier to understand without implying more precision than the underlying data provides.

## Current representations

1. **Free-space explorer:** semantic 3D placement with selectable nodes and edges, filtering, view presets, a relationship inspector, and a guided supported-chain trace.
2. **Provenance triptych:** mechanisms on the left, a selected context in the center, and interventions or features on the right. Solid and dashed paths distinguish direct from derived relationships.

## Constraints that must survive any redesign

- Five relational states are distinct: direct, derived, explicit zero, unknown, and structurally unavailable.
- Confidence in the evidence is not the same construct as magnitude, importance, potency, or certainty of direction.
- A missing relation must not be rendered as a weak or negative relation.
- A derived path must remain visibly distinguishable from a directly sourced relation.
- The interface must work with keyboard access, reduced motion, light and dark themes, and narrow mobile viewports.
- The result should feel like a serious editorial/scientific instrument, not a generic glowing network demo.

## Known design problems

- A light-theme tooltip currently combines a dark surface with inherited dark text.
- Node and edge previews are too terse; selection should reveal meaning, direction, provenance, context, confidence, and limitations.
- In condition-focused mode, the central context node and context plane mostly repeat the selected filter and create a high-degree hub that obscures downstream structure.
- Several compact controls are not self-explanatory.
- There is no concise, collapsed-by-default guide explaining the visual grammar with a worked visual example.
- Edge styling does not yet communicate a validated relationship magnitude.
- Dense screens compete for attention and do not establish one clear primary reading task.

## Questions for GPT 5.6 Pro

1. Which representations best expose shared versus distinctive mechanisms, interventions, and features while remaining interpretable: aligned layers, small multiples, bipartite projections, tripartite hypergraphs, edge-bundled parallel sets, 3D matrix volumes, or another model?
2. Should the selected context be represented as a node, a facet/filter, a background frame, or only in labels? Distinguish condition-focused and cross-context modes.
3. What is the smallest coherent visual grammar for entity type, relation direction, relation family, evidence state, and validated magnitude without overloading hue, width, opacity, shape, and animation?
4. What information belongs in hover/focus preview versus locked-selection inspector versus a deeper evidence drawer?
5. How should controls be grouped and progressively disclosed for first-time and expert users?
6. Propose a compact visual how-to example that explains one node, one directed relation, direct versus derived provenance, and unknown versus explicit-zero states.
7. Recommend a restrained light/dark palette with measured contrast targets. Avoid neon glows, gratuitous gradients, glassmorphism, excessive pills, and decorative motion.
8. Identify misleading encodings or interaction traps in the current source and recommend testable acceptance criteria.

## Requested response format

Provide:

1. a ranked set of recommendations;
2. a proposed information architecture;
3. two or three wireframe-level representation concepts;
4. a visual-encoding table with construct, channel, scale, and caveat;
5. mobile, accessibility, and performance risks;
6. a phased implementation sequence with explicit non-goals.

Do not rewrite the application. Do not invent quantitative edge weights that are absent from the source. Clearly label any inference.
