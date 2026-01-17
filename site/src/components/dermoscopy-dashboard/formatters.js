import { MODEL_SHORT_NAMES, PROVIDER_COLORS } from './constants.js';

export function shortModelName(name) {
  return MODEL_SHORT_NAMES[name] || name;
}

export function getProviderPalette(provider) {
  return (
    PROVIDER_COLORS[provider] || {
      name: provider,
      primary: 'var(--primary-600)',
      surface: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.25)'
    }
  );
}

export function formatPercent(value, digits = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return value.toLocaleString();
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function safeDivide(numerator, denominator) {
  if (!denominator) return 0;
  return numerator / denominator;
}

export function wilsonInterval(successes, n, z = 1.96) {
  if (typeof successes !== 'number' || typeof n !== 'number' || n <= 0) return [null, null];
  const phat = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (phat + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) / denom;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

export function formatCents(value, digits = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${value.toFixed(digits)}¢`;
}

export function formatUSD(value, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `$${value.toFixed(digits)}`;
}

