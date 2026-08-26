import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HermeticHallViewport.css';

const principles = [
  { number: 'I', slug: 'mentalism', name: 'Mentalism', subtitle: 'Before the Body, the All-Mind.', progress: 18 },
  { number: 'II', slug: 'correspondence', name: 'Correspondence', subtitle: 'As Above, So Below.', progress: 0 },
  { number: 'III', slug: 'vibration', name: 'Vibration', subtitle: 'Nothing Rests. Everything Moves.', progress: 0 },
  { number: 'IV', slug: 'polarity', name: 'Polarity', subtitle: 'Everything Is Dual.', progress: 0 },
  { number: 'V', slug: 'rhythm', name: 'Rhythm', subtitle: 'Everything Flows, Out and In.', progress: 0 },
  { number: 'VI', slug: 'cause-and-effect', name: 'Cause & Effect', subtitle: 'Every Cause Has Its Effect.', progress: 0 },
  { number: 'VII', slug: 'gender', name: 'Gender', subtitle: 'Creation Holds Both Principles.', progress: 0 },
];

export default function HermeticHallViewport() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(principles[0]);

  const choosePrinciple = (principle) => {
    setSelected(principle);
  };

  const enterModule = () => {
    navigate(`/experiencemode/sovereign/reclamation-university/hermetic-hall/${selected.slug}`);
  };

  return (
    <main className="hermetic-hall" aria-label="Reclamation University Hermetic Hall">
      <div className="hh-stage">
        <header className="hh-topbar" aria-label="Hermetic Hall heading">
          <button
            type="button"
            className="hh-brand"
            onClick={() => navigate('/experiencemode/sovereign/reclamation-university/nexus')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Reclamation University
          </button>
          <h1>Hermetic Hall</h1>
          <span className="hh-instruction">Select a Principle</span>
          <button
            type="button"
            onClick={() => navigate('/experiencemode/sovereign/reclamation-university/sovereign-os')}
            style={{
              marginTop: '0.75rem',
              padding: '0.4rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '999px',
              color: '#fca5a5',
              fontSize: '0.7rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Open Sovereign OS
          </button>
        </header>

        <nav className="hh-principle-map" aria-label="Seven Hermetic principles">
          {principles.map((principle, index) => (
            <button
              key={principle.number}
              type="button"
              className={`hh-hotspot hh-hotspot-${index + 1}${selected.number === principle.number ? ' is-selected' : ''}`}
              onClick={() => choosePrinciple(principle)}
              aria-label={`Select Principle ${principle.number}: ${principle.name}`}
              data-name={`${principle.number} — ${principle.name}`}
              aria-pressed={selected.number === principle.number}
            />
          ))}
        </nav>

        <section className="hh-focus-card" aria-live="polite">
          <div className="hh-focus-copy">
            <span>Principle {selected.number}</span>
            <h2>{selected.name}</h2>
            <p>{selected.subtitle}</p>
          </div>
          <div className={`hh-orb hh-orb-${selected.number.toLowerCase().replace(/[^a-z]/g, '')}`} aria-hidden="true" />
          <div className="hh-progress">
            <span>{selected.progress}% Complete</span>
            <div className="hh-progress-track">
              <i style={{ width: `${selected.progress}%` }} />
            </div>
          </div>
          <button type="button" className="hh-enter" onClick={enterModule}>
            Enter {selected.name} <span aria-hidden="true">→</span>
          </button>
        </section>

        <footer className="hh-footer">
          <strong>7 Principles · 7 Paths · One System</strong>
          <span>Select a module to change the screen.</span>
        </footer>
      </div>
    </main>
  );
}
