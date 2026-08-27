import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SovereignProvider } from '../sovereign/runtime';
import ReclamationModuleEngine from '../modules/sovereign/reclamation-university/ReclamationModuleEngine';
import HermeticCurriculumModule from '../modules/sovereign/reclamation-university/HermeticCurriculumModule';
import HermeticSuppliedModuleExperience from '../modules/sovereign/reclamation-university/HermeticSuppliedModuleExperience';
import VibrationModuleExperience from '../modules/sovereign/reclamation-university/VibrationModuleExperience';
import PolarityModuleExperience from '../modules/sovereign/reclamation-university/PolarityModuleExperience';
import RhythmModuleExperience from '../modules/sovereign/reclamation-university/RhythmModuleExperience';
import CauseEffectModuleExperience from '../modules/sovereign/reclamation-university/CauseEffectModuleExperience';
import GenderModuleExperience from '../modules/sovereign/reclamation-university/GenderModuleExperience';
import { getFacultyBySlug, getModuleBySlug } from '../data/reclamationUniversityCurriculum';
import { HERMETIC_HALL_FACULTY, getHermeticHallModule } from '../data/hermeticHallCurriculum';

/**
 * ReclamationModulePage
 *
 * Route: /experiencemode/sovereign/reclamation-university/:facultySlug/:moduleSlug
 *
 * This page loads the faculty and module from the curriculum registry.
 * Mentalism and Correspondence use the supplied Hermetic material experience.
 * Vibration, Polarity, Rhythm, Cause & Effect and Gender each have their own
 * dedicated, fully-authored experience with instrumented progress. Gender is the
 * seventh and final principle, so it completes back to the Hall rather than
 * onward. Non-Hermetic-Hall faculties use the original module engine.
 *
 * Phase 15 follow-up (docs/ARCHITECTURE.md): the six Sovereign-consuming
 * Hermetic Hall experiences below used to each mount their own
 * SovereignProvider, so navigating from one module to the next (the normal
 * onComplete flow) remounted a fresh instance and lost in-memory state —
 * "did module A's concept selection survive into module B" was never
 * actually true. React Router keeps this page's own component instance
 * mounted across :moduleSlug changes (same matched Route, just new params),
 * so hoisting one SovereignProvider here — around only the six components
 * that actually read useSovereign(), not HermeticCurriculumModule or
 * ReclamationModuleEngine, which don't — makes that memory real without
 * touching any of those six components' own internals beyond removing their
 * now-redundant individual providers.
 */
export default function ReclamationModulePage() {
  const navigate = useNavigate();
  const { facultySlug, moduleSlug } = useParams();
  const { user } = useAuth();

  const isHermeticHall = facultySlug === HERMETIC_HALL_FACULTY.slug;
  const faculty = useMemo(
    () => (isHermeticHall ? HERMETIC_HALL_FACULTY : getFacultyBySlug(facultySlug)),
    [facultySlug, isHermeticHall]
  );
  const module = useMemo(
    () => (isHermeticHall ? getHermeticHallModule(moduleSlug) : getModuleBySlug(facultySlug, moduleSlug)),
    [facultySlug, isHermeticHall, moduleSlug]
  );

  if (!faculty || !module) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1>Module Not Found</h1>
        <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          This module could not be loaded. Please return to the university.
        </p>
        <button
          type="button"
          onClick={() => navigate('/experiencemode/sovereign/reclamation-university')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Return to University
        </button>
      </div>
    );
  }

  let hermeticHallElement = null;

  if (isHermeticHall && module.slug === 'vibration') {
    hermeticHallElement = (
      <VibrationModuleExperience
        module={module}
        faculty={faculty}
        onComplete={() =>
          navigate('/experiencemode/sovereign/reclamation-university/hermetic-hall/polarity')
        }
      />
    );
  } else if (isHermeticHall && module.slug === 'polarity') {
    hermeticHallElement = (
      <PolarityModuleExperience
        module={module}
        faculty={faculty}
        onComplete={() =>
          navigate('/experiencemode/sovereign/reclamation-university/hermetic-hall/rhythm')
        }
      />
    );
  } else if (isHermeticHall && module.slug === 'rhythm') {
    hermeticHallElement = (
      <RhythmModuleExperience
        module={module}
        faculty={faculty}
        onComplete={() =>
          navigate('/experiencemode/sovereign/reclamation-university/hermetic-hall/cause-and-effect')
        }
      />
    );
  } else if (isHermeticHall && module.slug === 'cause-and-effect') {
    hermeticHallElement = (
      <CauseEffectModuleExperience
        module={module}
        faculty={faculty}
        onComplete={() =>
          navigate('/experiencemode/sovereign/reclamation-university/hermetic-hall/gender')
        }
      />
    );
  } else if (isHermeticHall && module.slug === 'gender') {
    hermeticHallElement = (
      <GenderModuleExperience
        module={module}
        faculty={faculty}
        onComplete={() =>
          navigate('/experiencemode/sovereign/reclamation-university/hermetic-hall')
        }
      />
    );
  } else if (isHermeticHall && ['mentalism', 'correspondence'].includes(module.slug)) {
    hermeticHallElement = (
      <HermeticSuppliedModuleExperience
        moduleSlug={module.slug}
        progress={0}
        onComplete={() =>
          navigate(
            `/experiencemode/sovereign/reclamation-university/hermetic-hall/${
              module.slug === 'mentalism' ? 'correspondence' : 'vibration'
            }`
          )
        }
      />
    );
  }

  if (hermeticHallElement) {
    const namespace = user?.id || 'anonymous';
    return (
      <SovereignProvider namespace={namespace} userId={user?.id}>
        {hermeticHallElement}
      </SovereignProvider>
    );
  }

  if (isHermeticHall) {
    return <HermeticCurriculumModule module={module} faculty={faculty} />;
  }

  return <ReclamationModuleEngine module={module} faculty={faculty} />;
}
