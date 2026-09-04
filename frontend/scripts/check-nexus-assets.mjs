/**
 * Nexus asset integrity check.
 *
 * No shebang on purpose: nexusAssets.test.js imports this module for its
 * collectNexusAssetPaths()/verifyAssets() helpers, and Vite's transform
 * cannot parse a shebang in an imported module. It is invoked as
 * `node scripts/check-nexus-assets.mjs`, so the shebang bought nothing.
 *
 * Reads the Nexus curriculum metadata and asserts that every image path it
 * references resolves to a real file on disk under `frontend/public/`. This
 * is deliberately a filesystem check, not a string check: the regression it
 * exists to prevent (PR #63 moved the Nexus art into a `Nexus/` subfolder
 * without updating the base path) left every URL string perfectly
 * well-formed and every image 404ing.
 *
 * Run: `npm run check:nexus-assets --prefix frontend`
 * Exit code 1 on any missing file, so CI can gate a deploy on it.
 */

import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, '..');
const publicRoot = path.join(frontendRoot, 'public');

/**
 * The floor this check must always cover, independent of what the
 * curriculum module happens to export today.
 */
const REQUIRED_NEXUS_FILES = [
  'reclamation-university/Nexus/Nexus_Background.png',
  'reclamation-university/Nexus/Nexus_Hermetic_Hall.png',
  'reclamation-university/Nexus/Nexus_Fracture_Protocol.png',
  'reclamation-university/Nexus/Nexus_Reflection_Protocol.png',
  'reclamation-university/Nexus/Nexus_Crucible_Protocol.png',
  'reclamation-university/Nexus/Nexus_Reclamation_Protocol.png',
];

/** Collects every public-root-relative asset path the Nexus metadata references. */
export async function collectNexusAssetPaths() {
  const curriculumUrl = pathToFileURL(
    path.join(frontendRoot, 'src/lib/university/curriculum.js')
  ).href;
  const curriculum = await import(curriculumUrl);

  const referenced = new Set();
  const add = (value) => {
    if (typeof value !== 'string' || !value.startsWith('/')) return;
    referenced.add(value.replace(/^\//, ''));
  };

  add(curriculum.nexusBackgroundImage);
  add(curriculum.hermeticHallImage);
  for (const protocol of curriculum.universityProtocols ?? []) add(protocol.image);

  for (const required of REQUIRED_NEXUS_FILES) referenced.add(required);

  return [...referenced].sort();
}

export function verifyAssets(relativePaths) {
  const missing = [];
  const empty = [];

  for (const relativePath of relativePaths) {
    const absolute = path.join(publicRoot, relativePath);
    if (!existsSync(absolute)) {
      missing.push(relativePath);
      continue;
    }
    if (statSync(absolute).size === 0) empty.push(relativePath);
  }

  return { missing, empty, checked: relativePaths.length };
}

async function main() {
  const relativePaths = await collectNexusAssetPaths();
  const { missing, empty, checked } = verifyAssets(relativePaths);

  for (const relativePath of relativePaths) {
    const status = missing.includes(relativePath)
      ? 'MISSING'
      : empty.includes(relativePath)
        ? 'EMPTY'
        : 'ok';
    console.log(`  ${status.padEnd(8)} public/${relativePath}`);
  }

  if (missing.length || empty.length) {
    console.error(
      `\nNexus asset integrity FAILED: ${missing.length} missing, ${empty.length} empty ` +
        `(of ${checked} referenced).`
    );
    console.error(
      'Every path above is read from frontend/src/lib/university/curriculum.js and ' +
        'resolved against frontend/public/. Fix the file or the reference — do not ' +
        'silence this check.'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\nNexus asset integrity OK — ${checked} referenced assets all present.`);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) await main();
