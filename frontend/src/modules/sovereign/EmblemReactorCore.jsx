// src/modules/sovereign/EmblemReactorCore.jsx
import { Component, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import { Color } from 'three';

const REACTOR_FALLBACK = '/media/visualizer/audio-reactive-healthy-frequency-sun.svg';
const REACTOR_MODEL = '/media/visualizer/texturized-new.optimized.glb';

class ReactorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('The 3D reactor could not load; using the static reactor.', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}


function EmblemMesh({ frequencyData, audioLevel, tint }) {
  const groupRef = useRef();
  const materialRefs = useRef([]);
  const { scene } = useGLTF(REACTOR_MODEL);
  const reactor = useMemo(() => {
    const clone = scene.clone(true);
    let meshCount = 0;
    const materials = [];
    const tintColor = tint ? new Color(tint) : null;

    materialRefs.current = [];
    clone.traverse((child) => {
      if (!child.isMesh) return;
      meshCount += 1;
      const sourceMaterials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      const clonedMaterials = sourceMaterials.map((material) => {
        const clonedMaterial = material.clone();
        clonedMaterial.transparent = true;
        clonedMaterial.alphaTest = 0.08;
        clonedMaterial.depthWrite = false;
        if (tintColor) {
          if (clonedMaterial.color) clonedMaterial.color.lerp(tintColor, 0.55);
          if (clonedMaterial.emissive) clonedMaterial.emissive.lerp(tintColor, 0.4);
        }
        clonedMaterial.needsUpdate = true;
        materials.push(clonedMaterial);
        return clonedMaterial;
      });
      child.material = Array.isArray(child.material)
        ? clonedMaterials
        : clonedMaterials[0];
      child.frustumCulled = false;
    });

    if (!meshCount) throw new Error('The reactor GLB does not contain a mesh.');
    materialRefs.current = materials;
    return clone;
  }, [scene, tint]);

  useFrame((_, delta) => {
    const data = frequencyData || [];
    const bassEnd = Math.floor(data.length * 0.12) || 1;
    let bass = 0;
    for (let i = 0; i < bassEnd; i++) bass += data[i] || 0;
    bass = bass / (bassEnd * 255) || 0;
    const midStart = bassEnd;
    const midEnd = Math.max(midStart + 1, Math.floor(data.length * .55));
    let mid = 0;
    for (let i = midStart; i < midEnd; i++) mid += data[i] || 0;
    mid = mid / (Math.max(1, midEnd - midStart) * 255) || 0;
    let treble = 0;
    for (let i = midEnd; i < data.length; i++) treble += data[i] || 0;
    treble = treble / (Math.max(1, data.length - midEnd) * 255) || 0;

    if (groupRef.current) {
      const energy = Math.min(1, Math.max(bass, audioLevel / 72));
      const targetScale = 1 + energy * 0.24;
      const nextScale = groupRef.current.scale.x
        + (targetScale - groupRef.current.scale.x) * Math.min(1, delta * 10);
      groupRef.current.scale.setScalar(nextScale);
      const targetTilt = (treble - .12) * .045;
      groupRef.current.rotation.z += (targetTilt - groupRef.current.rotation.z) * Math.min(1, delta * 7);
      groupRef.current.rotation.y += ((mid - .12) * .12 - groupRef.current.rotation.y) * Math.min(1, delta * 5);
      groupRef.current.position.y += ((bass - .12) * .09 - groupRef.current.position.y) * Math.min(1, delta * 8);
    }
    materialRefs.current.forEach((material) => {
      material.opacity = .78 + Math.min(1, bass + mid) * .22;
    });
  });


  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={reactor} />
      </Center>
    </group>
  );
}

function ReactiveSceneLights({ frequencyData, audioLevel, ambientColor, keyColor, fillColor }) {
  const ambientRef = useRef();
  const keyRef = useRef();
  const fillRef = useRef();

  useFrame((_, delta) => {
    const data = frequencyData || [];
    const average = (start, end) => {
      let total = 0;
      for (let index = start; index < end; index += 1) total += data[index] || 0;
      return total / Math.max(1, end - start) / 255;
    };
    const bassEnd = Math.max(1, Math.floor(data.length * .14));
    const midEnd = Math.max(bassEnd + 1, Math.floor(data.length * .55));
    const bass = data.length ? average(0, bassEnd) : audioLevel / 100;
    const mid = data.length ? average(bassEnd, midEnd) : 0;
    const smoothing = Math.min(1, delta * 6);

    if (ambientRef.current) {
      ambientRef.current.intensity += (.9 + mid * 1.25 - ambientRef.current.intensity) * smoothing;
    }
    if (keyRef.current) {
      keyRef.current.intensity += (.85 + bass * 3.2 - keyRef.current.intensity) * smoothing;
    }
    if (fillRef.current) {
      fillRef.current.intensity += (.25 + mid * 2.2 - fillRef.current.intensity) * smoothing;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1.05} color={ambientColor || '#fff7ed'} />
      <pointLight ref={keyRef} position={[2, 2, 3]} intensity={1} color={keyColor || '#fff7ed'} />
      <pointLight ref={fillRef} position={[-2, -1, 2]} intensity={.4} color={fillColor || '#ffd7b5'} />
    </>
  );
}

export default function EmblemReactorCore({ frequencyData, audioLevel, tint, ambientColor, keyColor, fillColor }) {
  return (
    <ReactorErrorBoundary
      fallback={<img src={REACTOR_FALLBACK} alt="Musiq Matrix Reclamation frequency reactor" />}
    >
      <Canvas camera={{ position: [0, 0, 2.7], fov: 45 }} gl={{ alpha: true, antialias: true }} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <ReactiveSceneLights
          frequencyData={frequencyData}
          audioLevel={audioLevel}
          ambientColor={ambientColor}
          keyColor={keyColor}
          fillColor={fillColor}
        />
        <EmblemMesh frequencyData={frequencyData} audioLevel={audioLevel} tint={tint} />
      </Canvas>
    </ReactorErrorBoundary>
  );
}
