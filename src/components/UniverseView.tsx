import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Html, Text, Trail } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Rocket, Zap, Globe, Compass, ArrowRight } from 'lucide-react';
import * as THREE from 'three';

interface PlanetData {
  id: string;
  name: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  description: string;
}

const PLANETS: PlanetData[] = [
  { id: 'mercury', name: 'Mercury', color: '#9ca3af', size: 0.4, distance: 4, speed: 0.04, description: 'The smallest and innermost planet in the Solar System.' },
  { id: 'venus', name: 'Venus', color: '#fbbf24', size: 0.9, distance: 7, speed: 0.015, description: 'The second planet from the Sun, with a thick toxic atmosphere.' },
  { id: 'earth', name: 'Earth', color: '#3b82f6', size: 1, distance: 10, speed: 0.01, description: 'Our home planet, the only known world to harbor life.' },
  { id: 'mars', name: 'Mars', color: '#ef4444', size: 0.5, distance: 14, speed: 0.008, description: 'The Red Planet, home to the largest volcano in the solar system.' },
  { id: 'jupiter', name: 'Jupiter', color: '#f59e0b', size: 2.5, distance: 20, speed: 0.004, description: 'The largest planet in our solar system, a gas giant.' },
  { id: 'saturn', name: 'Saturn', color: '#eab308', size: 2.1, distance: 28, speed: 0.002, description: 'Famous for its spectacular ring system.' },
];

function Planet({ data, onSelect, isSelected }: { data: PlanetData, onSelect: () => void, isSelected: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbitRef.current) {
      orbitRef.current.rotation.y = t * data.speed;
    }
    if (ref.current) {
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={orbitRef}>
      <group position={[data.distance, 0, 0]}>
        <Trail width={1} length={10} color={data.color} attenuation={(t) => t * t}>
          <mesh 
            ref={ref} 
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          >
            <sphereGeometry args={[data.size, 32, 32]} />
            <meshStandardMaterial 
              color={data.color} 
              emissive={data.color} 
              emissiveIntensity={isSelected ? 1 : 0.2} 
            />
          </mesh>
        </Trail>
        
        <Html distanceFactor={15}>
          <div className={`transition-all duration-500 ${isSelected ? 'scale-125' : 'opacity-40 hover:opacity-100'}`}>
            <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
              {data.name}
            </div>
          </div>
        </Html>
      </group>
      
      {/* Orbit Path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[data.distance - 0.05, data.distance + 0.05, 128]} />
        <meshBasicMaterial color="white" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function UniverseView({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#020205] overflow-hidden"
        >
          {/* 3D Scene */}
          <div className="absolute inset-0">
            <Canvas shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[0, 20, 40]} fov={50} />
              <Suspense fallback={null}>
                <ambientLight intensity={0.2} />
                <pointLight position={[0, 0, 0]} intensity={5} color="#f59e0b" />
                
                {/* Sun */}
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                  <mesh>
                    <sphereGeometry args={[2, 64, 64]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2} />
                  </mesh>
                </Float>

                {PLANETS.map(p => (
                  <Planet 
                    key={p.id} 
                    data={p} 
                    onSelect={() => setSelectedPlanet(p)} 
                    isSelected={selectedPlanet?.id === p.id}
                  />
                ))}

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              </Suspense>
              <OrbitControls enablePan={false} minDistance={10} maxDistance={100} />
            </Canvas>
          </div>

          {/* UI Overlay */}
          <div className="absolute top-8 left-8 z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <Compass className="text-[#8b5cf6]" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Universe Navigator</h2>
                <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Interactive Solar System</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-8 right-8 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl text-white transition-all"
          >
            <X size={24} />
          </button>

          {/* Planet Info Card */}
          <AnimatePresence>
            {selectedPlanet && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-96 z-10"
              >
                <div className="glass-panel p-10 rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedPlanet.color }} />
                    <h3 className="text-4xl font-display font-bold text-white">{selectedPlanet.name}</h3>
                  </div>
                  
                  <p className="text-white/60 leading-relaxed mb-10 font-light">
                    {selectedPlanet.description}
                  </p>

                  <div className="space-y-6 mb-10">
                    <InfoRow label="Distance from Sun" value={`${selectedPlanet.distance * 10}M km`} />
                    <InfoRow label="Orbital Velocity" value={`${(selectedPlanet.speed * 1000).toFixed(1)} km/s`} />
                    <InfoRow label="Surface Temp" value="Variable" />
                  </div>

                  <button className="w-full py-4 rounded-2xl bg-[#8b5cf6] text-white font-bold hover:bg-[#7c3aed] transition-all flex items-center justify-center gap-2 group">
                    Launch Surface Mission
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
            Click a planet to explore • Drag to rotate • Scroll to zoom
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
