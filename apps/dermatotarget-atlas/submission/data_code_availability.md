# Data and Code Availability

All analyses use public, non-PHI data sources. Source databases and documentation are available at:

| source | url |
| --- | --- |
| Open Targets Platform | https://platform.opentargets.org/ |
| GWAS Catalog | https://www.ebi.ac.uk/gwas/ |
| Human Protein Atlas | https://www.proteinatlas.org/ |
| ClinicalTrials.gov | https://clinicaltrials.gov/ |
| PubMed Entrez | https://www.ncbi.nlm.nih.gov/books/NBK25501/ |
| STROBE | https://www.strobe-statement.org/ |
| RECORD | https://www.record-statement.org/ |

The reproducible analysis code is contained in this repository under `src/dermatotarget_atlas/` with tests in `tests/`. Generated source extracts, normalized tables, figures, source manifests, validation reports, and submission materials are written to `data/`, `reports/`, and `submission/`.

API responses are cached under `data/cache/` by request method, URL, query parameters, and JSON body. Cache files may be large and are not required in a source-control submission if the pipeline can be rerun against public APIs.
