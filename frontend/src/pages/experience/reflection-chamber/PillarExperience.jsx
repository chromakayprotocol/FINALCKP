import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PILLARS } from '../../../data/reflectionChamberModuleData';
import { usePillarExperience } from './state/usePillarExperience';
import { STAGES, STAGE_ORDER, stageIndex, previousStage, PRACTICE_PHASES } from './utils/stageTransitions';
import { buildRecordSummary } from './utils/buildRecordSummary';

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

/**
 * PillarExperience — the shared engine behind every Reflection Chamber
 * portal's interactive lesson. It owns which stage the Seeker is on and
 * dispatches to the component that runs that stage; every stage component
 * is content-agnostic (see components/), so a different pillar is just a
 * different `config` object (see data/ownedInteriorConfig.js for Portal
 * One's). All state is local to this feature (state/usePillarExperience.js)
 * — no shared app-wide runtime, keyed per pillar + user in localStorage.
 *
 * `config` shape (see data/ownedInteriorConfig.js for a full example):
 *   pillarId, intro{eyebrow,word,tagline}, situation, sorter{statements,categories},
 *   conceptReveal{eyebrow,lines,closingLine}, shadowCodeIndex, shadowTeachingIndex,
 *   application{scenarios,digitalSequenceSteps,rehearsedShadowCodeIndex,rehearsedLines,rehearsedLead},
 *   reflectionEmotions, instructLightCodeIndex, instructTeachingIndex,
 *   unbentDoor{lightCodeIndex,choices,promptQuestion,avoidedActionQuestion},
 *   mastery, recordItems, seal{eyebrow,word,lines}
 */
export default function PillarExperience({ config, onReturnToChamber, completedPillarIds = [] }) {
  const { user } = useAuth();
  const pillar = PILLARS.find((p) => p.id === config.pillarId);
  const { state, setStage, setPracticePhase, patch } = usePillarExperience(config.pillarId, user?.id);

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
            onReturn={handleReturn}
          />
        );
      break;

    default:
      content = null;
  }

  return (
    <div className="pooi">
      <PillarHeader pillarIndex={pillar.index} pillarTitle={pillar.title} stageLabel={config.intro.word} />
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
