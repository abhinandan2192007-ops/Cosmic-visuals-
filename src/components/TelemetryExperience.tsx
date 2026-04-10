import { useRef, useState, useMemo, Suspense, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Stars, 
  Html, 
  AdaptiveDpr,
  AdaptiveEvents,
  Float
} from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Zap, Sparkles, Activity, Globe, Satellite, 
  ArrowRight, Settings2, Play, Pause, Cpu, 
  Signal, BarChart3, Radio, ShieldAlert,
  Terminal, Info, Share2, Camera
} from 'lucide-react';
import * as THREE from 'three';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// --- Constants & Types ---

const SATELLITE_COUNT = 15;
const UPDATE_INTERVAL = 2000; // 2 seconds

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface SatelliteData {
  id: string;
  name: string;
  altitude: number;
  speed: number;
  lat: number;
  lng: number;
  status: 'active' | 'standby' | 'degraded';
  history: { time: string; speed: number }[];
}

// --- Components ---

function SpaceLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-t-2 border-b-2 border-[#3b82f6] rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-l-2 border-r-2 border-[#60a5fa] rounded-full opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Radio className="text-white animate-pulse" size={24} />
        </div>
      </div>
      <div className="text-center">
        <div className="text-white font-display font-bold tracking-widest uppercase text-sm mb-2">Initializing Telemetry Systems</div>
        <div className="text-white/30 font-mono text-[10px] uppercase tracking-tighter">Establishing Secure Uplink...</div>
      </div>
    </div>
  );
}

function Earth({ lowPerf }: { lowPerf: boolean }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const textureLoader = new THREE.TextureLoader();
  
  const earthTexture = useMemo(() => {
    const tex = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/planets/earth_atmos_2048.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, lowPerf ? 32 : 64, lowPerf ? 32 : 64]} />
        <meshStandardMaterial map={earthTexture} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.05, lowPerf ? 32 : 64, lowPerf ? 32 : 64]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          transparent 
          opacity={0.1} 
          side={THREE.BackSide} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function SatelliteObject({ 
  data, 
  isSelected, 
  onSelect 
}: { 
  data: SatelliteData, 
  isSelected: boolean, 
  onSelect: () => void 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);

  // Random orbit parameters
  const orbitParams = useMemo(() => ({
    rotationX: Math.random() * Math.PI,
    rotationY: Math.random() * Math.PI,
    rotationZ: Math.random() * Math.PI,
    speed: 0.001 + Math.random() * 0.002
  }), []);

  useFrame((state) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.z += orbitParams.speed;
    }
  });

  return (
    <group rotation={[orbitParams.rotationX, orbitParams.rotationY, 0]}>
      <group ref={orbitRef}>
        <group position={[7 + data.altitude / 10000, 0, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color={isSelected ? "#facc15" : "#3b82f6"} emissive={isSelected ? "#facc15" : "#3b82f6"} emissiveIntensity={2} />
          </mesh>
          
          {/* Signal lines */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 2, 8]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
          </mesh>

          {isSelected && (
            <Html distanceFactor={10}>
              <div className="px-2 py-1 bg-blue-600/80 backdrop-blur-md rounded border border-blue-400 text-[8px] text-white font-mono whitespace-nowrap">
                {data.name}
              </div>
            </Html>
          )}
        </group>
      </group>
      
      {/* Orbit path */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[7 + data.altitude / 10000 - 0.01, 7 + data.altitude / 10000 + 0.01, 128]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function TelemetryExperience({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLive, setIsLive] = useState(true);
  const [lowPerf, setLowPerf] = useState(false);
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  const [refreshSpeed, setRefreshSpeed] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // Mock satellite data
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);

  const addLog = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [...prev.slice(-20), {
      id: Math.random().toString(),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const initialSats: SatelliteData[] = Array.from({ length: SATELLITE_COUNT }).map((_, i) => ({
      id: `sat-${i}`,
      name: `COSMOS-${100 + i}`,
      altitude: 400 + Math.random() * 35000,
      speed: 7.5 + Math.random() * 2,
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      status: Math.random() > 0.1 ? 'active' : 'standby',
      history: Array.from({ length: 10 }).map((_, j) => ({
        time: `${j}:00`,
        speed: 7.5 + Math.random() * 2
      }))
    }));
    setSatellites(initialSats);
    setSelectedSatId(initialSats[0].id);
    addLog("Telemetry systems initialized.", "info");
    addLog("Uplink established with global satellite network.", "info");

    const timer = setTimeout(() => setShowEntry(false), 2500);
    return () => clearTimeout(timer);
  }, [addLog]);

  // Real-time data updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setSatellites(prev => prev.map(sat => {
        const speedChange = (Math.random() - 0.5) * 0.05;
        const newSpeed = sat.speed + speedChange;
        
        if (newSpeed > 9.2 && Math.random() > 0.9) {
          addLog(`Critical velocity detected on ${sat.name}!`, "warning");
        }

        return {
          ...sat,
          lat: sat.lat + (Math.random() - 0.5) * 0.1,
          lng: sat.lng + (Math.random() - 0.5) * 0.1,
          speed: newSpeed,
          history: [...sat.history.slice(1), { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            speed: newSpeed 
          }]
        };
      }));
    }, UPDATE_INTERVAL / refreshSpeed);

    return () => clearInterval(interval);
  }, [isLive, refreshSpeed, addLog]);

  const handleSatelliteAction = (action: 'ping' | 'reboot' | 'deorbit') => {
    if (!selectedSat) return;
    
    addLog(`Executing ${action.toUpperCase()} command on ${selectedSat.name}...`, "info");
    
    if (action === 'ping') {
      setTimeout(() => addLog(`Response from ${selectedSat.name}: 42ms latency.`, "info"), 500);
    } else if (action === 'reboot') {
      setSatellites(prev => prev.map(s => s.id === selectedSatId ? { ...s, status: 'standby' } : s));
      setTimeout(() => {
        setSatellites(prev => prev.map(s => s.id === selectedSatId ? { ...s, status: 'active' } : s));
        addLog(`${selectedSat.name} system reboot complete.`, "info");
      }, 3000);
    } else if (action === 'deorbit') {
      addLog(`WARNING: De-orbit sequence initiated for ${selectedSat.name}.`, "error");
      setTimeout(() => addLog(`Command rejected: Insufficient clearance level.`, "error"), 1000);
    }
  };

  const selectedSat = useMemo(() => 
    satellites.find(s => s.id === selectedSatId), 
  [satellites, selectedSatId]);

  const aiInsight = useMemo(() => {
    if (!selectedSat) return "Awaiting satellite selection...";
    if (selectedSat.speed > 8.5) return "Warning: Orbital velocity exceeding nominal parameters. Potential decay detected.";
    if (selectedSat.altitude > 30000) return "Satellite in Geostationary Transfer Orbit. Signal latency: 240ms.";
    return "All systems nominal. Data throughput at 98% efficiency.";
  }, [selectedSat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col overflow-hidden select-none">
      <AnimatePresence>
        {showEntry && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-[#020205] flex items-center justify-center"
          >
            <SpaceLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="text-blue-500" size={20} />
            <span className="font-display font-bold text-white tracking-tight">TELEMETRY_CONTROL_V4</span>
          </div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
              {isLive ? 'Live Uplink Active' : 'Uplink Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${isLive ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Live
            </button>
            <button 
              onClick={() => setIsLive(false)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${!isLive ? 'bg-red-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Static
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 relative grid grid-cols-12 gap-4 p-4">
        {/* Left Panel: Satellite List */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="flex-1 glass-panel border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Satellite size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Satellite Fleet</span>
              </div>
              <span className="text-[10px] font-mono text-white/40">{satellites.length} Units</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {satellites.map(sat => (
                <button
                  key={sat.id}
                  onClick={() => setSelectedSatId(sat.id)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    selectedSatId === sat.id 
                      ? 'bg-blue-600/20 border-blue-500/40 text-white' 
                      : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${sat.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div className="text-left">
                      <div className="text-[10px] font-bold uppercase tracking-tight">{sat.name}</div>
                      <div className="text-[8px] font-mono opacity-50">{sat.altitude.toFixed(0)}km ALT</div>
                    </div>
                  </div>
                  <ArrowRight size={14} className={`transition-transform ${selectedSatId === sat.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 glass-panel border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">System Logs</span>
            </div>
            <div ref={logEndRef} className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[9px] leading-relaxed overflow-y-auto scrollbar-hide">
              {logs.map(log => (
                <div key={log.id} className={`mb-1 ${
                  log.type === 'warning' ? 'text-yellow-400' : 
                  log.type === 'error' ? 'text-red-400' : 'text-blue-300/60'
                }`}>
                  <span className="opacity-30">[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: 3D Visualization */}
        <div className="col-span-6 relative glass-panel border border-white/10 rounded-2xl overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold text-white uppercase">Earth Orbit View</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="text-[10px] font-mono text-white/40">LAT: {selectedSat?.lat.toFixed(4)}°</div>
              <div className="text-[10px] font-mono text-white/40">LNG: {selectedSat?.lng.toFixed(4)}°</div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/40 uppercase">Refresh Rate</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.5" 
                  value={refreshSpeed}
                  onChange={(e) => setRefreshSpeed(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] font-mono text-blue-400">{refreshSpeed}x</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <button 
                onClick={() => setIsRecording(!isRecording)}
                className={`flex items-center gap-2 transition-colors ${isRecording ? 'text-red-500' : 'text-white/60 hover:text-white'}`}
              >
                <Camera size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{isRecording ? 'Recording...' : 'Record Feed'}</span>
              </button>
            </div>
          </div>

          <Canvas 
            dpr={lowPerf ? [1, 1] : [1, 2]}
            gl={{ antialias: !lowPerf }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={2} />
              <Earth lowPerf={lowPerf} />
              {satellites.map(sat => (
                <SatelliteObject 
                  key={sat.id} 
                  data={sat} 
                  isSelected={selectedSatId === sat.id}
                  onSelect={() => setSelectedSatId(sat.id)}
                />
              ))}
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={8} maxDistance={30} makeDefault />
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
          </Canvas>

          {/* Scanline Effect Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-20 opacity-20" />
        </div>

        {/* Right Panel: Analytics & Metrics */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="flex-1 glass-panel border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-green-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Velocity Analytics</span>
              </div>
              <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[8px] font-mono text-green-400">
                REAL_TIME
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedSat?.history || []}>
                  <defs>
                    <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', fontSize: '10px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="speed" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorSpeed)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[8px] text-white/40 uppercase mb-1">Current Speed</div>
                <div className="text-lg font-display font-bold text-white">{selectedSat?.speed.toFixed(2)} <span className="text-[10px] font-normal opacity-40">km/s</span></div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[8px] text-white/40 uppercase mb-1">Altitude</div>
                <div className="text-lg font-display font-bold text-white">{(selectedSat?.altitude || 0 / 1000).toFixed(1)} <span className="text-[10px] font-normal opacity-40">k km</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[8px] text-white/40 uppercase tracking-widest">Satellite Commands</div>
              <div className="grid grid-cols-3 gap-2">
                <CommandBtn label="Ping" onClick={() => handleSatelliteAction('ping')} />
                <CommandBtn label="Reboot" onClick={() => handleSatelliteAction('reboot')} />
                <CommandBtn label="De-orbit" onClick={() => handleSatelliteAction('deorbit')} variant="danger" />
              </div>
            </div>
          </div>

          <div className="h-64 glass-panel border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-purple-400" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">System Metrics</span>
            </div>
            
            <div className="space-y-3">
              <MetricRow label="Simulation FPS" value="60" subValue="Stable" color="text-green-400" />
              <MetricRow label="Data Refresh" value={`${(UPDATE_INTERVAL / refreshSpeed / 1000).toFixed(1)}s`} subValue="Active" color="text-blue-400" />
              <MetricRow label="Active Uplinks" value="12" subValue="Encrypted" color="text-purple-400" />
              <MetricRow label="Threat Level" value="Low" subValue="Nominal" color="text-green-400" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-blue-600/10 border-t border-white/5 flex items-center justify-between px-8 text-[8px] font-mono text-white/40 tracking-widest uppercase">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span>Network: Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            <span>Encryption: AES-256</span>
          </div>
        </div>
        <div>
          {new Date().toISOString()} // MISSION_TIME_UTC
        </div>
      </footer>
    </div>
  );
}

function MetricRow({ label, value, subValue, color }: { label: string, value: string, subValue: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[9px] text-white/60">{label}</div>
        <div className="text-[8px] text-white/20 uppercase tracking-tighter">{subValue}</div>
      </div>
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function CommandBtn({ label, onClick, variant = 'default' }: { label: string, onClick: () => void, variant?: 'default' | 'danger' }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all border ${
        variant === 'danger' 
          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
          : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
      }`}
    >
      {label}
    </button>
  );
}
