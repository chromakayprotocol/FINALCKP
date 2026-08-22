import { describe, expect, it } from 'vitest';
import { exportArtifactToMarkdown } from './artifactExport';
import { createArtifactDocument, createArtifactSection, createArtifactBlock, createArtifactDecision } from './artifactSchema';

describe('exportArtifactToMarkdown', () => {
  it('returns an empty string for a missing document', () => {
    expect(exportArtifactToMarkdown(null)).toBe('');
    expect(exportArtifactToMarkdown(undefined)).toBe('');
  });

  it('returns an empty string for a document with no content anywhere', () => {
    expect(exportArtifactToMarkdown(createArtifactDocument())).toBe('');
  });

  it('renders each non-empty section as a heading with its blocks as a list, skipping empty sections', () => {
    const document = createArtifactDocument({
      sections: [
        createArtifactSection({
          id: 's1',
          title: 'What I Identified',
          blocks: [createArtifactBlock({ id: 'b1', type: 'concept', content: 'shadow-work' })],
        }),
        createArtifactSection({ id: 's2', title: 'Empty Section', blocks: [] }),
      ],
    });

    const markdown = exportArtifactToMarkdown(document);
    expect(markdown).toContain('## What I Identified');
    expect(markdown).toContain('- shadow-work');
    expect(markdown).not.toContain('Empty Section');
  });

  it('renders decisions under their own heading with a human-readable label per kind', () => {
    const document = createArtifactDocument({
      decisions: [
        createArtifactDecision({ id: 'd1', kind: 'concept-retained', description: 'Retained "shadow-work".' }),
        createArtifactDecision({ id: 'd2', kind: 'protocol-chosen', description: 'Chose "vision-quest".' }),
      ],
    });

    const markdown = exportArtifactToMarkdown(document);
    expect(markdown).toContain('## Decisions');
    expect(markdown).toContain('**Concept retained.** Retained "shadow-work".');
    expect(markdown).toContain('**Protocol chosen.** Chose "vision-quest".');
  });

  it('falls back to JSON.stringify for a non-string reflection block (Phase 8 whole-blob content)', () => {
    const document = createArtifactDocument({
      sections: [
        createArtifactSection({
          id: 's1',
          title: 'Reflections',
          blocks: [createArtifactBlock({ id: 'b1', type: 'reflection', content: { reflect: { primary: 'x' } } })],
        }),
      ],
    });

    expect(exportArtifactToMarkdown(document)).toContain('- {"reflect":{"primary":"x"}}');
  });
});
