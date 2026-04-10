import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Crown, Star, Video, Rocket, Shield } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  const plans = [
    {
      name: 'Explorer',
      price: 'Free',
      description: 'Perfect for casual observers of the cosmos.',
      features: [
        'Basic simulations',
        'Standard telemetry data',
        'Community missions',
        'Standard resolution'
      ],
      button: 'Current Plan',
      current: true
    },
    {
      name: 'Commander',
      price: '₹299',
      period: '/month',
      description: 'Unlock the full power of the cosmic engine.',
      features: [
        'All advanced simulations',
        '4K Cinematic exports',
        'No watermarks on videos',
        'Priority AI assistance',
        'Exclusive "Destroy Earth" mode',
        'Multi-universe physics lab'
      ],
      button: 'Upgrade Now',
      current: false,
      featured: true
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-[#0a0a14] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-[#8b5cf6]/20 to-transparent pointer-events-none" />
            
            <div className="relative p-12">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-4xl font-display font-bold tracking-tight mb-2">Choose Your Clearance</h2>
                  <p className="text-white/40">Unlock advanced cosmic parameters and high-fidelity exports.</p>
                </div>
                <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {plans.map((plan) => (
                  <div 
                    key={plan.name}
                    className={`relative p-8 rounded-[2rem] border transition-all ${
                      plan.featured 
                        ? 'bg-white/5 border-[#8b5cf6] shadow-[0_0_40px_rgba(139,92,246,0.15)]' 
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#8b5cf6] text-[10px] font-bold uppercase tracking-widest text-white">
                        Recommended
                      </div>
                    )}

                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        {plan.name}
                        {plan.featured && <Crown size={18} className="text-yellow-400" />}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-display font-bold">{plan.price}</span>
                        {plan.period && <span className="text-white/40 text-sm">{plan.period}</span>}
                      </div>
                      <p className="text-sm text-white/40 mt-4 leading-relaxed">{plan.description}</p>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                          <div className={`p-1 rounded-full ${plan.featured ? 'bg-[#8b5cf6]/20 text-[#a78bfa]' : 'bg-white/5 text-white/20'}`}>
                            <Check size={12} />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={plan.current ? undefined : onUpgrade}
                      disabled={plan.current}
                      className={`w-full py-4 rounded-2xl font-bold transition-all ${
                        plan.current 
                          ? 'bg-white/5 text-white/20 cursor-default' 
                          : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                      }`}
                    >
                      {plan.button}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex items-center justify-center gap-8 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2"><Shield size={14} /> Secure Payment</div>
                <div className="flex items-center gap-2"><Video size={14} /> 4K Resolution</div>
                <div className="flex items-center gap-2"><Rocket size={14} /> Instant Access</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
