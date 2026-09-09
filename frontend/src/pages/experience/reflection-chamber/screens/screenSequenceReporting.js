import { REFLECTION_CHAMBER_STEP_IDS } from '../../../../sovereign/reflectionChamber/reflectionChamberSteps';

/**
 * Sovereign Runtime reporting for the config-driven ScreenSequence engine
 * (screens/ScreenSequence.jsx). PortalOneStages.jsx (Portal One's own fixed
 * stage machine) has always dispatched into the Sovereign Runtime as the
 * Seeker moves through it — this is the same reporting, generalized to the
 * shared screen types every ScreenSequence pillar uses (intro/track/
 * synthesis/record/seal), so Pillars Two through Five all report real
 * progress the same way Portal One does, from ONE place, rather than each
 * needing its own bespoke wiring.
 *
 * Pure by design (a pure function of the screen just advanced from, plus
 * enough context to know whether it was the last track), matching
 * shadowTwin.js's fragmentForStepCompletion() pattern: this decides WHAT to
 * report, ScreenSequence.jsx's caller decides WHEN, and `sovereign` (bound
 * actions from useSovereign()) is the only side-effecting thing touched.
 *
 * Step mapping, mirroring reflectionChamberSteps.js's six-step lifecycle:
 *   intro      -> ENTER      (advanceStep)      — the Seeker has begun.
 *   track      -> DIAGNOSE   (selectConcept)     — one concept per
 *                completed track, the same way Portal One's Shadow Code
 *                claim credits a concept (see PortalOneStages.jsx).
 *                On the LAST track, also -> INSTRUCT (advanceStep): every
 *                track's own Light Code has necessarily been viewed by then.
 *   synthesis  -> REFLECT    (commitReflection)  — the synthesis prompts
 *                are this pillar's structured reflection, same promptId
 *                Portal One's own PersonalReflection submission uses.
 *              -> PRACTICE   (executeProtocol)   — the Carry Code is the
 *                pillar's practice commitment, same pattern as Portal
 *                One's Light Code practice.
 *   record     -> SEAL       (advanceStep)       — reaching the seal display
 *                is "viewed the mantra/seal" (record is the screen
 *                immediately before it — see ScreenSequence.jsx's SCREENS
 *                shape: every pillar ends ...,'record','seal').
 */
export function reportScreenAdvance({ screen, isLastTrack, pillarModuleId, sovereign, state }) {
  switch (screen.type) {
    case 'intro': {
      sovereign.module?.advanceStep(REFLECTION_CHAMBER_STEP_IDS.ENTER);
      break;
    }

    case 'track': {
      sovereign.concepts.selectConcept(`${pillarModuleId}:${screen.trackId}`, pillarModuleId);
      if (isLastTrack) {
        sovereign.module?.advanceStep(REFLECTION_CHAMBER_STEP_IDS.INSTRUCT);
      }
      break;
    }

    case 'synthesis': {
      const integration = state.experience?.integration || {};
      sovereign.reflection.commitReflection(REFLECTION_CHAMBER_STEP_IDS.REFLECT, integration, [], pillarModuleId);
      sovereign.synthesis.executeProtocol(
        `${pillarModuleId}:carry-code`,
        { carryCode: integration.carryCode ?? null },
        pillarModuleId,
      );
      break;
    }

    case 'record': {
      sovereign.module?.advanceStep(REFLECTION_CHAMBER_STEP_IDS.SEAL);
      break;
    }

    default:
      break;
  }
}
