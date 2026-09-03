/**
 * Canonical Reclamation University entry architecture.
 *
 *   Reclamation University
 *     └── /experiencemode/sovereign/reclamation-university/nexus
 *           ├── Hermetic Hall
 *           ├── Fracture Protocol   (faculty path)
 *           ├── Reflection Protocol (dedicated route)
 *           ├── Crucible Protocol   (locked)
 *           └── Reclamation Protocol (locked)
 *
 * Asserted against App.jsx's route table directly rather than by rendering
 * the whole authenticated app, so a route being renamed, dropped, or
 * repointed at a different component fails here immediately.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { universityProtocols } from '../../../../lib/university/curriculum';

const appSource = readFileSync(
  path.resolve(__dirname, '../../../../App.jsx'),
  'utf8'
);

const BASE = '/experiencemode/sovereign/reclamation-university';
const NEXUS_ROUTE = `${BASE}/nexus`;

/** Finds the <Route path="..."> block and returns its JSX body. */
function routeBlock(routePath) {
  const marker = `path="${routePath}"`;
  const index = appSource.indexOf(marker);
  if (index === -1) return null;
  const end = appSource.indexOf('</Route>', index);
  const selfClosing = appSource.indexOf('/>', index);
  const blockEnd = end === -1 || (selfClosing !== -1 && selfClosing < end) ? selfClosing : end;
  return appSource.slice(index, blockEnd === -1 ? index + 400 : blockEnd + 8);
}

describe('canonical Nexus route', () => {
  test('/nexus resolves to ReclamationUniversityNexusPage', () => {
    const block = routeBlock(NEXUS_ROUTE);
    expect(block).toBeTruthy();
    expect(block).toContain('<ReclamationUniversityNexusPage />');
  });

  test('the Nexus page is a lazy-loaded route component', () => {
    expect(appSource).toMatch(
      /const ReclamationUniversityNexusPage = lazy\(\(\) => import\('\.\/pages\/ReclamationUniversityNexusPage'\)\)/
    );
  });

  test('the University home route redirects to the Nexus, not to a second home screen', () => {
    const block = routeBlock(BASE);
    expect(block).toBeTruthy();
    expect(block).toContain(`<Navigate to="${NEXUS_ROUTE}" replace />`);
  });

  test('the legacy /reclamation-university path still resolves into the canonical tree', () => {
    const block = routeBlock('/reclamation-university');
    expect(block).toBeTruthy();
    expect(block).toContain('<Navigate to=');
    expect(block).toContain(BASE);
  });
});

describe('Nexus destinations', () => {
  test('the Hermetic Hall route exists and mounts the Hall hub', () => {
    const block = routeBlock(`${BASE}/hermetic-hall`);
    expect(block).toBeTruthy();
    expect(block).toContain('<HermeticHallHub />');
  });

  test('the Reflection Protocol route exists and mounts its own page', () => {
    const block = routeBlock(`${BASE}/reflection-protocol`);
    expect(block).toBeTruthy();
    expect(block).toContain('<ReflectionProtocolPage />');
  });

  test('every available protocol points at a route the app actually serves', () => {
    for (const protocol of universityProtocols.filter((p) => p.available)) {
      if (protocol.route) {
        expect(appSource).toContain(`path="${protocol.route}"`);
      } else {
        expect(protocol.facultySlug).toBeTruthy();
        // Faculty slugs are served by the dynamic :facultySlug route.
        expect(appSource).toContain(`path="${BASE}/:facultySlug"`);
      }
    }
  });

  test('the Reflection Protocol route is matched ahead of the dynamic faculty route', () => {
    const reflectionIndex = appSource.indexOf(`path="${BASE}/reflection-protocol"`);
    const facultyIndex = appSource.indexOf(`path="${BASE}/:facultySlug"`);
    expect(reflectionIndex).toBeGreaterThan(-1);
    expect(facultyIndex).toBeGreaterThan(-1);
    expect(reflectionIndex).toBeLessThan(facultyIndex);
  });

  test('unavailable protocols declare no route at all', () => {
    for (const protocol of universityProtocols.filter((p) => !p.available)) {
      expect(protocol.route).toBeUndefined();
      expect(protocol.facultySlug).toBeUndefined();
    }
  });
});
