import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  onSelectAI: (aiId: string) => void;
}

const AI_URL_MAP: Record<string, string> = {
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  claude: 'https://claude.ai',
  perplexity: 'https://www.perplexity.ai',
};

const AI_SERVICES = [
  { id: 'chatgpt', name: 'ChatGPT', icon: './chatgpt.png' },
  { id: 'gemini', name: 'Gemini', icon: './gemini.png' },
  { id: 'claude', name: 'Claude', icon: './claude.png' },
  { id: 'perplexity', name: 'Perplexity', icon: './perplexity.png' },
];

export default function SplashScreen({ onComplete, onSelectAI }: SplashScreenProps) {
  const [showDock, setShowDock] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowDock(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectAI = (aiId: string) => {
    if (window.electronAPI) {
      window.electronAPI.createAIView(AI_URL_MAP[aiId], aiId);
    }
    onSelectAI(aiId);
    setTimeout(() => onComplete(), 200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {/* Title - Perfectly Centered using Flexbox */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          textAlign: 'center',
          marginBottom: '80px',
        }}
      >
        <h1
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '84px',
            letterSpacing: '-0.05em',
            lineHeight: '1',
            color: '#ffffff',
            margin: 0,
            padding: 0,
            whiteSpace: 'nowrap',
          }}
        >
          AI in One
        </h1>
        <p
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: '15px',
            letterSpacing: '0.01em',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '12px',
          }}
        >
          Your All-in-One AI Workspace
        </p>
      </motion.div>

      {/* Dock - Bottom */}
      {showDock && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            bottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '22px',
            }}
          >
            {AI_SERVICES.map((ai, index) => (
              <motion.div
                key={ai.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                onMouseEnter={() => setHoveredId(ai.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ position: 'relative' }}
              >
                <motion.button
                  onClick={() => handleSelectAI(ai.id)}
                  whileHover={{ scale: 1.08, y: -6 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.filter = 'grayscale(0%) brightness(1) contrast(1)';
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.filter = 'grayscale(100%) brightness(10) contrast(1)';
                  }}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <img
                    src={ai.icon}
                    alt={ai.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      objectFit: 'contain',
                      filter: 'grayscale(100%) brightness(10) contrast(1)',
                      transition: 'filter 0.3s ease',
                    }}
                    onError={(e) => {
                      const emojiMap: Record<string, string> = {
                        chatgpt: '🤖',
                        gemini: '💎',
                        claude: '🧠',
                        perplexity: '🔍',
                      };
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.style.fontSize = '32px';
                      fallback.textContent = emojiMap[ai.id] || '🤖';
                      (e.target as HTMLImageElement).parentElement?.prepend(fallback);
                    }}
                  />
                </motion.button>
                
                {/* Tooltip */}
                {hoveredId === ai.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      top: '-46px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 14px',
                      background: 'rgba(255, 255, 255, 0.96)',
                      color: '#000000',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {ai.name}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* C&S Credit - Very small text below dock */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              color: '#ffffff',
              letterSpacing: '0.5px',
              marginTop: '4px',
            }}
          >
            C&S
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
