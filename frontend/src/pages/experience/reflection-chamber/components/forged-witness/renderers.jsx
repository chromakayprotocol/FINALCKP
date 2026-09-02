import ArmorInventory from './ArmorInventory';
import StrengthDebtBalancer from './StrengthDebtBalancer';
import SurvivalCodeSynthesis from './SurvivalCodeSynthesis';
import TransferScenario from './TransferScenario';
import IntegrationScreen from './IntegrationScreen';
import TrackEncounter from './TrackEncounter';
import { StepAdvance } from './fields';

/**
 * Pillar Two's renderer table — the screen types the shared engine does
 * not know about.
 *
 * This is the seam that keeps ScreenSequence generic: the engine resolves
 * `screen.type` against this table, which the Portal Two wrapper hands it.
 * Pillar Two's components therefore never appear anywhere in the shared
 * engine, and Pillar Three will bring a table of its own.
 *
 * Each entry adapts the engine's uniform prop bundle to a component that
 * takes plain domain props, and owns the gate on its own Continue button.
 */

const filled = (v) => Boolean(v && v.trim());

function readExperience(state) {
  const experience = state.experience ?? {};
  return {
    experience,
    trackStates: experience.tracks ?? {},
    completedTrackIds: state.completedTracks ?? [],
  };
}

/** A screen body plus its gated advance, so each renderer stays declarative. */
function Screen({ children, canAdvance = true, label = 'Continue', onAdvance }) {
  return (
    <>
      {children}
      <div className="fw-step-advance">
        <StepAdvance disabled={!canAdvance} onClick={onAdvance}>
          {label}
        </StepAdvance>
      </div>
    </>
  );
}

export const FORGED_WITNESS_RENDERERS = {
  track: TrackEncounter,

  'armor-inventory': ({ config, state, onAdvance }) => {
    const { trackStates, completedTrackIds } = readExperience(state);
    return (
      <Screen onAdvance={onAdvance} label="Balance the armor">
        <ArmorInventory
          tracks={config.tracks}
          trackStates={trackStates}
          completedTrackIds={completedTrackIds}
        />
      </Screen>
    );
  },

  'strength-debt': ({ config, state, actions, onAdvance }) => {
    const { trackStates, completedTrackIds } = readExperience(state);
    const balanced = completedTrackIds.every(
      (id) => filled(trackStates[id]?.keep) && filled(trackStates[id]?.debt)
    );
    return (
      <Screen onAdvance={onAdvance} canAdvance={balanced} label="Name the code underneath">
        <StrengthDebtBalancer
          tracks={config.tracks}
          trackStates={trackStates}
          completedTrackIds={completedTrackIds}
          onChangeTrack={actions.patchTrack}
        />
      </Screen>
    );
  },

  'survival-code': ({ config, state, actions, onAdvance }) => {
    const { experience, trackStates, completedTrackIds } = readExperience(state);
    return (
      <Screen
        onAdvance={onAdvance}
        canAdvance={filled(experience.personalSurvivalCode)}
        label="Test it outside"
      >
        <SurvivalCodeSynthesis
          tracks={config.tracks}
          trackStates={trackStates}
          completedTrackIds={completedTrackIds}
          prompt={config.synthesis.survivalCodePrompt}
          value={experience.personalSurvivalCode || ''}
          onChange={(v) => actions.patchExperience({ personalSurvivalCode: v })}
        />
      </Screen>
    );
  },

  transfer: ({ config, state, actions, onAdvance }) => {
    const { experience, trackStates, completedTrackIds } = readExperience(state);
    return (
      <Screen
        onAdvance={onAdvance}
        canAdvance={filled(experience.transferResponse)}
        label="Integrate"
      >
        <TransferScenario
          tracks={config.tracks}
          trackStates={trackStates}
          completedTrackIds={completedTrackIds}
          selectedTrackId={experience.transferTrackId}
          onSelectTrack={(id) => actions.patchExperience({ transferTrackId: id })}
          question={config.synthesis.transferQuestion}
          value={experience.transferResponse || ''}
          onChange={(v) => actions.patchExperience({ transferResponse: v })}
        />
      </Screen>
    );
  },

  integration: ({ config, state, actions, onAdvance }) => {
    const { experience, trackStates, completedTrackIds } = readExperience(state);
    return (
      <Screen
        onAdvance={onAdvance}
        canAdvance={filled(experience.carryCode)}
        label="Write the record"
      >
        <IntegrationScreen
          tracks={config.tracks}
          trackStates={trackStates}
          completedTrackIds={completedTrackIds}
          survivalCode={experience.personalSurvivalCode}
          experience={experience}
          onChange={actions.patchExperience}
        />
      </Screen>
    );
  },
};

export default FORGED_WITNESS_RENDERERS;
