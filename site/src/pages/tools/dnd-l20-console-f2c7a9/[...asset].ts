import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const assets = [
  'payload-01.js',
  'payload-02a.js',
  'payload-02b.js',
  'payload-03.js',
  'payload-04.js',
  'payload-05.js',
  'payload-06.js',
  'payload-07.js',
  'payload-08.js',
  'boot.js',
] as const;

const cwd = process.cwd();
const repositoryRoot = path.basename(cwd) === 'site' ? path.dirname(cwd) : cwd;
const sourceRoot = path.join(repositoryRoot, 'tools', 'dnd-l20-console-f2c7a9');

export const prerender = true;

// The directory index is rendered by index.ts. This optional catch-all route
// receives only concrete asset paths, preventing Astro from generating an
// undefined path that collides with the index route during prerendering.
export const getStaticPaths: GetStaticPaths = () =>
  assets.map((filename) => ({ params: { asset: filename }, props: { filename } }));

export const GET: APIRoute = async ({ props }) => {
  const filename = String(props.filename ?? '');
  if (!assets.includes(filename as (typeof assets)[number])) {
    return new Response('Not found', { status: 404 });
  }

  const body = await readFile(path.join(sourceRoot, filename));
  return new Response(body, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
};
