import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSovereign } from '../../../sovereign/runtime';
import { uploadShadowTwinSourceImage, generateShadowTwin } from '../../../lib/supabase/shadowTwin';
import { CURRENT_SHADOW_TWIN_PROMPT_VERSION } from './data/shadowTwinPrompt';
import ShadowTwinUploader from './components/ShadowTwinUploader';
import ShadowTwinReveal from './components/ShadowTwinReveal';
import './styles/shadowTwinInit.css';

/**
 * ACT II ENTRY — Shadow Twin Initialization (design guide §4-7). The first
 * screen a Seeker sees on entering Act II for the first time: full-screen,
 * no dashboard, no progress bar, no five-pillar navigation, no curriculum
 * copy — "the chamber should feel like the user has entered a system that
 * is waiting for an identity signal." ReflectionProtocolPage.jsx decides
 * whether to render this at all (only when the Seeker has no Shadow Twin
 * yet — see its own §42 "returning users" handling); once generation
 * completes, this hands off to ShadowTwinReveal and then calls
 * `onComplete` to enter the Chamber hub proper.
 */
export default function ShadowTwinInitialization({ onComplete }) {
  const { user } = useAuth();
  const { shadowTwin } = useSovereign();
  const [file, setFile] = useState(null);

  const isWorking = shadowTwin.status === 'uploading' || shadowTwin.status === 'generating';
  const hasFailed = shadowTwin.status === 'failed';
  const isReady = shadowTwin.status === 'ready' && shadowTwin.canonicalImage;

  async function handleInitialize() {
    if (!file || !user?.id || isWorking) return;

    shadowTwin.startUpload();
    const { path, error: uploadError } = await uploadShadowTwinSourceImage(user.id, file);
    if (uploadError || !path) {
      shadowTwin.failGeneration('The Chamber could not complete the initialization.');
      return;
    }

    shadowTwin.setSourceImage(path);
    shadowTwin.startGeneration(CURRENT_SHADOW_TWIN_PROMPT_VERSION);
    const { canonicalImagePath, visualIdentitySeed, error: generationError } = await generateShadowTwin({
      sourceImagePath: path,
      promptVersion: CURRENT_SHADOW_TWIN_PROMPT_VERSION,
    });

    if (generationError || !canonicalImagePath) {
      // Never surface the raw provider/API error (§41) — generateShadowTwin()
      // already sanitized it, but guard here too.
      shadowTwin.failGeneration('The Chamber could not complete the initialization.');
      return;
    }

    shadowTwin.completeGeneration({
      canonicalImagePath,
      promptVersion: CURRENT_SHADOW_TWIN_PROMPT_VERSION,
      visualIdentitySeed,
    });
  }

  if (isReady) {
    return <ShadowTwinReveal canonicalImagePath={shadowTwin.canonicalImage.path} onEnter={onComplete} />;
  }

  return (
    <div className="shadow-twin-init">
      <div className="shadow-twin-init__chrome">
        <span className="shadow-twin-init__eyebrow">CHROMA KEY · REFLECTION CHAMBER</span>
        <h1 className="shadow-twin-init__title">SOMETHING HAS BEEN WAITING HERE</h1>
      </div>

      <div className="shadow-twin-init__panel">
        <p className="shadow-twin-init__reveal">
          Before you can recognize what has been hidden, the Chamber needs to know who is entering it.
        </p>
        <p className="shadow-twin-init__secondary">
          Upload a full-body photograph of yourself. This image becomes the identity reference from
          which your Shadow Twin will be initialized.
        </p>

        <ShadowTwinUploader onValidFile={setFile} disabled={isWorking} />

        {hasFailed && (
          <div className="shadow-twin-init__failure" role="alert">
            <p>{shadowTwin.error || 'The Chamber could not complete the initialization.'}</p>
            <p>Your source image remains intact.</p>
          </div>
        )}

        <button
          type="button"
          className="shadow-twin-init__cta"
          disabled={!file || isWorking}
          onClick={handleInitialize}
        >
          {isWorking
            ? shadowTwin.status === 'uploading'
              ? 'STORING YOUR IMAGE…'
              : 'MATERIALIZING…'
            : hasFailed
              ? 'RETRY INITIALIZATION'
              : 'INITIALIZE SHADOW TWIN'}
        </button>
      </div>

      <span className="shadow-twin-init__footer">ACT II</span>
    </div>
  );
}
