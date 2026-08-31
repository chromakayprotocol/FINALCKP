import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import ReclamationCodex from '../acts/Reclamation/ReclamationCodex';

const actMeta = [
  { num: 1, roman: 'I', element: 'Earth', title: 'The Fractured Veil', color: 'var(--g3)', hex: '#5ab038', dim: 'var(--gdim)', bg: 'var(--gsurf)', surfGrad: 'linear-gradient(180deg,var(--gsurf),#070c05)', borderGrad: 'linear-gradient(90deg,var(--g3),var(--g4))', desc: 'Awareness. Recognition. Naming what was hidden beneath the surface.' },
  { num: 2, roman: 'II', element: 'Water', title: 'The Reflection Chamber', color: 'var(--b3)', hex: '#50a0e0', dim: 'var(--bdim)', bg: 'var(--bsurf)', surfGrad: 'linear-gradient(180deg,var(--bsurf),#050810)', borderGrad: 'linear-gradient(90deg,var(--b2),var(--b3))', desc: 'Reflection. Shadow work. Looking clearly into the mirror of self.' },
  { num: 3, roman: 'III', element: 'Fire', title: 'Reclamation', color: 'var(--r3)', hex: '#d03010', dim: 'var(--rdim)', bg: 'var(--rsurf)', surfGrad: 'linear-gradient(180deg,var(--rsurf),#0b0402)', borderGrad: 'linear-gradient(90deg,var(--r2),var(--r3))', desc: 'Reclamation. Burning away what is not essential. Sovereignty.' },
  { num: 4, roman: 'IV', element: 'Air', title: 'The Crucible Code', color: 'var(--y3)', hex: '#c8a020', dim: 'var(--ydim)', bg: 'var(--ysurf)', surfGrad: 'linear-gradient(180deg,var(--ysurf),#080600)', borderGrad: 'linear-gradient(90deg,var(--y2),var(--y3))', desc: 'Integration. Equilibrium. Holding all of it with grace.' },
];

const shareBtnStyle = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.1em',
  padding: '3px 8px', border: '1px solid var(--border2)', background: 'transparent',
  color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s'
};

const ShareButtons = ({ track, act }) => {
  const text = `Listening to "${track.name}" from Balanced Elementals — Act ${act.roman} · ${act.element}`;
  const url = window.location.href;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>Share</span>
      <button data-testid="share-twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420')} style={shareBtnStyle}>X</button>
      <button data-testid="share-facebook" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=550,height=420')} style={shareBtnStyle}>FB</button>
      <button data-testid="share-copy" onClick={() => { navigator.clipboard.writeText(`${text}\n${url}`); alert('Copied to clipboard!'); }} style={shareBtnStyle}>&#x2398;</button>
    </div>
  );
};

const ImmersionLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLocked = (act) => {
    if (user?.is_admin) return false;
    if (act.num === 1) return false;
    if (act.num === 3) return false;
    const tier = user?.tier || 'free';
    if (tier === 'full' || tier === 'license') return false;
    return true;
  };

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', padding: '16px 0 28px' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Musiq Matrix</div>
        <div data-testid="immersion-title" style={{ fontFamily: "'Oxanium',serif", fontSize: 'clamp(18px,3vw,30px)', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--act)' }}>Balanced Elementals</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginTop: 4 }}>The Chroma Key Protocol</div>
        <div style={{ width: 60, height: 1, background: 'var(--border2)', margin: '16px auto 0' }} />
        <div style={{ fontFamily: "'Oxanium',serif", fontSize: 'clamp(14px,2vw,20px)', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--white)', marginTop: 16 }}>The Immersion Protocol</div>
        <div style={{ fontFamily: "'Oxanium',serif", fontStyle: 'italic', fontSize: 13, color: 'var(--muted)', marginTop: 6, maxWidth: 520, margin: '6px auto 0' }}>Select an Act to begin your sonic immersion. Each element carries its own frequency, mythology, and revelation.</div>
      </div>
      <div data-testid="immersion-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxWidth: 1100, margin: '0 auto' }}>
        {actMeta.map(act => {
          const locked = isLocked(act);
          return (
            <div key={act.num} data-testid={`immersion-card-${act.num}`} onClick={() => !locked && navigate(`/listen/${act.num}`)} style={{ position: 'relative', overflow: 'hidden', cursor: locked ? 'not-allowed' : 'pointer', background: act.surfGrad, border: '1px solid var(--border)', padding: '24px 18px', opacity: locked ? 0.4 : 1, transition: 'all 0.25s', minHeight: 260, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: act.borderGrad }} />
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: '0.4em', textTransform: 'uppercase', color: act.color, marginBottom: 12 }}>Act {act.roman} · {act.element}</div>
              <div style={{ fontSize: 36, color: act.color, marginBottom: 12, lineHeight: 1, filter: `drop-shadow(0 0 12px ${act.hex}44)` }}>{act.num === 1 ? '\u2295' : act.num === 2 ? '\u224B' : act.num === 3 ? '\u25B3' : '\u2726'}</div>
              <div style={{ fontFamily: "'Oxanium',serif", fontSize: 14, fontWeight: 600, color: act.color, letterSpacing: '0.06em', marginBottom: 8 }}>{act.title}</div>
              <div style={{ fontFamily: "'Oxanium',serif", fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{act.desc}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: '0.15em', marginBottom: 10 }}>{locked ? '' : 'Immersive experience'}</div>
              <button data-testid={`immersion-enter-${act.num}`} style={{ width: '100%', fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '8px 0', border: `1px solid ${locked ? 'var(--border)' : act.color}`, background: 'transparent', cursor: locked ? 'not-allowed' : 'pointer', color: locked ? 'var(--muted)' : act.color, transition: 'all 0.2s' }}>{locked ? (act.num === 4 ? 'Coming Soon' : 'Locked') : 'Enter Immersion \u2192'}</button>
              {locked && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,6,4,0.55)', backdropFilter: 'blur(3px)' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: act.color }}>{act.num === 4 ? 'Coming Soon' : 'Unlock to Access'}</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GuidedListen = () => {
  const { actNumber } = useParams();
  const actNum = parseInt(actNumber || '0');
  if (!actNum) return <ImmersionLanding />;
  if (actNum === 3) return <ReclamationCodex />;
  return <div style={{ padding: 24 }}>Guided Listen Act {actNum}</div>;
};

export default GuidedListen;
