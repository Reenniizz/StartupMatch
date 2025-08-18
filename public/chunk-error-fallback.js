// Fallback para manejar chunk loading errors y debugging de Socket.IO
(function() {
  'use strict';
  
  let reloadAttempted = false;
  
  // Add Socket.IO debugging to window
  window.debugSocket = function() {
    console.log('🔍 Socket.IO Debug Info:');
    console.log('- Connection status:', window.socketDebugInfo || 'No debug info available');
    console.log('- User agent:', navigator.userAgent);
    console.log('- Local storage items:', Object.keys(localStorage));
    console.log('- Session storage items:', Object.keys(sessionStorage));
  };
  
  // Store socket debug info globally
  window.socketDebugInfo = {
    connected: false,
    socketId: null,
    lastError: null,
    connectionAttempts: 0
  };
  
  // Handle chunk loading errors by forcing page reload
  window.addEventListener('error', function(event) {
    const error = event.error;
    const target = event.target;
    
    // Check if it's a chunk loading error
    if (error && 
        (error.name === 'ChunkLoadError' || 
         (error.message && (
           error.message.includes('Loading chunk') ||
           error.message.includes('_app-pages-browser_lib_supabase-client_ts') ||
           error.message.includes('failed to fetch')
         )))
    ) {
      handleChunkError('Error event');
      event.preventDefault();
      return false;
    }
    
    // Check if it's a script loading error
    if (target && target.tagName === 'SCRIPT' && target.src && 
        target.src.includes('_app-pages-browser_lib_supabase-client_ts')) {
      handleChunkError('Script loading error');
      event.preventDefault();
      return false;
    }
  });
  
  // Also handle unhandled promise rejections for chunk errors
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    
    if (error && 
        (error.name === 'ChunkLoadError' || 
         (error.message && (
           error.message.includes('Loading chunk') ||
           error.message.includes('_app-pages-browser_lib_supabase-client_ts') ||
           error.message.includes('failed to fetch')
         )))
    ) {
      handleChunkError('Promise rejection');
      event.preventDefault();
    }
  });
  
  function handleChunkError(source) {
    if (reloadAttempted) {
      console.log('🔧 Chunk error already handled, ignoring...');
      return;
    }
    
    reloadAttempted = true;
    console.log('🔧 Chunk loading error detected (' + source + '), clearing cache and reloading...');
    
    // Clear localStorage cache that might be causing issues
    try {
      localStorage.removeItem('nextjs-webpack-cache');
      sessionStorage.clear();
      
      // Clear all localStorage items that start with '_next'
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('_next')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Could not clear cache:', e);
    }
    
    // Show user-friendly message
    const existingNotice = document.getElementById('chunk-error-notice');
    if (!existingNotice) {
      const notice = document.createElement('div');
      notice.id = 'chunk-error-notice';
      notice.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      notice.textContent = 'Actualizando aplicación...';
      document.body.appendChild(notice);
    }
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
  
  console.log('✅ Chunk error fallback script loaded');
  console.log('🔍 Use window.debugSocket() for Socket.IO debugging');
})();
