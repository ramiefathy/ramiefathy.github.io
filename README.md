# Personal Website and Research Repository

This repository contains both public-facing website content and private research materials. The public content is hosted on GitHub Pages, while private content will be migrated to GitLab.

## Repository Structure

```
.
├── assets/                    # All static assets
│   ├── public/               # Public assets
│   │   ├── documents/        # Public documentation
│   │   └── images/          # Public images
│   └── private/             # Private assets
│       ├── documents/       # Private documentation
│       └── images/         # Private images
├── private/                  # Private content
│   ├── research/            # Research materials
│   │   ├── analysis/       # Analysis files (.Rmd, .nb.html)
│   │   └── data/          # Data files
│   └── tools/              # Private tools and utilities
├── docs/                     # Documentation
│   ├── public/             # Public documentation
│   └── private/            # Private documentation
├── client/                   # Client-side code
├── server/                   # Server-side code
└── site_libs/               # Website dependencies
```

## Public Content

The public content is hosted on GitHub Pages and includes:
- Main website pages (index.html, about.html)
- Public documentation
- Public assets

## Private Content

Private content will be migrated to GitLab and includes:
- Research and analysis files
- Private tools and utilities
- Sensitive documents
- Internal documentation

## Development

### Website Development
- The website is built using HTML, CSS, and JavaScript
- R Markdown files are used for generating some content
- Site configuration is managed through `_site.yml`

### Research Tools
- Various tools for data analysis and processing
- R-based analysis notebooks
- Custom utilities for specific research needs

## Migration to GitLab

This repository is in the process of being migrated to GitLab for private hosting. The migration will:
1. Keep public content on GitHub Pages
2. Move private content to GitLab
3. Maintain proper access controls
4. Preserve all functionality

## Contributing

Please contact the repository owner for contribution guidelines.

## License

This repository contains both public and private content. The public content is available under the MIT License, while private content is restricted.

## Privacy & Sensitive Data

This repository contains both public and private content.

- **Public:** General website, documentation, and non-sensitive research outputs.
- **Private:** All files in `private/`, `assets/private/`, and `server/` contain sensitive or unpublished data, analyses, or tools. These must not be made public.

**Guidelines:**
- Do not move or copy files from private folders into public ones unless they are cleared for release.
- All collaborators must keep this repository private on GitLab.
- Before sharing or publishing, review all links and references to ensure no private data is exposed.

**If you clone or fork this repository, double-check your `.gitignore` and privacy settings.**