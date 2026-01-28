// Type definitions for Electron API exposed via ContextBridge

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  createAIView: (url: string, aiType: string) => Promise<{ success: boolean }>;
  onWebviewCreate: (callback: (data: { url: string; aiType: string }) => void) => void;
  removeWebviewListener: () => void;
  onToggleSplitView: (callback: () => void) => void;
  removeSplitViewListener: () => void;
  toggleAlwaysOnTop: () => Promise<boolean>;
  getAlwaysOnTop: () => Promise<boolean>;
  onAlwaysOnTopChanged: (callback: (isAlwaysOnTop: boolean) => void) => void;
  removeAlwaysOnTopListener: () => void;
  onQuickAISwitch: (callback: (data: { aiType: string; url: string }) => void) => void;
  removeQuickAISwitchListener: () => void;
  onOpenPromptLibrary: (callback: () => void) => void;
  removePromptLibraryListener: () => void;
  saveWindowSettings: (settings: { width: number; height: number }) => Promise<{ success: boolean; error?: string }>;
  loginWithBrowser: (aiType: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  injectGoogleCookies: (aiType: string, cookieString: string) => Promise<{ success: boolean; count?: number; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
