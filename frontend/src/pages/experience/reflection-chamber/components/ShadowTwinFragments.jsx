/**
 * Renders each individually recovered fragment (design guide §14) as a
 * small glowing marker over the Twin, positioned at that fragment's own
 * sourceRegion — never a hardcoded "mask" for every user, just whatever
 * region this Seeker's own recovered-fragment metadata names. Purely
 * decorative/additive over ShadowTwinViewport's base reconstruction
 * effect (the shard/coherence system), so an empty fragment list renders
 * nothing rather than an empty state message — the Chamber isn't waiting
 * on this list to feel alive.
 */
export default function ShadowTwinFragments({ fragments }) {
  if (!fragments?.length) return null;

  return (
    <div className="shadow-twin__fragments" aria-hidden="true">
      {fragments.map((fragment) => {
        const region = fragment.sourceRegion || {};
        return (
          <span
            key={fragment.id}
            className={`shadow-twin__fragment shadow-twin__fragment--${fragment.type}`}
            style={{
              left: `${region.x ?? 0}%`,
              top: `${region.y ?? 0}%`,
              width: `${region.width ?? 20}%`,
              height: `${region.height ?? 20}%`,
              '--fragment-weight': fragment.visualWeight ?? 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
