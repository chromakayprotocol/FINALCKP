/**
 * Export (the last stage of Phase 14's Sovereign State -> Artifact Schema
 * -> Renderer -> Editable Canvas -> User Revision -> Seal -> Export
 * pipeline). A renderer and an editable canvas are UI (Phase 16) and out
 * of scope here, but Export itself doesn't require any UI to be real —
 * it's a pure function from an ArtifactDocument to a portable format.
 * Markdown only for now; other formats (PDF, a Cloudflare-hosted page)
 * are Phase 17's concern once there's somewhere real to serve them from.
 */

const DECISION_LABELS = Object.freeze({
  'concept-retained': 'Concept retained',
  'protocol-chosen': 'Protocol chosen',
});

function blockToMarkdown(block) {
  if (block.type === 'reflection' && block.content && typeof block.content === 'object') {
    // Phase 8's whole-blob recordReflection() usage can leave non-string
    // response values on an entry; render something legible rather than
    // "[object Object]" if a caller ever compiles one of those in.
    return `- ${JSON.stringify(block.content)}`;
  }
  return `- ${block.content}`;
}

function decisionToMarkdown(decision) {
  const label = DECISION_LABELS[decision.kind] ?? decision.kind;
  return `- **${label}.** ${decision.description}`;
}

/**
 * Renders an ArtifactDocument (sealed or still a draft — this doesn't
 * care about `artifact.status`, only the document shape) to a single
 * Markdown string.
 */
export function exportArtifactToMarkdown(document) {
  if (!document) return '';

  const lines = [];

  for (const section of document.sections) {
    if (!section.blocks.length) continue;
    lines.push(`## ${section.title}`, '');
    for (const block of section.blocks) {
      lines.push(blockToMarkdown(block));
    }
    lines.push('');
  }

  if (document.decisions.length) {
    lines.push('## Decisions', '');
    for (const decision of document.decisions) {
      lines.push(decisionToMarkdown(decision));
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
