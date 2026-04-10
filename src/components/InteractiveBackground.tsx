import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Stars, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';

function Galaxy({ lowPerf }: { lowPerf: boolean }) {
  const ref = useRef<THREE.Points>(null);
  
  // Generate particles for the galaxy
  const particles = useMemo(() => {
    const count = lowPerf ? 1500 : 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 20;
      const spin = radius * 5;
      const angle = Math.random() * Math.PI * 2;
      
      const x = Math.cos(angle + spin) * radius + (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 1;
      const z = Math.sin(angle + spin) * radius + (Math.random() - 0.5) * 2;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      const mixedColor = new THREE.Color('#8b5cf6').lerp(new THREE.Color('#3b82f6'), Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    
    return { positions, colors };
  }, [lowPerf]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.001;
      // Mouse interaction - skip on mobile/low perf for smoothness
      if (!lowPerf) {
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, state.mouse.y * 0.2, 0.1);
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, -state.mouse.x * 0.2, 0.1);
      }
    }
  });

  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      <Points ref={ref} positions={particles.positions} colors={particles.colors}>
        <PointMaterial
          transparent
          vertexColors
          size={lowPerf ? 0.08 : 0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function InteractiveBackground() {
  const [lowPerf, setLowPerf] = useState(false);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) setLowPerf(true);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#05050a]">
      <Canvas 
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={lowPerf ? [1, 1] : [1, 2]}
        gl={{ antialias: !lowPerf }}
      >
        <ambientLight intensity={0.5} />
        <Galaxy lowPerf={lowPerf} />
        <Stars radius={100} depth={50} count={lowPerf ? 1000 : 5000} factor={4} saturation={0} fade speed={1} />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
