import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

export default function HeroPlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [lowPerf, setLowPerf] = useState(false);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) setLowPerf(true);
  }, []);

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.005;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002;
    }
  });

  return (
    <group scale={1.5}>
      <Float speed={lowPerf ? 1 : 2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere ref={planetRef} args={[1, lowPerf ? 32 : 64, lowPerf ? 32 : 64]}>
          <MeshDistortMaterial
            color="#8b5cf6"
            attach="material"
            distort={lowPerf ? 0.1 : 0.3}
            speed={lowPerf ? 1 : 2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
        
        {/* Atmosphere glow - simplified for low perf */}
        {!lowPerf && (
          <Sphere args={[1.1, 32, 32]}>
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.1} wireframe />
          </Sphere>
        )}

        {/* Saturn-like ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[1.8, 0.02, lowPerf ? 8 : 16, lowPerf ? 50 : 100]} />
          <meshStandardMaterial color="#a78bfa" transparent opacity={0.5} emissive="#8b5cf6" emissiveIntensity={lowPerf ? 1 : 2} />
        </mesh>
      </Float>
      
      <pointLight position={[5, 5, 5]} intensity={lowPerf ? 1 : 2} color="#8b5cf6" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#3b82f6" />
    </group>
  );
}
