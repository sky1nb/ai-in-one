import { motion } from 'framer-motion';
import { useState } from 'react';

interface ExternalLoginButtonProps {
  aiType: string;
  aiName: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ExternalLoginButton({ aiType, aiName, onSuccess, onClose }: ExternalLoginButtonProps) {
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting'>('idle');

  const handleLoginClick = async () => {
    setStatus('opening');
    
    try {
      const result = await window.electronAPI?.loginWithBrowser(aiType);
      
      if (result?.success) {
        setStatus('waiting');
      } else {
        setStatus('idle');
        alert(`❌ Error: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus('idle');
      alert(`❌ Error: ${String(error)}`);
    }
  };

  const handleRefresh = () => {
    setStatus('idle');
    if (onSuccess) {
      onSuccess();
    } else {
      // Reload webview
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={() => onClose?.()}
    >
      {/* Modal - perfectly centered inside flex container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative',
          textAlign: 'center',
          background: '#0a0a0a',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.95)',
          width: '460px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: '24px',
      }}>
        🔐
      </div>

      <h2 style={{ 
        color: '#fff', 
        marginBottom: '8px',
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      }}>
        Google Login Required
      </h2>
      
      <p style={{ 
        color: '#999', 
        marginBottom: '16px',
        lineHeight: '1.5',
        fontSize: '13px',
      }}>
        {aiName} requires Google authentication. We'll open it in your browser where Google will recognize it as safe.
      </p>

      <div style={{
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '8px',
        padding: '10px',
        marginBottom: '20px',
      }}>
        <p style={{ 
          color: '#ffc107', 
          fontSize: '12px',
          lineHeight: '1.4',
          margin: 0,
        }}>
          ⚠️ <strong>Note:</strong> Browser cookies don't auto-sync. Try manual login after.
        </p>
      </div>

      {status === 'idle' && (
        <motion.button
          onClick={handleLoginClick}
          whileHover={{ scale: 1.02, backgroundColor: '#ffffff' }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '12px 28px',
            background: '#f5f5f5',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '16px' }}>🌐</span>
          Login in Browser
        </motion.button>
      )}

      {status === 'opening' && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          color: '#999',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          Opening browser...
        </div>
      )}

      {status === 'waiting' && (
        <div>
          <div style={{
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px',
          }}>
            <p style={{ color: '#4ade80', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              ✓ Browser Opened!
            </p>
            <p style={{ color: '#999', fontSize: '12px', lineHeight: '1.4', marginBottom: '8px' }}>
              After logging in your browser:
            </p>
            <ol style={{ 
              color: '#999', 
              fontSize: '11px', 
              lineHeight: '1.5',
              paddingLeft: '18px',
              margin: 0,
              textAlign: 'left',
            }}>
              <li>Try "Refresh Now" button</li>
              <li>Or close popup and login manually</li>
              <li>Use same Google account</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.02, backgroundColor: '#5bec90' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 20px',
                background: '#4ade80',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ✓ Refresh Now
            </motion.button>

            <motion.button
              onClick={() => onClose?.()}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Close & Try Manually
            </motion.button>
          </div>
        </div>
      )}

      {/* Close button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)', scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          lineHeight: 1,
          fontWeight: 300,
        }}
      >
        ✕
      </motion.button>
    </motion.div>
    </div>
  );
}
