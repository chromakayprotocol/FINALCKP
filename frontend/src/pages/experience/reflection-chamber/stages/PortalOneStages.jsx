import { useState } from 'react';
import { STAGES, STAGE_ORDER, stageIndex, previousStage, PRACTICE_PHASES } from '../utils/stageTransitions';
import { buildRecordSummary } from '../utils/buildRecordSummary';

import PillarStage from '../components/PillarStage';
import PillarNavigation from '../components/PillarNavigation';
import PillarIntro from '../components/PillarIntro';
import SituationPresentation from '../components/SituationPresentation';
import ReflectionSorter from '../components/ReflectionSorter';
import ConceptReveal from '../components/ConceptReveal';
import ShadowCodePanel from '../components/ShadowCodePanel';
import ModernApplication from '../components/ModernApplication';
import ModernDigitalSequence from '../components/ModernDigitalSequence';
import RehearsedRoom from '../components/RehearsedRoom';
import PersonalReflection from '../components/PersonalReflection';
import MirrorAnalysis from '../components/MirrorAnalysis';
import PracticeExercise from '../components/PracticeExercise';
import ObservationLog from '../components/ObservationLog';
import UnbentDoor from '../components/UnbentDoor';
import MasteryCheck from '../components/MasteryCheck';
import PillarRecord from '../components/PillarRecord';
import PillarSeal from '../components/PillarSeal';

/**
 * Portal One / "The Owned Interior" — its fixed stage sequence.
 *
 * This is the body PillarExperience renders for a pillar whose config has
 * no `screens` list. It is Portal One's original stage machine, kept as
 * its own renderer rather than living inside the shared engine: the engine
 * is now the shell (header, progress, pillar/state wiring), and a pillar's
 * screen flow is a renderer plugged into it. Pillar Two supplies a
 * config-driven `screens` list instead (see screens/ScreenSequence.jsx).
 */
export default function PortalOneStages({ config, pillar, experience, onReturn }) {
  const { state, setStage, setPracticePhase, patch } = experience;

  const [conceptPhase, setConceptPhase] = useState('reveal');
  const [applicationPhase, setApplicationPhase] = useState('modern');
  const [reflectionPhase, setReflectionPhase] = useState('form');
  const [sealPhase, setSealPhase] = useState('record');

  const showNav = state.currentStage !== STAGES.INTRO && state.currentStage !== STAGES.SEAL;

  let content = null;

  switch (state.currentStage) {
    case STAGES.INTRO:
      content = (
        <PillarIntro
          pillar={pillar}
          onEnter={() => setStage(STAGES.SITUATION)}
          eyebrow={config.intro.eyebrow}
          word={config.intro.word}
          tagline={config.intro.tagline}
        />
      );
      break;

    case STAGES.SITUATION:
      content = (
        <SituationPresentation situation={config.situation} onContinue={() => setStage(STAGES.SORT)} />
      );
      break;

    case STAGES.SORT:
      content = (
        <>
          <ReflectionSorter
            statements={config.sorter.statements}
            categories={config.sorter.categories}
            onComplete={() => patch({ sorterComplete: true })}
          />
          {state.sorterComplete && (
            <button
              type="button"
              className="pooi-btn pooi-btn--primary pooi-btn--float"
              onClick={() => setStage(STAGES.CONCEPT)}
            >
              Continue
            </button>
          )}
        </>
      );
      break;

    case STAGES.CONCEPT:
      content =
        conceptPhase === 'reveal' ? (
          <ConceptReveal
            eyebrow={config.conceptReveal.eyebrow}
            lines={config.conceptReveal.lines}
            closingLine={config.conceptReveal.closingLine}
            onContinue={() => setConceptPhase('panel')}
          />
        ) : (
          <ShadowCodePanel
            code={pillar.shadow[config.shadowCodeIndex]}
            variant="shadow"
            teachingLine={pillar.teaching[config.shadowTeachingIndex]}
            response={state.conceptResponse}
            onResponseChange={(v) => patch({ conceptResponse: v })}
            onContinue={() => setStage(STAGES.APPLICATION)}
          />
        );
      break;

    case STAGES.APPLICATION:
      if (applicationPhase === 'modern') {
        content = (
          <ModernApplication
            scenarios={config.application.scenarios}
            selected={state.modernScenarioId}
            onSelect={(id) => patch({ modernScenarioId: id })}
            onContinue={() => setApplicationPhase('digital')}
          />
        );
      } else if (applicationPhase === 'digital') {
        content = (
          <ModernDigitalSequence
            steps={config.application.digitalSequenceSteps}
            log={state.digitalSequenceLog}
            onLogChange={(log) => patch({ digitalSequenceLog: log })}
            onComplete={() => setApplicationPhase('rehearsed')}
          />
        );
      } else {
        content = (
          <RehearsedRoom
            code={pillar.shadow[config.application.rehearsedShadowCodeIndex]}
            lines={config.application.rehearsedLines}
            leadText={config.application.rehearsedLead}
            selected={state.rehearsedRoomSelection}
            onSelect={(l) => patch({ rehearsedRoomSelection: l })}
            admission={state.rehearsedRoomAdmission}
            onAdmissionChange={(v) => patch({ rehearsedRoomAdmission: v })}
            onContinue={() => setStage(STAGES.REFLECTION)}
          />
        );
      }
      break;

    case STAGES.REFLECTION:
      content =
        reflectionPhase === 'form' ? (
          <PersonalReflection
            value={state.reflection}
            onChange={(v) => patch({ reflection: v })}
            emotionOptions={config.reflectionEmotions}
            onSubmit={() => setReflectionPhase('mirror')}
          />
        ) : (
          <MirrorAnalysis reflection={state.reflection} onContinue={() => setStage(STAGES.INSTRUCT)} />
        );
      break;

    case STAGES.INSTRUCT:
      content = (
        <ShadowCodePanel
          code={pillar.light[config.instructLightCodeIndex]}
          variant="light"
          teachingLine={pillar.teaching[config.instructTeachingIndex]}
          response={state.lightCodeResponse}
          onResponseChange={(v) => patch({ lightCodeResponse: v })}
          onContinue={() => setStage(STAGES.PRACTICE)}
        />
      );
      break;

    case STAGES.PRACTICE:
      if (state.practicePhase === PRACTICE_PHASES.OBSERVE) {
        content = <PracticeExercise onComplete={() => setPracticePhase(PRACTICE_PHASES.LOG)} />;
      } else if (state.practicePhase === PRACTICE_PHASES.LOG) {
        content = (
          <ObservationLog
            value={state.observation}
            onChange={(v) => patch({ observation: v })}
            onContinue={() => setPracticePhase(PRACTICE_PHASES.DOOR)}
          />
        );
      } else {
        content = (
          <UnbentDoor
            code={pillar.light[config.unbentDoor.lightCodeIndex]}
            choices={config.unbentDoor.choices}
            promptQuestion={config.unbentDoor.promptQuestion}
            avoidedActionQuestion={config.unbentDoor.avoidedActionQuestion}
            selectedChoice={state.unbentDoorChoice}
            onSelectChoice={(c) => patch({ unbentDoorChoice: c })}
            avoidedAction={state.avoidedAction}
            onAvoidedActionChange={(v) => patch({ avoidedAction: v })}
            onComplete={() => setStage(STAGES.MASTERY)}
          />
        );
      }
      break;

    case STAGES.MASTERY:
      content = (
        <MasteryCheck
          scenario={config.mastery}
          value={state.mastery}
          onChange={(v) => patch({ mastery: v })}
          onSubmit={() => setStage(STAGES.SEAL)}
        />
      );
      break;

    case STAGES.SEAL:
      content =
        sealPhase === 'record' ? (
          <PillarRecord
            pillar={pillar}
            items={config.recordItems}
            summary={buildRecordSummary(state)}
            onContinue={() => setSealPhase('final')}
          />
        ) : (
          <PillarSeal
            pillar={pillar}
            eyebrow={config.seal.eyebrow}
            word={config.seal.word}
            lines={config.seal.lines}
            onReturn={onReturn}
          />
        );
      break;

    default:
      content = null;
  }

  return (
    <>
      <PillarStage
        stageKey={`${state.currentStage}-${conceptPhase}-${applicationPhase}-${reflectionPhase}-${state.practicePhase}-${sealPhase}`}
      >
        {content}
      </PillarStage>

      {showNav && (
        <PillarNavigation
          canGoBack={stageIndex(state.currentStage) > 0}
          onBack={() => setStage(previousStage(state.currentStage))}
          stageNumber={stageIndex(state.currentStage) + 1}
          totalStages={STAGE_ORDER.length}
        />
      )}
    </>
  );
}
