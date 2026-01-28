import { motion } from 'framer-motion';
import { useState } from 'react';

const AI_SERVICES = [
  { id: 'chatgpt', name: 'ChatGPT', icon: './chatgpt.png', url: 'https://chat.openai.com' },
  { id: 'gemini', name: 'Gemini', icon: './gemini.png', url: 'https://gemini.google.com' },
  { id: 'claude', name: 'Claude', icon: './claude.png', url: 'https://claude.ai' },
  { id: 'perplexity', name: 'Perplexity', icon: './perplexity.png', url: 'https://www.perplexity.ai' },
];

export default function AISelector() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAIClick = (ai: typeof AI_SERVICES[0]) => {
    console.log('=== AI CLICK DEBUG ===');
    console.log('AI:', ai.id, ai.url);
    console.log('electronAPI exists?', !!window.electronAPI);
    console.log('createAIView exists?', !!window.electronAPI?.createAIView);
    
    setLoading(ai.id);
    setTimeout(() => setLoading(null), 500);
    
    if (window.electronAPI?.createAIView) {
      console.log('Calling createAIView...');
      window.electronAPI.createAIView(ai.url, ai.id)
        .then((result: any) => console.log('createAIView result:', result))
        .catch((err: any) => console.error('createAIView error:', err));
    } else {
      console.error('ERROR: electronAPI.createAIView not available!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
      {AI_SERVICES.map((ai, index) => (
        <motion.button
          key={ai.id}
          onClick={() => handleAIClick(ai)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ 
            scale: 1.05,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
          whileTap={{ scale: 0.95 }}
          disabled={loading === ai.id}
          onMouseEnter={(e) => {
            const img = e.currentTarget.querySelector('img');
            if (img) img.style.filter = 'grayscale(0%) brightness(1) contrast(1)';
          }}
          onMouseLeave={(e) => {
            const img = e.currentTarget.querySelector('img');
            if (img) img.style.filter = 'grayscale(100%) brightness(10) contrast(1)';
          }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: loading === ai.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          }}
        >
          <img
            src={ai.icon}
            alt={ai.name}
            style={{
              width: '28px',
              height: '28px',
              objectFit: 'contain',
              opacity: loading === ai.id ? 0.5 : 1,
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
              fallback.style.fontSize = '24px';
              fallback.textContent = emojiMap[ai.id] || '🤖';
              (e.target as HTMLImageElement).parentElement?.prepend(fallback);
            }}
          />
        </motion.button>
      ))}
    </div>
  );
}
