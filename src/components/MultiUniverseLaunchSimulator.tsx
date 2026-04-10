import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Rocket, Zap, Gauge, Thermometer, Wind, RotateCcw, Play, Pause, Camera, Share2, Info, Sparkles, Globe, Atom, AlertTriangle, Lock, Crown } from 'lucide-react';

type UniverseType = 'real' | 'blackhole' | 'lowgravity' | 'chaos' | 'quantum';

interface UniverseConfig {
  id: UniverseType;
  name: string;
  description: string;
  gravity: number;
  drag: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
  pro?: boolean;
}

const UNIVERSES: UniverseConfig[] = [
  { 
    id: 'real', 
    name: 'Real Universe', 
    description: 'Standard physics with Earth-like gravity and atmospheric drag.', 
    gravity: 0.1, 
    drag: 0.01, 
    color: '#3b82f6', 
    bg: 'bg-blue-950/20',
    icon: <Globe size={20} />
  },
  { 
    id: 'lowgravity', 
    name: 'Void', 
    description: 'Minimal gravity. Rockets travel vast distances with very little fuel.', 
    gravity: 0.02, 
    drag: 0, 
    color: '#10b981', 
    bg: 'bg-emerald-950/20',
    icon: <Sparkles size={20} />
  },
  { 
    id: 'blackhole', 
    name: 'Singularity', 
    description: 'Extreme gravity that bends time and space. Escape is nearly impossible.', 
    gravity: 0.5, 
    drag: 0, 
    color: '#8b5cf6', 
    bg: 'bg-purple-950/40',
    icon: <Zap size={20} />,
    pro: true
  },
  { 
    id: 'chaos', 
    name: 'Chaos Realm', 
    description: 'Unpredictable forces and unstable orbits. High risk of structural failure.', 
    gravity: 0.08, 
    drag: 0.005, 
    color: '#ef4444', 
    bg: 'bg-red-950/20',
    icon: <AlertTriangle size={20} />,
    pro: true
  },
  { 
    id: 'quantum', 
    name: 'Quantum Field', 
    description: 'Particles shift positions randomly. Trajectories are probabilistic.', 
    gravity: 0.05, 
    drag: 0, 
    color: '#ec4899', 
    bg: 'bg-pink-950/20',
    icon: <Atom size={20} />,
    pro: true
  },
];

interface RocketState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  thrust: number;
  fuel: number;
  mass: number;
  status: 'idle' | 'countdown' | 'launching' | 'orbit' | 'crashed' | 'escaped';
}

export default function MultiUniverseLaunchSimulator({ isOpen, onClose, isPro, onUpgrade }: { isOpen: boolean; onClose: () => void; isPro: boolean; onUpgrade: () => void }) {
  const [universe, setUniverse] = useState<UniverseConfig>(UNIVERSES[0]);
  const [rocket, setRocket] = useState<RocketState>({
    x: 400,
    y: 500,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    thrust: 0.2,
    fuel: 100,
    mass: 10,
    status: 'idle'
  });
  
  const [settings, setSettings] = useState({
    fuel: 100,
    mass: 10,
    enginePower: 0.2
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState({ altitude: 0, velocity: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Systems initialized. Waiting for launch...']);

  const canvasRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const startLaunch = () => {
    setCountdown(3);
    addLog('Commencing countdown...');
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setRocket(prev => ({ ...prev, status: 'launching' }));
      setCountdown(null);
      addLog('Ignition! We have liftoff.');
    }
  }, [countdown]);

  const reset = () => {
    setRocket({
      x: 400,
      y: 500,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrust: settings.enginePower,
      fuel: settings.fuel,
      mass: settings.mass,
      status: 'idle'
    });
    setTelemetry({ altitude: 0, velocity: 0 });
    addLog('Simulator reset.');
  };

  const jumpUniverse = () => {
    if (!isPro) {
      onUpgrade();
      return;
    }
    const currentIndex = UNIVERSES.findIndex(u => u.id === universe.id);
    const nextIndex = (currentIndex + 1) % UNIVERSES.length;
    setUniverse(UNIVERSES[nextIndex]);
    addLog(`Warping to ${UNIVERSES[nextIndex].name}...`);
  };

  useEffect(() => {
    if (rocket.status === 'idle' || rocket.status === 'crashed' || rocket.status === 'escaped') return;

    const update = () => {
      setRocket(prev => {
        let { x, y, vx, vy, fuel, angle, thrust, mass, status } = prev;

        // Gravity
        const planetX = 400;
        const planetY = 800; // Planet is below the screen
        const dx = planetX - x;
        const dy = planetY - y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const forceG = (universe.gravity * mass * 1000) / distSq;
        
        vx += (forceG * dx) / dist / mass;
        vy += (forceG * dy) / dist / mass;

        // Thrust
        if (fuel > 0 && status === 'launching') {
          const ax = Math.cos(angle) * thrust;
          const ay = Math.sin(angle) * thrust;
          vx += ax;
          vy += ay;
          fuel -= 0.1;
        }

        // Drag
        vx *= (1 - universe.drag);
        vy *= (1 - universe.drag);

        // Chaos Universe random forces
        if (universe.id === 'chaos') {
          vx += (Math.random() - 0.5) * 0.05;
          vy += (Math.random() - 0.5) * 0.05;
        }

        // Quantum Universe shifts
        if (universe.id === 'quantum' && Math.random() < 0.01) {
          x += (Math.random() - 0.5) * 20;
          y += (Math.random() - 0.5) * 20;
        }

        // Update positions
        x += vx;
        y += vy;

        // Status checks
        const altitude = 500 - y;
        const velocity = Math.sqrt(vx * vx + vy * vy);

        if (y > 550) {
          status = 'crashed';
          addLog('CRITICAL: Structural failure on impact.');
        } else if (altitude > 1000) {
          status = 'escaped';
          addLog('SUCCESS: Escape velocity achieved.');
        }

        setTelemetry({ altitude: Math.max(0, altitude), velocity });

        return { ...prev, x, y, vx, vy, fuel, status };
      });

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [rocket.status, universe]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl h-[80vh] bg-[#05050a] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Simulation Area */}
            <div className={`flex-1 relative overflow-hidden transition-colors duration-1000 ${universe.bg}`}>
              {/* Stars Background */}
              <div className="absolute inset-0 opacity-30">
                {[...Array(50)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bg-white rounded-full"
                    style={{
                      width: Math.random() * 2 + 'px',
                      height: Math.random() * 2 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                    }}
                  />
                ))}
              </div>

              {/* Quantum Glitch Effect */}
              {universe.id === 'quantum' && (
                <motion.div 
                  animate={{ opacity: [0, 0.2, 0] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                  className="absolute inset-0 bg-pink-500/5 pointer-events-none"
                />
              )}

              {/* Black Hole Distortion */}
              {universe.id === 'blackhole' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-96 h-96 rounded-full bg-black shadow-[0_0_100px_rgba(139,92,246,0.3)] border border-purple-500/20" />
                </div>
              )}

              {/* The Rocket */}
              <motion.div
                style={{ 
                  x: rocket.x - 20, 
                  y: rocket.y - 20,
                  rotate: (rocket.angle * 180) / Math.PI + 90
                }}
                className="absolute w-10 h-10 flex items-center justify-center"
              >
                <Rocket className={`w-8 h-8 ${rocket.status === 'crashed' ? 'text-red-500' : 'text-white'}`} />
                {rocket.status === 'launching' && rocket.fuel > 0 && (
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 0.1, repeat: Infinity }}
                    className="absolute -bottom-4 w-4 h-8 bg-gradient-to-t from-orange-500 to-yellow-300 blur-sm rounded-full"
                  />
                )}
              </motion.div>

              {/* Ground / Launch Pad */}
              <div className="absolute bottom-0 w-full h-10 bg-white/5 border-t border-white/10 flex items-center justify-center">
                <div className="w-32 h-2 bg-white/10 rounded-full" />
              </div>

              {/* Watermark for Free Users */}
              {!isPro && (
                <div className="absolute bottom-12 right-8 pointer-events-none select-none opacity-20 flex items-center gap-2">
                  <Sparkles size={16} />
                  <span className="text-sm font-display font-bold tracking-tighter uppercase">Cosmic Visuals Free</span>
                </div>
              )}

              {/* Countdown Overlay */}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div 
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-9xl font-display font-bold text-white drop-shadow-2xl">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recording Indicator */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">REC</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Telemetry Overlay */}
              <div className="absolute top-8 left-8 space-y-4">
                <div className="glass-panel p-4 rounded-2xl border border-white/10 min-w-[200px]">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Live Telemetry</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Altitude</span>
                      <span className="text-sm font-mono font-bold text-white">{telemetry.altitude.toFixed(1)}m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Velocity</span>
                      <span className="text-sm font-mono font-bold text-blue-400">{telemetry.velocity.toFixed(2)}m/s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Fuel</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ width: `${rocket.fuel}%` }}
                            className={`h-full ${rocket.fuel < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white">{Math.ceil(rocket.fuel)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logs */}
                <div className="glass-panel p-4 rounded-2xl border border-white/10 min-w-[200px] h-32 overflow-hidden">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Mission Log</div>
                  <div className="space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className={`text-[10px] font-mono ${i === 0 ? 'text-green-400' : 'text-white/30'}`}>
                        [{new Date().toLocaleTimeString([], { hour12: false })}] {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Controls */}
              <div className="absolute bottom-8 left-8 flex gap-3">
                <button onClick={reset} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={jumpUniverse}
                  className="px-6 py-4 rounded-2xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] font-bold text-sm flex items-center gap-2 hover:bg-[#8b5cf6]/30 transition-all"
                >
                  <Sparkles size={18} /> Jump Universe
                </button>
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-96 border-l border-white/10 p-8 flex flex-col gap-8 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-2xl">Launch Control</h3>
                  <p className="text-xs text-white/40 mt-1">Multi-Universe Simulation Engine</p>
                </div>
                <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Universe Selector */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Select Reality</h4>
                <div className="grid grid-cols-1 gap-2">
                  {UNIVERSES.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { 
                        if (u.pro && !isPro) {
                          onUpgrade();
                        } else {
                          setUniverse(u); 
                          addLog(`Switched to ${u.name}`); 
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                        universe.id === u.id 
                          ? 'bg-white/10 border-white/20 ring-1 ring-white/20' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${universe.id === u.id ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}>
                        {u.pro && !isPro ? <Lock size={20} /> : u.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold flex items-center justify-between">
                          {u.name}
                          {u.pro && !isPro && <Crown size={12} className="text-yellow-500" />}
                        </div>
                        <div className="text-[10px] text-white/40 line-clamp-1">{u.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rocket Customization */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Rocket Config</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Engine Power</span>
                      <span className="text-white">{Math.round(settings.enginePower * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="0.5" step="0.05"
                      value={settings.enginePower}
                      onChange={(e) => setSettings({...settings, enginePower: parseFloat(e.target.value)})}
                      className="w-full accent-[#8b5cf6]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Fuel Capacity</span>
                      <span className="text-white">{settings.fuel}L</span>
                    </div>
                    <input 
                      type="range" min="50" max="200" step="10"
                      value={settings.fuel}
                      onChange={(e) => setSettings({...settings, fuel: parseInt(e.target.value)})}
                      className="w-full accent-[#8b5cf6]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto grid grid-cols-2 gap-3">
                <button 
                  onClick={startLaunch}
                  disabled={rocket.status !== 'idle'}
                  className="col-span-2 py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Rocket size={20} /> Initiate Launch
                </button>
                <button 
                  onClick={() => {
                    if (isRecording) {
                      setIsRecording(false);
                      setShowExportModal(true);
                      addLog('Recording saved. Ready for export.');
                    } else {
                      setIsRecording(true);
                      addLog('Recording started...');
                    }
                  }}
                  className={`py-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${
                    isRecording ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Camera size={18} /> {isRecording ? 'Stop' : 'Record'}
                </button>
                <button className="py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                  <Share2 size={18} /> Share
                </button>
              </div>

              {/* Learning Tip */}
              <div className="p-4 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex gap-3">
                <Info size={16} className="text-[#a78bfa] shrink-0" />
                <p className="text-[10px] text-[#a78bfa] leading-relaxed">
                  <strong>Did you know?</strong> {universe.description} Experiment with different thrust angles to achieve stable orbit.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#0a0a15] rounded-[2rem] border border-white/10 p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-[#8b5cf6]" size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold">Launch Recorded</h3>
                <p className="text-sm text-white/40">Your cinematic sequence is ready for export.</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Download SD (480p)
                  <span className="text-[10px] text-white/40 px-2 py-0.5 rounded-full bg-white/5">Free</span>
                </button>
                <button 
                  onClick={() => {
                    if (isPro) {
                      // Simulate download
                      addLog('Exporting 4K Cinematic...');
                      setShowExportModal(false);
                    } else {
                      onUpgrade();
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                >
                  <Crown size={18} className={isPro ? "" : "group-hover:animate-bounce"} />
                  Download HD (4K)
                  {!isPro && <Lock size={14} className="opacity-60" />}
                </button>
              </div>

              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full text-xs text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest font-bold"
              >
                Discard Recording
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
