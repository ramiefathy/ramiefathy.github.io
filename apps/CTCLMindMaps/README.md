# CTCL Mind Maps Application

An interactive D3.js-based mind map visualization for Cutaneous T-Cell Lymphoma (CTCL) diagnosis and management.

## Files Overview

### Main Application Files
- **`CTCLMindMaps.html`** - Original version of the CTCL mind map application
- **`CTCLMindMaps_improved.html`** - Optimized version with enhanced features

### Documentation
- **`CTCL_Updated_Clinical_Info.md`** - Updated clinical information and medical content
- **`CTCL_Verification_Report.md`** - Medical accuracy verification report

### Testing & Development Scripts
- **`test_overlap.js`** - Tests for node overlap issues
- **`fix_overlap.js`** - Script to fix node overlap problems
- **`test_dynamic_sizing.js`** - Tests for dynamic node sizing
- **`review_and_optimize.js`** - Comprehensive review and optimization script

### Screenshots & Visual Documentation
- **`overlap_test.png`** - Initial overlap issue demonstration
- **`overlap_analysis.png`** - Analysis of overlap problems
- **`overlap_fixed.png`** - Fixed overlap demonstration
- **`dynamic_few_nodes.png`** - Dynamic sizing with few nodes
- **`dynamic_many_nodes.png`** - Dynamic sizing with many nodes
- **`optimized_desktop.png`** - Optimized desktop view
- **`optimized_mobile.png`** - Optimized mobile view

## Features (Improved Version)

### Core Features
- Interactive radial tree visualization
- Tab-based navigation (Question, Test, Condition, Result, Image, Citation)
- Dynamic node sizing based on visible nodes
- Smooth expand/collapse animations
- Detailed tooltips with clinical information

### Enhanced Features (in improved version)
- 🔍 **Search functionality** with live highlighting
- ⌨️ **Full keyboard navigation** support
- 🔲 **Expand/Collapse All** buttons
- ⚙️ **Configuration object** for easy customization
- 📱 **Responsive design** for mobile devices
- ♿ **Accessibility** improvements (ARIA labels, focus indicators)

## Usage

1. Open `CTCLMindMaps_improved.html` in a modern web browser
2. Navigate between tabs to explore different views
3. Click nodes to expand/collapse branches
4. Use search to find specific content
5. Use keyboard shortcuts:
   - `Tab` - Navigate between tabs
   - `Enter/Space` - Expand/collapse focused node
   - `Ctrl/Cmd+F` - Focus search input
   - `Escape` - Clear search

## Technical Stack
- **D3.js v7** - Data visualization
- **Tailwind CSS** - Styling
- **Vanilla JavaScript** - Application logic
- **Playwright** - Testing automation

## Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)
