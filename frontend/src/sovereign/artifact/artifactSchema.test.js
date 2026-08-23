import { describe, expect, it } from 'vitest';
import {
  createArtifactBlock,
  createArtifactSection,
  createArtifactDecision,
  createArtifactDocument,
  createArtifactRevision,
  compileArtifactDocument,
} from './artifactSchema';
import { buildSynthesisState } from '../synthesis/sovereignSynthesis';
import { sovereignReducer } from '../runtime/sovereignReducer';
import { createInitialState } from '../runtime/sovereignState';
import {
  startModule,
  advanceStep,
  selectConcept,
  executeProtocol,
  extractConcepts,
  commitReflection,
} from '../runtime/sovereignActions';
import { SOVEREIGN_STEP_IDS } from '../runtime/sovereignSteps';

describe('artifact schema constructors', () => {
  it('createArtifactBlock/Section/Decision/Document produce plain, inspectable shapes', () => {
    const block = createArtifactBlock({ id: 'b1', type: 'concept', content: 'shadow-work', sourceRef: 'shadow-work' });
    expect(block).toEqual({ id: 'b1', type: 'concept', content: 'shadow-work', sourceRef: 'shadow-work' });

    const section = createArtifactSection({ id: 's1', title: 'Identified', blocks: [block] });
    expect(section).toEqual({ id: 's1', title: 'Identified', blocks: [block] });

    const decision = createArtifactDecision({ id: 'd1', kind: 'concept-retained', description: 'x' });
    expect(decision).toEqual({ id: 'd1', kind: 'concept-retained', description: 'x', sourceRef: null, decidedAt: null });

    const document = createArtifactDocument({ sections: [section], decisions: [decision] });
    expect(document).toEqual({ sections: [section], decisions: [decision] });
  });

  it('createArtifactDocument defaults to empty sections/decisions', () => {
    expect(createArtifactDocument()).toEqual({ sections: [], decisions: [] });
  });

  it('createArtifactRevision snapshots a previous draft with an index-based id', () => {
    const revision = createArtifactRevision({ title: 'v1' }, 0, '2026-01-01T00:00:00.000Z');
    expect(revision).toEqual({
      revisionId: 'revision-0',
      previousDraft: { title: 'v1' },
      revisedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('compileArtifactDocument', () => {
  function buildJourney() {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, selectConcept('shadow-work', 'mentalism'));
    for (const stepId of [
      SOVEREIGN_STEP_IDS.INTRO,
      SOVEREIGN_STEP_IDS.PRINCIPLE,
      SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
      SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
      SOVEREIGN_STEP_IDS.DOMAINS,
      SOVEREIGN_STEP_IDS.RECLAMATION,
      SOVEREIGN_STEP_IDS.LENS_2026,
    ]) {
      state = sovereignReducer(state, advanceStep('mentalism', stepId));
    }
    state = sovereignReducer(
      state,
      extractConcepts('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work', 'projection']),
    );
    state = sovereignReducer(
      state,
      commitReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection', ['shadow-work']),
    );
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'mentalism'));
    return state;
  }

  it('compiles an empty document from a fresh session', () => {
    const document = compileArtifactDocument(buildSynthesisState(createInitialState()));
    expect(document.sections.every((section) => section.blocks.length === 0)).toBe(true);
    expect(document.decisions).toEqual([]);
  });

  it('compiles identified concepts and committed reflections into sections, traceable via sourceRef', () => {
    const document = compileArtifactDocument(buildSynthesisState(buildJourney()));

    const identified = document.sections.find((section) => section.id === 'section-identified');
    expect(identified.blocks).toEqual([
      { id: 'block-identified-0', type: 'concept', content: 'shadow-work', sourceRef: 'shadow-work' },
    ]);

    const reflections = document.sections.find((section) => section.id === 'section-reflections');
    expect(reflections.blocks).toEqual([
      {
        id: 'block-reflection-0',
        type: 'reflection',
        content: 'a real reflection',
        sourceRef: 'mentalism:08-reflection',
      },
    ]);
  });

  it('compiles concept-retained and protocol-chosen decisions from Synthesis State, not from rejected candidates', () => {
    const document = compileArtifactDocument(buildSynthesisState(buildJourney()));

    expect(document.decisions).toHaveLength(2);
    expect(document.decisions.find((d) => d.kind === 'concept-retained')).toMatchObject({
      description: expect.stringContaining('shadow-work'),
      sourceRef: 'mentalism:08-reflection',
    });
    expect(document.decisions.find((d) => d.kind === 'protocol-chosen')).toMatchObject({
      description: expect.stringContaining('vision-quest'),
      sourceRef: 'mentalism',
    });
    // "projection" was a candidate but never retained — must not appear as a decision.
    expect(document.decisions.some((d) => d.description.includes('projection'))).toBe(false);
  });

  it('is pure — compiling the same SynthesisState twice produces an equal (deep-equal) document', () => {
    const synthesisState = buildSynthesisState(buildJourney());
    expect(compileArtifactDocument(synthesisState)).toEqual(compileArtifactDocument(synthesisState));
  });
});
