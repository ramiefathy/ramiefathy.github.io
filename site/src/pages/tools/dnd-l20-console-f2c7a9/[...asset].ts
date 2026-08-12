import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const assets = [
  'styles.css',
  'data.js',
  'app.js',
  'manifest.webmanifest',
  'icon.svg',
  'sw.js',
] as const;

const mime: Record<(typeof assets)[number], string> = {
  'styles.css': 'text/css; charset=utf-8',
  'data.js': 'text/javascript; charset=utf-8',
  'app.js': 'text/javascript; charset=utf-8',
  'manifest.webmanifest': 'application/manifest+json; charset=utf-8',
  'icon.svg': 'image/svg+xml; charset=utf-8',
  'sw.js': 'text/javascript; charset=utf-8',
};

const cwd = process.cwd();
const repositoryRoot = path.basename(cwd) === 'site' ? path.dirname(cwd) : cwd;
const sourceRoot = path.join(repositoryRoot, 'tools', 'dnd-l20-console-f2c7a9');

export const prerender = true;
export const getStaticPaths: GetStaticPaths = () => assets.map((filename) => ({
  params: { asset: filename },
  props: { filename },
}));

export const GET: APIRoute = async ({ props }) => {
  const filename = String(props.filename ?? '') as (typeof assets)[number];
  if (!assets.includes(filename)) return new Response('Not found', { status: 404 });
  return new Response(await readFile(path.join(sourceRoot, filename)), {
    headers: {
      'Content-Type': mime[filename],
      'Cache-Control': filename === 'sw.js' ? 'no-cache' : 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      ...(filename === 'sw.js' ? { 'Service-Worker-Allowed': './' } : {}),
    },
  });
};
