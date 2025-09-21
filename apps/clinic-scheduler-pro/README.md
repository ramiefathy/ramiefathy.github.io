# Clinic Scheduler Pro

A Firebase-powered clinical scheduling application with real-time data synchronization for managing medical institution schedules, attendings, residents, and assignments.

## Dependency Loader Documentation

### Overview

The application uses a custom dependency loader (`index.html`) that ensures all CDN dependencies share a single React runtime, preventing "Cannot read properties of null" errors from duplicate React instances.

### How It Works

1. **Import Map**: The loader uses native ES module import maps to pin React versions:
   - React, ReactDOM, and ReactDOM/client are all pinned to version 18.3.1
   - Redirect aliases ensure any request for React 18.2.0 resolves to 18.3.1
   - This prevents accidental loading of multiple React versions

2. **Dependency Identity Tracking**: The loader tracks whether dependencies successfully share the React runtime:
   ```javascript
   window.depsIdentity = {
     rechartsSharesWindowReact: true/false,
     framerMotionSharesWindowReact: true/false
   }
   ```

3. **Fallback Mechanism**: For browsers without import map support, the loader falls back to direct CDN URLs with `?external=react,react-dom` query parameters

### Telemetry

The loader logs dependency loading status to the console:
```
[deps] Loaded {
  supportsImportMap: true,
  reactVersion: "18.3.1",
  reactDomVersion: "18.3.1-next-f1338f8080-20240426",
  framerMotionHasReact: true,
  identityChecks: {
    rechartsSharesWindowReact: true,
    framerMotionSharesWindowReact: true
  }
}
```

### Using Identity Checks in Application Code

The main application code (`assets/main.js`) uses the identity checks to determine if animations should be enabled:

```javascript
const useFramerMotion = window.depsIdentity?.framerMotionSharesWindowReact ||
                       window.__framerMotionReact === window.React;

const motion = useFramerMotion && window['framer-motion']?.motion ?
               window['framer-motion'].motion :
               ({ children }) => children;
```

### Troubleshooting

If animations or charts are not working:

1. **Check Console Telemetry**: Verify that `rechartsSharesWindowReact` and `framerMotionSharesWindowReact` are `true`
2. **Check Network Tab**: Ensure only React 18.3.1 modules are loaded (no 18.2.0 versions)
3. **Clear Browser Cache**: Force a hard refresh to ensure the latest import map is used
4. **Verify CDN Availability**: Check that esm.sh CDN is accessible and serving the correct modules

### CDN URLs

All dependencies are loaded from esm.sh's stable endpoints with ES2022 modules:
- React: `https://esm.sh/stable/react@18.3.1/es2022/react.mjs`
- ReactDOM: `https://esm.sh/stable/react-dom@18.3.1/es2022/react-dom.mjs`
- Framer Motion: `https://esm.sh/stable/framer-motion@11.0.3/es2022/framer-motion.mjs?external=react,react-dom`
- Recharts: `https://esm.sh/stable/recharts@2.5.0/es2022/recharts.mjs?external=react,react-dom`

### Important Notes

- **Sealed Module Exports**: esm.sh marks module exports as non-extensible, which is why the loader uses fallback globals (`window.__rechartsReact`, `window.__framerMotionReact`) when it can't attach React directly
- **Import Map Priority**: The import map takes precedence over direct imports, ensuring version consistency
- **External Dependencies**: The `?external=react,react-dom` query parameter tells esm.sh not to bundle React, ensuring the shared instance is used

## Development

### Building the Application

```bash
# Build the React bundle after editing source files
npm run clinic:scheduler:build

# Serve locally for testing
python -m http.server 8000
```

### Testing React Runtime Deduplication

1. Open the application in a browser
2. Open Developer Console
3. Verify the telemetry shows both identity checks as `true`
4. Test animations and charts to ensure they render correctly

### CI/CD Integration

The GitHub Actions workflow runs `npm run site:build` which validates:
- All TypeScript/JavaScript compiles correctly
- Astro site builds successfully
- No import errors in the dependency chain