import { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Float, 
  Stars, 
  Html, 
  useTexture,
  PointMaterial,
  Points,
  Grid
} from '@react-three/drei';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { X, Info, Zap, Camera, Eye, Volume2, Maximize2, Sparkles, AlertTriangle, Grid3X3, Play, Activity, Sun } from 'lucide-react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, Bloom as BloomEffect } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

function PhotonSimulation({ gravity, simSpeed, lightAngle, photonOrbitMode }: { gravity: number, simSpeed: number, lightAngle: number, photonOrbitMode: boolean }) {
  const [photons, setPhotons] = useState<{ pos: THREE.Vector3, vel: THREE.Vector3, path: THREE.Vector3[] }[]>([]);
  const lastSpawn = useRef(0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Spawn new photons
    if (t - lastSpawn.current > 0.2 / simSpeed && !photonOrbitMode) {
      const angle = (lightAngle * Math.PI) / 180;
      const startPos = new THREE.Vector3(-15, Math.sin(angle) * 10, Math.cos(angle) * 5);
      const startVel = new THREE.Vector3(1, 0, 0).multiplyScalar(0.2 * simSpeed);
      
      setPhotons(prev => [...prev.slice(-20), { pos: startPos, vel: startVel, path: [startPos.clone()] }]);
      lastSpawn.current = t;
    }

    if (photonOrbitMode && photons.length === 0) {
      // Spawn orbiting photons
      const orbitPhotons = Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        const r = 2.25; // Photon sphere
        const pos = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
        const vel = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.1 * simSpeed);
        return { pos, vel, path: [pos.clone()] };
      });
      setPhotons(orbitPhotons);
    }

    // Update existing photons
    setPhotons(prev => prev.map(p => {
      const newPos = p.pos.clone().add(p.vel);
      const distSq = newPos.lengthSq();
      
      // Gravitational pull (simplified GR bending)
      const force = new THREE.Vector3().copy(newPos).normalize().multiplyScalar(-0.05 * gravity * simSpeed / distSq);
      const newVel = p.vel.clone().add(force);
      
      // Keep speed of light constant
      newVel.normalize().multiplyScalar(p.vel.length());

      const newPath = [...p.path.slice(-50), newPos.clone()];
      
      return { pos: newPos, vel: newVel, path: newPath };
    }).filter(p => p.pos.length() < 30 && p.pos.length() > 1.5));
  });

  return (
    <group>
      {photons.map((p, i) => (
        <group key={i}>
          <mesh position={p.pos}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#7afcff" />
          </mesh>
          <line>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                count={p.path.length}
                array={new Float32Array(p.path.flatMap(v => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#0ea5e9" transparent opacity={0.5} />
          </line>
        </group>
      ))}
    </group>
  );
}

function BlackHole({ gravity, showGrid, isCrossing, relativityMode, simSpeed, lightAngle, photonOrbitMode }: { gravity: number, showGrid: boolean, isCrossing: boolean, relativityMode: boolean, simSpeed: number, lightAngle: number, photonOrbitMode: boolean }) {
  const diskRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (diskRef.current) {
      diskRef.current.rotation.z += 0.01 * gravity;
      diskRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.02);
    }
    if (coreRef.current) {
      coreRef.current.scale.setScalar(isCrossing ? 1 + t * 0.5 : 1);
    }
  });

  return (
    <group>
      {/* The Singularity / Event Horizon Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Accretion Disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.8, 5, 128]} />
        <meshStandardMaterial 
          color="#ff4e00" 
          emissive="#ff4e00" 
          emissiveIntensity={5} 
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Secondary Glow Ring (Photon Sphere) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.05, 16, 100]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.5} />
      </mesh>

      {/* Space-Time Grid */}
      {showGrid && (
        <group ref={gridRef} rotation={[Math.PI / 2, 0, 0]}>
          <Grid 
            args={[20, 20]} 
            sectionColor="#3b82f6" 
            cellColor="#1d4ed8" 
            sectionThickness={1} 
            cellThickness={0.5} 
            infiniteGrid 
            fadeDistance={30}
          />
        </group>
      )}

      {/* Relativity Mode: Light Bending */}
      {relativityMode && (
        <PhotonSimulation 
          gravity={gravity} 
          simSpeed={simSpeed} 
          lightAngle={lightAngle} 
          photonOrbitMode={photonOrbitMode} 
        />
      )}

      {/* Gravitational Lensing Simulation (Simplified with light points) */}
      <Stars radius={50} depth={50} count={2000} factor={10} saturation={0} fade speed={1} />
    </group>
  );
}

function DistortionEffect({ intensity }: { intensity: number }) {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.1} intensity={1.5} radius={0.4} />
      <ChromaticAberration 
        blendFunction={BlendFunction.NORMAL} 
        offset={new THREE.Vector2(0.005 * intensity, 0.005 * intensity)} 
      />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
      <Noise opacity={0.05} />
    </EffectComposer>
  );
}

export default function EventHorizonExperience({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [gravity, setGravity] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isCrossing, setIsCrossing] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [isSpaghettified, setIsSpaghettified] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  
  // Relativity Mode States
  const [relativityMode, setRelativityMode] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [lightAngle, setLightAngle] = useState(0);
  const [photonOrbitMode, setPhotonOrbitMode] = useState(false);
  const [showEdu, setShowEdu] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setEntryComplete(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setEntryComplete(false);
      setIsCrossing(false);
      setIsSpaghettified(false);
    }
  }, [isOpen]);

  const handleCross = () => {
    if (safeMode) return;
    setIsCrossing(true);
    setTimeout(() => setIsSpaghettified(true), 2000);
    setTimeout(() => {
      onClose();
      // Reset state for next time
      setIsCrossing(false);
      setIsSpaghettified(false);
    }, 6000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black overflow-hidden"
        >
          {/* Entry Hook Moment */}
          {!entryComplete && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1, delay: 2 }}
              className="absolute inset-0 z-[110] bg-black flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 1.5 }}
                  className="mb-4"
                >
                  <AlertTriangle size={64} className="text-orange-500 mx-auto mb-6 animate-pulse" />
                  <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-white">
                    Approaching Event Horizon
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-orange-500/60 tracking-[0.4em] uppercase text-xs font-bold"
                >
                  Gravitational Lensing Detected
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Spaghettification Overlay */}
          <AnimatePresence>
            {isSpaghettified && (
              <motion.div
                initial={{ opacity: 0, scaleY: 1 }}
                animate={{ opacity: 1, scaleY: 10 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-black flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent blur-sm" />
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-20 text-white font-mono text-xl tracking-[1em] uppercase"
                >
                  No data can return
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Scene */}
          <div className="absolute inset-0">
            <Canvas shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
              <Suspense fallback={null}>
                <BlackHole 
                  gravity={gravity} 
                  showGrid={showGrid} 
                  isCrossing={isCrossing} 
                  relativityMode={relativityMode}
                  simSpeed={simSpeed}
                  lightAngle={lightAngle}
                  photonOrbitMode={photonOrbitMode}
                />
                <DistortionEffect intensity={gravity + (isCrossing ? 5 : 0)} />
              </Suspense>
              <OrbitControls 
                enablePan={false} 
                minDistance={5} 
                maxDistance={25} 
                autoRotate={!isCrossing} 
                autoRotateSpeed={0.2} 
              />
            </Canvas>
          </div>

          {/* Educational Overlay */}
          <AnimatePresence>
            {showEdu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[115] w-full max-w-lg p-8 rounded-3xl bg-blue-900/40 backdrop-blur-3xl border border-blue-400/30 text-center"
              >
                <h3 className="text-2xl font-display font-bold text-white mb-4">Space-Time Curvature</h3>
                <p className="text-blue-100/80 leading-relaxed mb-6">
                  According to General Relativity, gravity is not a force but the curvature of spacetime. 
                  Light follows this curvature, causing it to bend near massive objects. 
                  In extreme cases, light can even be trapped in circular orbits called the photon sphere.
                </p>
                <button 
                  onClick={() => setShowEdu(false)}
                  className="px-6 py-2 rounded-full bg-blue-500 text-white font-bold text-sm"
                >
                  Understood
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* UI Controls - Top Right */}
          <div className="absolute top-8 right-8 flex flex-col gap-4 z-[105]">
            <button 
              onClick={onClose}
              className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl text-white transition-all group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Relativity Controls - Right */}
          <AnimatePresence>
            {relativityMode && !isCrossing && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-72 z-[105] space-y-4"
              >
                <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl">
                  <h3 className="text-xs font-bold text-[#7afcff] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={14} />
                    Relativity Controls
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <span>Light Angle</span>
                        <span>{lightAngle}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="-45" 
                        max="45" 
                        value={lightAngle}
                        onChange={(e) => setLightAngle(parseInt(e.target.value))}
                        className="w-full accent-[#7afcff]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <span>Sim Speed</span>
                        <span>{simSpeed}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.1"
                        value={simSpeed}
                        onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                        className="w-full accent-[#7afcff]"
                      />
                    </div>

                    <button
                      onClick={() => setPhotonOrbitMode(!photonOrbitMode)}
                      className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        photonOrbitMode 
                          ? 'bg-[#7afcff] text-black border-transparent' 
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Photon Orbit Mode
                    </button>

                    <button
                      onClick={() => setShowEdu(true)}
                      className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/30 transition-all"
                    >
                      Educational Overlay
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Panel - Left */}
          <AnimatePresence>
            {showInfo && !isCrossing && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-80 z-[105]"
              >
                <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                      <AlertTriangle size={20} className="text-orange-500" />
                    </div>
                    <h2 className="font-display font-bold text-xl">Event Horizon</h2>
                  </div>

                  <div className="space-y-6">
                    <InfoItem label="Type" value="Black Hole Boundary" delay={0.1} />
                    <InfoItem label="Definition" value="Point of no return" delay={0.2} />
                    <InfoItem label="Escape Velocity" value="> Speed of Light" delay={0.3} />
                    <InfoItem label="Effect" value="Time Dilation" delay={0.4} />
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-xs text-orange-500/60 leading-relaxed italic">
                      "The Event Horizon is the boundary beyond which nothing, not even light, can escape..."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          {!isCrossing && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[105]">
              <ControlBtn 
                active={relativityMode} 
                onClick={() => setRelativityMode(!relativityMode)} 
                icon={<Sun size={20} />} 
                label="Relativity Mode" 
                accent="bg-blue-500"
              />

              <div className="h-10 w-[1px] bg-white/10 mx-2" />

              <ControlBtn 
                active={!safeMode} 
                onClick={() => setSafeMode(!safeMode)} 
                icon={<Zap size={20} />} 
                label={safeMode ? "Safe Mode: ON" : "Safe Mode: OFF"} 
                accent="bg-red-600"
              />
              
              <button
                disabled={safeMode}
                onClick={handleCross}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold uppercase tracking-widest transition-all ${
                  safeMode 
                    ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' 
                    : 'bg-orange-600 text-white shadow-[0_0_30px_rgba(234,88,12,0.5)] hover:bg-orange-500'
                }`}
              >
                <Play size={20} fill="currentColor" />
                Cross Horizon
              </button>

              <div className="h-10 w-[1px] bg-white/10 mx-2" />
              
              <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                <Sparkles size={16} className="text-white/40" />
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.1" 
                  value={gravity}
                  onChange={(e) => setGravity(parseFloat(e.target.value))}
                  className="w-24 accent-orange-500"
                />
              </div>

              <button 
                onClick={() => setShowGrid(!showGrid)}
                className={`p-4 rounded-full transition-all ${showGrid ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
              >
                <Grid3X3 size={20} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoItem({ label, value, delay }: { label: string, value: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + 0.5 }}
      className="space-y-1"
    >
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</div>
      <div className="text-sm text-white/80">{value}</div>
    </motion.div>
  );
}

function ControlBtn({ active, onClick, icon, label, accent }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, accent: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
        active 
          ? `${accent} text-white border-transparent shadow-[0_0_20px_rgba(0,0,0,0.3)]` 
          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
      }`}
    >
      {icon}
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
