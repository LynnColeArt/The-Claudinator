// background.js (Manifest V3 service worker)

console.log("[Background] Service worker started.");

// Catch errors in the background script
self.addEventListener('error', event => {
  console.error('[Background] Uncaught error:', event.error);
});
self.addEventListener('unhandledrejection', event => {
  console.error('[Background] Unhandled promise rejection:', event.reason);
});

// Listen for 'LOG_ERROR' from content script / popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_ERROR') {
    console.error(`[BG] [From ${message.from}] ${message.name}: ${message.message}\nStack: ${message.stack || '(no stack)'}`);
  }
});
