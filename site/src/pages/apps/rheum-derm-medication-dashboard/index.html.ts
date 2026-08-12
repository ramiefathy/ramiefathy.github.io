import type { APIRoute } from 'astro'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const source = path.resolve(
  process.cwd(),
  'src/data/rheum-derm-medication-dashboard/index.html'
)

export const prerender = true

export const GET: APIRoute = async () => new Response(await readFile(source), {
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300'
  }
})
