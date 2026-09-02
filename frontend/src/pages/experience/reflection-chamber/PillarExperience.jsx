import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PILLARS } from '../../../data/reflectionChamberModuleData';
import { usePillarExperience } from './state/usePillarExperience';
import { useLockBodyScroll } from './hooks/useLockBodyScroll';
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
import OwnedInteriorDefinition from './components/OwnedInteriorDefinition';
import PersonalCommitment from './components/PersonalCommitment';
import CodeDiscovery from './components/CodeDiscovery';
import ShadowCodeRecognition from './components/ShadowCodeRecognition';
import ShadowEncounter from './components/ShadowEncounter';
import ActiveImagination from './components/ActiveImagination';
import ShadowDialogue from './components/ShadowDialogue';
import ShadowEnergy from './components/ShadowEnergy';
import LightCodeRecode from './components/LightCodeRecode';
import LightCodePractice from './components/LightCodePractice';
import TransferTest from './components/TransferTest';
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
 * The stage order is curriculum, not chrome (see utils/stageTransitions.js):
 * recognition first, then the Shadow Code arc. The Light Code is revealed only
 * at STAGES.LIGHT_CODE, after the Seeker has met the Shadow it replaces —
 * nothing earlier may present it, or the encounter becomes decorative.
 *
 * `config` shape (see data/ownedInteriorConfig.js for a full example):
 *   pillarId, intro{eyebrow,word,tagline}, situation, sorter{statements,categories},
 *   conceptReveal{eyebrow,lines,closingLine}, shadowCodeIndex, shadowTeachingIndex,
 *   application{scenarios,digitalSequenceSteps,rehearsedShadowCodeIndex,rehearsedLines,rehearsedLead},
 *   reflectionEmotions, ownedInterior{title,definition,layers},
 *   unbentDoor{lightCodeIndex,choices,promptQuestion,avoidedActionQuestion},
 *   commitment{anchors}, codeDiscovery{layers,leadText},
 *   activeImagination{forms,prompts}, dialogue{prompts}, shadowEnergy{needs},
 *   transfer, mastery, recordItems, seal{eyebrow,word,lines}
 *
 * The canonical Shadow/Light Codes come off the pillar itself
 * (`pillar.canonicalCodes`, reflectionChamberModuleData.js), not from config —
 * they are curriculum, not per-portal presentation.
 */
export default function PillarExperience({ config, onReturnToChamber, completedPillarIds = [] }) {
  const { user } = useAuth();
  const pillar = PILLARS.find((p) => p.id === config.pillarId);
  const { state, setStage, setPracticePhase, patch } = usePillarExperience(config.pillarId, user?.id);
  useLockBodyScroll();

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
        <OwnedInteriorDefinition
          title={config.ownedInterior.title}
          definition={config.ownedInterior.definition}
          layers={config.ownedInterior.layers}
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
            onComplete={() => setStage(STAGES.COMMITMENT)}
          />
        );
      }
      break;

    case STAGES.COMMITMENT:
      content = (
        <PersonalCommitment
          value={state.commitment}
          onChange={(v) => patch({ commitment: v })}
          anchors={config.commitment.anchors}
          onCommit={() => setStage(STAGES.CODE_DISCOVERY)}
        />
      );
      break;

    case STAGES.CODE_DISCOVERY:
      content = (
        <CodeDiscovery
          layers={config.codeDiscovery.layers}
          leadText={config.codeDiscovery.leadText}
          story={state.reflection.whatAssumed}
          value={state.shadow.discoveredCode}
          onChange={(v) => patch({ shadow: { ...state.shadow, discoveredCode: v } })}
          onContinue={() => setStage(STAGES.SHADOW_CODE)}
        />
      );
      break;

    case STAGES.SHADOW_CODE:
      content = (
        <ShadowCodeRecognition
          discoveredCode={state.shadow.discoveredCode}
          isRule={state.shadow.isRule}
          onIsRuleChange={(v) => patch({ shadow: { ...state.shadow, isRule: v } })}
          canonical={pillar.canonicalCodes.shadow}
          onContinue={() => setStage(STAGES.SHADOW_ENCOUNTER)}
        />
      );
      break;

    case STAGES.SHADOW_ENCOUNTER:
      content = <ShadowEncounter onEnter={() => setStage(STAGES.ACTIVE_IMAGINATION)} />;
      break;

    case STAGES.ACTIVE_IMAGINATION:
      content = (
        <ActiveImagination
          forms={config.activeImagination.forms}
          prompts={config.activeImagination.prompts}
          value={state.shadow}
          onChange={(v) => patch({ shadow: v })}
          onContinue={() => setStage(STAGES.DIALOGUE)}
        />
      );
      break;

    case STAGES.DIALOGUE:
      content = (
        <ShadowDialogue
          prompts={config.dialogue.prompts}
          dialogue={state.shadow.dialogue}
          onDialogueChange={(d) => patch({ shadow: { ...state.shadow, dialogue: d } })}
          onContinue={() => setStage(STAGES.SHADOW_ENERGY)}
        />
      );
      break;

    case STAGES.SHADOW_ENERGY:
      content = (
        <ShadowEnergy
          needs={config.shadowEnergy.needs}
          value={state.shadow}
          onChange={(v) => patch({ shadow: v })}
          onContinue={() => setStage(STAGES.LIGHT_CODE)}
        />
      );
      break;

    case STAGES.LIGHT_CODE:
      content = (
        <LightCodeRecode
          shadowCode={pillar.canonicalCodes.shadow.code}
          lightCode={pillar.canonicalCodes.light.code}
          lightBody={pillar.canonicalCodes.light.body}
          onContinue={() => setStage(STAGES.LIGHT_PRACTICE)}
        />
      );
      break;

    case STAGES.LIGHT_PRACTICE:
      content = (
        <LightCodePractice
          lightCode={pillar.canonicalCodes.light.code}
          value={state.light}
          onChange={(v) => patch({ light: v })}
          onContinue={() => setStage(STAGES.TRANSFER)}
        />
      );
      break;

    case STAGES.TRANSFER:
      content = (
        <TransferTest
          scenario={config.transfer}
          value={state.light}
          onChange={(v) => patch({ light: v })}
          onContinue={() => setStage(STAGES.MASTERY)}
        />
      );
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
