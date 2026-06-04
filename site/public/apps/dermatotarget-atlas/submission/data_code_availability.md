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

This website bundle contains a derived interactive dashboard under `site/public/apps/dermatotarget-atlas/`. It ships compact JSON data bundles in `data/`, publication figures in `figures/`, the validation report in `reports/validation/`, submission markdown files in `submission/`, and the compiled publication PDF in `publication_pdf/`.

The full reproducible analysis source package is maintained separately from this static website app. In that source package, API responses are cached by request method, URL, query parameters, and JSON body. Cache files may be large and are not required in a source-control submission if the pipeline can be rerun against public APIs.
