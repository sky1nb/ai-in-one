import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExternalLoginButton from './ExternalLoginButton';

interface WebViewProps {
  url: string;
  aiType: string;
  onClose: () => void;
}

export default function WebView({ url, aiType }: WebViewProps) {
  const webviewRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExternalLogin, setShowExternalLogin] = useState(false);

  useEffect(() => {
    // Wait for webview to be ready
    const checkWebview = () => {
      if (webviewRef.current) {
        const webview = webviewRef.current as any;
        
        // Note: partition is already set in JSX as prop - don't set it here again!
        // Setting partition after navigation causes "The object has already navigated" error
        
        const handleDomReady = () => {
          console.log('Webview DOM ready for', aiType);
          
          // Special handling for each AI service
          // Use iPad UA for all Google OAuth services (proven method)
          let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
          
          if (aiType === 'gemini' || aiType === 'chatgpt' || aiType === 'perplexity' || url.includes('google.com') || url.includes('accounts.google.com')) {
            // Use iPad UA for Google services to bypass "unsafe browser" restriction
            // This is the PROVEN METHOD that works without complex scripts!
            userAgent = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
            console.log(`✅ Using iPad UA for ${aiType} to bypass Google OAuth restrictions`);
          } else if (aiType === 'claude') {
            // Use latest Chrome UA for Claude
            userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
          }
          
          webview.setUserAgent(userAgent);
          console.log('Set User-Agent for', aiType, ':', userAgent.substring(0, 80));
        };

        const handleLoad = () => {
          console.log('Webview loaded:', url, 'for', aiType);
          setLoading(false);
          setError(null);
        };

        const handleError = (event: any) => {
          console.error('Webview error for', aiType, ':', event);
          // Don't show error immediately, wait a bit for retry
          setTimeout(() => {
            if (loading) {
              setLoading(false);
              setError(`Failed to load ${aiType}. Retrying...`);
              // Auto retry
              setTimeout(() => {
                if (webviewRef.current) {
                  (webviewRef.current as any).reload();
                }
              }, 2000);
            }
          }, 3000);
        };

        // Handle render process crashes (use new event, not deprecated 'crashed')
        const handleRenderProcessGone = (event: any) => {
          console.error('Webview render process gone for', aiType, ':', event.detail);
          setLoading(true);
          setError('Webview crashed. Reloading...');
          // Auto reload after crash
          setTimeout(() => {
            if (webviewRef.current) {
              setError(null);
              (webviewRef.current as any).reload();
            }
          }, 1000);
        };

        // Handle unresponsive webview
        const handleUnresponsive = () => {
          console.warn('Webview became unresponsive for', aiType);
        };

        const handleResponsive = () => {
          console.log('Webview became responsive again for', aiType);
        };

        webview.addEventListener('dom-ready', handleDomReady);
        webview.addEventListener('did-finish-load', handleLoad);
        webview.addEventListener('did-fail-load', handleError);
        webview.addEventListener('did-start-loading', () => {
          console.log('Webview started loading:', aiType);
        });
        
        // Modern crash handling - use 'render-process-gone' not 'crashed'
        webview.addEventListener('render-process-gone', handleRenderProcessGone);
        webview.addEventListener('unresponsive', handleUnresponsive);
        webview.addEventListener('responsive', handleResponsive);

        return () => {
          webview.removeEventListener('dom-ready', handleDomReady);
          webview.removeEventListener('did-finish-load', handleLoad);
          webview.removeEventListener('did-fail-load', handleError);
          webview.removeEventListener('did-start-loading', () => {});
          webview.removeEventListener('render-process-gone', handleRenderProcessGone);
          webview.removeEventListener('unresponsive', handleUnresponsive);
          webview.removeEventListener('responsive', handleResponsive);
        };
      }
      return undefined;
    };

    // Use setTimeout to ensure webview is mounted
    const timer = setTimeout(() => {
      checkWebview();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [url, aiType, loading]);

  // Create partition based on AI type
  const partition = `persist:webview-${aiType}`;

  const aiNames: Record<string, string> = {
    chatgpt: 'ChatGPT',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    claude: 'Claude',
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-[#0a0a0a] relative"
      style={{ 
        width: '100%',
        height: '100%',
        minWidth: '100%',
        minHeight: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* External Login Button Overlay */}
      <AnimatePresence>
        {showExternalLogin && (
          <ExternalLoginButton
            aiType={aiType}
            aiName={aiNames[aiType] || aiType}
            onSuccess={() => {
              setShowExternalLogin(false);
              setError(null);
              setLoading(true);
              if (webviewRef.current) {
                (webviewRef.current as any).reload();
              }
            }}
            onClose={() => setShowExternalLogin(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && !showExternalLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10"
            style={{ 
              width: '100%', 
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 text-sm font-medium">Loading {aiType}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !showExternalLogin ? (
        <div 
          className="absolute inset-0 flex items-center justify-center" 
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
          }}
        >
          <div className="text-center space-y-4">
            <p className="text-red-400">{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (webviewRef.current) {
                    (webviewRef.current as any).reload();
                  }
                }}
                className="px-4 py-2 glass rounded hover:bg-white/10 transition-colors"
              >
                Retry
              </button>
              {(aiType === 'chatgpt' || aiType === 'gemini' || aiType === 'perplexity') && (
                <button
                  onClick={() => {
                    setError(null);
                    setShowExternalLogin(true);
                  }}
                  className="px-4 py-2 glass rounded hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)' }}
                >
                  🌐 Login in Browser
                </button>
              )}
            </div>
          </div>
        </div>
      ) : !showExternalLogin ? (
        <webview
          ref={webviewRef}
          src={url}
          partition={partition}
          style={{
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            display: 'flex',
            flex: '1 1 auto',
          }}
          allowpopups
          disablewebsecurity
          useragent={
            (aiType === 'chatgpt' || aiType === 'perplexity' || aiType === 'gemini')
              ? 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
              : undefined
          }
          webpreferences="allowRunningInsecureContent=yes, javascript=yes, webSecurity=no, nodeIntegration=no, contextIsolation=yes, sandbox=no"
        />
      ) : null}

      {/* Quick access button to show external login */}
      {!showExternalLogin && !loading && !error && (aiType === 'chatgpt' || aiType === 'gemini' || aiType === 'perplexity') && (
        <motion.button
          onClick={() => setShowExternalLogin(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.6, y: 0 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
          }}
        >
          🔐 Login Issues? Try Browser
        </motion.button>
      )}
    </div>
  );
}
