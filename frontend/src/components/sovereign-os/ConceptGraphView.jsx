import { useMemo, useState } from 'react';
import { useSovereign } from '../../sovereign/runtime';
import { domainsForConcept } from '../../sovereign/runtime';
import './sovereignOSVisuals.css';

/**
 * Interactive concept nodes + SVG causal-chain animation (Phase 16 of the
 * Sovereign OS migration — two of the guide's seven "Visual Interaction
 * Layer" elements). The distinction the guide draws — "these visuals now
 * consume real runtime state" instead of "scroll position -> CSS
 * animation" — is literal here: every node is a concept that's actually
 * in `concepts.selected` (Phase 10), every edge is an actual
 * `concepts.connections` entry (also Phase 10) a user really created via
 * connectConcepts(), and hovering a node reads its real Domain Matrix
 * placements (Phase 11) via domainsForConcept(). There's no placeholder
 * or sample data path — an empty graph renders an empty state, not mock
 * nodes.
 *
 * Layout is a simple circle (angle = index / count around the origin) —
 * a force-directed layout is real future work but isn't what makes this
 * phase's point; consuming real state rather than CSS-only animation is.
 */

const RADIUS = 140;
const CENTER = 160;

function positionForIndex(index, count) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

/** Causal relationships get the flowing-dash animation; everything else is a plain line. */
function isCausal(relationship) {
  return /cause/i.test(relationship);
}

export default function ConceptGraphView() {
  const { concepts } = useSovereign();
  const [hoveredId, setHoveredId] = useState(null);
  const [focusedId, setFocusedId] = useState(null);

  const positions = useMemo(() => {
    const map = new Map();
    concepts.selected.forEach((conceptId, index) => {
      map.set(conceptId, positionForIndex(index, concepts.selected.length));
    });
    return map;
  }, [concepts.selected]);

  const activeId = focusedId ?? hoveredId;
  const connectedIds = useMemo(() => {
    if (!activeId) return null;
    const set = new Set([activeId]);
    for (const connection of concepts.connections) {
      if (connection.fromConceptId === activeId) set.add(connection.toConceptId);
      if (connection.toConceptId === activeId) set.add(connection.fromConceptId);
    }
    return set;
  }, [activeId, concepts.connections]);

  if (concepts.selected.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-zinc-500">
        No concepts selected yet — the graph renders once concepts.selected has something in it.
      </div>
    );
  }

  const detail = activeId ? domainsForConcept(concepts, activeId) : null;

  return (
    <div className="flex gap-4">
      <svg
        width={CENTER * 2}
        height={CENTER * 2}
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        role="img"
        aria-label="Concept graph"
        className="shrink-0"
      >
        {concepts.connections.map((connection, index) => {
          const from = positions.get(connection.fromConceptId);
          const to = positions.get(connection.toConceptId);
          if (!from || !to) return null;
          const dimmed = connectedIds && !(connectedIds.has(connection.fromConceptId) && connectedIds.has(connection.toConceptId));
          const causal = isCausal(connection.relationship);
          return (
            <line
              key={`${connection.fromConceptId}-${connection.toConceptId}-${connection.relationship}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={causal ? '#ef4444' : '#52525b'}
              strokeWidth={causal ? 2 : 1}
              opacity={dimmed ? 0.15 : causal ? 0.9 : 0.5}
              strokeDasharray={causal ? '6 4' : undefined}
              className={causal ? 'sovereign-causal-edge' : undefined}
            />
          );
        })}

        {concepts.selected.map((conceptId) => {
          const position = positions.get(conceptId);
          const isFocused = conceptId === activeId;
          const dimmed = connectedIds && !connectedIds.has(conceptId);
          return (
            <g
              key={conceptId}
              transform={`translate(${position.x}, ${position.y})`}
              onMouseEnter={() => setHoveredId(conceptId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setFocusedId((current) => (current === conceptId ? null : conceptId))}
              style={{ cursor: 'pointer' }}
              opacity={dimmed ? 0.35 : 1}
            >
              <circle
                r={isFocused ? 16 : 12}
                fill={isFocused ? '#ef4444' : '#18181b'}
                stroke="#ef4444"
                strokeWidth={isFocused ? 2 : 1.5}
                style={{ transition: 'r 150ms ease, fill 150ms ease' }}
              />
              <text
                y={28}
                textAnchor="middle"
                fontSize="9"
                fill="#e4e4e7"
                style={{ pointerEvents: 'none' }}
              >
                {conceptId}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="min-w-[160px] rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
        {activeId ? (
          <>
            <p className="mb-2 font-semibold uppercase tracking-wide text-red-300">{activeId}</p>
            {detail.length === 0 ? (
              <p className="text-zinc-500">Not mapped into any domain yet.</p>
            ) : (
              <ul className="space-y-1">
                {detail.map(({ domain, roles }) => (
                  <li key={domain} className="text-zinc-300">
                    <span className="text-zinc-500">{domain}:</span> {roles.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-zinc-500">Hover or click a node to see its Domain Matrix placements.</p>
        )}
      </div>
    </div>
  );
}
