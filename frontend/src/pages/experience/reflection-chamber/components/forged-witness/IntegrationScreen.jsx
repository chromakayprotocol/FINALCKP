import SurvivalAdaptationMap from './SurvivalAdaptationMap';
import { PromptField } from './fields';

/**
 * Where the six become one. The map is shown whole, the Seeker's own
 * survival code is read back, and they state the difference between the
 * version that survived and the witness who decides — then write the one
 * line they carry out (§56).
 */
export default function IntegrationScreen({
  tracks,
  trackStates = {},
  completedTrackIds = [],
  survivalCode,
  experience = {},
  onChange,
}) {
  return (
    <div className="fw-integration">
      <span className="pooi-intro-eyebrow">Integration</span>
      <h2 className="fw-screen-title">The version that survived, and the one who decides</h2>

      <SurvivalAdaptationMap
        tracks={tracks}
        trackStates={trackStates}
        completedTrackIds={completedTrackIds}
      />

      {survivalCode && (
        <blockquote className="fw-carry-quote">
          <span className="fw-reference-label">Your survival code</span>
          <p>{survivalCode}</p>
        </blockquote>
      )}

      <PromptField
        label="The old version would have…"
        value={experience.oldVersion || ''}
        onChange={(v) => onChange({ oldVersion: v })}
        rows={2}
      />

      <PromptField
        label="The Forged Witness will…"
        value={experience.forgedVersion || ''}
        onChange={(v) => onChange({ forgedVersion: v })}
        rows={2}
      />

      <PromptField
        label="Carry code"
        hint="The one line you take out of this Chamber."
        value={experience.carryCode || ''}
        onChange={(v) => onChange({ carryCode: v })}
        rows={2}
      />
    </div>
  );
}
