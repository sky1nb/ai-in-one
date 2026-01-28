import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import AIViewContainer from './components/AIViewContainer';
import SplashScreen from './components/SplashScreen';
import Settings from './components/Settings';
import PromptLibraryModal from './components/PromptLibraryModal';
import { PromptTemplate } from './types/prompt';

const AI_URL_MAP: Record<string, string> = {
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  claude: 'https://claude.ai',
  perplexity: 'https://www.perplexity.ai',
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [pendingView, setPendingView] = useState<{ url: string; aiType: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

  const handleSelectAI = (aiId: string) => {
    const url = AI_URL_MAP[aiId];
    // Store pending view to pass to AIViewContainer after splash
    setPendingView({ url, aiType: aiId });
    // Also trigger via IPC as backup
    if (window.electronAPI) {
      window.electronAPI.createAIView(url, aiId);
    }
  };

  // Clear pending view after splash is hidden
  useEffect(() => {
    if (!showSplash && pendingView) {
      // Small delay to ensure AIViewContainer is mounted
      const timer = setTimeout(() => {
        setPendingView(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showSplash, pendingView]);

  // Listen for Prompt Library shortcut
  useEffect(() => {
    const handleOpenPromptLibrary = () => {
      setShowPromptLibrary(true);
    };

    window.electronAPI?.onOpenPromptLibrary(handleOpenPromptLibrary);

    return () => {
      window.electronAPI?.removePromptLibraryListener();
    };
  }, []);

  const handleSelectTemplate = (template: PromptTemplate, filledPrompt: string) => {
    console.log('Selected template:', template.name);
    console.log('Filled prompt:', filledPrompt);
    // TODO: Copy to clipboard or send to active AI
    navigator.clipboard.writeText(filledPrompt);
    alert('Prompt copied to clipboard! Paste it into your AI chat.');
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen 
            onComplete={() => setShowSplash(false)} 
            onSelectAI={handleSelectAI}
          />
        )}
      </AnimatePresence>
      
      {!showSplash && (
        <motion.div
          className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <TitleBar onSettingsClick={() => setShowSettings(true)} />
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Always visible */}
            <Sidebar 
              onHomeClick={() => setShowSplash(true)} 
              onSettingsClick={() => setShowSettings(true)}
              onPromptLibraryClick={() => setShowPromptLibrary(true)}
            />
            {/* Main content area */}
            <div className="flex-1 relative">
              <AIViewContainer initialView={pendingView} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Prompt Library Modal */}
      <AnimatePresence>
        {showPromptLibrary && (
          <PromptLibraryModal
            isOpen={showPromptLibrary}
            onClose={() => setShowPromptLibrary(false)}
            onSelectTemplate={handleSelectTemplate}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
