import { spawnSync } from 'node:child_process'

function buildRunId() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('')
}

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const runId = process.env.VISUAL_AUDIT_RUN_ID?.trim() || buildRunId()
const env = {
  ...process.env,
  VISUAL_AUDIT: '1',
  VISUAL_AUDIT_RUN_ID: runId
}

const result = spawnSync(
  npmBin,
  ['exec', '--', 'playwright', 'test', 'tests/visual-audit.spec.ts', '--workers=1'],
  {
    stdio: 'inherit',
    env
  }
)

process.exit(result.status ?? 1)

