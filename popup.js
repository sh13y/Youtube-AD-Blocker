// ============================================================
// YouTube Ad Blocker v2.0 - Popup Script
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM refs ---
    const toggleButton = document.getElementById('toggleButton');
    const adsBlockedEl = document.getElementById('adsBlocked');
    const timeSavedEl = document.getElementById('timeSaved');
    const networkBlockedEl = document.getElementById('networkBlocked');
    const shieldSection = document.getElementById('shieldSection');
    const shieldLabel = document.getElementById('shieldLabel');
    const shieldProgress = document.querySelector('.shield-progress');

    // --- Load saved state ---
    chrome.storage.local.get(['enabled', 'adsBlocked', 'timeSaved'], (result) => {
        const isEnabled = result.enabled === undefined ? true : result.enabled;
        toggleButton.checked = isEnabled;
        updateShieldUI(isEnabled);

        const adsBlocked = result.adsBlocked || 0;
        const timeSaved = Math.round(result.timeSaved || 0);

        animateCounter(adsBlockedEl, 0, adsBlocked);
        animateCounter(timeSavedEl, 0, timeSaved);
    });

    // --- Load network stats ---
    loadNetworkStats();

    // --- Toggle handler ---
    toggleButton.addEventListener('change', () => {
        const enabled = toggleButton.checked;

        chrome.storage.local.set({ enabled }, () => {
            updateShieldUI(enabled);

            // Toggle declarativeNetRequest rules
            chrome.runtime.sendMessage({ action: 'setRulesEnabled', enabled }).catch(() => {});

            // Notify content script
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
                    try {
                        await chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'toggleBlocker',
                            enabled,
                        }).catch(() => {});
                        // Reload to apply changes cleanly
                        chrome.tabs.reload(tabs[0].id);
                    } catch (e) {
                        chrome.tabs.reload(tabs[0].id);
                    }
                }
            });
        });
    });

    // --- Shield UI ---
    function updateShieldUI(enabled) {
        if (enabled) {
            shieldSection.classList.remove('disabled');
            shieldLabel.textContent = 'Protection Active';
        } else {
            shieldSection.classList.add('disabled');
            shieldLabel.textContent = 'Protection Disabled';
        }
    }

    // --- Animate counter ---
    function animateCounter(element, start, end) {
        if (end === 0) {
            element.textContent = '0';
            return;
        }

        const duration = 1200;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * ease);

            if (current >= 10000) {
                element.textContent = (current / 1000).toFixed(1) + 'K';
            } else if (current >= 1000) {
                element.textContent = (current / 1000).toFixed(1) + 'K';
            } else {
                element.textContent = current.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                // Final pop
                element.classList.add('pop');
                setTimeout(() => element.classList.remove('pop'), 300);
            }
        }

        requestAnimationFrame(update);
    }

    // --- Network stats ---
    function loadNetworkStats() {
        try {
            chrome.storage.local.get('networkBlocked', (result) => {
                if (chrome.runtime.lastError) {
                    networkBlockedEl.textContent = '-';
                    return;
                }
                const count = result.networkBlocked || 0;
                animateCounter(networkBlockedEl, 0, count);
            });
        } catch (e) {
            networkBlockedEl.textContent = '-';
        }
    }

    // --- Refresh stats on hover ---
    document.querySelector('.stats-grid').addEventListener('mouseenter', () => {
        chrome.storage.local.get(['adsBlocked', 'timeSaved'], (result) => {
            const adsBlocked = result.adsBlocked || 0;
            const timeSaved = Math.round(result.timeSaved || 0);

            const currentAds = parseStatValue(adsBlockedEl.textContent);
            const currentTime = parseStatValue(timeSavedEl.textContent);

            if (adsBlocked !== currentAds) {
                animateCounter(adsBlockedEl, currentAds, adsBlocked);
            }
            if (timeSaved !== currentTime) {
                animateCounter(timeSavedEl, currentTime, timeSaved);
            }
        });

        loadNetworkStats();
    });

    function parseStatValue(text) {
        if (text.includes('K')) {
            return Math.round(parseFloat(text) * 1000);
        }
        return parseInt(text.replace(/[^0-9]/g, '')) || 0;
    }
});