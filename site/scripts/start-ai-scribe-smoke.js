import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function findPythonExecutable(repoRoot) {
  const overridden = process.env.AI_SCRIBE_PYTHON?.trim()
  if (overridden) return overridden

  const candidates = [
    path.join(repoRoot, 'services/ai-scribe/.venv/bin/python'),
    path.join(repoRoot, 'services/ai-scribe/.venv/Scripts/python.exe')
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return process.platform === 'win32' ? 'python' : 'python3'
}

function buildAllowedOrigins() {
  const explicit = process.env.ALLOWED_ORIGINS?.trim()
  if (explicit) return explicit

  return [
    'http://127.0.0.1:4321',
    'http://localhost:4321',
    'http://[::1]:4321'
  ].join(',')
}

function run() {
  const repoRoot = path.resolve(process.cwd())
  const pythonExe = findPythonExecutable(repoRoot)

  const env = {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    HOST: process.env.HOST?.trim() || '127.0.0.1',
    PORT: process.env.PORT?.trim() || '8765',
    SESSION_SECRET: process.env.SESSION_SECRET?.trim() || 'development-token',
    JWT_SIGNING_SECRET: process.env.JWT_SIGNING_SECRET?.trim() || 'development-token',
    ALLOWED_ORIGINS: buildAllowedOrigins()
  }

  const child = spawn(pythonExe, ['services/ai-scribe/app.py'], {
    stdio: 'inherit',
    env
  })

  const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal)
  }

  process.on('SIGINT', forwardSignal)
  process.on('SIGTERM', forwardSignal)

  child.on('exit', (code) => {
    process.exit(code ?? 1)
  })
}

run()

