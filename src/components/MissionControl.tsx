import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, Star, ChevronRight, Lock, CheckCircle2, Zap, Shield, Rocket, Users } from 'lucide-react';

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  type: 'exploration' | 'simulation' | 'data';
}

interface MissionControlProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  points: number;
  level: number;
  onLaunchMission: (id: string) => void;
}

export default function MissionControl({ isOpen, onClose, missions, points, level, onLaunchMission }: MissionControlProps) {
  const [activeTab, setActiveTab] = useState<'missions' | 'leaderboard'>('missions');
  const progress = (missions.filter(m => m.completed).length / missions.length) * 100;

  const leaderboard = [
    { rank: 1, name: 'Commander Vega', points: 12500, level: 25, avatar: 'https://picsum.photos/seed/vega/100/100' },
    { rank: 2, name: 'Pilot Orion', points: 10200, level: 21, avatar: 'https://picsum.photos/seed/orion/100/100' },
    { rank: 3, name: 'Dr. Nova', points: 8900, level: 18, avatar: 'https://picsum.photos/seed/nova/100/100' },
    { rank: 4, name: 'You', points: points, level: level, avatar: 'https://picsum.photos/seed/you/100/100', isUser: true },
    { rank: 5, name: 'Astro Sam', points: 4500, level: 9, avatar: 'https://picsum.photos/seed/sam/100/100' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl h-[80vh] bg-[#0a0a14] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                  <Rocket size={32} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <h2 className="text-4xl font-display font-bold tracking-tight">Mission Control</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <Zap size={14} className="text-yellow-400" />
                      <span className="text-xs font-bold uppercase tracking-widest">{points} XP</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <Shield size={14} className="text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-widest">Level {level}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => setActiveTab('missions')}
                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'missions' ? 'bg-[#8b5cf6] text-white' : 'text-white/40 hover:text-white'}`}
                  >
                    Missions
                  </button>
                  <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-[#8b5cf6] text-white' : 'text-white/40 hover:text-white'}`}
                  >
                    Leaderboard
                  </button>
                </div>
                <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Stats */}
              <div className="w-80 border-r border-white/10 p-10 space-y-10 bg-white/20">
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-6">Overall Progress</h3>
                  <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6] to-[#d946ef]"
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>{Math.round(progress)}% Complete</span>
                    <span>{missions.filter(m => m.completed).length}/{missions.length} Missions</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Level Progress</h3>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-white/40">Next Level</span>
                      <span className="text-yellow-400">{points % 500} / 500 XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(points % 500) / 5}%` }}
                        className="h-full bg-yellow-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Achievements</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Badge icon={<Star size={16} />} active={level >= 2} />
                    <Badge icon={<Trophy size={16} />} active={level >= 5} />
                    <Badge icon={<Target size={16} />} active={progress === 100} />
                  </div>
                </div>

                <div className="mt-auto p-6 rounded-3xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                  <p className="text-xs text-[#a78bfa] leading-relaxed">
                    Complete missions to unlock advanced simulations and earn your place among the stars.
                  </p>
                </div>
              </div>

              {/* Mission List or Leaderboard */}
              <div className="flex-1 overflow-y-auto p-10 space-y-4 scrollbar-hide">
                {activeTab === 'missions' ? (
                  <>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-6">Active Missions</h3>
                    {missions.map((mission) => (
                      <motion.div
                        key={mission.id}
                        whileHover={{ x: 10 }}
                        onClick={() => onLaunchMission(mission.id)}
                        className={`p-6 rounded-3xl border transition-all flex items-center justify-between cursor-pointer group ${
                          mission.completed 
                            ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#8b5cf6]/50'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`p-3 rounded-2xl transition-colors ${
                            mission.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40 group-hover:bg-[#8b5cf6]/20 group-hover:text-[#8b5cf6]'
                          }`}>
                            {mission.completed ? <CheckCircle2 size={24} /> : <Target size={24} />}
                          </div>
                          <div>
                            <h4 className={`font-bold text-lg transition-colors ${mission.completed ? 'text-green-400' : 'text-white group-hover:text-[#a78bfa]'}`}>
                              {mission.title}
                            </h4>
                            <p className="text-sm text-white/40">{mission.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Reward</div>
                            <div className="text-sm font-bold text-yellow-400">+{mission.reward} XP</div>
                          </div>
                          {mission.completed ? (
                            <div className="px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                              Completed
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5cf6] text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              Launch <Rocket size={12} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-6">Global Leaderboard</h3>
                    <div className="space-y-2">
                      {leaderboard.map((entry) => (
                        <div 
                          key={entry.name}
                          className={`p-4 rounded-2xl border flex items-center justify-between ${
                            entry.isUser 
                              ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30' 
                              : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-8 text-center font-display font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-white/20'}`}>
                              #{entry.rank}
                            </div>
                            <div className="flex items-center gap-4">
                              <img src={entry.avatar} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                              <div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                  {entry.name}
                                  {entry.isUser && <span className="px-1.5 py-0.5 rounded bg-[#8b5cf6] text-[8px] uppercase tracking-widest">You</span>}
                                </div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest">Level {entry.level}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">{entry.points.toLocaleString()}</div>
                            <div className="text-[10px] text-white/20 uppercase tracking-widest">Total XP</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Badge({ icon, active }: { icon: React.ReactNode, active: boolean }) {
  return (
    <div className={`aspect-square rounded-2xl flex items-center justify-center border transition-all ${
      active 
        ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
        : 'bg-white/5 border-white/5 text-white/10'
    }`}>
      {active ? icon : <Lock size={16} />}
    </div>
  );
}
