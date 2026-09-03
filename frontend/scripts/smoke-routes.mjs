#!/usr/bin/env node
/**
 * Post-build static route smoke test.
 *
 * A green Vite build proves the module graph compiles. It proves nothing
 * about whether the deployed application actually serves its routes, which
 * is why this exists as a separate gate.
 *
 * Serves `frontend/build` exactly the way Cloudflare Pages serves an SPA
 * (static file if one exists at the path, otherwise index.html), then
 * requests each canonical Reclamation University route and asserts the
 * application shell comes back. Also asserts that the Nexus art the shell
 * will request is actually present in the build output, not just in
 * `public/`.
 *
 * Run: `npm run smoke:routes --prefix frontend` (after `npm run build`)
 * Optional: `--base https://chromakeyprotocol.pages.dev` to smoke a real
 * deployment instead of the local build directory.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const buildRoot = path.resolve(here, '../build');

const ROUTES = [
  '/',
  '/experiencemode/sovereign/reclamation-university/nexus',
  '/experiencemode/sovereign/reclamation-university/hermetic-hall',
  '/experiencemode/sovereign/reclamation-university/reflection-protocol',
];

const BUILD_ASSETS = [
  '/reclamation-university/Nexus/Nexus_Background.png',
  '/reclamation-university/Nexus/Nexus_Hermetic_Hall.png',
  '/reclamation-university/Nexus/Nexus_Fracture_Protocol.png',
  '/reclamation-university/Nexus/Nexus_Reflection_Protocol.png',
  '/reclamation-university/Nexus/Nexus_Crucible_Protocol.png',
  '/reclamation-university/Nexus/Nexus_Reclamation_Protocol.png',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

async function readIfFile(absolute) {
  try {
    const stats = await stat(absolute);
    if (!stats.isFile()) return null;
    return await readFile(absolute);
  } catch {
    return null;
  }
}

/** Cloudflare Pages-style SPA server over the build output. */
async function startStaticServer() {
  const indexHtml = await readIfFile(path.join(buildRoot, 'index.html'));
  if (!indexHtml) {
    throw new Error(
      `No build/index.html found at ${buildRoot}. Run \`npm run build\` before the smoke test.`
    );
  }

  const server = createServer(async (req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const absolute = path.join(buildRoot, safePath);

    const file = safePath === '/' ? null : await readIfFile(absolute);
    if (file) {
      res.writeHead(200, { 'content-type': MIME[path.extname(absolute)] ?? 'application/octet-stream' });
      res.end(file);
      return;
    }

    // SPA fallback — every unmatched path serves the application shell.
    res.writeHead(200, { 'content-type': MIME['.html'] });
    res.end(indexHtml);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

function assertAppShell(html) {
  const failures = [];
  if (!/<div[^>]+id=["']root["']/.test(html)) failures.push('missing #root mount point');
  if (!/<script[^>]+src=/.test(html)) failures.push('no script bundle referenced');
  return failures;
}

async function main() {
  const baseArgIndex = process.argv.indexOf('--base');
  const externalBase = baseArgIndex > -1 ? process.argv[baseArgIndex + 1] : null;

  let server = null;
  let base = externalBase;
  if (!externalBase) {
    ({ server, base } = await startStaticServer());
  }

  const problems = [];

  try {
    for (const route of ROUTES) {
      const response = await fetch(`${base}${route}`, { redirect: 'follow' });
      const body = await response.text();

      if (!response.ok) {
        problems.push(`${route} -> HTTP ${response.status}`);
        console.log(`  FAIL   ${route} (HTTP ${response.status})`);
        continue;
      }

      const shellFailures = assertAppShell(body);
      if (shellFailures.length) {
        problems.push(`${route} -> ${shellFailures.join(', ')}`);
        console.log(`  FAIL   ${route} (${shellFailures.join(', ')})`);
        continue;
      }

      console.log(`  ok     ${route} (HTTP ${response.status}, app shell served)`);
    }

    for (const asset of BUILD_ASSETS) {
      const response = await fetch(`${base}${asset}`);
      const contentType = response.headers.get('content-type') ?? '';
      // The SPA fallback answers 200/HTML for a missing asset, so an
      // HTML content-type here means the file is NOT in the build output.
      const served = response.ok && !contentType.includes('text/html');
      if (!served) {
        problems.push(`${asset} -> not present in build output`);
        console.log(`  FAIL   ${asset} (served as ${contentType || 'unknown'})`);
      } else {
        console.log(`  ok     ${asset} (${contentType})`);
      }
    }
  } finally {
    server?.close();
  }

  if (problems.length) {
    console.error(`\nRoute smoke test FAILED (${problems.length}):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nRoute smoke test OK — ${ROUTES.length} routes, ${BUILD_ASSETS.length} assets.`);
}

await main();
