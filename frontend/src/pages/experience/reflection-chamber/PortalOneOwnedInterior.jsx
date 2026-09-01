import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PILLARS } from '../../../data/reflectionChamberModuleData';
import { usePortalOneExperience } from './state/usePortalOneExperience';
import { STAGES, STAGE_ORDER, stageIndex, previousStage, PRACTICE_PHASES } from './utils/stageTransitions';
import { buildRecordSummary } from './utils/buildRecordSummary';
import {
  OPENING_SITUATION,
  SORT_CATEGORIES,
  SORT_STATEMENTS,
  MODERN_SCENARIOS,
  DIGITAL_SEQUENCE_STEPS,
  PERSONAL_REFLECTION_EMOTIONS,
  REHEARSED_LINES,
  UNBENT_DOOR_CHOICES,
  MASTERY_SCENARIO,
  PILLAR_RECORD_ITEMS,
} from './data/portalOneContent';

import PillarHeader from './components/PillarHeader';
import PillarProgress from './components/PillarProgress';
import PillarStage from './components/PillarStage';
import PillarNavigation from './components/PillarNavigation';
import PillarIntro from './components/PillarIntro';
import SituationPresentation from './components/SituationPresentation';
import ReflectionSorter from './components/ReflectionSorter';
import ConceptReveal from './components/ConceptReveal';
import ShadowCodePanel from './components/ShadowCodePanel';
import ModernApplication from './components/ModernApplication';
import ModernDigitalSequence from './components/ModernDigitalSequence';
import RehearsedRoom from './components/RehearsedRoom';
import PersonalReflection from './components/PersonalReflection';
import MirrorAnalysis from './components/MirrorAnalysis';
import PracticeExercise from './components/PracticeExercise';
import ObservationLog from './components/ObservationLog';
import UnbentDoor from './components/UnbentDoor';
import MasteryCheck from './components/MasteryCheck';
import PillarRecord from './components/PillarRecord';
import PillarSeal from './components/PillarSeal';

import './portalOneOwnedInterior.css';

const PILLAR_ID = 'owned-interior';

/**
 * PortalOneOwnedInterior — orchestrates Portal One / Pillar One ("The Owned
 * Interior"). It owns which stage the Seeker is on and dispatches to the
 * component that runs that stage; the stage components themselves only
 * know how to run their own screen. All state is local to this feature
 * (see state/usePortalOneExperience.js) — no shared app-wide runtime.
 */
export default function PortalOneOwnedInterior({ onReturnToChamber, completedPillarIds = [] }) {
  const { user } = useAuth();
  const pillar = PILLARS.find((p) => p.id === PILLAR_ID);
  const { state, setStage, setPracticePhase, patch } = usePortalOneExperience(user?.id);

  const [conceptPhase, setConceptPhase] = useState('reveal');
  const [applicationPhase, setApplicationPhase] = useState('modern');
  const [reflectionPhase, setReflectionPhase] = useState('form');
  const [sealPhase, setSealPhase] = useState('record');

  if (!pillar) return null;

  const handleReturn = () => {
    patch({ completedAt: new Date().toISOString() });
    onReturnToChamber?.(true);
  };

  const showNav = state.currentStage !== STAGES.INTRO && state.currentStage !== STAGES.SEAL;

  let content = null;

  switch (state.currentStage) {
    case STAGES.INTRO:
      content = <PillarIntro pillar={pillar} onEnter={() => setStage(STAGES.SITUATION)} />;
      break;

    case STAGES.SITUATION:
      content = (
        <SituationPresentation situation={OPENING_SITUATION} onContinue={() => setStage(STAGES.SORT)} />
      );
      break;

    case STAGES.SORT:
      content = (
        <>
          <ReflectionSorter
            statements={SORT_STATEMENTS}
            categories={SORT_CATEGORIES}
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
            eyebrow="The Displaced War"
            lines={[
              'Something happened.',
              'You felt something.',
              'Your mind interpreted what happened.',
              'Those things can be connected without being identical.',
            ]}
            closingLine="The first practice of the Owned Interior is learning to recognize the difference."
            onContinue={() => setConceptPhase('panel')}
          />
        ) : (
          <ShadowCodePanel
            code={pillar.shadow[0]}
            variant="shadow"
            teachingLine={pillar.teaching[1]}
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
            scenarios={MODERN_SCENARIOS}
            selected={state.modernScenarioId}
            onSelect={(id) => patch({ modernScenarioId: id })}
            onContinue={() => setApplicationPhase('digital')}
          />
        );
      } else if (applicationPhase === 'digital') {
        content = (
          <ModernDigitalSequence
            steps={DIGITAL_SEQUENCE_STEPS}
            log={state.digitalSequenceLog}
            onLogChange={(log) => patch({ digitalSequenceLog: log })}
            onComplete={() => setApplicationPhase('rehearsed')}
          />
        );
      } else {
        content = (
          <RehearsedRoom
            code={pillar.shadow[1]}
            lines={REHEARSED_LINES}
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
            emotionOptions={PERSONAL_REFLECTION_EMOTIONS}
            onSubmit={() => setReflectionPhase('mirror')}
          />
        ) : (
          <MirrorAnalysis reflection={state.reflection} onContinue={() => setStage(STAGES.INSTRUCT)} />
        );
      break;

    case STAGES.INSTRUCT:
      content = (
        <ShadowCodePanel
          code={pillar.light[0]}
          variant="light"
          teachingLine={pillar.teaching[2]}
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
            code={pillar.light[1]}
            choices={UNBENT_DOOR_CHOICES}
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
          scenario={MASTERY_SCENARIO}
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
            items={PILLAR_RECORD_ITEMS}
            summary={buildRecordSummary(state)}
            onContinue={() => setSealPhase('final')}
          />
        ) : (
          <PillarSeal pillar={pillar} onReturn={handleReturn} />
        );
      break;

    default:
      content = null;
  }

  return (
    <div className="pooi">
      <PillarHeader pillarIndex={pillar.index} pillarTitle={pillar.title} stageLabel="Recognition" />
      <PillarProgress pillars={PILLARS} activePillarId={pillar.id} completedPillarIds={completedPillarIds} />

      <PillarStage stageKey={`${state.currentStage}-${conceptPhase}-${applicationPhase}-${reflectionPhase}-${state.practicePhase}-${sealPhase}`}>
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
    </div>
  );
}
