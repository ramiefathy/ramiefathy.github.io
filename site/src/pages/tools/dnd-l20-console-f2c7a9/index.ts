import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';

const source = new URL('../../../../../tools/dnd-l20-console-f2c7a9/index.html', import.meta.url);

export const prerender = true;

export const GET: APIRoute = async () => {
  const body = await readFile(source);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
};
