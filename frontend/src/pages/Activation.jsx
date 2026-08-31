import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { actEntryRoute } from "../lib/actRoutes";
import "./Activation.css";

const LAUNCH_VIDEO_SRC =
  "https://media.chromakeyprotocol.com/video/chroma_key_protocol_launch_sequence.mp4";
const PROTOCOL_MARK_SRC =
  "https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2Fd3526f31-e65b-4642-bccd-c79d30512556?alt=media&token=a8c1f44c-cc2f-4bb6-918d-717aeb72021f";

const parseActNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : null;
};

export default function Activation() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const fallbackTimerRef = useRef(null);
  const completedRef = useRef(false);

  const act = useMemo(
    () => parseActNumber(searchParams.get("act")) || parseActNumber(state?.act) || 1,
    [searchParams, state?.act],
  );

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const completeActivation = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearFallbackTimer();
    navigate(actEntryRoute(act), { replace: true });
  }, [act, clearFallbackTimer, navigate]);

  const scheduleFallbackRedirect = useCallback(
    (durationSeconds) => {
      clearFallbackTimer();
      const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 10;
      const timeoutMs = Math.max(9000, Math.min(45000, duration * 1000 + 900));
      fallbackTimerRef.current = window.setTimeout(completeActivation, timeoutMs);
    },
    [clearFallbackTimer, completeActivation],
  );

  useEffect(() => {
    scheduleFallbackRedirect();
    return clearFallbackTimer;
  }, [clearFallbackTimer, scheduleFallbackRedirect]);

  return (
    <main className="activation-screen" aria-label={`Act ${act} activation handoff`}>
      <div className="activation-stage">
        <div className="activation-frame activation-frame-outer" aria-hidden="true" />
        <div className="activation-frame activation-frame-middle" aria-hidden="true" />
        <div className="activation-frame activation-frame-inner" aria-hidden="true" />
        <div className="activation-soft activation-soft-blue" aria-hidden="true" />
        <div className="activation-soft activation-soft-gold" aria-hidden="true" />

        <header className="activation-header">
          <div className="activation-brand">
            <img src={PROTOCOL_MARK_SRC} alt="" aria-hidden="true" />
            <div className="activation-brand-title">
              <strong>Chroma Key Protocol</strong>
              <span>|</span>
              <em>Musiq Matrix Mainframe</em>
            </div>
          </div>

          <div className="activation-status" aria-label="Mainframe activated">
            <span className="activation-status-dot" />
            <span>Mainframe Activated</span>
            <span className="activation-status-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
        </header>

        <section className="activation-video-shell" aria-label="Chroma Key Protocol launch sequence">
          <video
            src={LAUNCH_VIDEO_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(event) => scheduleFallbackRedirect(event.currentTarget.duration)}
            onEnded={completeActivation}
            onError={() => scheduleFallbackRedirect(3)}
          />
          <div className="activation-video-overlay" aria-hidden="true" />
        </section>

        <footer className="activation-footer">
          <div className="activation-footer-copy">
            <span>Chrome edition</span>
            <i aria-hidden="true" />
            <span>Autoplay sequence</span>
          </div>

          <button className="activation-transmitting" type="button" onClick={completeActivation}>
            Transmitting
          </button>
        </footer>

        <div className="activation-side activation-side-left" aria-hidden="true">
          Chroma Key Protocol
        </div>
        <div className="activation-side activation-side-right" aria-hidden="true">
          Musiq Matrix Mainframe
        </div>

        <span className="activation-corner activation-corner-top-left" aria-hidden="true" />
        <span className="activation-corner activation-corner-top-right" aria-hidden="true" />
        <span className="activation-corner activation-corner-bottom-left" aria-hidden="true" />
        <span className="activation-corner activation-corner-bottom-right" aria-hidden="true" />
      </div>
    </main>
  );
}
