import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, AlertTriangle, RotateCcw, Play, Camera, Share2, Info, Sparkles, Flame, Skull } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Html, Text, useTexture, Trail } from '@react-three/drei';
import * as THREE from 'three';

function Earth({ impactProgress }: { impactProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      if (impactProgress > 0) {
        meshRef.current.rotation.y += impactProgress * 0.1;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial 
        color={impactProgress > 0.5 ? '#ff4500' : '#3b82f6'} 
        emissive={impactProgress > 0.5 ? '#ff0000' : '#000000'}
        emissiveIntensity={impactProgress * 2}
        wireframe={impactProgress > 0.8}
      />
    </mesh>
  );
}

function Asteroid({ progress, onImpact }: { progress: number, onImpact: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const impactTriggered = useRef(false);

  useFrame(() => {
    if (ref.current) {
      const z = 10 - progress * 10;
      ref.current.position.set(0, 0, z);
      ref.current.rotation.x += 0.05;
      ref.current.rotation.y += 0.05;

      if (z < 1.6 && !impactTriggered.current) {
        impactTriggered.current = true;
        onImpact();
      }
    }
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#444" />
      <pointLight intensity={2} color="#ffaa00" />
    </mesh>
  );
}

function ImpactParticles({ impacted }: { impacted: boolean }) {
  const count = 500;
  const meshRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Start at origin
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 1.5; // Surface of Earth
      
      // Random velocity vector (mostly outwards)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.05 + Math.random() * 0.2;
      
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;

      // Fire colors
      colors[i * 3] = 1; // R
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.5; // G
      colors[i * 3 + 2] = 0; // B
    }
    return { positions, velocities, colors };
  }, []);

  useFrame(() => {
    if (meshRef.current && impacted) {
      const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += particles.velocities[i * 3];
        pos[i * 3 + 1] += particles.velocities[i * 3 + 1];
        pos[i * 3 + 2] += particles.velocities[i * 3 + 2];
        
        // Add gravity-like pull back to center or just let them fly
        particles.velocities[i * 3] *= 0.98;
        particles.velocities[i * 3 + 1] *= 0.98;
        particles.velocities[i * 3 + 2] *= 0.98;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (!impacted) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function FireRing({ impacted }: { impacted: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current && impacted) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 10) * 0.1;
      ref.current.scale.set(s, s, s);
      ref.current.rotation.z += 0.05;
    }
  });

  if (!impacted) return null;

  return (
    <mesh ref={ref} position={[0, 0, 1.51]} rotation={[0, 0, 0]}>
      <ringGeometry args={[0.1, 0.8, 32]} />
      <meshBasicMaterial color="#ff4500" transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export default function DestroyEarthExperience({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [impacted, setImpacted] = useState(false);
  const [logs, setLogs] = useState<string[]>(['System Ready. Targeting Earth coordinates.']);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (isSimulating && progress < 1) {
      const interval = setInterval(() => {
        setProgress(p => Math.min(1, p + 0.005));
      }, 16);
      return () => clearInterval(interval);
    }
  }, [isSimulating, progress]);

  const handleImpact = () => {
    setImpacted(true);
    addLog('IMPACT DETECTED. Crustal displacement initiated.');
    addLog('Atmospheric ignition confirmed.');
  };

  const reset = () => {
    setIsSimulating(false);
    setProgress(0);
    setImpacted(false);
    setLogs(['System Reset. Target re-acquired.']);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl h-[80vh] bg-[#05050a] rounded-[2.5rem] border border-red-500/20 overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Simulation Area */}
            <div className="flex-1 relative bg-black">
              <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <OrbitControls enableZoom={false} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                
                <Suspense fallback={null}>
                  <Earth impactProgress={impacted ? 1 : progress} />
                  {isSimulating && !impacted && (
                    <Asteroid progress={progress} onImpact={handleImpact} />
                  )}
                  <ImpactParticles impacted={impacted} />
                  <FireRing impacted={impacted} />
                  {impacted && (
                    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
                      <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[1.6, 32, 32]} />
                        <meshBasicMaterial color="#ff4500" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
                      </mesh>
                    </Float>
                  )}
                </Suspense>
              </Canvas>

              {/* HUD Overlays */}
              <div className="absolute top-8 left-8 space-y-4 pointer-events-none">
                <div className="glass-panel p-4 rounded-2xl border border-red-500/20 min-w-[200px] bg-red-950/10">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Threat Level: Extreme</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Target</span>
                      <span className="text-sm font-bold text-white uppercase">Earth-01</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Velocity</span>
                      <span className="text-sm font-mono font-bold text-red-400">{(progress * 45000).toFixed(0)} km/h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Integrity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ width: `${(1 - (impacted ? 1 : progress)) * 100}%` }}
                            className="h-full bg-red-500"
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white">{Math.ceil((1 - (impacted ? 1 : progress)) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-white/10 min-w-[200px] h-32 overflow-hidden">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Tactical Log</div>
                  <div className="space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className={`text-[10px] font-mono ${i === 0 ? 'text-red-400' : 'text-white/30'}`}>
                        [{new Date().toLocaleTimeString([], { hour12: false })}] {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning Text */}
              {impacted && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="text-center">
                    <h2 className="text-6xl font-display font-bold text-red-500 mb-2 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">EXTINCTION</h2>
                    <p className="text-white/40 uppercase tracking-[0.5em] text-sm">Event Confirmed</p>
                  </div>
                </motion.div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-8 left-8 flex gap-3">
                <button onClick={reset} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={() => { setIsSimulating(true); addLog('Asteroid deployed. Intercept in T-15s.'); }}
                  disabled={isSimulating}
                  className="px-8 py-4 rounded-2xl bg-red-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  <Flame size={18} /> Initiate Impact
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-96 border-l border-white/10 p-8 flex flex-col gap-8 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-2xl text-red-500">Cataclysm</h3>
                  <p className="text-xs text-white/40 mt-1">Planetary Destruction Engine</p>
                </div>
                <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Simulation Parameters</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                      <Skull size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Asteroid Impact</div>
                      <div className="text-[10px] text-white/40">10km Diameter Chondrite</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Gamma Ray Burst</div>
                      <div className="text-[10px] text-white/40">Atmospheric Stripping Mode</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                  <Camera size={20} /> Record Extinction
                </button>
                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                  <Share2 size={20} /> Share Event
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3">
                <Info size={16} className="text-red-400 shrink-0" />
                <p className="text-[10px] text-red-400 leading-relaxed">
                  <strong>Warning:</strong> This simulation represents a hypothetical extinction-level event. All data is based on astrophysical impact models.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
