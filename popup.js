// popup.js

console.log("[Popup] Script loaded.");

// 1) Global Error Logging in popup
window.addEventListener('error', event => {
  console.log("[Popup] error event triggered:", event.error);
  chrome.runtime.sendMessage({
    type: 'LOG_ERROR',
    from: 'popup',
    name: event.error?.name || 'Error',
    message: event.error?.message || event.message || 'Unknown popup error',
    stack: event.error?.stack || ''
  });
});

window.addEventListener('unhandledrejection', event => {
  console.log("[Popup] unhandledrejection triggered:", event.reason);
  chrome.runtime.sendMessage({
    type: 'LOG_ERROR',
    from: 'popup',
    name: event.reason?.name || 'UnhandledRejection',
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack || ''
  });
});

// 2) Single button -> request user+assistant messages
document.getElementById('dumpBtn').addEventListener('click', async () => {
  console.log("[Popup] Dump button clicked.");

  // Identify active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    alert("No active tab found. Are you on Claude.ai?");
    return;
  }

  console.log("[Popup] Sending DUMP_CHAT to content script...");

  // The message type is "DUMP_CHAT"
  chrome.tabs.sendMessage(tab.id, { type: "DUMP_CHAT" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Popup] Error sending message:", chrome.runtime.lastError);
      alert("Could not dump chat messages. Possibly not on claude.ai domain?");
      return;
    }

    if (!response) {
      alert("No response from content script. Possibly not on claude.ai?");
      return;
    }
    if (!response.success) {
      alert("Failed to get chat messages: " + (response.error || 'Unknown error.'));
      return;
    }

    // We got an array of chat messages
    const chatMessages = response.data;
    console.log("[Popup] chatMessages returned:", chatMessages);

    // Download as JSON
    const blob = new Blob([JSON.stringify(chatMessages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url,
      filename: "claude_chat.json"
    });
  });
});
