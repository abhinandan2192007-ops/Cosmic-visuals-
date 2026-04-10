import { useRef, useState, useMemo, Suspense, useEffect, useCallback, lazy } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Float, 
  Stars, 
  Html, 
  PointMaterial,
  Points,
  Trail,
  AdaptiveDpr,
  AdaptiveEvents
} from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Zap, Camera, Eye, Volume2, Maximize2, Sparkles, Activity, Globe, Satellite, ArrowRight, RotateCcw, Target, Settings2, Play, Pause, Box, ExternalLink, Video, Cpu } from 'lucide-react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

// Constants for simulation
const G = 100; // Simplified gravitational constant

const PLANETS = [
  { name: 'Mercury', color: '#9ca3af', dist: 4, size: 0.38, speed: 1.6, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/mercury.jpg' },
  { name: 'Venus', color: '#fbbf24', dist: 6, size: 0.95, speed: 1.17, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/venus_surface.jpg' },
  { name: 'Earth', color: '#3b82f6', dist: 9, size: 1.0, speed: 1.0, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/earth_atmos_2048.jpg' },
  { name: 'Mars', color: '#ef4444', dist: 12, size: 0.53, speed: 0.8, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/mars.jpg' },
  { name: 'Jupiter', color: '#f97316', dist: 18, size: 2.5, speed: 0.43, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/jupiter.jpg' },
  { name: 'Saturn', color: '#eab308', dist: 24, size: 2.1, speed: 0.32, hasRings: true, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/saturn.jpg' },
  { name: 'Uranus', color: '#22d3ee', dist: 30, size: 1.5, speed: 0.23, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/uranus.jpg' },
  { name: 'Neptune', color: '#6366f1', dist: 36, size: 1.4, speed: 0.18, sketchfabId: '0f53097169664be4ab127fc58974a1c8', textureUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/neptune.jpg' },
];

// Robust texture loader hook
function useSafeTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      (error) => {
        console.error(`Texture failed to load: ${url}`, error);
      }
    );
  }, [url]);

  return texture;
}

// Space-themed loader component
function SpaceLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-t-2 border-b-2 border-[#8b5cf6] rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-l-2 border-r-2 border-[#a78bfa] rounded-full opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-white animate-pulse" size={24} />
        </div>
      </div>
      <div className="text-center">
        <div className="text-white font-display font-bold tracking-widest uppercase text-sm mb-2">Initializing Cosmic Engine</div>
        <div className="text-white/30 font-mono text-[10px] uppercase tracking-tighter">Syncing Orbital Physics...</div>
      </div>
    </div>
  );
}

// Auto Performance Monitor
function PerformanceMonitor({ onLagDetected }: { onLagDetected: () => void }) {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lagStrikes = useRef(0);

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      const fps = frameCount.current;
      if (fps < 30) {
        lagStrikes.current++;
        if (lagStrikes.current >= 3) {
          onLagDetected();
          lagStrikes.current = 0;
        }
      } else {
        lagStrikes.current = 0;
      }
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

function OrbitingObject({ 
  planet,
  centralMass, 
  timeScale,
  isSelected,
  onSelect,
  onUpdateMetrics,
  lowPerf
}: { 
  planet: any,
  centralMass: number, 
  timeScale: number,
  isSelected: boolean,
  onSelect: () => void,
  onUpdateMetrics: (metrics: any) => void,
  lowPerf: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pos, setPos] = useState(new THREE.Vector3(planet.dist, 0, 0));
  const [vel, setVel] = useState(new THREE.Vector3(0, 0, 0));
  
  // Load texture safely
  const texture = useSafeTexture(planet.textureUrl);
  
  useEffect(() => {
    const circularVel = Math.sqrt((G * centralMass) / planet.dist) * planet.speed;
    setVel(new THREE.Vector3(0, 0, circularVel));
    setPos(new THREE.Vector3(planet.dist, 0, 0));
  }, [centralMass, planet.dist, planet.speed]);

  useFrame((state, delta) => {
    if (!meshRef.current || lowPerf && state.clock.elapsedTime % 0.06 < 0.03) return; // Simple FPS limit for low perf

    const dt = delta * timeScale * 2;
    const rVec = pos.clone().negate();
    const distSq = pos.lengthSq();
    const dist = Math.sqrt(distSq);
    
    if (dist < 1.5) return;

    const forceMag = (G * centralMass) / distSq;
    const accel = rVec.normalize().multiplyScalar(forceMag);
    
    const newVel = vel.clone().add(accel.multiplyScalar(dt));
    const newPos = pos.clone().add(newVel.clone().multiplyScalar(dt));
    
    setPos(newPos);
    setVel(newVel);
    
    meshRef.current.position.copy(newPos);
    meshRef.current.rotation.y += delta * 0.5;

    if (isSelected && state.clock.elapsedTime % 0.2 < 0.02) {
      const escapeVel = Math.sqrt((2 * G * centralMass) / dist);
      const period = 2 * Math.PI * Math.sqrt(Math.pow(dist, 3) / (G * centralMass));
      onUpdateMetrics({
        name: planet.name,
        velocity: newVel.length().toFixed(2),
        distance: dist.toFixed(2),
        force: forceMag.toFixed(2),
        escapeVelocity: escapeVel.toFixed(2),
        period: (period / 10).toFixed(2)
      });
    }
  });

  return (
    <group>
      {!lowPerf && (
        <Trail
          width={planet.size * 0.5}
          length={isSelected ? 20 : 10}
          color={new THREE.Color(planet.color)}
          attenuation={(t) => t * t}
        >
          <mesh 
            ref={meshRef} 
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <sphereGeometry args={[planet.size * 0.5, lowPerf ? 16 : 32, lowPerf ? 16 : 32]} />
            <meshStandardMaterial 
              map={texture || undefined}
              color={planet.color}
              emissive={planet.color} 
              emissiveIntensity={0.2} 
            />
            {planet.hasRings && (
              <mesh rotation={[Math.PI / 2.5, 0, 0]}>
                <ringGeometry args={[planet.size * 0.6, planet.size * 1.2, lowPerf ? 32 : 64]} />
                <meshStandardMaterial color={planet.color} transparent opacity={0.4} side={THREE.DoubleSide} />
              </mesh>
            )}
          </mesh>
        </Trail>
      )}

      {lowPerf && (
        <mesh 
          ref={meshRef} 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <sphereGeometry args={[planet.size * 0.5, 16, 16]} />
          <meshStandardMaterial 
            map={texture || undefined}
            color={planet.color}
            emissive={planet.color} 
            emissiveIntensity={0.2} 
          />
          {planet.hasRings && (
            <mesh rotation={[Math.PI / 2.5, 0, 0]}>
              <ringGeometry args={[planet.size * 0.6, planet.size * 1.2, 32]} />
              <meshStandardMaterial color={planet.color} transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          )}
        </mesh>
      )}
      
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.dist - 0.02, planet.dist + 0.02, lowPerf ? 64 : 128]} />
        <meshBasicMaterial color={planet.color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function OrbitalScene({ 
  centralMass, 
  timeScale,
  selectedPlanet,
  onSelectPlanet,
  onUpdateMetrics,
  planets,
  lowPerf
}: { 
  centralMass: number, 
  timeScale: number,
  selectedPlanet: string | null,
  onSelectPlanet: (name: string) => void,
  onUpdateMetrics: (metrics: any) => void,
  planets: any[],
  lowPerf: boolean
}) {
  const sunTexture = useSafeTexture('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/sun.jpg');

  return (
    <>
      <color attach="background" args={['#020205']} />
      <ambientLight intensity={lowPerf ? 0.8 : 0.6} />
      <pointLight position={[0, 0, 0]} intensity={lowPerf ? 10 : 15} color="#f59e0b" />
      
      <mesh>
        <sphereGeometry args={[2.5, lowPerf ? 32 : 64, lowPerf ? 32 : 64]} />
        <meshStandardMaterial 
          map={sunTexture || undefined}
          color="#f59e0b"
          emissive="#f59e0b" 
          emissiveIntensity={lowPerf ? 2 : 4} 
        />
        {!lowPerf && <pointLight intensity={10} distance={100} color="#f59e0b" />}
      </mesh>

      {planets.map(planet => (
        <OrbitingObject 
          key={planet.name}
          planet={planet}
          centralMass={centralMass} 
          timeScale={timeScale}
          isSelected={selectedPlanet === planet.name}
          onSelect={() => onSelectPlanet(planet.name)}
          onUpdateMetrics={onUpdateMetrics}
          lowPerf={lowPerf}
        />
      ))}

      <Stars radius={150} depth={50} count={lowPerf ? 2000 : 7000} factor={4} saturation={0} fade speed={1} />
      
      {!lowPerf && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      )}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <PerformanceMonitor onLagDetected={() => lowPerf || onUpdateMetrics({ lagWarning: true })} />

      <OrbitControls enablePan={!lowPerf} minDistance={5} maxDistance={100} makeDefault />
    </>
  );
}

export default function OrbitalMetricsExperience({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [centralMass, setCentralMass] = useState(100);
  const [timeScale, setTimeScale] = useState(1);
  const [scaleMode, setScaleMode] = useState<'compact' | 'real'>('compact');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>('Earth');
  const [viewMode, setViewMode] = useState<'system' | 'detail'>('system');
  const [isRecording, setIsRecording] = useState(false);
  const [lowPerf, setLowPerf] = useState(false);
  const [showLagWarning, setShowLagWarning] = useState(false);
  const [metrics, setMetrics] = useState({
    name: 'Earth',
    velocity: '0',
    distance: '0',
    force: '0',
    escapeVelocity: '0',
    period: '0'
  });
  const [showEdu, setShowEdu] = useState(true);
  const [entryComplete, setEntryComplete] = useState(false);

  useEffect(() => {
    // Auto-detect mobile for low performance mode
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) setLowPerf(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setEntryComplete(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setEntryComplete(false);
      setViewMode('system');
    }
  }, [isOpen]);

  const resetSim = () => {
    setCentralMass(100);
    setTimeScale(1);
    setScaleMode('compact');
    setSelectedPlanet('Earth');
    setViewMode('system');
  };

  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => setIsRecording(false), 3000);
  };

  const adjustedPlanets = useMemo(() => {
    if (scaleMode === 'compact') return PLANETS;
    const scaleFactors: Record<string, number> = {
      'Mercury': 0.39 * 10,
      'Venus': 0.72 * 10,
      'Earth': 1.00 * 10,
      'Mars': 1.52 * 10,
      'Jupiter': 5.20 * 6,
      'Saturn': 9.58 * 5,
      'Uranus': 19.22 * 4,
      'Neptune': 30.05 * 3.5,
    };
    return PLANETS.map(p => ({
      ...p,
      dist: scaleFactors[p.name] || p.dist
    }));
  }, [scaleMode]);

  const selectedPlanetData = useMemo(() => 
    adjustedPlanets.find(p => p.name === selectedPlanet),
  [adjustedPlanets, selectedPlanet]);

  const handleMetricsUpdate = useCallback((newMetrics: any) => {
    if (newMetrics.lagWarning) {
      setShowLagWarning(true);
      setLowPerf(true);
      setTimeout(() => setShowLagWarning(false), 5000);
      return;
    }
    setMetrics(newMetrics);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black overflow-hidden"
        >
          {/* Entry Experience */}
          {!entryComplete && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="absolute inset-0 z-[110] bg-black flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
                className="text-center"
              >
                <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-white mb-4">
                  Orbital Metrics
                </h1>
                <p className="text-[#a78bfa] tracking-[0.3em] uppercase text-sm font-medium">
                  Precision Motion of the Cosmos
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* 3D Simulation */}
          <div className="absolute inset-0">
            {viewMode === 'system' ? (
              <Canvas 
                shadows={!lowPerf} 
                dpr={lowPerf ? [1, 1] : [1, 2]}
                performance={{ min: 0.5 }}
                gl={{ antialias: !lowPerf, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
                onCreated={({ gl }) => {
                  gl.setClearColor(new THREE.Color('#020205'));
                }}
              >
                <PerspectiveCamera makeDefault position={[0, scaleMode === 'real' ? 100 : 40, scaleMode === 'real' ? 100 : 40]} fov={50} />
                <Suspense fallback={<Html center><SpaceLoader /></Html>}>
                  <OrbitalScene 
                    centralMass={centralMass} 
                    timeScale={timeScale}
                    selectedPlanet={selectedPlanet}
                    onSelectPlanet={setSelectedPlanet}
                    onUpdateMetrics={handleMetricsUpdate}
                    planets={adjustedPlanets}
                    lowPerf={lowPerf}
                  />
                </Suspense>
              </Canvas>
            ) : (
              <div className="w-full h-full bg-[#020205] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedPlanet}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full h-full relative"
                  >
                    <iframe
                      title={`${selectedPlanet || 'Solar System'} 3D Model`}
                      className="w-full h-full border-0"
                      src={`https://sketchfab.com/models/${selectedPlanet ? (selectedPlanetData?.sketchfabId) : '0f53097169664be4ab127fc58974a1c8'}/embed?autostart=1&internal=1&tracking=0&ui_ar=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_theatre=1&ui_watermark=0`}
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      xr-spatial-tracking="true"
                      execution-while-out-of-viewport="true"
                      execution-while-not-rendered="true"
                      web-share="true"
                    />
                    
                    {/* Detail View Overlay */}
                    <div className="absolute top-24 left-8 z-[110] space-y-4">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="glass-panel p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl"
                      >
                        <h2 className="text-3xl font-display font-bold text-white mb-2">{selectedPlanet || 'Solar System'}</h2>
                        <p className="text-white/40 text-xs uppercase tracking-widest">8K Photorealistic Model</p>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Lag Warning */}
          <AnimatePresence>
            {showLagWarning && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] bg-orange-500/90 backdrop-blur-xl px-6 py-3 rounded-full text-white text-xs font-bold flex items-center gap-3 shadow-2xl"
              >
                <Cpu size={16} className="animate-pulse" />
                Performance Drop Detected: Enabling Low Performance Mode
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150] pointer-events-none border-[20px] border-red-500/20"
              >
                <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-600 px-4 py-2 rounded-full text-white font-bold text-xs uppercase tracking-widest animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  Recording Cinematic View...
                </div>
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
            <button 
              onClick={() => setLowPerf(!lowPerf)}
              className={`p-4 rounded-full border backdrop-blur-xl transition-all ${lowPerf ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/5 border-white/10 text-white'}`}
              title={lowPerf ? "Disable Low Performance Mode" : "Enable Low Performance Mode"}
            >
              <Cpu size={24} className={lowPerf ? "animate-pulse" : ""} />
            </button>
          </div>

          {/* Metrics Dashboard - Left */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute left-8 top-1/2 -translate-y-1/2 w-80 z-[105] space-y-6"
          >
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-[#0a0a14]/80 backdrop-blur-3xl shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Activity size={20} className="text-[#a78bfa]" />
                </div>
                <h2 className="font-display font-bold text-xl tracking-tight text-white">{metrics.name} <span className="text-white/20 font-light">Telemetry</span></h2>
              </div>

              <div className="space-y-1">
                <MetricItem label="Orbital Velocity" value={metrics.velocity} unit="km/s" />
                <MetricItem label="Distance from Sun" value={metrics.distance} unit="AU" />
                <MetricItem label="Grav. Force" value={metrics.force} unit="N" />
                <MetricItem label="Escape Vel." value={metrics.escapeVelocity} unit="km/s" />
                <MetricItem label="Year Length" value={metrics.period} unit="Days" />
              </div>
            </div>

            {/* Planet Selector */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Select Planet</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setScaleMode('compact')}
                    className={`text-[8px] px-2 py-1 rounded border ${scaleMode === 'compact' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-white/20'}`}
                  >
                    Compact
                  </button>
                  <button 
                    onClick={() => setScaleMode('real')}
                    className={`text-[8px] px-2 py-1 rounded border ${scaleMode === 'real' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-white/20'}`}
                  >
                    Real Scale
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {adjustedPlanets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedPlanet(p.name);
                      if (viewMode === 'detail') setViewMode('detail');
                    }}
                    className={`p-2 rounded-lg border transition-all text-[10px] font-bold ${
                      selectedPlanet === p.name 
                        ? 'bg-[#8b5cf6] border-transparent text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {p.name.slice(0, 3)}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => setViewMode(viewMode === 'system' ? 'detail' : 'system')}
                  className="py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  {viewMode === 'system' ? <Maximize2 size={14} /> : <Globe size={14} />}
                  {viewMode === 'system' ? 'Planet Detail' : 'System View'}
                </button>
                <button
                  onClick={() => {
                    setSelectedPlanet(null);
                    setViewMode('detail');
                  }}
                  className="py-3 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa] text-[10px] font-bold uppercase tracking-widest hover:bg-[#8b5cf6]/30 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                >
                  <Sparkles size={14} />
                  Full System
                </button>
              </div>
            </div>

            {/* Educational Overlay */}
            <AnimatePresence>
              {showEdu && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Physics Insight</span>
                    <button onClick={() => setShowEdu(false)} className="text-white/40 hover:text-white"><X size={12} /></button>
                  </div>
                  <p className="text-xs text-blue-100/70 leading-relaxed">
                    Objects stay in orbit because gravity pulls them inward while their velocity keeps them moving forward. This balance creates a stable path.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Interaction Controls - Bottom */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-[105]">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-8">
              <div className="flex-1 min-w-[200px] space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span>Sun Mass (Chaos Mode)</span>
                  <span>{centralMass} M☉</span>
                </div>
                <input 
                  type="range" min="10" max="1000" value={centralMass} 
                  onChange={(e) => setCentralMass(parseInt(e.target.value))}
                  className="w-full accent-[#8b5cf6]"
                />
              </div>

              <div className="flex-1 min-w-[200px] space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span>Time Acceleration</span>
                  <span>{timeScale}x</span>
                </div>
                <input 
                  type="range" min="0" max="10" step="0.1" value={timeScale} 
                  onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                  className="w-full accent-[#8b5cf6]"
                />
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleRecord}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
                  title="Record Cinematic View"
                >
                  <Video size={20} />
                </button>
                <button 
                  onClick={() => setTimeScale(timeScale === 0 ? 1 : 0)}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
                >
                  {timeScale === 0 ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button 
                  onClick={resetSim}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
                  title="Reset Simulation"
                >
                  <RotateCcw size={20} />
                </button>
                <div className="h-10 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">System Status</span>
                  <span className={`text-xs font-bold uppercase tracking-widest ${centralMass !== 100 ? 'text-red-500' : 'text-green-500'}`}>
                    {centralMass !== 100 ? 'Chaos Mode Active' : 'Stable Solar System'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetricItem({ label, value, unit }: { label: string, value: string, unit: string }) {
  return (
    <div className="group flex justify-between items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors">
      <div className="flex flex-col">
        <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-mono font-medium text-white tracking-tighter">{value}</span>
          <span className="text-[10px] text-[#a78bfa] font-bold uppercase">{unit}</span>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight size={12} className="text-white/20" />
      </div>
    </div>
  );
}
