import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, screen, desktopCapturer, session, protocol, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';

// Helper to get resource path - using app.getAppPath() which works at runtime
const getResourcePath = (...paths: string[]) => {
  const basePath = app.isPackaged 
    ? process.resourcesPath 
    : app.getAppPath();
  return path.join(basePath, ...paths);
};

const getPreloadPath = () => {
  if (app.isPackaged) {
    // In production, app.asar is in resources folder
    // __dirname in production = resources/app.asar/dist-electron
    // So we just need to go to ../dist-electron/preload.js from current location
    return path.join(__dirname, 'preload.js');
  }
  // In development, preload is in dist-electron after compilation
  return path.join(app.getAppPath(), 'dist-electron', 'preload.js');
};

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus existing window if user tries to open another instance
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let spotlightWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// User-Agent configurations
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

// Configure session for webviews - NO CACHE CLEARING
function configureWebviewSession(partitionName: string = 'persist:webview') {
  const ses = session.fromPartition(partitionName);
  
  // Set user agent
  ses.setUserAgent(DESKTOP_UA);
  
  // Note: Cache is enabled by default with persist: partition
  // No need to call setCacheSize (not available in all versions)
  
  // Allow all permissions
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true); // Silently allow
  });
  
  // Handle certificate errors - accept all
  ses.setCertificateVerifyProc((request, callback) => {
    callback(0);
  });
  
  // Configure webRequest to allow all connections
  ses.webRequest.onBeforeRequest((details, callback) => {
    callback({});
  });
  
  // Allow CORS and set proper headers
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders: Record<string, string[]> = {
      ...details.responseHeaders,
      'Access-Control-Allow-Origin': ['*'],
      'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
      'Access-Control-Allow-Headers': ['*'],
      'Access-Control-Allow-Credentials': ['true'],
    };
    
    // Remove restrictive headers
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    
    // For Google services
    if (details.url.includes('google.com') || details.url.includes('gstatic.com')) {
      try {
        const urlObj = new URL(details.url);
        responseHeaders['Referer'] = [details.url];
        responseHeaders['Origin'] = [urlObj.origin];
      } catch (e) {
        // Ignore
      }
    }
    
    callback({ responseHeaders });
  });
  
  // Handle network errors - suppress known issues
  ses.webRequest.onErrorOccurred((details) => {
    // Only log real errors, not cache misses or aborts
    if (details.error !== 'net::ERR_CACHE_MISS' && 
        details.error !== 'net::ERR_ABORTED' &&
        details.error !== 'net::ERR_FAILED') {
      console.error('Network error:', details.error, 'for URL:', details.url);
    }
  });
  
  return ses;
}

// 🔥 RADICAL SOLUTION: Unified Google OAuth Session
// All Google OAuth services share the SAME session for automatic cookie sync!
function configureAISessions() {
  console.log('🚀 RADICAL COOKIE SOLUTION: Unified Google session for all OAuth services');
  
  // STRATEGY: ChatGPT, Gemini, Perplexity all use SAME session
  // This ensures when you login to one, you're logged in to ALL!
  const googleSession = configureWebviewSession('persist:google-unified');
  const claudeSession = configureWebviewSession('persist:claude');
  
  // Configure Google unified session with iPad UA (bypasses "unsafe browser")
  googleSession.setUserAgent(IPAD_UA);
  googleSession.setProxy({ mode: 'direct' });
  googleSession.setPreloads([]);
  
  // Set iPad headers for all Google requests
  googleSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const { requestHeaders } = details;
    
    // iPad Safari identity
    requestHeaders['sec-ch-ua'] = '"Safari";v="16"';
    requestHeaders['sec-ch-ua-mobile'] = '?1';
    requestHeaders['sec-ch-ua-platform'] = '"iOS"';
    requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
    
    // Remove Electron fingerprints
    delete requestHeaders['X-Automation'];
    delete requestHeaders['Electron'];
    
    callback({ requestHeaders });
  });
  
  // Enable persistent cookies with NO expiration
  googleSession.cookies.on('changed', async (_event, cookie, _cause, removed) => {
    if (!removed && cookie.domain.includes('google')) {
      console.log(`🍪 Google cookie captured: ${cookie.name} for ${cookie.domain}`);
      
      // Force persistent storage (no expiration)
      try {
        await googleSession.cookies.set({
          url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
        });
      } catch (e) {
        // Ignore errors
      }
    }
  });
  
  // Claude uses desktop UA
  claudeSession.setUserAgent(DESKTOP_UA);
  
  console.log('✅ Google unified session: ChatGPT, Gemini, Perplexity share cookies');
  console.log('✅ Claude uses separate session');
  console.log('✅ iPad UA enabled for Google OAuth bypass');
  
  // Store session mapping for IPC handlers
  (global as any).sessionMap = {
    'chatgpt': 'persist:google-unified',
    'gemini': 'persist:google-unified',
    'perplexity': 'persist:google-unified',
    'claude': 'persist:claude',
  };
}

function createWindow() {
  // Load saved window size
  const userData = app.getPath('userData');
  const settingsPath = path.join(userData, 'window-settings.json');
  
  let windowWidth = 1400;
  let windowHeight = 900;
  
  try {
    const settingsData = require('fs').readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);
    windowWidth = settings.width || 1400;
    windowHeight = settings.height || 900;
    console.log(`Loaded window size: ${windowWidth}x${windowHeight}`);
  } catch (e) {
    console.log('No saved window settings, using defaults');
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#000000',
    skipTaskbar: false,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      webviewTag: true,
      allowRunningInsecureContent: true,
      partition: 'persist:main',
    },
    show: false,
    icon: getResourcePath('assets', 'icon.png'),
  });

  // Load the app
  if (isDev) {
    console.log('[DEV] Loading from http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: dist-electron and dist are both in app.asar root
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('[PROD] Loading index.html');
    console.log('[PROD] __dirname:', __dirname);
    console.log('[PROD] indexPath:', indexPath);
    
    mainWindow.loadFile(indexPath);
    // DevTools disabled in production for clean UX
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('[WINDOW] Ready to show');
    mainWindow?.show();
  });

  // Debug: webContents events
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[LOAD ERROR]', errorCode, errorDescription, 'URL:', validatedURL);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[LOAD] Page loaded successfully');
    console.log('[LOAD] Current URL:', mainWindow?.webContents.getURL());
  });

  // Log all console messages from renderer
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[RENDERER] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details.reason);
    if (details.reason !== 'clean-exit') {
      // Optionally reload the window
      console.log('Attempting to reload...');
      mainWindow?.reload();
    }
  });

  // Handle webview crashes
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    // Use render-process-gone instead of deprecated crashed event
    webContents.on('render-process-gone', (event, details) => {
      console.error('Webview render process gone:', details.reason);
      if (details.reason !== 'clean-exit') {
        console.log('Webview crashed, may need to reload');
      }
    });
    
    // Handle unresponsive webview
    webContents.on('unresponsive', () => {
      console.warn('Webview became unresponsive');
    });
    
    webContents.on('responsive', () => {
      console.log('Webview became responsive again');
    });
  });

  // Handle window controls
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });
}

// Always on top handlers (must be registered before app.whenReady)
ipcMain.handle('toggle-always-on-top', () => {
  if (!mainWindow) return false;
  
  const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
  console.log(`Always on top toggled: ${!isAlwaysOnTop}`);
  return !isAlwaysOnTop;
});

ipcMain.handle('get-always-on-top', () => {
  if (!mainWindow) return false;
  return mainWindow.isAlwaysOnTop();
});

function createTray() {
  // In production, assets are copied to dist by Vite
  const iconPath = isDev 
    ? getResourcePath('assets', 'icon.png')
    : path.join(__dirname, '..', 'dist', 'icon.png');
  
  console.log('[TRAY] Icon path:', iconPath);
  
  const trayIcon = nativeImage.createFromPath(iconPath);
  
  if (trayIcon.isEmpty()) {
    console.warn('Tray icon not found at:', iconPath);
    // Don't create tray if icon is missing
    return;
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('AI in One');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: 'Spotlight',
      click: () => {
        // TODO: Show spotlight window
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow?.show();
  });
}

function registerGlobalShortcuts() {
  // Ctrl+Shift+S (Cmd+Shift+S on Mac) for Split View
  const splitShortcut = process.platform === 'darwin' ? 'Cmd+Shift+S' : 'Ctrl+Shift+S';
  globalShortcut.register(splitShortcut, () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-split-view');
    }
  });

  // Ctrl+Alt+A (Cmd+Alt+A on Mac) for Show/Hide App
  const toggleShortcut = process.platform === 'darwin' ? 'Cmd+Alt+A' : 'Ctrl+Alt+A';
  globalShortcut.register(toggleShortcut, () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Ctrl+Shift+P (Cmd+Shift+P on Mac) for Pin/Always on Top Toggle
  const pinShortcut = process.platform === 'darwin' ? 'Cmd+Shift+P' : 'Ctrl+Shift+P';
  globalShortcut.register(pinShortcut, () => {
    console.log('Pin toggle triggered');
    if (mainWindow) {
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
      mainWindow.webContents.send('always-on-top-changed', !isAlwaysOnTop);
      console.log(`Always on top: ${!isAlwaysOnTop}`);
    }
  });

  // Quick AI Switch shortcuts
  const aiShortcuts = [
    { key: '1', aiType: 'chatgpt', url: 'https://chat.openai.com' },
    { key: '2', aiType: 'gemini', url: 'https://gemini.google.com' },
    { key: '3', aiType: 'claude', url: 'https://claude.ai' },
    { key: '4', aiType: 'perplexity', url: 'https://www.perplexity.ai' },
  ];

  aiShortcuts.forEach(({ key, aiType, url }) => {
    const shortcut = process.platform === 'darwin' ? `Cmd+${key}` : `Ctrl+${key}`;
    const registered = globalShortcut.register(shortcut, () => {
      console.log(`Quick switch to ${aiType}`);
      if (mainWindow) {
        mainWindow.webContents.send('quick-ai-switch', { aiType, url });
      }
    });
    if (registered) {
      console.log(`Registered quick switch: ${shortcut} → ${aiType}`);
    } else {
      console.warn(`Failed to register: ${shortcut}`);
    }
  });

  // Ctrl+P for Prompt Library
  const promptLibraryShortcut = process.platform === 'darwin' ? 'Cmd+P' : 'Ctrl+P';
  globalShortcut.register(promptLibraryShortcut, () => {
    console.log('Prompt Library triggered');
    if (mainWindow) {
      mainWindow.webContents.send('open-prompt-library');
    }
  });
}

async function captureScreenshot() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 3840, height: 2160 },
    });

    const primarySource = sources.find(source => source.name === 'Entire Screen' || source.name === 'Screen 1') || sources[0];
    
    if (mainWindow) {
      mainWindow.webContents.send('screenshot-captured', {
        thumbnail: primarySource.thumbnail.toDataURL(),
        id: primarySource.id,
      });
    }
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
}

// Share cookies between Google services (SSO)
async function shareGoogleCookies(targetAiType: string) {
  try {
    // All AIs that use Google OAuth
    const googleAIs = ['gemini', 'chatgpt', 'perplexity'];
    const targetSession = session.fromPartition(`persist:webview-${targetAiType}`);
    
    for (const aiType of googleAIs) {
      if (aiType === targetAiType) continue;
      
      const sourceSession = session.fromPartition(`persist:webview-${aiType}`);
      const cookies = await sourceSession.cookies.get({});
      
      for (const cookie of cookies) {
        if (cookie.domain?.includes('google.com') || cookie.domain?.includes('openai.com') || cookie.domain?.includes('perplexity.ai')) {
          try {
            await targetSession.cookies.set({
              url: `https://${cookie.domain}${cookie.path}`,
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
              path: cookie.path,
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              expirationDate: cookie.expirationDate,
            });
          } catch (e) {
            // Ignore individual cookie errors
          }
        }
      }
    }
    console.log(`✅ Shared Google cookies for ${targetAiType}`);
  } catch (error) {
    console.error('Error sharing cookies:', error);
  }
}

// IPC Handlers
ipcMain.handle('create-ai-view', async (event, { url, aiType }) => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'Main window not available' };
    }

    // Share cookies if Google service
    if (url.includes('google.com') || aiType === 'gemini') {
      await shareGoogleCookies(aiType);
    }

    // Send message to renderer
    mainWindow.webContents.send('create-webview', { url, aiType });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating AI view:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-webview-url', async (event, { url, aiType }) => {
  return { url, aiType };
});

ipcMain.handle('get-full-screenshot', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 3840, height: 2160 },
    });

    const primarySource = sources.find(source => source.name === 'Entire Screen' || source.name === 'Screen 1') || sources[0];
    
    return {
      thumbnail: primarySource.thumbnail.toDataURL(),
      id: primarySource.id,
    };
  } catch (error) {
    console.error('Error getting full screenshot:', error);
    return null;
  }
});

ipcMain.handle('save-prompt', async (event, prompt) => {
  const promptsPath = path.join(app.getPath('userData'), 'prompts.json');
  
  try {
    let prompts: Array<{ id: string; [key: string]: unknown }> = [];
    try {
      const data = await fs.readFile(promptsPath, 'utf-8');
      prompts = JSON.parse(data) as Array<{ id: string; [key: string]: unknown }>;
    } catch {
      // File doesn't exist
    }

    prompts.push({
      id: Date.now().toString(),
      ...prompt,
      createdAt: new Date().toISOString(),
    } as { id: string; [key: string]: unknown });

    await fs.writeFile(promptsPath, JSON.stringify(prompts, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving prompt:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-prompts', async () => {
  const promptsPath = path.join(app.getPath('userData'), 'prompts.json');
  
  try {
    const data = await fs.readFile(promptsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
});

ipcMain.handle('delete-prompt', async (event, promptId) => {
  const promptsPath = path.join(app.getPath('userData'), 'prompts.json');
  
  try {
    let prompts: Array<{ id: string; [key: string]: unknown }> = [];
    try {
      const data = await fs.readFile(promptsPath, 'utf-8');
      prompts = JSON.parse(data) as Array<{ id: string; [key: string]: unknown }>;
    } catch {
      return { success: false, error: 'No prompts file found' };
    }

    prompts = prompts.filter((p) => p.id !== promptId);
    await fs.writeFile(promptsPath, JSON.stringify(prompts, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return { success: false, error: String(error) };
  }
});

// Save window settings
ipcMain.handle('save-window-settings', async (event, { width, height }) => {
  const settingsPath = path.join(app.getPath('userData'), 'window-settings.json');
  
  try {
    const settings = { width, height };
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`Window settings saved: ${width}x${height}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving window settings:', error);
    return { success: false, error: String(error) };
  }
});

// External Browser OAuth - Open in default browser
ipcMain.handle('login-with-browser', async (event, { aiType }) => {
  try {
    const authUrls: Record<string, string> = {
      chatgpt: 'https://chat.openai.com',
      gemini: 'https://gemini.google.com',
      perplexity: 'https://www.perplexity.ai',
      claude: 'https://claude.ai',
    };

    const url = authUrls[aiType];
    if (!url) {
      return { success: false, error: 'Unknown AI type' };
    }

    // Open in default browser
    await shell.openExternal(url);
    
    console.log(`🌐 Opened ${aiType} in external browser for login`);
    
    // 🔥 RADICAL: Try to sync cookies from default session after a delay
    // This attempts to capture any shared session cookies
    setTimeout(async () => {
      try {
        const sessionMap: Record<string, string> = (global as any).sessionMap || {};
        const partitionName = sessionMap[aiType] || `persist:webview-${aiType}`;
        const targetSession = session.fromPartition(partitionName);
        
        // Get all Google cookies from default session
        const defaultCookies = await session.defaultSession.cookies.get({ domain: '.google.com' });
        
        console.log(`🔄 Attempting to sync ${defaultCookies.length} Google cookies to ${aiType}...`);
        
        // Inject into target session
        for (const cookie of defaultCookies) {
          try {
            await targetSession.cookies.set({
              url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path}`,
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
              path: cookie.path,
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              expirationDate: cookie.expirationDate || Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
            });
            console.log(`  ✓ Injected cookie: ${cookie.name}`);
          } catch (e) {
            // Skip failed cookies
          }
        }
        
        console.log(`✅ Cookie sync complete for ${aiType}`);
      } catch (error) {
        console.error('Cookie sync failed:', error);
      }
    }, 3000); // Wait 3s for user to login in browser
    
    return { 
      success: true, 
      message: `${aiType} opened in your default browser. Please login there.` 
    };
  } catch (error) {
    console.error('Error opening external browser:', error);
    return { success: false, error: String(error) };
  }
});

// 🔥 RADICAL: Manual cookie injection API for advanced users
ipcMain.handle('inject-google-cookies', async (event, { aiType, cookieString }) => {
  try {
    const sessionMap: Record<string, string> = (global as any).sessionMap || {};
    const partitionName = sessionMap[aiType] || `persist:webview-${aiType}`;
    const targetSession = session.fromPartition(partitionName);
    
    // Parse cookie string (format: name1=value1; name2=value2; ...)
    const cookies = cookieString.split(';').map((c: string) => c.trim());
    let injected = 0;
    
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name && value) {
        try {
          await targetSession.cookies.set({
            url: 'https://google.com',
            name: name.trim(),
            value: value.trim(),
            domain: '.google.com',
            path: '/',
            secure: true,
            httpOnly: false,
            expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          });
          injected++;
        } catch (e) {
          // Skip
        }
      }
    }
    
    console.log(`✅ Manually injected ${injected} cookies for ${aiType}`);
    return { success: true, count: injected };
  } catch (error) {
    console.error('Manual cookie injection failed:', error);
    return { success: false, error: String(error) };
  }
});

// RADICAL BYPASS: Chrome command-line flags to disable automation detection
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-features', 'CrossSiteDocumentBlockingIfIsolating,CrossSiteDocumentBlockingAlways,IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('disable-dev-shm-usage');
console.log('🔓 Chrome automation detection disabled');

app.whenReady().then(() => {
  // Register custom protocol for loading local files in production
  if (!isDev) {
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = request.url.replace('app://', '');
      const filePath = path.join(__dirname, '..', 'dist', url);
      callback({ path: filePath });
    });
  }

  // Configure default session - NO CACHE CLEARING
  const defaultSession = session.defaultSession;
  
  // Note: Cache is enabled by default
  // No need to call setCacheSize
  
  // Set user agent
  defaultSession.setUserAgent(DESKTOP_UA);
  
  // Allow all permissions silently
  defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  
  // Accept all certificates
  defaultSession.setCertificateVerifyProc((request, callback) => {
    callback(0);
  });
  
  // Configure CORS
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders: Record<string, string[]> = {
      ...details.responseHeaders,
      'Access-Control-Allow-Origin': ['*'],
      'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
      'Access-Control-Allow-Headers': ['*'],
      'Access-Control-Allow-Credentials': ['true'],
    };
    
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    
    callback({ responseHeaders });
  });
  
  // Suppress common errors
  defaultSession.webRequest.onErrorOccurred((details) => {
    if (details.error !== 'net::ERR_CACHE_MISS' && 
        details.error !== 'net::ERR_ABORTED' &&
        details.error !== 'net::ERR_FAILED') {
      console.error('Default session error:', details.error);
    }
  });

  // Configure AI sessions
  configureAISessions();
  
  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
