import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSovereign } from '../../../sovereign/runtime';
import { REFLECTION_CHAMBER_STEP_IDS } from '../../../sovereign/reflectionChamber/reflectionChamberSteps';
import { reflectionChamberModuleId } from '../../../sovereign/reflectionChamber/mirrorClarity';
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

/** Concept-graph id for a shadow/light code: its own name, slugified. */
function codeConceptId(code) {
  return code.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Sovereign reflections store one response string per prompt, not four
    separate fields — join the sort's four answers into one readable record. */
function serializeReflection(reflection) {
  return [
    `What happened: ${reflection.whatHappened}`,
    `What I felt: ${reflection.whatFelt.join(', ')}`,
    `What I assumed: ${reflection.whatAssumed}`,
    `What I actually know: ${reflection.whatKnow}`,
  ].join('\n');
}

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

  // Real Sovereign Runtime progress, alongside (not instead of) the rich
  // local UI state above: usePillarExperience owns every granular field
  // this screen renders (sorter placements, digital-sequence log, etc — see
  // its own header comment), while the dispatches below register this
  // pillar's *curriculum* progress — module/step/concept/reflection/
  // protocol state — against the shared runtime, which is what actually
  // persists to Supabase (sovereign_module_state, sovereign_concepts,
  // sovereign_reflections, sovereign_events) and what
  // reflectionChamber/mirrorClarity.js reads to know this pillar is done.
  const { curriculum, module: sovereignModule, concepts, reflection, synthesis } = useSovereign();
  const moduleId = reflectionChamberModuleId(config.pillarId);

  const [conceptPhase, setConceptPhase] = useState('reveal');
  const [applicationPhase, setApplicationPhase] = useState('modern');
  const [reflectionPhase, setReflectionPhase] = useState('form');
  const [sealPhase, setSealPhase] = useState('record');

  // Registers this pillar as the active Sovereign module so every dispatch
  // below (selectConcept, reflection, executeProtocol, advanceStep) is
  // attributed to it rather than left module-unscoped.
  useEffect(() => {
    curriculum.startModule(moduleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  // Marks Enter (01-enter) viewed once this module actually becomes active
  // in the runtime — startModule() above dispatches but doesn't take effect
  // until the next render, so sovereignModule is still null on that first
  // pass.
  useEffect(() => {
    if (!sovereignModule || sovereignModule.moduleId !== moduleId) return;
    sovereignModule.advanceStep(REFLECTION_CHAMBER_STEP_IDS.ENTER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovereignModule?.moduleId]);

  if (!pillar) return null;

  const isActiveModule = sovereignModule?.moduleId === moduleId;

  const handleReturn = () => {
    patch({ completedAt: new Date().toISOString() });
    if (isActiveModule) sovereignModule.advanceStep(REFLECTION_CHAMBER_STEP_IDS.SEAL);
    onReturnToChamber?.();
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
            onContinue={() => {
              // 02-diagnose: claiming the shadow code is this pillar's Key
              // Fragment — the Concept Graph selection the runtime's
              // DIAGNOSE step checks for.
              if (isActiveModule) {
                concepts.selectConcept(codeConceptId(pillar.shadow[config.shadowCodeIndex]));
              }
              setStage(STAGES.APPLICATION);
            }}
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
            onChange={(v) => {
              // 03-reflect: the runtime's staged reflection pipeline —
              // startReflection is idempotent, so calling it on every
              // keystroke just marks the prompt begun once; updateReflection
              // records the live draft.
              if (isActiveModule) {
                reflection.startReflection(REFLECTION_CHAMBER_STEP_IDS.REFLECT);
                reflection.updateReflection(REFLECTION_CHAMBER_STEP_IDS.REFLECT, serializeReflection(v));
              }
              patch({ reflection: v });
            }}
            emotionOptions={config.reflectionEmotions}
            onSubmit={() => {
              // The explicit Decision step — PersonalReflection only allows
              // this once every field is filled, so this is the real commit.
              if (isActiveModule) {
                reflection.commitReflection(REFLECTION_CHAMBER_STEP_IDS.REFLECT, serializeReflection(state.reflection), []);
              }
              setReflectionPhase('mirror');
            }}
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
          onContinue={() => {
            // 04-instruct: viewed the light-code instructional content. Also
            // claims the light code as a second Key Fragment (satisfies
            // 02-diagnose too, if the shadow code claim above was skipped
            // by navigating back and forward).
            if (isActiveModule) {
              concepts.selectConcept(codeConceptId(pillar.light[config.instructLightCodeIndex]));
              sovereignModule.advanceStep(REFLECTION_CHAMBER_STEP_IDS.INSTRUCT);
            }
            setStage(STAGES.PRACTICE);
          }}
        />
      );
      break;

    case STAGES.PRACTICE:
      if (state.practicePhase === PRACTICE_PHASES.OBSERVE) {
        content = (
          <PracticeExercise
            onComplete={() => {
              // 05-practice: the one-minute observation *is* this pillar's
              // authored practice (reflectionChamberModuleData.js
              // PILLARS[0].practices[0]) — a real Protocol execution in the
              // runtime's vocabulary, not a generic timer completion.
              const practice = pillar.practices[0];
              if (isActiveModule && practice) {
                synthesis.executeProtocol(practice.id, { title: practice.title });
              }
              setPracticePhase(PRACTICE_PHASES.LOG);
            }}
          />
        );
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
