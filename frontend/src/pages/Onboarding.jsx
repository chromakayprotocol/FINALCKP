import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const emotionalStates = [
  { id: 'lost', icon: '\u25CC', label: 'Lost', sub: "Something doesn't fit anymore" },
  { id: 'focused', icon: '\u25CE', label: 'Focused', sub: "I know what I'm building toward" },
  { id: 'curious', icon: '\u25C7', label: 'Curious', sub: "I found something here and I don't know why" },
  { id: 'numb', icon: '\u2014', label: 'Numb', sub: 'Going through the motions, nothing lands' },
  { id: 'driven', icon: '\u25B2', label: 'Driven', sub: "I'm reclaiming something and I won't stop" },
];

const responses = {
  lost: "The system sees you. What you're feeling isn't confusion — it's the beginning of recognition. The old code is fragmenting. That's the first step.",
  focused: "Good. Focus is fuel. But even lasers need a target. The Protocol will refine your trajectory — and reveal the blind spots you didn't know you had.",
  curious: "Curiosity is the highest form of intelligence. You found this because something in you recognized it before your mind caught up. Trust that signal.",
  numb: "Numbness isn't emptiness — it's protection. You've been carrying weight that wasn't yours. The Protocol begins where you stopped feeling.",
  driven: "That fire? It's not anger. It's remembrance. You're waking up to something that was always yours. The system is designed for seekers like you.",
};

const lyrics = {
  lost: '"I was searching for a signal in the noise..."',
  focused: '"Every step was measured, every breath was code..."',
  curious: '"Something pulled me here, I don\'t know the name..."',
  numb: '"I went through the motions, watched the world go by..."',
  driven: '"Burning bridges just to build a better road..."',
};

const Onboarding = () => {
  const [phase, setPhase] = useState(1);
  const [selectedState, setSelectedState] = useState(null);
  const navigate = useNavigate();

  const handleStateSelect = (stateId) => {
    setSelectedState(stateId);
    setPhase(3);
  };

  const enterProtocol = () => navigate('/dashboard');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--void)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Phase 1: The Statement */}
      {phase === 1 && (
        <div data-testid="ob-phase-1" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', width: '100%', maxWidth: 600, padding: 40,
          animation: 'obIn 0.6s ease both'
        }}>
          <div style={{ width: 1, height: 60, background: 'linear-gradient(180deg,transparent,var(--act),transparent)', marginBottom: 32 }} />
          <div style={{ fontSize: 48, color: 'var(--act)', marginBottom: 20, opacity: 0.6, animation: 'pulse 3s ease-in-out infinite' }}>
            &#x25C8;
          </div>
          <div style={{ fontFamily: "'Oxanium',serif", fontSize: 'clamp(28px,5vw,52px)', fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1.15, color: 'var(--white)', marginBottom: 20 }}>
            This is not<br />an album.<br /><span style={{ color: 'var(--act)' }}>This is a system.</span>
          </div>
          <div style={{ fontFamily: "'Oxanium',serif", fontStyle: 'italic', fontSize: 18, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 48, maxWidth: 400 }}>
            You move through it. It changes based on you.
          </div>
          <button
            data-testid="begin-btn"
            onClick={() => setPhase(2)}
            style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.5em',
              textTransform: 'uppercase', padding: '16px 48px', border: '1px solid var(--act)',
              background: 'transparent', color: 'var(--act)', cursor: 'pointer',
              transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
            }}
          >
            Begin
          </button>
        </div>
      )}

      {/* Phase 2: Emotional State */}
      {phase === 2 && (
        <div data-testid="ob-phase-2" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', width: '100%', maxWidth: 600, padding: 40,
          animation: 'obIn 0.6s ease both'
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 32 }}>
            Where are you right now?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {emotionalStates.map(state => (
              <button
                key={state.id}
                data-testid={`state-${state.id}`}
                onClick={() => handleStateSelect(state.id)}
                style={{
                  padding: '16px 24px', border: '1px solid var(--border)', background: 'transparent',
                  fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 500, color: 'var(--muted)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 16, letterSpacing: '0.08em'
                }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{state.icon}</span>
                {state.label}
                <span style={{ fontFamily: "'Oxanium',serif", fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', marginLeft: 'auto', maxWidth: 180, textAlign: 'right', lineHeight: 1.4 }}>
                  {state.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase 3: Response + Two Entry Options */}
      {phase === 3 && selectedState && (
        <div data-testid="ob-phase-3" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', width: '100%', maxWidth: 600, padding: 40,
          animation: 'obIn 0.6s ease both'
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--act)', marginBottom: 16 }}>
            The System Responds
          </div>
          <div style={{ fontFamily: "'Oxanium',serif", fontStyle: 'italic', fontSize: 20, color: 'var(--white)', lineHeight: 1.65, marginBottom: 24 }}>
            {responses[selectedState]}
          </div>
          <div style={{
            background: 'rgba(90,176,56,0.08)', border: '1px solid var(--act)',
            padding: '14px 24px', fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--act)',
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center'
          }}>
            <span>&#x2295;</span>
            <span>Act I: The Fractured Veil — Unlocked</span>
          </div>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--border)', borderLeft: '3px solid var(--act)',
            padding: '16px 20px', fontFamily: "'Oxanium',serif", fontStyle: 'italic',
            fontSize: 15, color: '#8a8870', lineHeight: 1.75, textAlign: 'left', width: '100%', marginBottom: 32
          }}>
            {lyrics[selectedState]}
          </div>

          {/* Entry */}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
            Begin
          </div>
          <div style={{ display: 'flex', width: '100%' }}>
            <button
              data-testid="enter-protocol-btn"
              onClick={enterProtocol}
              style={{
                flex: 1, padding: '20px 24px', border: '1px solid var(--act)', background: 'transparent',
                cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center'
              }}
            >
              <div style={{ fontFamily: "'Oxanium',serif", fontSize: 14, fontWeight: 600, color: 'var(--act)', marginBottom: 8, letterSpacing: '0.1em' }}>
                Enter The Protocol
              </div>
              <div style={{ fontFamily: "'Oxanium',serif", fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                Start from Act I and follow the structured path through all acts.
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
