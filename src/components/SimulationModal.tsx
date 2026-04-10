import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface Body {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  radius: number;
}

export default function SimulationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const G = 0.5;

  // Initialize with a simple system
  useEffect(() => {
    if (isOpen && bodies.length === 0) {
      setBodies([
        { id: 'sun', x: 400, y: 300, vx: 0, vy: 0, mass: 1000, color: '#f59e0b', radius: 20 },
        { id: 'earth', x: 400, y: 150, vx: 2, vy: 0, mass: 10, color: '#3b82f6', radius: 8 },
        { id: 'moon', x: 400, y: 130, vx: 3, vy: 0, mass: 1, color: '#94a3b8', radius: 4 },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setBodies(prev => {
        const next = prev.map(b => ({ ...b }));
        
        // Calculate forces
        for (let i = 0; i < next.length; i++) {
          let fx = 0;
          let fy = 0;
          for (let j = 0; j < next.length; j++) {
            if (i === j) continue;
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const distSq = dx * dx + dy * dy + 100; // softing
            const dist = Math.sqrt(distSq);
            const force = (G * next[i].mass * next[j].mass) / distSq;
            fx += (force * dx) / dist;
            fy += (force * dy) / dist;
          }
          next[i].vx += fx / next[i].mass;
          next[i].vy += fy / next[i].mass;
        }

        // Update positions
        for (let i = 0; i < next.length; i++) {
          next[i].x += next[i].vx;
          next[i].y += next[i].vy;
        }

        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const addPlanet = () => {
    const newPlanet: Body = {
      id: Math.random().toString(),
      x: Math.random() * 600 + 100,
      y: Math.random() * 400 + 100,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      mass: Math.random() * 50 + 5,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      radius: Math.random() * 10 + 5
    };
    setBodies([...bodies, newPlanet]);
  };

  const reset = () => {
    setBodies([
      { id: 'sun', x: 400, y: 300, vx: 0, vy: 0, mass: 1000, color: '#f59e0b', radius: 20 },
      { id: 'earth', x: 400, y: 150, vx: 2, vy: 0, mass: 10, color: '#3b82f6', radius: 8 },
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl aspect-video bg-[#0a0a14] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex"
          >
            {/* Simulation Canvas */}
            <div className="flex-1 relative bg-black/40 overflow-hidden">
              <svg className="w-full h-full">
                {bodies.map(b => (
                  <motion.circle
                    key={b.id}
                    cx={b.x}
                    cy={b.y}
                    r={b.radius}
                    fill={b.color}
                    className="shadow-lg"
                    style={{ filter: `drop-shadow(0 0 8px ${b.color}88)` }}
                  />
                ))}
              </svg>
              
              <div className="absolute top-6 left-6 flex gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={reset} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Controls Sidebar */}
            <div className="w-80 border-l border-white/10 p-6 flex flex-col gap-6 bg-white/5">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-xl">Simulation</h3>
                <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={addPlanet}
                  className="w-full py-3 rounded-xl bg-[#8b5cf6] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#7c3aed] transition-colors"
                >
                  <Plus size={18} /> Add Planet
                </button>
                
                <div className="text-sm text-white/40 uppercase tracking-widest font-bold">Active Bodies</div>
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                  {bodies.map(b => (
                    <div key={b.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="text-sm font-medium capitalize">{b.id.length > 8 ? 'Planet' : b.id}</span>
                      </div>
                      <button 
                        onClick={() => setBodies(bodies.filter(x => x.id !== b.id))}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-4 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                <p className="text-xs text-[#a78bfa] leading-relaxed">
                  Adjust gravity and mass to see how orbits change. Real-time N-body physics simulation.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
