import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';

const assets = [
  'index.html',
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

const sourceRoot = new URL('../../../../../tools/dnd-l20-console-f2c7a9/', import.meta.url);

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => [
  { params: { asset: undefined }, props: { filename: 'index.html' } },
  ...assets.slice(1).map((filename) => ({ params: { asset: filename }, props: { filename } })),
];

export const GET: APIRoute = async ({ props }) => {
  const filename = String(props.filename ?? 'index.html');
  if (!assets.includes(filename as (typeof assets)[number])) {
    return new Response('Not found', { status: 404 });
  }

  const body = await readFile(new URL(filename, sourceRoot));
  const contentType = filename.endsWith('.js')
    ? 'text/javascript; charset=utf-8'
    : 'text/html; charset=utf-8';

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': filename === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
};
