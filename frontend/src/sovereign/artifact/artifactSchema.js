/**
 * The Artifact Compiler (Phase 14 of the Sovereign OS migration).
 *
 * "The artifact should not be a static export template. It should be
 * generated from: Synthesis State." The guide's pipeline is Sovereign
 * State -> Artifact Schema -> Renderer -> Editable Canvas -> User
 * Revision -> Seal -> Export. This file is the Schema and the Compiler
 * (Sovereign State -> Artifact Schema); the Renderer and Editable Canvas
 * are UI (Phase 16, Visual Interaction Layer) and out of scope here —
 * this only has to produce a real, structured document a future renderer
 * can draw, not draw it. Sealing already existed (sealArtifact(), Phase
 * 3); Export is artifactExport.js in this same directory; User Revision
 * is handled by reusing generateArtifact() as a redraft (see
 * sovereignReducer.js's GENERATE_ARTIFACT case) rather than inventing a
 * second, parallel edit action — it already tracked ARTIFACT_EDITED vs.
 * ARTIFACT_STARTED (Phase 6) precisely by whether a draft already
 * existed, which is exactly what "is this a revision" means.
 *
 * ArtifactDocument/Section/Block/Decision are the four schema pieces the
 * guide names; ArtifactRevision is the fifth, tracked separately from the
 * document itself (see sovereignState.js's artifact.revisions) as a
 * history of prior document snapshots, not a field inside the document.
 */

export function createArtifactBlock({ id, type, content, sourceRef = null }) {
  return { id, type, content, sourceRef };
}

export function createArtifactSection({ id, title, blocks = [] }) {
  return { id, title, blocks };
}

export function createArtifactDecision({ id, kind, description, sourceRef = null, decidedAt = null }) {
  return { id, kind, description, sourceRef, decidedAt };
}

export function createArtifactDocument({ sections = [], decisions = [] } = {}) {
  return { sections, decisions };
}

/** A snapshot of the document as it stood *before* a revision replaced it. */
export function createArtifactRevision(previousDraft, index, revisedAt) {
  return { revisionId: `revision-${index}`, previousDraft, revisedAt };
}

/**
 * Sovereign State -> Artifact Schema. Compiles a fresh ArtifactDocument
 * from a Phase 13 SynthesisState — the literal "generated from Synthesis
 * State" the guide asks for, with every block/decision traceable back to
 * where it came from via `sourceRef`. Pure: calling this twice with the
 * same synthesisState produces the same document, so re-compiling is
 * always safe (a caller who wants to preserve their own edits should
 * dispatch generateArtifact() with their edited copy, not re-call this).
 *
 * @param {ReturnType<import('../synthesis/sovereignSynthesis').buildSynthesisState>} synthesisState
 */
export function compileArtifactDocument(synthesisState) {
  const committedReflections = synthesisState.reflections.filter((entry) => entry.status === 'committed');

  const identifiedSection = createArtifactSection({
    id: 'section-identified',
    title: 'What I Identified',
    blocks: synthesisState.selectedConcepts.map((conceptId, index) =>
      createArtifactBlock({
        id: `block-identified-${index}`,
        type: 'concept',
        content: conceptId,
        sourceRef: conceptId,
      }),
    ),
  });

  const reflectionsSection = createArtifactSection({
    id: 'section-reflections',
    title: 'Reflections',
    blocks: committedReflections.map((entry, index) =>
      createArtifactBlock({
        id: `block-reflection-${index}`,
        type: 'reflection',
        content: entry.response,
        sourceRef: `${entry.moduleId}:${entry.promptId}`,
      }),
    ),
  });

  const conceptDecisions = committedReflections.flatMap((entry) =>
    (entry.retainedConcepts ?? []).map((conceptId, index) =>
      createArtifactDecision({
        id: `decision-concept-${entry.moduleId}-${entry.promptId}-${index}`,
        kind: 'concept-retained',
        description: `Retained "${conceptId}" from the reflection on ${entry.promptId}.`,
        sourceRef: `${entry.moduleId}:${entry.promptId}`,
        decidedAt: entry.committedAt,
      }),
    ),
  );

  const protocolDecisions = synthesisState.protocolDecisions.map((execution, index) =>
    createArtifactDecision({
      id: `decision-protocol-${index}`,
      kind: 'protocol-chosen',
      description: `Chose the "${execution.protocolId}" protocol.`,
      sourceRef: execution.moduleId,
      decidedAt: execution.executedAt,
    }),
  );

  return createArtifactDocument({
    sections: [identifiedSection, reflectionsSection],
    decisions: [...conceptDecisions, ...protocolDecisions],
  });
}
