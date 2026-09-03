/**
 * Nexus asset integrity, as a test as well as a CI script.
 *
 * Checks the filesystem, not the URL string: the regression this guards
 * against (PR #63 relocating the Nexus art without updating the base path)
 * left every referenced URL syntactically perfect and every image 404ing.
 */

import { describe, test, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  collectNexusAssetPaths,
  verifyAssets,
} from '../../../../../scripts/check-nexus-assets.mjs';
import {
  hermeticHallImage,
  nexusBackgroundImage,
  universityProtocols,
} from '../../../../lib/university/curriculum';

const publicRoot = path.resolve(__dirname, '../../../../../public');

const REQUIRED = [
  'Nexus_Background.png',
  'Nexus_Hermetic_Hall.png',
  'Nexus_Fracture_Protocol.png',
  'Nexus_Reflection_Protocol.png',
  'Nexus_Crucible_Protocol.png',
  'Nexus_Reclamation_Protocol.png',
];

describe('Nexus asset integrity', () => {
  test.each(REQUIRED)('%s exists on disk under public/reclamation-university/Nexus', (file) => {
    expect(existsSync(path.join(publicRoot, 'reclamation-university/Nexus', file))).toBe(true);
  });

  test('every asset the curriculum references resolves to a real file', async () => {
    const paths = await collectNexusAssetPaths();
    const { missing, empty, checked } = verifyAssets(paths);

    expect(missing).toEqual([]);
    expect(empty).toEqual([]);
    expect(checked).toBeGreaterThanOrEqual(REQUIRED.length);
  });

  test('the check fails loudly for a reference that does not exist', () => {
    const { missing } = verifyAssets(['reclamation-university/Nexus/Not_A_Real_Asset.png']);
    expect(missing).toEqual(['reclamation-university/Nexus/Not_A_Real_Asset.png']);
  });

  test('every Nexus image path is rooted at the Nexus/ subfolder', () => {
    const referenced = [
      nexusBackgroundImage,
      hermeticHallImage,
      ...universityProtocols.map((protocol) => protocol.image),
    ];
    for (const reference of referenced) {
      expect(reference.startsWith('/reclamation-university/Nexus/')).toBe(true);
    }
  });
});
