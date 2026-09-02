import { PromptField } from './fields';

/**
 * Six encounters converge into one rule. The Seeker's own answers are laid
 * out as reference material and the question is asked — the system does
 * not compose the code for them, and never offers a generated "your
 * survival code is…" (§20/§46).
 */
export default function SurvivalCodeSynthesis({
  tracks,
  trackStates = {},
  completedTrackIds = [],
  prompt,
  value = '',
  onChange,
}) {
  const forged = tracks.filter((track) => completedTrackIds.includes(track.id));

  return (
    <div className="fw-synthesis">
      <span className="pooi-intro-eyebrow">The Survival Code</span>
      <h2 className="fw-screen-title">{prompt}</h2>

      <div className="fw-reference">
        <span className="fw-reference-label">What you wrote</span>
        <ul className="fw-reference-list">
          {forged.map((track) => {
            const state = trackStates[track.id] ?? {};
            return (
              <li key={track.id}>
                <span className="fw-reference-territory">{track.territory}</span>
                <span className="fw-reference-learned">{state.learned || '—'}</span>
                <span className="fw-reference-code">{track.shadowCode}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <PromptField
        label="My survival code"
        hint="One rule, in your words. The one underneath all of them."
        value={value}
        onChange={onChange}
        rows={3}
      />
    </div>
  );
}
