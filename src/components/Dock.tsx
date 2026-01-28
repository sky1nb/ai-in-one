import { motion } from 'framer-motion';
import { useState } from 'react';

const AI_SERVICES = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '/chatgpt.png',
    color: 'from-green-500/30 to-emerald-500/30',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '/gemini.png',
    color: 'from-blue-500/30 to-cyan-500/30',
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '/claude.png',
    color: 'from-purple-500/30 to-pink-500/30',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '/perplexity.png',
    color: 'from-orange-500/30 to-red-500/30',
  },
];

interface DockProps {
  onSelectAI: (aiId: string) => void;
}

export default function Dock({ onSelectAI }: DockProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="flex items-center justify-center gap-4 px-8 py-5 glass-dark rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {AI_SERVICES.map((ai, index) => (
          <motion.div
            key={ai.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="relative"
            onMouseEnter={() => setHoveredId(ai.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <motion.button
              onClick={() => onSelectAI(ai.id)}
              whileHover={{ scale: 1.2, y: -12 }}
              whileTap={{ scale: 0.9 }}
              className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${ai.color} border-2 border-white/20 flex items-center justify-center transition-all duration-300 group overflow-hidden`}
              style={{
                boxShadow: hoveredId === ai.id 
                  ? '0 20px 50px rgba(255, 255, 255, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                  : '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={hoveredId === ai.id ? { x: '200%' } : { x: '-100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              <img
                src={ai.icon}
                alt={ai.name}
                className="relative z-10 w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110 filter drop-shadow-lg"
                onError={(e) => {
                  const emojiMap: Record<string, string> = {
                    chatgpt: '🤖',
                    gemini: '💎',
                    claude: '🧠',
                    perplexity: '🔍',
                  };
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.className = 'text-2xl';
                  fallback.textContent = emojiMap[ai.id] || '🤖';
                  (e.target as HTMLImageElement).parentElement?.prepend(fallback);
                }}
              />
              
              {/* Tooltip */}
              {hoveredId === ai.id && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 glass-dark rounded-xl text-sm font-semibold whitespace-nowrap pointer-events-none border border-white/10 shadow-xl"
                >
                  {ai.name}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white/10" />
                </motion.div>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
