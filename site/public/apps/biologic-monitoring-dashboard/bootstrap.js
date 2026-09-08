import { validateMonitoringData } from './safety.js';

try {
  const data = await import('./data.js');
  validateMonitoringData(data);
  await import('./app.js');
} catch {
  // Do not render a partial or malformed clinical reference or enable its exports.
  const result = document.querySelector('#results');
  result.replaceChildren();
  const notice = document.createElement('p');
  notice.setAttribute('role', 'alert');
  notice.textContent = 'The monitoring reference could not be validated or loaded. No clinical entries are available. Consult current prescribing information and reload later.';
  result.appendChild(notice);
  document.querySelector('#result-count').textContent = 'Reference unavailable';
  document.querySelectorAll('#controls button, #controls input').forEach((control) => { control.disabled = true; });
}
