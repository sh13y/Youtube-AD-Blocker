// ============================================================
// YouTube Ad Blocker v2.0 - Background Service Worker
// ============================================================

// --- Extension install / update ---
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[YT-AdBlocker] Installed / Updated:', details.reason);
    // Ensure default enabled state
    chrome.storage.local.get('enabled', (result) => {
        if (result.enabled === undefined) {
            chrome.storage.local.set({ enabled: true });
        }
    });
});

// --- Track tabs where content script is injected ---
const injectedTabs = new Set();

// --- Inject content script on YouTube navigation ---
chrome.webNavigation.onCommitted.addListener((details) => {
    if (!details.url.includes('youtube.com')) return;

    // Inject into main frame and sub-frames
    chrome.storage.local.get('enabled', (result) => {
        if (result.enabled === false) return;

        // Avoid double-injection on main frame initial load
        // (content_scripts in manifest handles that)
        if (details.frameId === 0 && !injectedTabs.has(details.tabId)) {
            injectedTabs.add(details.tabId);
            return; // manifest content_scripts handles first load
        }

        // For SPA navigations or sub-frames, inject manually
        chrome.scripting.executeScript({
            target: { tabId: details.tabId, allFrames: true },
            files: ['content.js'],
        }).catch(() => {
            // Tab may have been closed or navigated away
        });
    });
});

// --- Clean up on tab close ---
chrome.tabs.onRemoved.addListener((tabId) => {
    injectedTabs.delete(tabId);
});

// --- Handle SPA navigations (YouTube doesn't do full reloads) ---
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0 || !details.url.includes('youtube.com')) return;

    chrome.storage.local.get('enabled', (result) => {
        if (result.enabled === false) return;

        chrome.scripting.executeScript({
            target: { tabId: details.tabId, allFrames: true },
            files: ['content.js'],
        }).catch(() => {});
    });
});

// --- Dynamic rule management (enable/disable declarativeNetRequest) ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'setRulesEnabled') {
        if (msg.enabled) {
            chrome.declarativeNetRequest.updateEnabledRulesets({
                enableRulesetIds: ['ytad_rules'],
            }).then(() => sendResponse({ ok: true }))
              .catch((e) => sendResponse({ ok: false, error: e.message }));
        } else {
            chrome.declarativeNetRequest.updateEnabledRulesets({
                disableRulesetIds: ['ytad_rules'],
            }).then(() => sendResponse({ ok: true }))
              .catch((e) => sendResponse({ ok: false, error: e.message }));
        }
        return true; // keep message channel open for async response
    }

    if (msg.action === 'getNetworkStats') {
        chrome.storage.local.get('networkBlocked', (result) => {
            sendResponse({ count: result.networkBlocked || 0 });
        });
        return true;
    }

    if (msg.action === 'incrementNetworkBlocked') {
        chrome.storage.local.get('networkBlocked', (result) => {
            chrome.storage.local.set({
                networkBlocked: (result.networkBlocked || 0) + (msg.count || 1),
            });
        });
    }
});