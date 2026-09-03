import { indexInSequence, nextInSequence, previousInSequence, screenIds } from '../utils/stageTransitions';

import PillarStage from '../components/PillarStage';
import PillarNavigation from '../components/PillarNavigation';
import PillarIntro from '../components/PillarIntro';
import PillarBridge from '../components/PillarBridge';
import PillarRecord from '../components/PillarRecord';
import PillarSeal from '../components/PillarSeal';

/**
 * The config-driven screen engine.
 *
 * A pillar whose config carries a `screens` list is run by this component
 * instead of a hand-written stage machine. It walks the configured order,
 * looks each screen's `type` up in a renderer table, and hands the renderer
 * one uniform prop bundle. It deliberately imports no pillar-specific
 * component: the shared screen types below are the only ones it knows, and
 * everything else arrives through the `renderers` prop that the pillar's
 * own wrapper supplies. Adding Pillar Three means a new config plus a new
 * renderer table — not an edit to this file.
 *
 * Renderer contract — every renderer receives:
 *   { screen, config, pillar, state, actions, onAdvance, onBack, onReturn }
 *
 * `screens` entries are `{ id, type, ...rendererProps }`; the whole entry
 * is passed through as `screen`, so a renderer reads its own extra keys.
 */

const SHARED_RENDERERS = {
  intro: ({ config, pillar, onAdvance }) => (
    <PillarIntro
      pillar={pillar}
      onEnter={onAdvance}
      eyebrow={config.intro?.eyebrow}
      word={config.intro?.word}
      tagline={config.intro?.tagline}
    />
  ),

  bridge: ({ screen, onAdvance }) => (
    <PillarBridge
      eyebrow={screen.eyebrow}
      lines={screen.lines}
      closingLine={screen.closingLine}
      ctaLabel={screen.ctaLabel}
      onContinue={onAdvance}
    />
  ),

  record: ({ config, pillar, state, onAdvance }) => {
    // The engine cannot know what a given pillar's record is made of, so
    // the pillar's config builds it (§44's generic mechanism). Portal
    // One's flat `recordItems` list still works untouched.
    const built = config.buildRecord?.({ pillar, state, config }) ?? {};
    return (
      <PillarRecord
        pillar={pillar}
        items={built.items ?? config.recordItems ?? []}
        sections={built.sections}
        summary={built.summary}
        onContinue={onAdvance}
      />
    );
  },

  seal: ({ config, pillar, onReturn }) => (
    <PillarSeal
      pillar={pillar}
      eyebrow={config.seal?.eyebrow}
      word={config.seal?.word}
      lines={config.seal?.lines}
      onReturn={onReturn}
    />
  ),
};

export default function ScreenSequence({ config, pillar, experience, onReturn, renderers = {} }) {
  const { state, setScreen, completeScreen } = experience;

  const screens = config.screens ?? [];
  const sequence = screenIds(screens);

  const currentId = sequence.includes(state.currentScreen) ? state.currentScreen : sequence[0];
  const index = indexInSequence(sequence, currentId);
  const screen = screens[index];

  if (!screen) return null;

  const isLast = index === sequence.length - 1;

  const onAdvance = () => {
    completeScreen(currentId);
    if (isLast) {
      onReturn();
      return;
    }
    setScreen(nextInSequence(sequence, currentId));
  };

  const onBack = () => setScreen(previousInSequence(sequence, currentId));

  const Renderer = renderers[screen.type] ?? SHARED_RENDERERS[screen.type];

  const content = Renderer ? (
    <Renderer
      screen={screen}
      config={config}
      pillar={pillar}
      state={state}
      actions={experience.actions}
      onAdvance={onAdvance}
      onBack={onBack}
      onReturn={onReturn}
    />
  ) : (
    <p className="pooi-missing-screen">
      No renderer is registered for screen type “{screen.type}”.
    </p>
  );

  // `hideNav` opts a screen out of the back/counter chrome entirely (the
  // bridge and the seal own the full frame). `ownsNav` means the renderer
  // draws its own instead, because it has inner steps the screen-level
  // counter would misreport — the track encounter does exactly that.
  const showNav = index > 0 && !screen.hideNav && !screen.ownsNav;

  return (
    <>
      <PillarStage stageKey={currentId}>{content}</PillarStage>

      {showNav && (
        <PillarNavigation
          canGoBack={index > 0}
          onBack={onBack}
          stageNumber={index + 1}
          totalStages={sequence.length}
        />
      )}
    </>
  );
}
