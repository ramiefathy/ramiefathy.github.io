import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const cwd = process.cwd();
const repositoryRoot = path.basename(cwd) === 'site' ? path.dirname(cwd) : cwd;
const source = path.join(repositoryRoot, 'tools', 'dnd-l20-console-f2c7a9', 'index.html');

export const prerender = true;

export const GET: APIRoute = async () => new Response(await readFile(source), {
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  },
});
