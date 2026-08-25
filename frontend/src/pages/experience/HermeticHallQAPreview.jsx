import { useParams } from 'react-router-dom';
import { SovereignProvider } from '../../sovereign/runtime';
import VibrationModuleExperience from '../../modules/sovereign/reclamation-university/VibrationModuleExperience';
import PolarityModuleExperience from '../../modules/sovereign/reclamation-university/PolarityModuleExperience';
import RhythmModuleExperience from '../../modules/sovereign/reclamation-university/RhythmModuleExperience';
import CauseEffectModuleExperience from '../../modules/sovereign/reclamation-university/CauseEffectModuleExperience';
import GenderModuleExperience from '../../modules/sovereign/reclamation-university/GenderModuleExperience';
import HermeticSuppliedModuleExperience from '../../modules/sovereign/reclamation-university/HermeticSuppliedModuleExperience';

/**
 * A staging page for the Hermetic Hall modules' visual design, same
 * precedent as /qa/sovereign-os (SovereignOSDemo.jsx) -- not linked from
 * anywhere in the live app, reachable only at its own route
 * (/qa/hermetic-hall/:moduleSlug). Exists because these six components
 * are only otherwise reachable behind ProtectedRoute (a real, signed-in
 * Supabase session, which this environment has never had), so there was
 * previously no way to actually look at what any of them render.
 */
const MODULES = {
  vibration: VibrationModuleExperience,
  polarity: PolarityModuleExperience,
  rhythm: RhythmModuleExperience,
  'cause-and-effect': CauseEffectModuleExperience,
  gender: GenderModuleExperience,
};

export default function HermeticHallQAPreview() {
  const { moduleSlug } = useParams();

  if (moduleSlug === 'mentalism' || moduleSlug === 'correspondence') {
    return (
      <SovereignProvider>
        <HermeticSuppliedModuleExperience moduleSlug={moduleSlug} onComplete={() => {}} />
      </SovereignProvider>
    );
  }

  const Module = MODULES[moduleSlug];
  if (!Module) {
    return (
      <div style={{ padding: 40, color: '#fff', background: '#111' }}>
        Unknown module &quot;{moduleSlug}&quot;. Try one of: {Object.keys(MODULES).join(', ')}, mentalism, correspondence.
      </div>
    );
  }

  return (
    <SovereignProvider>
      <Module faculty={{ title: 'Hermetic Hall' }} onComplete={() => {}} />
    </SovereignProvider>
  );
}
