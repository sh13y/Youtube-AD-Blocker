// Background script to handle extension initialization and updates
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Ad Blocker installed');
});

// Keep track of tabs where content script is already injected
const injectedTabs = new Set();

// Listen for navigation events to ensure content script is properly injected
chrome.webNavigation.onCommitted.addListener((details) => {
  // Only handle main frame navigation
  if (details.frameId === 0 && details.url.includes('youtube.com') && !injectedTabs.has(details.tabId)) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['content.js']
    }).then(() => {
      injectedTabs.add(details.tabId);
    }).catch(console.error);
  }
});

// Clean up injectedTabs when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
}); 