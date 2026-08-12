# Rheum–Derm Atlas mobile display review and release evidence

Date: 2026-07-14

Base commit: `e5fe6549764393e397c9d1c906a882c0235bae60`

Tested head: `ffa086887505f954e465d770eb1d422764aaaf28`

Deployed merge: `089dc6229cf6b1f5cf8cf6d5e806198f2c203c31`

Artifact identifier: `atlas-mobile-20260714` (Cloudflare production assets verified byte-identical)

Runtime: Node `22.12.0`

## Disposition

The mobile tranche is **shipped**. Every atlas destination and every Systems Explorer representation remains directly reachable. The alternative views are not hidden, deferred, reduced to screenshots, or treated as incomplete experiments.

An independent read-only review examined the implemented displays for learners, researchers, and pharmaceutical developers. Its highest-risk findings—stale Explorer assets, desktop-width diagrams on mobile, false pairwise uniqueness against missing states, collapsed coverage states, unknown-to-zero dashboard coercion, pooled unlike evidence constructs, and pointer-only precision paths—were addressed in this tranche.

## Display-by-display result

| Display | Mobile and interaction result | Audience value now | Recommended next evidence-bounded refinement |
| --- | --- | --- | --- |
| Atlas navigation | Stable mobile destination selector; deep links and desktop navigation remain synchronized | Learners can move by question without horizontal pill scrolling | Measure first-time destination-finding success |
| Systems free-space | Fitted front projection, compact controls, entity navigator, visible active preset, locked inspector | Learners get an interpretable starting view; researchers retain graph inspection | Remove redundant condition-hub geometry in the typed-topology tranche |
| Provenance triptych | Locally scrolling facets with named previous/next pager | Makes direct, derived, and contextual evidence easier to compare | Compare facet headers with a central context band in task testing |
| Mechanism lanes | Pathways stack vertically against four fixed comparison lanes | Rapid shared/distinctive pathway scanning | Add evidence-tested pathway-family grouping without changing canonical order |
| Bipartite projection | Focused source-to-pathway projection plus full desktop overview and coordinate table | Supports treatment and context coverage questions | Add target/class/context filters only after typed relation fields land |
| Difference lens | Compact fixed-coordinate mobile grid with unresolved states preserved | Prevents missing evidence from becoming false uniqueness | Add relation-family filters and explicit “why unresolved” drill-down |
| Parallel sets | Complete supported chains stack vertically with component evidence | Enables source-backed mechanism-chain tracing | Add chain comparison and evidence export after report composition lands |
| Coverage volume | Width-fitted overview plus exact orthogonal slice pager and table | Offers a categorical three-class coverage query without false precision | Add slice search/virtualization if measured task time justifies it |
| Dashboard heatmap | Missing axes are patterned unknown/unmapped cells with a complete structured list | Learners see coverage gaps rather than artificial zeros | Add source-linked cell inspection |
| Condition radar | Declares mapped denominator and lists unmapped axes; no missing-to-zero polygon vertices | Prevents unsupported quantitative comparison | Retain as contextual summary unless task testing supports promotion |
| Evidence distribution | User-selectable homogeneous constructs; unlike row types are never pooled | Researchers can interpret evidence grade within a declared denominator | Add cutoff and reviewer-disposition strata after evidence schema migration |
| Coverage lanes | Full state-preserving set algebra and structured mobile records | Drug developers can distinguish covered, zero, filtered, unknown, and unavailable routes | Add treatment-class and route filters without implying synergy |
| Pairwise overlap | A-only/B-only requires explicit-zero evidence in the counterpart | Eliminates false uniqueness against unknown or threshold-filtered evidence | Expose selected relationship source rows inline |
| Research tables | Complete labeled cards on mobile; no columns silently disappear | Precise reference access without page-level overflow | Add measured search/virtualization where row counts warrant it |
| Manifest matrix and cohort ledger | Retain local scrolling, deterministic coordinates, legends, and existing accessible labels | Authoritative dense overview remains available | Add cell-to-source deep links and a structured focused slice in the next accessibility tranche |

## Semantic changes

- Pairwise uniqueness is asserted only against an explicit-zero counterpart. Unknown, threshold-filtered, and structurally-unavailable records propagate as unresolved states.
- Treatment coverage overlap preserves direct/derived support, explicit zero, threshold filtering, unknown, and structural unavailability. No “neither” bucket absorbs unlike missing states.
- Heatmap and radar missingness is never rendered or announced as zero.
- Evidence-grade distributions are stratified by one declared construct at a time.
- All variable relationship marks remain constant width; magnitude is not encoded.

## Accessibility and interaction evidence

- The seven Systems Explorer representations remain visible in a 44 px-target mobile switcher with Arrow, Home, and End navigation.
- Alternative SVG marks retain keyboard focus, Enter/Space activation, arrow traversal, locked inspectors, and structured tables.
- Every atlas destination is reachable from a stable mobile section selector at 320 CSS px without page-level horizontal overflow.
- Wide authoritative matrices use locally labeled scrolling; mobile-native projections and structured records are provided where exact comparison would otherwise require two-axis panning.
- Hover, focus, touch, and locked selection expose equivalent core relationship information. Light-theme tooltips have dedicated contrast tokens and viewport collision handling.
- Unknown/unmapped, threshold-filtered, explicit-zero, derived, direct, and structurally-unavailable states remain textually discoverable and visually redundant.

## Visual and automated evidence

Interactive browser review covered all seven Explorer representations, every atlas destination, light and dark themes, mobile and desktop layouts, local overflow, tooltip collision, fitted graph projection, facet/slice paging, and browser diagnostics. Exact 320 and 390 CSS px contracts are enforced by Playwright.

| Gate | Result |
| --- | --- |
| Mobile display browser suite | 16/16 passed |
| Focused atlas, alternative-view, and mobile browser suites | 37/37 passed |
| Unit/policy suite | 33 files; 212/212 tests passed |
| Full browser suite | 173 passed; 21 opt-in visual/screenshot tests skipped |
| Production build | Passed; existing large-chunk advisory remains |
| `git diff --check` | Passed |

## Residual risk

- Browser automation and responsive inspection do not replace physical-device or formal human task-performance studies. No superiority claim is made for a view without such evidence.
- The manifest matrix and cohort ledger remain dense scientific overviews. They have local scrolling and semantic labels, but focused structured slices and source deep-links remain valuable future work.
- The current embedded contract does not justify variable edge width or temporal-response trajectories. Those encodings remain absent rather than cosmetically inferred.
- The repository’s existing large-bundle advisory, `punycode` deprecation notice, and known `xlsx` security debt predate this tranche and remain outside its scope.
