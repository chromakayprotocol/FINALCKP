import { describe, expect, it } from 'vitest';
import { reconcileSovereignState } from './sovereignReconciliation';
import { createInitialState, createModuleState } from '../runtime/sovereignState';

function baseLocal(overrides = {}) {
  return { ...createInitialState(), ...overrides };
}

describe('reconcileSovereignState', () => {
  it('returns local state (stamped synced) unchanged when there is no remote snapshot yet', () => {
    const local = baseLocal({
      curriculum: { activeModuleId: 'mentalism', modules: { mentalism: createModuleState('mentalism') } },
    });

    const result = reconcileSovereignState(local, null);

    expect(result.curriculum).toEqual(local.curriculum);
    expect(result.session.syncStatus).toBe('synced');
    expect(result.session.lastSyncedAt).not.toBeNull();
  });

  describe('modules', () => {
    it('keeps a module that only exists locally', () => {
      const local = baseLocal({
        curriculum: { activeModuleId: null, modules: { mentalism: createModuleState('mentalism') } },
      });
      const result = reconcileSovereignState(local, { modules: {} });
      expect(result.curriculum.modules.mentalism).toEqual(local.curriculum.modules.mentalism);
    });

    it('adopts a module that only exists remotely', () => {
      const remoteModule = { ...createModuleState('correspondence'), interactionCount: 5 };
      const local = baseLocal();
      const result = reconcileSovereignState(local, { modules: { correspondence: remoteModule } });
      expect(result.curriculum.modules.correspondence).toEqual(remoteModule);
    });

    it('adopts the whole record from whichever side was more recently active, not a field blend', () => {
      const local = baseLocal({
        curriculum: {
          activeModuleId: 'mentalism',
          modules: {
            mentalism: {
              ...createModuleState('mentalism'),
              currentStep: '05-domains',
              lastActiveAt: '2026-01-01T00:00:00.000Z',
            },
          },
        },
      });
      const remoteModule = {
        ...createModuleState('mentalism'),
        currentStep: '09-protocol',
        lastActiveAt: '2026-01-02T00:00:00.000Z', // later than local
      };

      const result = reconcileSovereignState(local, { modules: { mentalism: remoteModule } });

      // Whole remote record wins, not a merge that could produce e.g.
      // currentStep '09-protocol' with local's other stale fields.
      expect(result.curriculum.modules.mentalism).toEqual(remoteModule);
    });

    it('keeps the local module record when local was more recently active', () => {
      const localModule = {
        ...createModuleState('mentalism'),
        currentStep: '09-protocol',
        lastActiveAt: '2026-01-05T00:00:00.000Z',
      };
      const remoteModule = {
        ...createModuleState('mentalism'),
        currentStep: '02-principle',
        lastActiveAt: '2026-01-01T00:00:00.000Z',
      };
      const local = baseLocal({ curriculum: { activeModuleId: 'mentalism', modules: { mentalism: localModule } } });

      const result = reconcileSovereignState(local, { modules: { mentalism: remoteModule } });
      expect(result.curriculum.modules.mentalism).toEqual(localModule);
    });

    it('preserves local activeModuleId regardless of what the remote snapshot contains', () => {
      const local = baseLocal({ curriculum: { activeModuleId: 'mentalism', modules: {} } });
      const result = reconcileSovereignState(local, { modules: {} });
      expect(result.curriculum.activeModuleId).toBe('mentalism');
    });
  });

  describe('reflection entries', () => {
    it('unions entries for different module/prompt keys without conflict', () => {
      const local = baseLocal({
        reflection: { entries: { 'mentalism:08-reflection': { moduleId: 'mentalism', promptId: '08-reflection', response: 'a', updatedAt: 't1' } } },
      });
      const remote = {
        reflections: {
          'correspondence:08-reflection': { moduleId: 'correspondence', promptId: '08-reflection', response: 'b', updatedAt: 't2' },
        },
      };

      const result = reconcileSovereignState(local, remote);
      expect(Object.keys(result.reflection.entries).sort()).toEqual([
        'correspondence:08-reflection',
        'mentalism:08-reflection',
      ]);
    });

    it('the later-updated entry wins on a real conflict (same key, different content)', () => {
      const local = baseLocal({
        reflection: {
          entries: {
            'mentalism:08-reflection': {
              moduleId: 'mentalism',
              promptId: '08-reflection',
              response: 'older, edited on this device',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        },
      });
      const remote = {
        reflections: {
          'mentalism:08-reflection': {
            moduleId: 'mentalism',
            promptId: '08-reflection',
            response: 'newer, edited on another device',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        },
      };

      const result = reconcileSovereignState(local, remote);
      expect(result.reflection.entries['mentalism:08-reflection'].response).toBe(
        'newer, edited on another device',
      );
    });
  });

  describe('concepts', () => {
    it('unions selected concepts without duplicating', () => {
      const local = baseLocal({ concepts: { selected: ['shadow-work'], connections: [], domainMappings: [] } });
      const remote = { concepts: ['shadow-work', 'projection'] };

      const result = reconcileSovereignState(local, remote);
      expect(result.concepts.selected).toEqual(['shadow-work', 'projection']);
    });

    it('unions connections by (from, to, relationship) identity, deduping repeats', () => {
      const local = baseLocal({
        concepts: {
          selected: [],
          connections: [{ fromConceptId: 'a', toConceptId: 'b', relationship: 'CAUSES' }],
          domainMappings: [],
        },
      });
      const remote = {
        connections: [
          { fromConceptId: 'a', toConceptId: 'b', relationship: 'CAUSES' }, // duplicate of local
          { fromConceptId: 'b', toConceptId: 'c', relationship: 'REINFORCES' },
        ],
      };

      const result = reconcileSovereignState(local, remote);
      expect(result.concepts.connections).toHaveLength(2);
    });

    it('unions domain mappings by (concept, domain, role) identity, deduping repeats', () => {
      const local = baseLocal({
        concepts: {
          selected: [],
          connections: [],
          domainMappings: [{ conceptId: 'shadow-work', domain: 'psychology', role: 'cause' }],
        },
      });
      const remote = {
        domainMappings: [
          { conceptId: 'shadow-work', domain: 'psychology', role: 'cause' }, // duplicate of local
          { conceptId: 'shadow-work', domain: 'culture', role: 'effect' },
        ],
      };

      const result = reconcileSovereignState(local, remote);
      expect(result.concepts.domainMappings).toHaveLength(2);
    });
  });

  it('leaves synthesis.protocolExecutions as local-only (no remote table yet)', () => {
    const local = baseLocal({
      synthesis: { protocolExecutions: [{ protocolId: 'vision-quest', moduleId: 'mentalism', executedAt: 't1' }] },
    });
    const result = reconcileSovereignState(local, { modules: {} });
    expect(result.synthesis).toEqual(local.synthesis);
  });

  describe('artifact', () => {
    it('a sealed remote artifact beats a local draft', () => {
      const local = baseLocal({ artifact: { status: 'draft', draft: { title: 'local draft' }, sealedAt: null } });
      const remote = { artifact: { status: 'sealed', draft: { title: 'final' }, sealedAt: 't1' } };

      const result = reconcileSovereignState(local, remote);
      expect(result.artifact).toEqual(remote.artifact);
    });

    it('a sealed local artifact is never downgraded by a remote draft', () => {
      const local = baseLocal({ artifact: { status: 'sealed', draft: { title: 'final' }, sealedAt: 't1' } });
      const remote = { artifact: { status: 'draft', draft: { title: 'stale draft' }, sealedAt: null } };

      const result = reconcileSovereignState(local, remote);
      expect(result.artifact).toEqual(local.artifact);
    });

    it('between two sealed artifacts, the later sealedAt wins', () => {
      const local = baseLocal({ artifact: { status: 'sealed', draft: {}, sealedAt: '2026-01-01T00:00:00.000Z' } });
      const remote = { artifact: { status: 'sealed', draft: {}, sealedAt: '2026-01-05T00:00:00.000Z' } };

      const result = reconcileSovereignState(local, remote);
      expect(result.artifact).toEqual(remote.artifact);
    });

    it('between two unsealed states, local wins as the session in progress', () => {
      const local = baseLocal({ artifact: { status: 'draft', draft: { title: 'local' }, sealedAt: null } });
      const remote = { artifact: { status: 'draft', draft: { title: 'remote' }, sealedAt: null } };

      const result = reconcileSovereignState(local, remote);
      expect(result.artifact).toEqual(local.artifact);
    });

    it('keeps local when there is no remote artifact row yet', () => {
      const local = baseLocal({ artifact: { status: 'draft', draft: { title: 'local' }, sealedAt: null } });
      const result = reconcileSovereignState(local, { artifact: null });
      expect(result.artifact).toEqual(local.artifact);
    });
  });

  describe('identity', () => {
    it("local's populated fields win over remote's", () => {
      const local = baseLocal({ identity: { ...createInitialState().identity, userId: 'u1', level: 3 } });
      const remote = { identity: { userId: 'u1', level: 1, tier: 'full' } };

      const result = reconcileSovereignState(local, remote);
      expect(result.identity.level).toBe(3);
      expect(result.identity.tier).toBe('full'); // filled in from remote since local had none
    });

    it('leaves identity untouched when the remote snapshot has none', () => {
      const local = baseLocal({ identity: { ...createInitialState().identity, userId: 'u1' } });
      const result = reconcileSovereignState(local, { identity: null });
      expect(result.identity).toEqual(local.identity);
    });
  });

  describe('media', () => {
    it("keeps local media when something is actively loaded locally, ignoring remote's snapshot", () => {
      const local = baseLocal({ media: { ...createInitialState().media, currentTrackId: 'track-live', position: 42 } });
      const remote = { media: { currentTrackId: 'track-old', position: 10 } };

      const result = reconcileSovereignState(local, remote);
      expect(result.media).toEqual(local.media);
    });

    it('falls back to remote media when nothing has played locally yet this session', () => {
      const local = baseLocal();
      const remote = { media: { currentTrackId: 'track-old', position: 10 } };

      const result = reconcileSovereignState(local, remote);
      expect(result.media).toEqual(remote.media);
    });
  });

  it('always stamps session as synced with a fresh lastSyncedAt', () => {
    const local = baseLocal();
    const before = Date.now();
    const result = reconcileSovereignState(local, { modules: {} });

    expect(result.session.syncStatus).toBe('synced');
    expect(new Date(result.session.lastSyncedAt).getTime()).toBeGreaterThanOrEqual(before);
  });
});
