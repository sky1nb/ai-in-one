import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Shortcut {
  id: string;
  name: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  category: 'window' | 'feature';
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'promptLibrary',
    name: 'Open Prompt Library',
    description: 'Quick access to template library',
    defaultKey: 'Ctrl+P',
    currentKey: 'Ctrl+P',
    category: 'feature',
  },
  {
    id: 'quickSwitch1',
    name: 'Quick Switch to ChatGPT',
    description: 'Instantly switch to ChatGPT',
    defaultKey: 'Ctrl+1',
    currentKey: 'Ctrl+1',
    category: 'feature',
  },
  {
    id: 'quickSwitch2',
    name: 'Quick Switch to Gemini',
    description: 'Instantly switch to Gemini',
    defaultKey: 'Ctrl+2',
    currentKey: 'Ctrl+2',
    category: 'feature',
  },
  {
    id: 'quickSwitch3',
    name: 'Quick Switch to Claude',
    description: 'Instantly switch to Claude',
    defaultKey: 'Ctrl+3',
    currentKey: 'Ctrl+3',
    category: 'feature',
  },
  {
    id: 'quickSwitch4',
    name: 'Quick Switch to Perplexity',
    description: 'Instantly switch to Perplexity',
    defaultKey: 'Ctrl+4',
    currentKey: 'Ctrl+4',
    category: 'feature',
  },
  {
    id: 'splitView',
    name: 'Toggle Split View',
    description: 'Use two AIs side-by-side',
    defaultKey: 'Ctrl+Shift+S',
    currentKey: 'Ctrl+Shift+S',
    category: 'feature',
  },
  {
    id: 'toggleApp',
    name: 'Show/Hide App',
    description: 'Toggle application visibility',
    defaultKey: 'Ctrl+Alt+A',
    currentKey: 'Ctrl+Alt+A',
    category: 'window',
  },
  {
    id: 'pinWindow',
    name: 'Pin Window (Always on Top)',
    description: 'Keep window above all others',
    defaultKey: 'Ctrl+Shift+P',
    currentKey: 'Ctrl+Shift+P',
    category: 'window',
  },
];

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'general'>('shortcuts');
  
  // Resolution settings
  const [windowWidth, setWindowWidth] = useState(1200);
  const [windowHeight, setWindowHeight] = useState(800);

  useEffect(() => {
    // Load saved shortcuts
    const saved = localStorage.getItem('ai-in-one-shortcuts');
    if (saved) {
      try {
        const parsedShortcuts = JSON.parse(saved);
        // Filter out old shortcuts (spotlight, screenshot) and keep valid ones
        const validShortcutIds = ['promptLibrary', 'quickSwitch1', 'quickSwitch2', 'quickSwitch3', 'quickSwitch4', 'splitView', 'toggleApp', 'pinWindow'];
        const validShortcuts = parsedShortcuts.filter((s: Shortcut) => 
          validShortcutIds.includes(s.id)
        );
        
        // If we filtered any out, update localStorage
        if (validShortcuts.length !== parsedShortcuts.length) {
          localStorage.setItem('ai-in-one-shortcuts', JSON.stringify(validShortcuts));
        }
        
        // Merge with defaults to add any new shortcuts
        const mergedShortcuts = DEFAULT_SHORTCUTS.map(defaultShortcut => {
          const saved = validShortcuts.find((s: Shortcut) => s.id === defaultShortcut.id);
          return saved || defaultShortcut;
        });
        
        setShortcuts(mergedShortcuts);
      } catch (e) {
        console.error('Failed to parse shortcuts:', e);
        // Reset to defaults if parsing fails
        setShortcuts(DEFAULT_SHORTCUTS);
        localStorage.setItem('ai-in-one-shortcuts', JSON.stringify(DEFAULT_SHORTCUTS));
      }
    } else {
      // Initialize with defaults
      setShortcuts(DEFAULT_SHORTCUTS);
    }
    
    // Load resolution settings
    const savedWidth = localStorage.getItem('ai-in-one-window-width');
    const savedHeight = localStorage.getItem('ai-in-one-window-height');
    if (savedWidth) setWindowWidth(parseInt(savedWidth));
    if (savedHeight) setWindowHeight(parseInt(savedHeight));
  }, []);

  const handleSaveShortcuts = async () => {
    localStorage.setItem('ai-in-one-shortcuts', JSON.stringify(shortcuts));
    localStorage.setItem('ai-in-one-window-width', windowWidth.toString());
    localStorage.setItem('ai-in-one-window-height', windowHeight.toString());
    
    // Save to electron userData
    if (window.electronAPI) {
      try {
        // @ts-ignore - We'll add this to types
        await window.electronAPI.saveWindowSettings?.({ width: windowWidth, height: windowHeight });
      } catch (e) {
        console.error('Failed to save window settings:', e);
      }
    }
    
    alert('Settings saved! Restart the app to apply window size changes.');
  };

  const handleResetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.setItem('ai-in-one-shortcuts', JSON.stringify(DEFAULT_SHORTCUTS));
    alert('Shortcuts reset to defaults!');
  };

  const handleKeyInput = (id: string, e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Cmd');
    
    const key = e.key.toUpperCase();
    // Ignore modifier keys alone
    if (key !== 'CONTROL' && key !== 'ALT' && key !== 'SHIFT' && key !== 'META' && key !== 'CAPSLOCK') {
      keys.push(key === ' ' ? 'Space' : key);
    }

    // Only save if we have at least one modifier + one key
    if (keys.length > 1) {
      const newKey = keys.join('+');
      setShortcuts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, currentKey: newKey } : s))
      );
      setEditingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          background: '#000000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Settings
          </h2>
          <motion.button
            onClick={onClose}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {(['shortcuts', 'general'] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ backgroundColor: activeTab === tab ? 'transparent' : 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                background: activeTab === tab ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                borderRadius: '6px',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginBottom: '4px' }}>
                      {shortcut.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {shortcut.description}
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setEditingId(shortcut.id)}
                    onKeyDown={(e) => {
                      if (editingId === shortcut.id) {
                        handleKeyInput(shortcut.id, e);
                      }
                    }}
                    onBlur={() => setEditingId(null)}
                    tabIndex={0}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      fontFamily: 'monospace',
                      color: editingId === shortcut.id ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      background: editingId === shortcut.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${editingId === shortcut.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '6px',
                      minWidth: '100px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {editingId === shortcut.id ? 'Press keys...' : shortcut.currentKey}
                  </motion.button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>
                  Window Resolution
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '16px' }}>
                  Set the default window size for the application.
                </p>
              </div>

              {/* Width */}
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                    Width (px)
                  </span>
                  <input
                    type="number"
                    value={windowWidth}
                    onChange={(e) => setWindowWidth(Math.max(800, Math.min(3840, parseInt(e.target.value) || 1200)))}
                    min="800"
                    max="3840"
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    Min: 800px, Max: 3840px
                  </span>
                </label>
              </div>

              {/* Height */}
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                    Height (px)
                  </span>
                  <input
                    type="number"
                    value={windowHeight}
                    onChange={(e) => setWindowHeight(Math.max(600, Math.min(2160, parseInt(e.target.value) || 800)))}
                    min="600"
                    max="2160"
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    Min: 600px, Max: 2160px
                  </span>
                </label>
              </div>

              {/* Preset Resolutions */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                  Quick Presets:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'HD', width: 1280, height: 720 },
                    { name: 'Full HD', width: 1920, height: 1080 },
                    { name: '2K', width: 2560, height: 1440 },
                    { name: '4K', width: 3840, height: 2160 },
                  ].map((preset) => (
                    <motion.button
                      key={preset.name}
                      onClick={() => {
                        setWindowWidth(preset.width);
                        setWindowHeight(preset.height);
                      }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.8)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                      }}
                    >
                      {preset.name} ({preset.width}×{preset.height})
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                }}
              >
                Preview: {windowWidth} × {windowHeight} px
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <motion.button
            onClick={handleResetShortcuts}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
            }}
          >
            Reset
          </motion.button>
          <motion.button
            onClick={handleSaveShortcuts}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#000000',
              background: '#ffffff',
              border: 'none',
              borderRadius: '6px',
            }}
          >
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
