/* ============================================================================
   THE CHROMA FRAME — LIVING REFERENCE   (/system/chroma-frame)
   ----------------------------------------------------------------------------
   The spec you can look at. docs/CENTRAL_ARCHITECTURE.md says what the system
   is; this renders it, in the frame, using the same components every screen
   uses — so it cannot describe a system the code does not actually have.

   Change the channel here and the entire chassis re-keys: brackets, rails,
   meters, focus rings, every panel edge. That is the whole architecture in
   one gesture. One chassis, many worlds.
   ========================================================================= */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Lock, Slash } from 'lucide-react';
import {
  CHANNEL_IDS,
  CHROMA_CHANNELS,
  ChromaFrame,
  FrameAction,
  FrameMeter,
  FramePanel,
  PROTOCOL_SURFACES,
  READOUT_STATE,
  SURFACE_STATUS,
} from '../../system';
import './chromaFrameReference.css';

/* The six layers, in z-order. Named here exactly as chromaFrame.css names
   them, so the diagram and the stylesheet cannot disagree. */
const LAYERS = [
  ['0', 'Plate', 'The module’s own world — art, video, canvas, 3D.'],
  ['1', 'Veil', 'The grade. Why five environments read as one product.'],
  ['2', 'Field', 'The module’s composition, on a 16:9 stage.'],
  ['3', 'Chassis', 'Corner brackets and hairline rules. The signature.'],
  ['4', 'Rails', 'Six slots: system · location · readout / seeker · meters · actions.'],
  ['5', 'Overlay', 'Boot, transition, video, modal. Nothing lives here.'],
];

const VOICES = [
  ['Sigil', 'Cinzel', 'Place names and module titles. Mythic register.', 'ckp-subtitle'],
  ['Signal', 'JetBrains Mono', 'Every system label and telemetry. Machine register.', 'ckp-eyebrow'],
  ['Script', 'Inter', 'Prose and instruction. Human register.', 'ckp-body'],
];

/* Every state a value can be in, shown side by side — because the point of
   the rule is that these four look and sound DIFFERENT. */
const READOUT_CASES = [
  ['Derived', 64, READOUT_STATE.OK],
  ['Reading', null, READOUT_STATE.LOADING],
  ['Signed out', null, READOUT_STATE.SIGNED_OUT],
  ['Not yet built', null, READOUT_STATE.UNAVAILABLE],
  ['Read failed', 93, READOUT_STATE.ERROR],
];

const STATUS_ICON = {
  [SURFACE_STATUS.LIVE]: ArrowUpRight,
  [SURFACE_STATUS.SEALED]: Lock,
  [SURFACE_STATUS.VACANT]: Slash,
};

export default function ChromaFrameReference() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState('aurum');
  const current = CHROMA_CHANNELS[channel];

  return (
    <ChromaFrame
      channel={channel}
      location={`System · Chroma Frame · ${current.label}`}
      readout={{ label: 'Channels', value: CHANNEL_IDS.length, state: READOUT_STATE.OK }}
      seeker={{ name: 'Reference' }}
      meters={[
        { label: 'Derived', value: 72, state: READOUT_STATE.OK },
        { label: 'Unbuilt', value: null, state: READOUT_STATE.UNAVAILABLE },
        { label: 'Failed', value: 40, state: READOUT_STATE.ERROR },
      ]}
      actions={<FrameAction keyed onClick={() => navigate('/acts')}>Exit</FrameAction>}
      className="cfr"
    >
      <div className="cfr-grid">
        <header className="cfr-head">
          <span className="ckp-eyebrow">One chassis, many worlds</span>
          <h1 className="ckp-title">The Chroma Frame</h1>
          <p className="ckp-body">
            Chroma keying works because the frame is constant and the key is not. Every screen
            supplies a <em>plate</em> and a <em>channel</em>; everything else — brackets, rails,
            type, and the way a missing number is reported — is supplied once, here. Pick a
            channel and watch the whole chassis re-key.
          </p>
        </header>

        {/* ---- the channels ------------------------------------------- */}
        <section className="cfr-channels" aria-label="Channels">
          {CHANNEL_IDS.map((id) => {
            const entry = CHROMA_CHANNELS[id];
            return (
              <button
                key={id}
                type="button"
                className={`cfr-chip${id === channel ? ' is-active' : ''}`}
                style={{ '--chip': entry.key, '--chip-bright': entry.keyBright }}
                onClick={() => setChannel(id)}
                aria-pressed={id === channel}
              >
                <span className="cfr-chip__swatch" aria-hidden="true" />
                <span className="cfr-chip__name">{entry.label}</span>
                <span className="cfr-chip__domain">{entry.domain}</span>
              </button>
            );
          })}
        </section>

        {/* ---- anatomy ------------------------------------------------- */}
        <FramePanel className="cfr-card">
          <h2 className="ckp-eyebrow">Six layers</h2>
          <ol className="cfr-layers">
            {LAYERS.map(([z, name, note]) => (
              <li key={z}>
                <span className="ckp-data">{z}</span>
                <span className="cfr-layers__name">{name}</span>
                <span className="cfr-layers__note">{note}</span>
              </li>
            ))}
          </ol>
        </FramePanel>

        {/* ---- voices -------------------------------------------------- */}
        <FramePanel className="cfr-card">
          <h2 className="ckp-eyebrow">Three voices. Never a fourth.</h2>
          <ul className="cfr-voices">
            {VOICES.map(([name, family, note, sample]) => (
              <li key={name}>
                <span className={sample}>{name} — {family}</span>
                <span className="cfr-voices__note">{note}</span>
              </li>
            ))}
          </ul>
        </FramePanel>

        {/* ---- the readout rule ---------------------------------------- */}
        <FramePanel className="cfr-card">
          <h2 className="ckp-eyebrow">A missing value says why</h2>
          <div className="cfr-readouts">
            {READOUT_CASES.map(([label, value, state]) => (
              <ReadoutCase key={label} label={label} value={value} state={state} />
            ))}
          </div>
        </FramePanel>

        {/* ---- the surface map ----------------------------------------- */}
        <section className="cfr-map" aria-label="Protocol surfaces">
          <h2 className="ckp-eyebrow">Every surface the Protocol has</h2>
          <ul>
            {PROTOCOL_SURFACES.map((surface) => {
              const Icon = STATUS_ICON[surface.status];
              const entry = CHROMA_CHANNELS[surface.channel];
              const reachable = surface.status === SURFACE_STATUS.LIVE;
              return (
                <li key={surface.id} data-status={surface.status}>
                  <button
                    type="button"
                    className="cfr-surface"
                    style={{ '--chip': entry.key, '--chip-bright': entry.keyBright }}
                    onClick={() => reachable && navigate(surface.route)}
                    disabled={!reachable}
                    aria-label={`${surface.title} — ${surface.location} — ${surface.status}`}
                  >
                    <span className="cfr-surface__dot" aria-hidden="true" />
                    <span className="cfr-surface__title">{surface.title}</span>
                    <span className="cfr-surface__where">{surface.location}</span>
                    <Icon size={13} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </ChromaFrame>
  );
}

/* Rendered through the frame's own FrameMeter, not a facsimile of one, so
   this reference cannot drift from the behaviour it documents. */
function ReadoutCase({ label, value, state }) {
  return (
    <div className="cfr-readout-case">
      <span className="ckp-label">{label}</span>
      <FrameMeter label={label} value={value} state={state} />
    </div>
  );
}
