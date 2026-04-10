import { useRef, useState, useMemo, Suspense, useEffect, useCallback } from 'react';
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
  AdaptiveDpr,
  AdaptiveEvents
} from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Zap, Camera, Eye, Volume2, Maximize2, Sparkles, Thermometer, Wind, Sun, Video, Play, Share2 } from 'lucide-react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField } from '@react-three/postprocessing';

// --- Components ---

function DustParticles({ count = 1000, density = 1 }: { count?: number, density?: number }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return p;
  }, [count]);

  return (
    <Points positions={points}>
      <PointMaterial
        transparent
        color="#fff"
        size={0.02 * density}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.2}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function NebulaCloud({ 
  color, 
  position, 
  size = 5, 
  speed = 1, 
  density = 1, 
  collapsing = false 
}: { 
  color: string, 
  position: [number, number, number], 
  size?: number, 
  speed?: number, 
  density?: number,
  collapsing?: boolean
}) {
  const ref = useRef<THREE.Group>(null);
  const originalPos = useRef(new THREE.Vector3(...position));
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.001 * speed;
      ref.current.rotation.z += 0.0005 * speed;

      if (collapsing) {
        ref.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.005);
        ref.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.005);
      } else {
        ref.current.position.lerp(originalPos.current, 0.01);
        ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.01);
      }
    }
  });

  const particles = useMemo(() => {
    const count = Math.floor(40 * density);
    const pos = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * size;
      pos[i * 3 + 1] = (Math.random() - 0.5) * size;
      pos[i * 3 + 2] = (Math.random() - 0.5) * size;
      scales[i] = Math.random() * 2 + 1;
    }
    return { pos, scales, count };
  }, [size, density]);

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: particles.count }).map((_, i) => (
        <mesh key={i} position={[particles.pos[i*3], particles.pos[i*3+1], particles.pos[i*3+2]]}>
          <sphereGeometry args={[particles.scales[i], 16, 16]} />
          <meshStandardMaterial 
            color={color} 
            transparent 
            opacity={0.05 * density} 
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function Protostar({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (ref.current) {
      const s = active ? 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2 : 0;
      ref.current.scale.setScalar(s);
      if (lightRef.current) {
        lightRef.current.intensity = active ? 20 + Math.sin(state.clock.elapsedTime * 20) * 10 : 0;
      }
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#fff" 
          emissive="#fff" 
          emissiveIntensity={10} 
          transparent 
          opacity={active ? 0.8 : 0}
        />
      </mesh>
      <pointLight ref={lightRef} color="#fff" distance={20} />
      
      {/* Energy Bursts */}
      {active && (
        <group>
          {Array.from({ length: 3 }).map((_, i) => (
            <Float key={i} speed={5} rotationIntensity={2} floatIntensity={2}>
              <mesh position={[(Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#fff" transparent opacity={0.5} />
              </mesh>
            </Float>
          ))}
        </group>
      )}
    </group>
  );
}

function OrionScene({ 
  simMode, 
  lightIntensity, 
  density, 
  temperature,
  isCinematic,
  ripples 
}: { 
  simMode: boolean, 
  lightIntensity: number, 
  density: number,
  temperature: number,
  isCinematic: boolean,
  ripples: { id: number, pos: THREE.Vector3, time: number }[]
}) {
  const { camera } = useThree();
  
  useFrame((state) => {
    if (isCinematic) {
      const t = state.clock.elapsedTime * 0.2;
      camera.position.x = Math.sin(t) * 15;
      camera.position.z = Math.cos(t) * 15;
      camera.lookAt(0, 0, 0);
    }
  });

  const nebulaColors = useMemo(() => {
    // Shift colors based on temperature (hotter = bluer, cooler = redder)
    const hot = new THREE.Color("#0ea5e9");
    const cool = new THREE.Color("#ff1e8d");
    const base1 = cool.clone().lerp(hot, (temperature - 0.5) * 2);
    const base2 = new THREE.Color("#7c3aed").lerp(hot, (temperature - 0.5) * 2);
    return [base1, base2, hot, cool];
  }, [temperature]);

  return (
    <>
      <color attach="background" args={['#010103']} />
      <fog attach="fog" args={['#010103', 8, 30]} />
      
      <ambientLight intensity={0.1 * lightIntensity} />
      <pointLight position={[0, 0, 0]} intensity={2 * lightIntensity} color={nebulaColors[0]} />
      <pointLight position={[5, 2, -5]} intensity={1 * lightIntensity} color={nebulaColors[1]} />
      
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group scale={1.2}>
          <NebulaCloud color={nebulaColors[0].getStyle()} position={[0, 0, 0]} size={8} speed={1} density={density} collapsing={simMode} />
          <NebulaCloud color={nebulaColors[1].getStyle()} position={[2, -1, -2]} size={6} speed={0.8} density={density} collapsing={simMode} />
          <NebulaCloud color={nebulaColors[2].getStyle()} position={[-3, 1, 1]} size={7} speed={1.2} density={density} collapsing={simMode} />
          <NebulaCloud color={nebulaColors[3].getStyle()} position={[1, 2, -3]} size={5} speed={0.5} density={density} collapsing={simMode} />
          
          <Protostar active={simMode} />
          <DustParticles count={1000} density={density} />
          
          {/* Ripples */}
          {ripples.map(r => (
            <Ripple key={r.id} position={r.pos} />
          ))}
        </group>
      </Float>

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={300} intensity={2 * lightIntensity} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
      </EffectComposer>

      {!isCinematic && (
        <OrbitControls 
          enablePan={false} 
          minDistance={5} 
          maxDistance={25} 
          autoRotate={!simMode} 
          autoRotateSpeed={0.5} 
        />
      )}
      
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  );
}

function Ripple({ position }: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.addScalar(0.05);
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity -= 0.01;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <ringGeometry args={[0.1, 0.2, 32]} />
      <meshBasicMaterial color="#fff" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function OrionNebulaExperience({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [simMode, setSimMode] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [density, setDensity] = useState(1);
  const [temperature, setTemperature] = useState(0.5);
  const [showInfo, setShowInfo] = useState(true);
  const [realData, setRealData] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  const [ripples, setRipples] = useState<{ id: number, pos: THREE.Vector3, time: number }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowEntry(true);
      const timer = setTimeout(() => setShowEntry(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCanvasClick = (e: any) => {
    if (e.intersections && e.intersections.length > 0) {
      const pos = e.intersections[0].point;
      const id = Date.now();
      setRipples(prev => [...prev, { id, pos, time: Date.now() }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 1000);
    }
  };

  const handleGenerateVideo = () => {
    setIsCinematic(true);
    setSimMode(true);
    setVideoReady(false);
    setTimeout(() => {
      setIsCinematic(false);
      setSimMode(false);
      setVideoReady(true);
    }, 10000);
  };

  const downloadVideo = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'nebula_formation.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setVideoReady(false);
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
          {/* Entry Overlay */}
          <AnimatePresence>
            {showEntry && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 z-[110] bg-black flex flex-col items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-center"
                >
                  <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
                    Orion Nebula
                  </h1>
                  <div className="flex items-center gap-4 justify-center">
                    <div className="h-px w-12 bg-white/20" />
                    <p className="text-[#a78bfa] tracking-[0.4em] uppercase text-xs font-bold">
                      Birthplace of Stars
                    </p>
                    <div className="h-px w-12 bg-white/20" />
                  </div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-white/40 text-sm font-light italic"
                  >
                    Entering the stellar nursery...
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Canvas */}
          <div className="absolute inset-0">
            <Canvas shadows dpr={[1, 2]} onClick={handleCanvasClick}>
              <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
              <Suspense fallback={null}>
                <OrionScene 
                  simMode={simMode} 
                  lightIntensity={lightIntensity} 
                  density={density}
                  temperature={temperature}
                  isCinematic={isCinematic}
                  ripples={ripples}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* UI Controls - Top Right */}
          <div className="absolute top-8 right-8 flex flex-col gap-4 z-[105]">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-4 rounded-full transition-all ${soundEnabled ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
            >
              <Volume2 size={24} />
            </button>
            <button 
              onClick={onClose}
              className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl text-white transition-all group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Info Panel - Left */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-80 z-[105]"
              >
                <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                      <Info size={20} className="text-[#a78bfa]" />
                    </div>
                    <h2 className="font-display font-bold text-xl">Orion Nebula (M42)</h2>
                  </div>

                  <div className="space-y-5">
                    <InfoRow label="Type" value="Diffuse Nebula" />
                    <InfoRow label="Distance" value="~1,344 light-years" />
                    <InfoRow label="Location" value="Orion Constellation" />
                    <InfoRow label="Age" value="~1–3 million years" />
                    <InfoRow label="Function" value="Active star formation region" />
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Educational Insight</div>
                    <p className="text-xs text-white/60 leading-relaxed mb-4">
                      The Orion Nebula is a massive cloud of gas and dust where gravity pulls material together to form new stars.
                    </p>
                    <button 
                      onClick={() => setShowTheory(true)}
                      className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={12} /> View Formation Theory
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Theory Modal */}
          <AnimatePresence>
            {showTheory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[130] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="max-w-2xl w-full glass-panel p-10 rounded-[3rem] border border-white/10 relative"
                >
                  <button 
                    onClick={() => setShowTheory(false)}
                    className="absolute top-8 right-8 p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-yellow-500/20 border border-yellow-500/30">
                      <Zap size={24} className="text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-bold">Star Formation Theory</h2>
                      <p className="text-white/40 text-sm">The lifecycle of a stellar nursery</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <TheoryStep 
                        number="01" 
                        title="Gravitational Collapse" 
                        desc="Cold molecular clouds begin to collapse under their own gravity, often triggered by nearby supernovae."
                      />
                      <TheoryStep 
                        number="02" 
                        title="Protostar Formation" 
                        desc="As the cloud collapses, it fragments and the core heats up, forming a protostar surrounded by a disk."
                      />
                    </div>
                    <div className="space-y-6">
                      <TheoryStep 
                        number="03" 
                        title="Nuclear Fusion" 
                        desc="When core temperatures reach 10 million Kelvin, hydrogen fusion begins. A star is born."
                      />
                      <TheoryStep 
                        number="04" 
                        title="Stellar Winds" 
                        desc="The new star's radiation blows away the remaining gas, revealing the brilliant newborn star."
                      />
                    </div>
                  </div>

                  <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-sm text-white/60 mb-4">Want to see the physics in action?</p>
                    <button 
                      onClick={() => { setShowTheory(false); setSimMode(true); }}
                      className="px-8 py-3 rounded-full bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-all"
                    >
                      Launch Star Birth Simulation
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-[105] w-full max-w-2xl">
            <div className="flex items-center gap-4">
              <ControlBtn 
                active={simMode} 
                onClick={() => setSimMode(!simMode)} 
                icon={<Zap size={20} />} 
                label="Simulate Star Birth" 
                accent="bg-yellow-500"
              />
              <ControlBtn 
                active={realData} 
                onClick={() => setRealData(!realData)} 
                icon={<Eye size={20} />} 
                label="Real Observation" 
                accent="bg-blue-500"
              />
              <ControlBtn 
                active={isCinematic} 
                onClick={handleGenerateVideo} 
                icon={<Video size={20} />} 
                label="Generate Video" 
                accent="bg-purple-600"
              />
            </div>

            <div className="flex items-center gap-8 px-8 py-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl w-full">
              <Slider icon={<Wind size={16} />} label="Density" value={density} onChange={setDensity} />
              <div className="w-px h-8 bg-white/10" />
              <Slider icon={<Thermometer size={16} />} label="Temp" value={temperature} onChange={setTemperature} />
              <div className="w-px h-8 bg-white/10" />
              <Slider icon={<Sun size={16} />} label="Light" value={lightIntensity} onChange={setLightIntensity} min={0.5} max={2} />
              <div className="w-px h-8 bg-white/10" />
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-3 rounded-xl transition-all ${showInfo ? 'bg-[#8b5cf6] text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
              >
                <Info size={20} />
              </button>
            </div>
          </div>

          {/* Real Data Overlay */}
          <AnimatePresence>
            {realData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[102] pointer-events-none"
              >
                <img 
                  src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=2000" 
                  className="w-full h-full object-cover opacity-40 mix-blend-screen"
                  referrerPolicy="no-referrer"
                  alt="NASA Data"
                />
                <div className="absolute top-32 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  NASA Telescope Observation Active
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cinematic Overlay */}
          <AnimatePresence>
            {isCinematic && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] pointer-events-none border-[40px] border-black/80"
              >
                <div className="absolute top-12 left-12 text-white/40 font-mono text-[10px] uppercase tracking-widest">
                  REC ● 00:00:{Math.floor(Math.random()*60).toString().padStart(2, '0')}
                </div>
                <div className="absolute bottom-12 right-12 text-white/40 font-mono text-[10px] uppercase tracking-widest">
                  ORION_NURSERY_FEED
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Ready Modal */}
          <AnimatePresence>
            {videoReady && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] glass-panel p-10 rounded-[3rem] border border-green-500/30 text-center bg-black/60 backdrop-blur-3xl"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Camera className="text-green-500" size={40} />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">Cinematic Clip Ready</h3>
                <p className="text-white/60 text-sm mb-10 max-w-xs mx-auto font-light">Your high-fidelity capture of the Orion Nebula is ready for export.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setVideoReady(false)}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={downloadVideo}
                    className="flex-1 py-4 rounded-2xl bg-green-500 text-black font-bold hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} /> Export MP4
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{label}</div>
      <div className="text-sm text-white/90 font-medium">{value}</div>
    </div>
  );
}

function TheoryStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl font-display font-bold text-white/10">{number}</div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h4>
        <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Slider({ icon, label, value, onChange, min = 0.5, max = 2 }: { icon: React.ReactNode, label: string, value: number, onChange: (v: number) => void, min?: number, max?: number }) {
  return (
    <div className="flex-1 flex items-center gap-3">
      <div className="text-white/40">{icon}</div>
      <div className="flex-1">
        <div className="text-[8px] font-bold text-white/20 uppercase tracking-tighter mb-1">{label}</div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step="0.1" 
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#8b5cf6]"
        />
      </div>
    </div>
  );
}

function ControlBtn({ active, onClick, icon, label, accent }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, accent: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
        active 
          ? `${accent} text-white border-transparent shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105` 
          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
      }`}
    >
      {icon}
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
