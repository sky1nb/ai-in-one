import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // AI View management
  createAIView: (url: string, aiType: string) =>
    ipcRenderer.invoke('create-ai-view', { url, aiType }),
  onWebviewCreate: (callback: (data: { url: string; aiType: string }) => void) => {
    ipcRenderer.on('create-webview', (_, data) => callback(data));
  },
  removeWebviewListener: () => {
    ipcRenderer.removeAllListeners('create-webview');
  },
  onToggleSplitView: (callback: () => void) => {
    ipcRenderer.on('toggle-split-view', () => callback());
  },
  removeSplitViewListener: () => {
    ipcRenderer.removeAllListeners('toggle-split-view');
  },

  // Always on Top
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  onAlwaysOnTopChanged: (callback: (isAlwaysOnTop: boolean) => void) => {
    ipcRenderer.on('always-on-top-changed', (_, isAlwaysOnTop) => callback(isAlwaysOnTop));
  },
  removeAlwaysOnTopListener: () => {
    ipcRenderer.removeAllListeners('always-on-top-changed');
  },

  // Quick AI Switch
  onQuickAISwitch: (callback: (data: { aiType: string; url: string }) => void) => {
    ipcRenderer.on('quick-ai-switch', (_, data) => callback(data));
  },
  removeQuickAISwitchListener: () => {
    ipcRenderer.removeAllListeners('quick-ai-switch');
  },

  // Prompt Library
  onOpenPromptLibrary: (callback: () => void) => {
    ipcRenderer.on('open-prompt-library', () => callback());
  },
  removePromptLibraryListener: () => {
    ipcRenderer.removeAllListeners('open-prompt-library');
  },

  // Settings
  saveWindowSettings: (settings: { width: number; height: number }) =>
    ipcRenderer.invoke('save-window-settings', settings),

  // External Browser OAuth
  loginWithBrowser: (aiType: string) =>
    ipcRenderer.invoke('login-with-browser', { aiType }),
  
  // Manual Cookie Injection
  injectGoogleCookies: (aiType: string, cookieString: string) =>
    ipcRenderer.invoke('inject-google-cookies', { aiType, cookieString }),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      createAIView: (url: string, aiType: string) => Promise<{ success: boolean }>;
      getFullScreenshot: () => Promise<{ thumbnail: string; id: string } | null>;
      onScreenshotCaptured: (callback: (data: { thumbnail: string; id: string }) => void) => void;
      removeScreenshotListener: () => void;
      savePrompt: (prompt: { title: string; content: string; category?: string }) => Promise<{ success: boolean; error?: string }>;
      loadPrompts: () => Promise<Array<{ id: string; title: string; content: string; category?: string; createdAt: string }>>;
      deletePrompt: (promptId: string) => Promise<{ success: boolean; error?: string }>;
      onWebviewCreate: (callback: (data: { url: string; aiType: string }) => void) => void;
      removeWebviewListener: () => void;
      onToggleSplitView: (callback: () => void) => void;
      removeSplitViewListener: () => void;
    };
  }
}
