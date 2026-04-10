import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Sparkles, Terminal, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AIAssistant({ onTriggerAction }: { onTriggerAction: (action: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Greetings, Commander. I am NOVA, your AI Space Assistant. How can I assist your exploration today? I can explain cosmic phenomena or launch specific simulations for you.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: `You are NOVA, a futuristic AI Space Assistant. 
          Your tone is professional, helpful, and slightly sci-fi. 
          Keep answers concise but informative. 
          If the user wants to see something, you can suggest launching a simulation.
          Available simulations: 'Orion Nebula', 'Black Hole', 'Orbital Metrics', 'Mission Control', 'Launch Simulator'.
          If you think a simulation is relevant, end your message with [ACTION: simulation_name].`,
        }
      });

      const text = response.text || "I'm having trouble connecting to the deep space network.";
      
      // Check for actions
      const actionMatch = text.match(/\[ACTION: (.*?)\]/);
      if (actionMatch) {
        const action = actionMatch[1];
        onTriggerAction(action);
      }

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: text.replace(/\[ACTION: .*?\]/, '').trim(), 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "System anomaly detected. Deep space communication interrupted.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[80] p-4 rounded-full bg-[#8b5cf6] text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] border border-white/20"
      >
        <MessageSquare size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 z-[80] w-[400px] h-[600px] glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                  <Bot size={20} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">NOVA Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#8b5cf6] text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10 bg-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask NOVA anything..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#8b5cf6]/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#8b5cf6] hover:text-[#a78bfa] disabled:text-white/20 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <SuggestionBtn label="Black Holes" onClick={() => setInput("Explain black holes like I'm 15")} />
                <SuggestionBtn label="Destroy Earth" onClick={() => setInput("How can I simulate Earth's destruction?")} />
                <SuggestionBtn label="Simulate" onClick={() => setInput("Launch the orbital simulation")} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SuggestionBtn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
    >
      {label}
    </button>
  );
}
