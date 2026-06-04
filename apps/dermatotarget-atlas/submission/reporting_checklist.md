# Reporting Checklist

This checklist adapts STROBE observational-reporting concepts and RECORD routinely collected data extensions to a public biomedical database integration study. Final journal submission should use the journal's required checklist.

- STROBE official site: https://www.strobe-statement.org/
- RECORD official site: https://www.record-statement.org/

| section | item | status | location |
| --- | --- | --- | --- |
| Title/Abstract | Identify the study as a public-data computational target-prioritization study. | addressed | manuscript.md Abstract |
| Introduction | Explain scientific background and objective. | addressed | manuscript.md Introduction |
| Methods | Describe study design, disease scope, public data sources, and source access. | addressed | manuscript.md Methods; supplementary_methods.md |
| Methods | Report disease identifiers, aliases, inclusion scope, and target-disease unit of analysis. | addressed | config/diseases.yml; supplementary_methods.md |
| Methods | Define variables, scoring components, weights, and validation analyses. | addressed | manuscript.md Scoring; reports/methods/source_manifest.json |
| Methods | Describe data cleaning, caching, missingness handling, and reproducibility. | addressed | supplementary_methods.md; data_code_availability.md |
| Results | Report row counts, source yields, top-ranked outputs, and validation checks. | addressed | manuscript.md Results; reports/tables/ |
| Discussion | State limitations of association-only evidence, public-source coverage, and noncausal interpretation. | addressed | manuscript.md Discussion |
| Other | Provide public source URLs and data/code availability. | addressed | data_code_availability.md |
