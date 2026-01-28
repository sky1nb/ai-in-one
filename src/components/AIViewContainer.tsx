import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import WebView from './WebView';

interface ActiveView {
  url: string;
  aiType: string;
}

interface AIViewContainerProps {
  initialView?: { url: string; aiType: string } | null;
}

export default function AIViewContainer({ initialView }: AIViewContainerProps) {
  const [activeViews, setActiveViews] = useState<ActiveView[]>([]);
  const [splitMode, setSplitMode] = useState(false);

  // Handle initial view from splash screen
  useEffect(() => {
    if (initialView) {
      setActiveViews([initialView]);
    }
  }, [initialView]);

  const toggleSplitMode = () => {
    setSplitMode((prev) => {
      const newMode = !prev;
      // If disabling split and we have 2 views, keep only the first
      if (!newMode) {
        setActiveViews((currentViews) => {
          if (currentViews.length > 1) {
            return [currentViews[0]];
          }
          return currentViews;
        });
      }
      return newMode;
    });
  };

  const handleClose = (aiType: string) => {
    setActiveViews((prev) => prev.filter((v) => v.aiType !== aiType));
  };

  useEffect(() => {
    const handleWebviewCreate = (data: { url: string; aiType: string }) => {
      setActiveViews((prev) => {
        // If same AI is already open, don't add duplicate
        if (prev.some((v) => v.aiType === data.aiType)) {
          return prev;
        }
        // If split mode is off and we have a view, replace it
        if (!splitMode && prev.length > 0) {
          return [{ url: data.url, aiType: data.aiType }];
        }
        // Otherwise add new view (max 2 for split)
        if (prev.length < 2) {
          return [...prev, { url: data.url, aiType: data.aiType }];
        }
        return prev;
      });
    };

    const handleToggleSplitView = () => {
      toggleSplitMode();
    };

    const handleQuickAISwitch = (data: { aiType: string; url: string }) => {
      console.log('Quick AI switch:', data.aiType);
      setActiveViews((prev) => {
        // If split mode is off, replace current view
        if (!splitMode) {
          return [{ url: data.url, aiType: data.aiType }];
        }
        // If split mode is on and we have less than 2 views, add it
        if (prev.length < 2) {
          // Check if this AI is already open
          if (prev.some((v) => v.aiType === data.aiType)) {
            return prev;
          }
          return [...prev, { url: data.url, aiType: data.aiType }];
        }
        // If split mode and we have 2 views, replace the second one
        return [prev[0], { url: data.url, aiType: data.aiType }];
      });
    };

    window.electronAPI?.onWebviewCreate(handleWebviewCreate);
    window.electronAPI?.onToggleSplitView(handleToggleSplitView);
    window.electronAPI?.onQuickAISwitch(handleQuickAISwitch);

    return () => {
      window.electronAPI?.removeWebviewListener();
      window.electronAPI?.removeSplitViewListener();
      window.electronAPI?.removeQuickAISwitchListener();
    };
  }, [splitMode]);

  return (
    <motion.div
      className="relative bg-[#0a0a0a] flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Split Mode Toggle - Bottom Left */}
      {activeViews.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <button
            onClick={toggleSplitMode}
            className={`px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/20 rounded-lg transition-all shadow-lg ${
              splitMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-300'
            }`}
            title={splitMode ? 'Disable Split View' : 'Enable Split View (Ctrl+Shift+S)'}
          >
            {splitMode ? '⊞ Single' : '⊞ Split'}
          </button>
        </div>
      )}

      {/* Views Container */}
      <div 
        className={`flex flex-1 ${splitMode && activeViews.length > 1 ? 'flex-row' : 'flex-col'}`}
        style={{ 
          width: '100%',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {activeViews.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ width: '100%', height: '100%' }}
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Select an AI Service
              </h2>
              <p className="text-gray-400 text-sm font-medium">
                Choose from the sidebar to get started
              </p>
              <div className="mt-8 flex gap-2 justify-center text-xs text-gray-500">
                <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Alt+Space</kbd>
                <span>Spotlight</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Alt+S</kbd>
                <span>Screenshot</span>
              </div>
            </div>
          </motion.div>
        ) : (
          activeViews.map((view) => (
            <motion.div
              key={view.aiType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`relative flex-1 ${
                splitMode && activeViews.length > 1
                  ? 'border-r border-white/5'
                  : ''
              }`}
              style={{ 
                width: splitMode && activeViews.length > 1 ? '50%' : '100%',
                height: '100%',
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <WebView
                url={view.url}
                aiType={view.aiType}
                onClose={() => handleClose(view.aiType)}
              />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
