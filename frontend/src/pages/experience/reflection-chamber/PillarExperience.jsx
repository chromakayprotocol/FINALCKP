import { useAuth } from '../../../context/AuthContext';
import { PILLARS } from '../../../data/reflectionChamberModuleData';
import { usePillarExperience } from './state/usePillarExperience';
import { useLockBodyScroll } from './hooks/useLockBodyScroll';

import PillarHeader from './components/PillarHeader';
import PillarProgress from './components/PillarProgress';
import PortalOneStages from './stages/PortalOneStages';
import ScreenSequence from './screens/ScreenSequence';

import './portalOneOwnedInterior.css';
import './styles/reflectionChamber.css';

/**
 * PillarExperience — the shared engine behind every Reflection Chamber
 * portal's interactive lesson.
 *
 * It is the *shell*: it resolves the pillar from the canonical curriculum,
 * owns the per-pillar session state, locks page scroll while the pillar is
 * open, and renders the chrome every pillar shares (header, five-pillar
 * progress, return-to-Chamber). It holds no pillar's stage logic. The body
 * is a renderer chosen by the config:
 *
 *   config.screens present  → ScreenSequence, the config-driven engine
 *                             (Pillar Two and everything after it).
 *   config.screens absent   → PortalOneStages, Portal One's own fixed
 *                             stage machine (see stages/PortalOneStages.jsx
 *                             for its Sovereign Runtime reporting).
 *
 * So a new pillar is a config plus, where it needs mechanics of its own, a
 * renderer table — never a fork of this file. All state is local to this
 * feature (state/usePillarExperience.js), keyed per pillar + user in
 * localStorage; there is no shared app-wide runtime.
 *
 * `config` shape:
 *   Both modes — pillarId, intro{eyebrow,word,tagline}, seal{eyebrow,word,lines},
 *     optional themeClass (a CSS scope for this pillar's accent tokens).
 *   Screen mode — screens[{id,type,...}], plus buildRecord({pillar,state,config}).
 *     See data/forgedWitnessConfig.js.
 *   Portal One mode — situation, sorter, conceptReveal, shadowCodeIndex,
 *     application, reflectionEmotions, ownedInterior{title,definition,layers},
 *     unbentDoor{lightCodeIndex,choices,promptQuestion,avoidedActionQuestion},
 *     commitment{anchors}, codeDiscovery{layers,leadText},
 *     activeImagination{forms,prompts}, dialogue{prompts}, shadowEnergy{needs},
 *     transfer, mastery, recordItems… See data/ownedInteriorConfig.js.
 *
 * The canonical Shadow/Light Codes come off the pillar itself
 * (`pillar.canonicalCodes`, reflectionChamberModuleData.js), not from config —
 * they are curriculum, not per-portal presentation.
 */
export default function PillarExperience({
  config,
  onReturnToChamber,
  completedPillarIds = [],
  renderers,
}) {
  const { user } = useAuth();
  const pillar = PILLARS.find((p) => p.id === config.pillarId);
  const experience = usePillarExperience(config.pillarId, user?.id);
  useLockBodyScroll();

  if (!pillar) return null;

  const handleReturn = () => {
    experience.patch({ completedAt: new Date().toISOString() });
    onReturnToChamber?.(true);
  };

  const Body = config.screens ? ScreenSequence : PortalOneStages;

  return (
    <div className={`pooi${config.themeClass ? ` ${config.themeClass}` : ''}`}>
      <PillarHeader
        pillarIndex={pillar.index}
        pillarTitle={pillar.title}
        stageLabel={config.intro?.word}
      />
      <PillarProgress
        pillars={PILLARS}
        activePillarId={pillar.id}
        completedPillarIds={completedPillarIds}
      />

      <Body
        config={config}
        pillar={pillar}
        experience={experience}
        onReturn={handleReturn}
        renderers={renderers}
      />
    </div>
  );
}
