import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TitleBarProps {
  onSettingsClick?: () => void;
}

export default function TitleBar({ onSettingsClick }: TitleBarProps) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    // Get initial state
    if (window.electronAPI?.getAlwaysOnTop) {
      window.electronAPI.getAlwaysOnTop().then(setIsPinned);
    }

    // Listen for changes
    if (window.electronAPI?.onAlwaysOnTopChanged) {
      window.electronAPI.onAlwaysOnTopChanged(setIsPinned);
    }

    return () => {
      if (window.electronAPI?.removeAlwaysOnTopListener) {
        window.electronAPI.removeAlwaysOnTopListener();
      }
    };
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  const handleTogglePin = async () => {
    if (window.electronAPI?.toggleAlwaysOnTop) {
      const newState = await window.electronAPI.toggleAlwaysOnTop();
      setIsPinned(newState);
    }
  };

  return (
    <div
      className="select-none"
      style={{
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#000000',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        // @ts-ignore
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Left: App Name */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-0.01em',
        }}
      >
        AI in One
      </motion.div>

      {/* Right: Controls */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px',
          // @ts-ignore
          WebkitAppRegion: 'no-drag',
        }}
      >
        {/* Pin (Always on Top) */}
        <motion.button
          onClick={handleTogglePin}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          whileTap={{ scale: 0.95 }}
          title={isPinned ? 'Unpin Window (Ctrl+Shift+P)' : 'Pin Window on Top (Ctrl+Shift+P)'}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: isPinned ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M9.5 6.5L6.5 9.5M11 3L13 5L9.5 8.5L11 13L8 10L3 15L1 13L6 8L3 5L7.5 6.5L11 3Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={isPinned ? 'currentColor' : 'none'}
              fillOpacity={isPinned ? '0.3' : '0'}
            />
          </svg>
        </motion.button>

        {/* Settings */}
        <motion.button
          onClick={onSettingsClick}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </motion.button>

        {/* Minimize */}
        <motion.button
          onClick={handleMinimize}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '40px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <svg width="12" height="1" viewBox="0 0 12 1">
            <rect width="12" height="1" fill="rgba(255,255,255,0.6)" />
          </svg>
        </motion.button>

        {/* Maximize */}
        <motion.button
          onClick={handleMaximize}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '40px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="1" y="1" width="8" height="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          </svg>
        </motion.button>

        {/* Close */}
        <motion.button
          onClick={handleClose}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '40px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
