import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bounds, useGLTF } from '@react-three/drei';
import {
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Diamond,
  Minus,
  Orbit,
  Plus,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './SelfDirectedSovereignMode.css';

const MODULES = [
  {
    id: 'audio-visualizer-core',
    title: 'Audio Visualizer Core',
    code: 'AVC',
    lightCode: 'See The Waveform. Shape The Sound. Amplify Your Vision.',
    route: '/experiencemode/sovereign/module/audio-visualizer-core',
    card: '/ui/reclamation/Module_Cards/Sovereign/visualizer_core.png',
  },
  {
    id: 'elemental-codex',
    title: 'Elemental Codex',
    code: 'ECP',
    lightCode: 'The Structure Beneath The System',
    route: '/experiencemode/sovereign/module/elemental-codex',
    card: '/ui/reclamation/Module_Cards/Sovereign/elemental_codex.png',
  },
  {
    id: 'reclamation-university',
    title: 'Reclamation University',
    code: 'RU',
    lightCode: "The Sun Don't Invoice?",
    route: '/experiencemode/sovereign/reclamation-university',
    card: '/ui/reclamation/Module_Cards/Sovereign/reclamation_university.png',
  },
  {
    id: 'lyrical-codex',
    title: 'Lyrical Codex',
    code: 'LCP',
    lightCode: 'Content Is Structure. Structure Is Legacy.',
    route: '/experiencemode/sovereign/module/lyrical-codex',
    card: '/ui/reclamation/Module_Cards/Sovereign/lyrical_codex.png',
  },
  {
    id: 'sonic-artifacts',
    title: 'Sonic Artifacts',
    code: 'SAP',
    lightCode: 'Frequencies Hold Memory. Artifacts Hold Purpose.',
    route: '/experiencemode/sovereign/module/sonic-artifacts',
    card: '/ui/reclamation/Module_Cards/Sovereign/sonic_artifacts.png',
  },
  {
    id: 'vibes-and-scribes',
    title: 'Vibes & Scribes',
    code: 'VSP',
    lightCode: 'Set The Tags. Run The Alchemizr. Meet The Track.',
    route: '/experiencemode/sovereign/module/vibes-and-scribes',
    card: '/ui/reclamation/Module_Cards/Sovereign/sonic_artifacts.png',
  },
  {
    id: 'archetype',
    title: 'Archetype',
    code: 'ARC',
    lightCode: 'Know The Patterns. Master The Self. Shape Your Legacy.',
    route: '/experiencemode/sovereign/module/archetype',
    card: '/ui/reclamation/Module_Cards/Sovereign/archaetypes.png',
  },
];

const ELEMENT_LEVELS = [
  { label: 'Fire', value: 78, color: '#f22f2f' },
  { label: 'Water', value: 62, color: '#249ce6' },
  { label: 'Earth', value: 70, color: '#2daf62' },
  { label: 'Air', value: 64, color: '#55bc56' },
  { label: 'Sound', value: 88, color: '#8d20ef' },
];

const PROTOCOL_PROGRESS = { currentTrack: 15, totalTracks: 27, percentage: 55 };
const CORE_MODEL = '/ui/reclamation/Module_Cards/Sovereign/flamecore.glb';

class CoreErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function PrometheanModel({ intensity }) {
  const model = useRef();
  const { scene } = useGLTF(CORE_MODEL);

  useFrame((state, delta) => {
    if (!model.current) return;
    model.current.rotation.y += delta * (0.2 + intensity * 0.34);
    model.current.position.y = Math.sin(state.clock.elapsedTime * 1.35) * 0.025;
  });

  return <primitive ref={model} object={scene} />;
}

useGLTF.preload(CORE_MODEL);

function getCircularOffset(index, activeIndex, length) {
  let offset = index - activeIndex;
  const midpoint = Math.floor(length / 2);

  if (offset > midpoint) offset -= length;
  if (offset < -midpoint) offset += length;

  return offset;
}

function ModuleCard({ module, offset, index, depthPass, onSelect }) {
  const distance = Math.abs(offset);
  const isNearSide = distance <= 1;
  const isVisible = depthPass === 'front' ? isNearSide : !isNearSide;

  return (
    <button
      type="button"
      className={`sos-module-card sos-module-card--${depthPass} ${offset === 0 ? 'is-active' : ''} ${isVisible ? 'is-pass-visible' : ''}`}
      data-module-index={index}
      data-offset={offset}
      style={{ '--card-order': 20 - distance }}
      onClick={onSelect}
      aria-label={offset === 0 ? `Enter ${module.title}` : `Select ${module.title}`}
      aria-current={offset === 0 ? 'true' : undefined}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      <span className="sos-card-shell">
        <span className="sos-card-corner sos-card-corner--tl" aria-hidden="true" />
        <span className="sos-card-corner sos-card-corner--tr" aria-hidden="true" />
        <img className="sos-card-art" src={module.card} alt={`${module.title} module card`} />
        <span className="sos-card-scanline" aria-hidden="true" />
      </span>
    </button>
  );
}

function HudPanel({ title, children, className = '' }) {
  return (
    <section className={`sos-hud-panel ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function SelfDirectedSovereignMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [interactionIntensity, setInteractionIntensity] = useState(0);
  const settleTimer = useRef();

  const activeModule = MODULES[activeIndex];
  const userName = user?.name || user?.email?.split('@')[0] || 'Supabase';

  const cards = useMemo(
    () =>
      MODULES.map((module, index) => ({
        module,
        index,
        offset: getCircularOffset(index, activeIndex, MODULES.length),
      })),
    [activeIndex],
  );

  const animateSelection = useCallback(() => {
    window.clearTimeout(settleTimer.current);
    setIsRotating(true);
    setInteractionIntensity(1);
    settleTimer.current = window.setTimeout(() => {
      setIsRotating(false);
      setInteractionIntensity(0);
    }, 620);
  }, []);

  const selectModule = useCallback((index) => {
    animateSelection();
    setActiveIndex((index + MODULES.length) % MODULES.length);
  }, [animateSelection]);

  const rotate = useCallback((direction) => {
    animateSelection();
    setActiveIndex((current) => (current + direction + MODULES.length) % MODULES.length);
  }, [animateSelection]);

  const handlePointerMove = useCallback((event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    event.currentTarget.style.setProperty('--parallax-x', x.toFixed(3));
    event.currentTarget.style.setProperty('--parallax-y', y.toFixed(3));
  }, []);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const resetParallax = useCallback((event) => {
    event.currentTarget.style.setProperty('--parallax-x', 0);
    event.currentTarget.style.setProperty('--parallax-y', 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      if (event.key === 'ArrowLeft') rotate(-1);
      if (event.key === 'ArrowRight') rotate(1);
      if (event.key === 'Enter') navigate(activeModule.route);
      if (event.key === '+' || event.key === '=') setZoom((value) => Math.min(1.16, value + 0.08));
      if (event.key === '-') setZoom((value) => Math.max(0.84, value - 0.08));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModule.route, navigate, rotate]);

  return (
    <main
      className={`sos-page ${isRotating ? 'is-rotating' : ''}`}
      style={{ '--deck-zoom': zoom, '--core-intensity': interactionIntensity, '--parallax-x': 0, '--parallax-y': 0 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetParallax}
    >
      <div className="sos-chamber" aria-hidden="true" />
      <div className="sos-atmosphere" aria-hidden="true" />
      <div className="sos-architecture" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="sos-orbital-rings" aria-hidden="true" />
      <div className="sos-vignette" aria-hidden="true" />

      <header className="sos-header">
        <button type="button" className="sos-brand-block" onClick={() => navigate('/acts')} aria-label="Back to all Acts">
          <img src="/emblem/reclamation_core_emblem.png" alt="" />
          <div>
            <strong>The Chroma Key Protocol</strong>
            <span>Reclamation Mainframe</span>
            <span>Sovereign Mode</span>
          </div>
        </button>

        <div className="sos-system-status" role="status"><i aria-hidden="true" /> System Status: Operational</div>

        <div className="sos-user-block">
          <div>
            <strong><span>User:</span> {userName}</strong>
            <span>Clearance: ECP Level {user?.level || 7}</span>
          </div>
          <img src="/emblem/reclamation_core_emblem.png" alt="" />
        </div>
      </header>

      <div className="sos-operating-stage sos-operating-stage--rear">
        <div className="sos-card-deck sos-card-deck--rear">
          {cards.map(({ module, index, offset }) => (
            <ModuleCard
              key={`rear-${module.id}`}
              module={module}
              index={index}
              offset={offset}
              depthPass="rear"
              onSelect={() => selectModule(index)}
            />
          ))}
        </div>
      </div>

      <section className="sos-operating-stage sos-operating-stage--front" aria-label="Sovereign Mode orbital operating system">
        <button
          type="button"
          className="sos-stage-arrow sos-stage-arrow--left"
          onClick={() => rotate(-1)}
          aria-label="Rotate modules left"
        >
          <ChevronLeft />
        </button>

        <div className="sos-card-deck">
          {cards.map(({ module, index, offset }) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              offset={offset}
              depthPass="front"
              onSelect={() => {
                if (offset === 0) {
                  navigate(module.route);
                  return;
                }
                selectModule(index);
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="sos-stage-arrow sos-stage-arrow--right"
          onClick={() => rotate(1)}
          aria-label="Rotate modules right"
        >
          <ChevronRight />
        </button>
      </section>

      <section className="sos-promethean-core" aria-label="Promethean Core energy output 93 percent">
        <div className="sos-alignment-beam" aria-hidden="true" />
        <div className="sos-core-machine" aria-hidden="true">
          <div className="sos-core-canvas">
            <CoreErrorBoundary>
              <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.25, 4], fov: 34 }} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={0.75} />
                <pointLight position={[0, 1.5, 2]} color="#ff382d" intensity={4 + interactionIntensity * 2.5} distance={8} />
                <pointLight position={[-2, 0, -1]} color="#8d0b08" intensity={2} distance={6} />
                <Suspense fallback={null}>
                  <Bounds fit clip observe margin={1.18}><PrometheanModel intensity={interactionIntensity} /></Bounds>
                </Suspense>
              </Canvas>
            </CoreErrorBoundary>
          </div>
          <i className="sos-core-ring sos-core-ring--outer" />
          <i className="sos-core-ring sos-core-ring--inner" />
        </div>
        <div className="sos-core-readout"><span>Promethean Core</span><div><small>Energy Output</small><i><b /></i><strong>93%</strong></div></div>
      </section>

      <aside className="sos-left-hud" aria-label="Active light code">
        <HudPanel title="Active Light Code" className="sos-light-code" key={activeModule.id}>
          <div className="sos-light-code-body">
            <span className="sos-code-emblem"><Diamond aria-hidden="true" /><i>{activeModule.code}</i></span>
            <div>
              <strong>{activeModule.lightCode}</strong>
              <span>Code: {activeModule.code}-777-A</span>
            </div>
          </div>
          <p>Sync Status</p>
          <b><Radio aria-hidden="true" /> Synchronized</b>
        </HudPanel>
      </aside>

      <aside className="sos-right-hud" aria-label="Protocol telemetry">
        <HudPanel title="Protocol Progress" className="sos-protocol-progress">
          <span>Track {PROTOCOL_PROGRESS.currentTrack} of {PROTOCOL_PROGRESS.totalTracks}</span>
          <div className="sos-progress">
            <i style={{ '--progress': `${PROTOCOL_PROGRESS.percentage}%` }} />
          </div>
          <strong>{PROTOCOL_PROGRESS.percentage}%</strong>
        </HudPanel>

        <HudPanel title="Element Balance">
          <div className="sos-elements">
            {ELEMENT_LEVELS.map((element) => (
              <div key={element.label} style={{ '--element-value': `${element.value}%`, '--element-color': element.color }}>
                <Diamond aria-hidden="true" />
                <span>{element.label}</span>
                <i>
                  <b />
                </i>
                <strong>{element.value}%</strong>
              </div>
            ))}
          </div>
        </HudPanel>
      </aside>

      <nav className="sos-control-rail" aria-label="Sovereign Mode controls">
        <button type="button" onClick={() => selectModule(2)}>
          <CircleGauge aria-hidden="true" />
          System Overview
        </button>

        <div className="sos-orbital-controls">
          <span><Orbit aria-hidden="true" /> Orbital Controls</span>
          <div>
            <button type="button" onClick={() => rotate(-1)} aria-label="Rotate left"><ChevronLeft /></button>
            <strong>Rotate</strong>
            <button type="button" onClick={() => rotate(1)} aria-label="Rotate right"><ChevronRight /></button>
          </div>
        </div>

        <button type="button" className="sos-core-button" onClick={() => selectModule(2)} aria-label="Center on Reclamation University">
          <img src="/emblem/reclamation_core_emblem.png" alt="" />
        </button>

        <div className="sos-zoom-controls">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.84, value - 0.08))}
            aria-label="Zoom out"
          >
            <Minus />
          </button>
          <strong>Zoom</strong>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.16, value + 0.08))}
            aria-label="Zoom in"
          >
            <Plus />
          </button>
        </div>

        <button type="button" className="sos-enter-module" onClick={() => navigate(activeModule.route)} aria-label={`Enter ${activeModule.title}`}>
          Enter Module
          <ChevronRight aria-hidden="true" />
        </button>
      </nav>
    </main>
  );
}
