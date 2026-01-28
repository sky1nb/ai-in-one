import { motion } from 'framer-motion';
import AISelector from './AISelector';

interface SidebarProps {
  onHomeClick: () => void;
  onSettingsClick?: () => void;
  onPromptLibraryClick?: () => void;
}

export default function Sidebar({ onHomeClick, onSettingsClick, onPromptLibraryClick }: SidebarProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '72px',
        height: '100%',
        background: '#000000',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: '12px',
      }}
    >
      {/* Home */}
      <motion.button
        onClick={onHomeClick}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10l7-7 7 7M4 9v9a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h0a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>

      {/* Divider */}
      <div style={{ width: '32px', height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

      {/* AI Services */}
      <div style={{ flex: 1, width: '100%', overflow: 'auto' }}>
        <AISelector />
      </div>

      {/* Divider */}
      <div style={{ width: '32px', height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Prompt Library */}
      <motion.button
        onClick={onPromptLibraryClick}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        whileTap={{ scale: 0.95 }}
        title="Prompt Library (Ctrl+P)"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      </motion.button>

      {/* Settings */}
      <motion.button
        onClick={onSettingsClick}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
