# Dr. Ramie Fathy - Personal Website

This repository contains the personal website and professional portfolio of Dr. Ramie Fathy, MD, hosted on GitHub Pages.

🌐 **Live Site**: [https://ramiefathy.github.io](https://ramiefathy.github.io)

## About Dr. Fathy

PGY-3 Dermatology Resident Physician at Johns Hopkins University, with expertise in:
- Dermatology and dermatopathology
- AI applications in medicine
- Medical research and education
- Clinical innovation

## Repository Structure

```
.
├── index.html                # Main website homepage
├── about.html               # About page
├── apps/                    # Interactive applications
│   ├── dermpath ddxs.html  # Dermatopathology Navigator Pro
│   ├── dermascore.html     # DermaScore Calculator
│   ├── Scheduler.html      # Clinic Scheduler
│   └── ...                 # Other medical applications
├── assets/                 # Static assets
│   ├── public/            # Public assets
│   └── private/           # Private assets (not served)
├── site_libs/             # Website dependencies
└── docs/                  # Documentation
```

## Features

### Interactive Medical Applications
- **Dermatopathology Navigator Pro**: Advanced differential diagnosis tool
- **DermaScore**: Comprehensive medical scoring calculators
- **Clinic Scheduler**: Multi-functional scheduling system
- **Study Tools**: Educational resources and tools

### Professional Portfolio
- Research publications and projects
- Clinical experience and expertise
- Leadership and writing contributions
- Educational content and resources

## Technology Stack

- **Hosting**: GitHub Pages (Static hosting)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS via CDN
- **Icons**: Font Awesome
- **Analytics**: Built-in engagement tracking

## GitHub Pages Setup

This site is optimized for GitHub Pages static hosting:

- ✅ No build process required
- ✅ Direct HTML/CSS/JS serving
- ✅ CDN-based dependencies
- ✅ Mobile-responsive design
- ✅ Professional accessibility features

### Previous Build Issues Resolved

The repository previously had Netlify and Node.js build configurations that caused deployment issues with GitHub Pages. These have been resolved:

- `netlify.toml` → `netlify.toml.disabled`
- `webpack.config.js` → `webpack.config.js.disabled`
- Simplified `package.json` for GitHub Pages compatibility

## Development

### Local Development
```bash
# Simple HTTP server (Python)
python -m http.server 8000

# Or with Node.js (if you have live-server installed)
npx live-server
```

### File Organization
- **Public Content**: All HTML, CSS, JS files in root and `/apps/`
- **Private Content**: Stored in `/private/`, `/assets/private/`, `/server/` (gitignored)
- **Large Files**: Research data and analysis files (gitignored)

## Privacy & Content

This repository contains both public and private content:

- **Public**: Website files, applications, and general documentation
- **Private**: Research data, analysis files, and sensitive materials (properly gitignored)

**Security Measures**:
- Private folders are gitignored
- No sensitive data in public directories
- Proper access controls maintained

## Contributing

For contributions or suggestions, please contact Dr. Fathy directly.

## License

- **Public Content**: MIT License
- **Private Content**: All rights reserved

## Recent Updates

- ✅ Implemented comprehensive design system
- ✅ Enhanced accessibility features
- ✅ Mobile-optimized responsive design
- ✅ Professional UI/UX improvements
- ✅ GitHub Pages deployment optimization

---

**Contact**: [Dr. Ramie Fathy](https://ramiefathy.github.io) | Johns Hopkins University School of Medicine