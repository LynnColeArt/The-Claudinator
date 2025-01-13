// content_script.js

// Optional runtime domain check for extra security
if (!window.location.hostname.endsWith('claude.ai')) {
  console.error('Error: This script should only run on claude.ai domains.');
  // Optionally, exit early if desired:
  // return;
}

console.log("[Content Script] Loaded on:", window.location.href);

// 1) Global Error Logging in content script
window.addEventListener('error', event => {
  console.log("[Content Script] error event triggered:", event.error);
  chrome.runtime.sendMessage({
    type: 'LOG_ERROR',
    from: 'content_script',
    name: event.error?.name || 'Error',
    message: event.error?.message || event.message || 'Unknown content script error',
    stack: event.error?.stack || ''
  });
});

window.addEventListener('unhandledrejection', event => {
  console.log("[Content Script] unhandledrejection triggered:", event.reason);
  chrome.runtime.sendMessage({
    type: 'LOG_ERROR',
    from: 'content_script',
    name: event.reason?.name || 'UnhandledRejection',
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack || ''
  });
});

// 2) Collect both user & assistant messages when asked
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "DUMP_CHAT") {
    console.log("[Content Script] Received DUMP_CHAT request.");

    try {
      // Grab user + assistant messages, in DOM order
      const allEls = document.querySelectorAll(
        'div[data-testid="user-message"], div[data-testid="assistant-message"]'
      );
      console.log(`[Content Script] Found ${allEls.length} total messages (user+assistant).`);

      const messages = [];
      allEls.forEach((el, index) => {
        // Determine type based on data-testid
        const testid = el.getAttribute('data-testid');
        let type = "unknown";
        if (testid === "user-message") {
          type = "user";
        } else if (testid === "assistant-message") {
          type = "assistant";
        }

        // Capture all text content inside the message element
        const content = el.textContent.trim();

        messages.push({
          index,
          type,
          content
        });
      });

      console.log("[Content Script] Sending combined user+assistant messages:", messages);
      sendResponse({ success: true, data: messages });
    } catch (err) {
      console.error("[Content Script] Error while dumping chat messages:", err);
      // Log to background
      chrome.runtime.sendMessage({
        type: 'LOG_ERROR',
        from: 'content_script',
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      sendResponse({ success: false, error: err.message });
    }

    return true; // Keep message channel open for async
  }
});
