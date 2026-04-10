import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowRight, Compass, Sparkles, Telescope, LogIn, LogOut, User, Play, Rocket, Globe as GlobeIcon, Zap, ChevronRight, Shield, Trophy, X, Crown, Youtube } from 'lucide-react';
import React, { useRef, useState, useEffect, Suspense, lazy, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import InteractiveBackground from './components/InteractiveBackground';
import HeroPlanet from './components/HeroPlanet';
import TelemetryOverlay from './components/TelemetryOverlay';
import MultiUniverseLaunchSimulator from './components/MultiUniverseLaunchSimulator';
import AIAssistant from './components/AIAssistant';
import MissionControl, { Mission } from './components/MissionControl';
import UniverseView from './components/UniverseView';
import UpgradeModal from './components/UpgradeModal';
import DestroyEarthExperience from './components/DestroyEarthExperience';

// Lazy load heavy experiences
const OrionNebulaExperience = lazy(() => import('./components/OrionNebulaExperience'));
const EventHorizonExperience = lazy(() => import('./components/EventHorizonExperience'));
const OrbitalMetricsExperience = lazy(() => import('./components/OrbitalMetricsExperience'));
const TelemetryExperience = lazy(() => import('./components/TelemetryExperience'));
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1000',
    title: 'Orion Nebula',
    category: 'Deep Space',
    interactive: true
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
    title: 'Telemetry Data',
    category: 'Data Viz',
    interactive: true
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=1000',
    title: 'Event Horizon',
    category: 'Abstract',
    interactive: true
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=1000',
    title: 'Orbital Metrics',
    category: 'Analysis',
    interactive: true
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1000',
    title: 'Destroy Earth',
    category: 'Viral Sim',
    interactive: true
  }
];

// Error Boundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Cosmic Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/40">
              <Zap className="text-red-500" size={40} />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">System Anomaly Detected</h1>
            <p className="text-white/60 font-light">The cosmic engine encountered an unexpected error. Our telemetry systems are investigating.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all"
            >
              Reboot Systems
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [isOrionOpen, setIsOrionOpen] = useState(false);
  const [isEventHorizonOpen, setIsEventHorizonOpen] = useState(false);
  const [isOrbitalOpen, setIsOrbitalOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false);
  const [isUniverseOpen, setIsUniverseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isDestroyEarthOpen, setIsDestroyEarthOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  // Missions State
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'universe', title: 'Cosmic Navigator', description: 'Access the Universe Navigator.', reward: 50, completed: false, type: 'exploration' },
    { id: 'orion', title: 'Stellar Observer', description: 'Explore the Orion Nebula simulation.', reward: 100, completed: false, type: 'exploration' },
    { id: 'blackhole', title: 'Gravity Master', description: 'Survive the Event Horizon crossing.', reward: 250, completed: false, type: 'simulation' },
    { id: 'telemetry', title: 'Telemetry Officer', description: 'Access the Mission Control dashboard.', reward: 150, completed: false, type: 'data' },
    { id: 'orbital', title: 'Orbital Navigator', description: 'Analyze planetary orbital metrics.', reward: 200, completed: false, type: 'data' },
    { id: 'launch', title: 'Reality Jumper', description: 'Launch a rocket across multiple universes.', reward: 300, completed: false, type: 'simulation' },
    { id: 'destroy', title: 'World Ender', description: 'Simulate a planetary extinction event.', reward: 500, completed: false, type: 'simulation' },
  ]);

  const [showLevelUp, setShowLevelUp] = useState(false);

  const completeMission = (id: string) => {
    setMissions(prevMissions => {
      let missionFound = false;
      const nextMissions = prevMissions.map(m => {
        if (m.id === id && !m.completed) {
          missionFound = true;
          return { ...m, completed: true };
        }
        return m;
      });

      if (missionFound) {
        const reward = prevMissions.find(m => m.id === id)?.reward || 0;
        setPoints(prevPoints => {
          const newPoints = prevPoints + reward;
          const nextLevel = Math.floor(newPoints / 500) + 1;
          if (nextLevel > level) {
            setLevel(nextLevel);
            setShowLevelUp(true);
          }
          return newPoints;
        });
      }
      return nextMissions;
    });
  };

  const handleAIAction = (action: string) => {
    if (action === 'Orion Nebula') { setIsOrionOpen(true); completeMission('orion'); }
    if (action === 'Black Hole') { setIsEventHorizonOpen(true); completeMission('blackhole'); }
    if (action === 'Orbital Metrics') { setIsOrbitalOpen(true); completeMission('orbital'); }
    if (action === 'Mission Control') { setIsTelemetryOpen(true); completeMission('telemetry'); }
    if (action === 'Universe') { setIsUniverseOpen(true); completeMission('universe'); }
    if (action === 'Launch Simulator') { setIsSimOpen(true); completeMission('launch'); }
    if (action === 'Destroy Earth') { 
      setIsDestroyEarthOpen(true); 
      completeMission('destroy'); 
    }
  };

  const handleLaunchMission = (id: string) => {
    if (id === 'universe') setIsUniverseOpen(true);
    if (id === 'orion') setIsOrionOpen(true);
    if (id === 'blackhole') setIsEventHorizonOpen(true);
    if (id === 'telemetry') setIsTelemetryOpen(true);
    if (id === 'orbital') setIsOrbitalOpen(true);
    if (id === 'launch') setIsSimOpen(true);
    if (id === 'destroy') {
      setIsDestroyEarthOpen(true);
    }
    completeMission(id);
    setIsMissionControlOpen(false);
  };

  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const rocketY = useTransform(scrollYProgress, [0, 1], [0, -1000]);

  useEffect(() => {
    // Performance monitoring
    const start = performance.now();
    window.addEventListener('load', () => {
      const loadTime = performance.now() - start;
      console.log(`Cosmic Load Time: ${loadTime.toFixed(2)}ms`);
    });

    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans selection:bg-accent/30 selection:text-white text-white">
        <InteractiveBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[60] glass-panel border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
            <span className="font-display font-bold text-xl tracking-tight">Cosmic Visuals</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <button onClick={() => { setIsUniverseOpen(true); completeMission('universe'); }} className="hover:text-white transition-colors">Universe</button>
            <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>
            <button onClick={() => setIsMissionControlOpen(true)} className="hover:text-white transition-colors">Mission Control</button>
            <a href="#sim" onClick={(e) => { e.preventDefault(); setIsSimOpen(true); completeMission('launch'); }} className="hover:text-white transition-colors">Launch Engine</a>
          </div>

          <div className="flex items-center gap-4">
            {isPro && (
              <div className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-[10px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                <Crown size={12} /> Pro
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <div 
                  className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                  onClick={() => setIsMissionControlOpen(true)}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap size={12} className="text-yellow-400" />
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">{points} XP</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">LVL {level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-tighter">Pilot</div>
                    <div className="text-sm font-medium">{user.displayName}</div>
                  </div>
                  <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border border-white/10" alt="Profile" />
                  <button onClick={logout} className="p-2 text-white/40 hover:text-white transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all flex items-center gap-2"
              >
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        <div 
          className="absolute inset-0 z-0 cursor-pointer"
          onClick={() => { setIsUniverseOpen(true); completeMission('universe'); }}
        >
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 5] }}>
              <HeroPlanet />
            </Canvas>
          </Suspense>
        </div>

        <motion.div 
          style={{ y: rocketY }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-20"
        >
          <Rocket size={120} className="text-[#8b5cf6] rotate-[-45deg]" />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <span className="inline-block py-1 px-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium tracking-widest uppercase mb-6 text-[#a78bfa]">
              Next-Gen Space Exploration
            </span>
            <h1 className="font-display text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.85]">
              Explore, Simulate, <br/>
              <span className="text-gradient">& Control the Universe</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              Experience the universe through interactive simulations, real-time telemetry, and high-fidelity cosmic visualizations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setIsSimOpen(true)}
                className="px-8 py-4 rounded-full bg-[#8b5cf6] text-white font-bold hover:bg-[#7c3aed] transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.4)] group"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Free
              </button>
              <a href="#gallery" className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/5 transition-all text-white font-medium flex items-center gap-2">
                Explore Archives
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Control Section */}
      <section id="mission" className="relative z-10 py-32 bg-[#05050a]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">Mission Control</h2>
              <p className="text-white/60 max-w-md mb-8 leading-relaxed text-lg">
                Track your progress through the cosmos. Complete missions, earn XP, and unlock advanced simulation parameters.
              </p>
              <div 
                className="flex items-center gap-6 cursor-pointer group"
                onClick={() => setIsMissionControlOpen(true)}
              >
                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-[#8b5cf6]/50 transition-all">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Current Level</div>
                  <div className="text-2xl font-display font-bold text-[#a78bfa]">{level}</div>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-yellow-500/50 transition-all">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Total XP</div>
                  <div className="text-2xl font-display font-bold text-yellow-400">{points}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsMissionControlOpen(true)}
                className="mt-10 px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center gap-2"
              >
                Open Dashboard
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-full border border-white/5 bg-white/5 flex items-center justify-center p-12">
                <div className="w-full h-full rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 flex items-center justify-center animate-pulse">
                  <Rocket size={80} className="text-[#8b5cf6]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="relative z-10 py-32 bg-[#05050a]/90">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">Cosmic Archives</h2>
              <p className="text-white/60 max-w-md">High-fidelity captures from the furthest reaches of the observable universe.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GALLERY_IMAGES.map((image, index) => (
              <motion.div 
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => {
                  if (image.title === 'Orion Nebula') { setIsOrionOpen(true); completeMission('orion'); }
                  if (image.title === 'Event Horizon') { setIsEventHorizonOpen(true); completeMission('blackhole'); }
                  if (image.title === 'Orbital Metrics') { setIsOrbitalOpen(true); completeMission('orbital'); }
                  if (image.title === 'Telemetry Data') { setIsTelemetryOpen(true); completeMission('telemetry'); }
                  if (image.title === 'Destroy Earth') {
                    setIsDestroyEarthOpen(true);
                    completeMission('destroy');
                  }
                }}
                className={`group relative aspect-[16/10] overflow-hidden rounded-3xl bg-[#0a0a14] border border-white/5 ${image.interactive ? 'cursor-pointer' : ''}`}
              >
                <img 
                  src={image.url} 
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                {image.title === 'Telemetry Data' && <TelemetryOverlay />}
                <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 z-30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#a78bfa] block">
                      {image.category}
                    </span>
                    {image.interactive && (
                      <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[8px] font-bold text-[#a78bfa] uppercase tracking-widest animate-pulse">
                        Interactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-3xl font-bold text-white">
                    {image.title}
                  </h3>
                  {image.pro && !isPro && (
                    <div className="mt-2 flex items-center gap-2 text-yellow-500 text-[10px] font-bold uppercase tracking-widest">
                      <Crown size={12} /> Pro Feature
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSimOpen(true)}
          className="px-8 py-4 rounded-full bg-white text-black font-bold shadow-2xl flex items-center gap-3"
        >
          <Rocket size={20} />
          Start Exploring Free
        </motion.button>
      </div>

      <AIAssistant onTriggerAction={handleAIAction} />
      
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] glass-panel px-8 py-4 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 flex items-center gap-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
          >
            <div className="p-2 rounded-full bg-yellow-500 text-black">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Level Up!</div>
              <div className="text-sm font-bold text-white">You reached Level {level}</div>
            </div>
            <button 
              onClick={() => setShowLevelUp(false)}
              className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <MultiUniverseLaunchSimulator 
        isOpen={isSimOpen} 
        onClose={() => setIsSimOpen(false)} 
        isPro={isPro}
        onUpgrade={() => setIsUpgradeOpen(true)}
      />
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} onUpgrade={() => { setIsPro(true); setIsUpgradeOpen(false); }} />
      <DestroyEarthExperience isOpen={isDestroyEarthOpen} onClose={() => setIsDestroyEarthOpen(false)} />
      
      <Suspense fallback={null}>
        <OrionNebulaExperience isOpen={isOrionOpen} onClose={() => setIsOrionOpen(false)} />
        <EventHorizonExperience isOpen={isEventHorizonOpen} onClose={() => setIsEventHorizonOpen(false)} />
        <OrbitalMetricsExperience isOpen={isOrbitalOpen} onClose={() => setIsOrbitalOpen(false)} />
        <TelemetryExperience isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />
        <UniverseView isOpen={isUniverseOpen} onClose={() => setIsUniverseOpen(false)} />
        <MissionControl 
          isOpen={isMissionControlOpen} 
          onClose={() => setIsMissionControlOpen(false)} 
          missions={missions}
          points={points}
          level={level}
          onLaunchMission={handleLaunchMission}
        />
      </Suspense>

      {/* Footer */}
      <footer className="relative z-10 py-20 bg-[#05050a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Sparkles className="w-6 h-6 text-[#8b5cf6]" />
            <span className="font-display font-bold text-2xl tracking-tight">Cosmic Visuals</span>
          </div>
          <div className="flex justify-center gap-6 mb-8">
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center gap-2">
              <Youtube size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Community Channel</span>
            </a>
          </div>
          <div className="text-white/40 text-sm max-w-md mx-auto">
            Powered by NASA Open APIs and Google Earth Engine. <br/>
            © {new Date().getFullYear()} Cosmic Visuals. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  </ErrorBoundary>
);
}
