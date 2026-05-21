/**
 * Feature Flag System
 *
 * Allows toggling features on/off without code changes.
 * Flags can be overridden via localStorage for testing.
 *
 * Usage:
 *   import { isEnabled } from '../lib/featureFlags';
 *   if (isEnabled('statsCounter')) { ... }
 *
 * To enable a flag in browser console:
 *   localStorage.setItem('ff_statsCounter', 'true');
 *   location.reload();
 */

// Default flag values (false = disabled by default)
export const flags = {
  // Homepage features
  statsCounter: false,      // Dynamic statistics counter with animation
  activityFeed: false,      // Recent activity feed (publications, blog, apps)

  // About page features
  interactiveTimeline: true,  // Career timeline visualization
  skillsVisualization: true,  // Radar chart for skills
  publicationMetrics: false,  // Deprecated publication metrics surface

  // Apps catalog features
  demoModal: true,           // Quick demo iframe modal
  appCollections: true,      // Learning Tools Bundle, etc.

  // Research page features
  citationExport: true,      // BibTeX, RIS, EndNote export
  publicationTypeFilter: true, // Filter by journal, conference, etc.
  coauthorNetwork: true,     // D3 force-directed graph

  // Mind maps features
  deepLinking: true,         // URL fragments for nodes
  crossTopicLinks: false,    // Links between different mind maps

  // RAMIE features
  templateLibrary: true,     // Note templates
  quickMacros: true,         // .bp, .nad shortcuts
  multiPatient: false,       // Multiple patient sessions
  offlineMode: false,        // Service worker, offline queue
  voiceCommands: false,      // "Hey RAMIE" wake word

  // Dermatopathology Navigator features
  adaptiveLearning: false,   // AI-generated study paths
  srsNotifications: false,   // Browser notifications for due cards
  leaderboard: false,        // Social learning features
  offlinePWA: false,         // Full offline mode

  // Biologic Dashboard features
  patientChecklist: true,    // Patient-specific monitoring
  labOrderTemplates: true,   // Printable lab orders
  drugInteractions: false,   // Interaction checker
};

/**
 * Check if a feature flag is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Whether the feature is enabled
 */
export function isEnabled(flagName) {
  // Server-side rendering: use default value
  if (typeof window === 'undefined') {
    return flags[flagName] ?? false;
  }

  // Check for localStorage override
  const override = localStorage.getItem(`ff_${flagName}`);
  if (override !== null) {
    return override === 'true';
  }

  // Fall back to default value
  return flags[flagName] ?? false;
}

/**
 * Enable a feature flag (persists to localStorage)
 * @param {string} flagName - Name of the feature flag
 */
export function enableFlag(flagName) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`ff_${flagName}`, 'true');
  }
}

/**
 * Disable a feature flag (persists to localStorage)
 * @param {string} flagName - Name of the feature flag
 */
export function disableFlag(flagName) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`ff_${flagName}`, 'false');
  }
}

/**
 * Reset a feature flag to its default value
 * @param {string} flagName - Name of the feature flag
 */
export function resetFlag(flagName) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`ff_${flagName}`);
  }
}

/**
 * Reset all feature flags to their default values
 */
export function resetAllFlags() {
  if (typeof window !== 'undefined') {
    Object.keys(flags).forEach(flagName => {
      localStorage.removeItem(`ff_${flagName}`);
    });
  }
}

/**
 * Get all feature flags with their current values
 * @returns {Object} - Object with flag names as keys and current values as booleans
 */
export function getAllFlags() {
  const result = {};
  Object.keys(flags).forEach(flagName => {
    result[flagName] = isEnabled(flagName);
  });
  return result;
}

// Export a helper for React components
export const FeatureFlag = ({ name, children, fallback = null }) => {
  if (typeof window === 'undefined') {
    // During SSR, use default value
    return flags[name] ? children : fallback;
  }
  return isEnabled(name) ? children : fallback;
};
