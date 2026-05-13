'use strict';

// ============================================================
// YouTube Ad Blocker v2.0 - Content Script
// Runs at document_start for instant ad suppression
// ============================================================

if (window.__ytAdBlockerV2) {
    // Already initialized - bail out
} else {
    window.__ytAdBlockerV2 = true;

    let enabled = true;
    let adStats = { video: 0, banner: 0, popup: 0 };

    // --------------------------------------------------------
    // 1. INSTANT CSS INJECTION (runs before page paints)
    // --------------------------------------------------------
    const AD_HIDE_CSS = `
        /* Video ad overlays */
        .ad-showing .video-ads,
        .ad-showing .ytp-ad-module,
        .ad-showing .ytp-ad-overlay-container,
        .ad-showing .ytp-ad-image-overlay,
        .ad-showing .ytp-ad-text-overlay,
        .ytp-ad-overlay-slot,
        .ytp-ad-progress-list,
        .ytp-ad-player-overlay,
        .ytp-ad-player-overlay-layout,
        .ytp-ad-action-interstitial,

        /* Banner & feed ads */
        ytd-ad-slot-renderer,
        ytd-banner-promo-renderer,
        ytd-statement-banner-renderer,
        ytd-in-feed-ad-layout-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-promoted-video-renderer,
        ytd-display-ad-renderer,
        ytd-compact-promoted-video-renderer,
        ytd-action-companion-ad-renderer,
        ytd-player-legacy-desktop-watch-ads-renderer,
        .ytd-promoted-sparkles-text-search-renderer,
        .ytd-merch-shelf-renderer,
        ytd-merch-shelf-renderer,

        /* Masthead & engagement panel ads */
        #masthead-ad,
        #player-ads,
        #panels .ytd-ads-engagement-panel-content-renderer,
        ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],

        /* Feed ad items */
        ytd-rich-item-renderer:has(.ytd-ad-slot-renderer),
        ytd-rich-section-renderer:has(ytd-ad-slot-renderer),

        /* Popup / enforcement overlays */
        tp-yt-paper-dialog:has(ytd-enforcement-message-view-model),
        tp-yt-paper-dialog:has(#dismiss-button),
        ytd-popup-container:has(ytd-enforcement-message-view-model),

        /* Additional overlay variants */
        .ytp-ad-skip-button-slot,
        .ytp-ad-visit-advertiser-button,
        .ytp-ad-feedback-dialog-renderer,
        .ytp-suggested-action,
        ytd-promoted-sparkles-web-renderer {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
        }

        /* Prevent ad-showing class from pausing/dimming the video */
        .ad-showing video {
            visibility: visible !important;
        }

        /* Remove ad survey popups */
        .ytp-ad-survey {
            display: none !important;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'yt-adblocker-v2-css';
    styleEl.textContent = AD_HIDE_CSS;
    (document.head || document.documentElement).appendChild(styleEl);

    // --------------------------------------------------------
    // 2. SAFE CHROME API WRAPPER
    // --------------------------------------------------------
    function safeChrome(fn) {
        try {
            if (chrome && chrome.runtime && chrome.runtime.id) {
                fn();
            }
        } catch (e) {
            // Extension context invalidated - script is orphaned, stop gracefully
            shutdown();
        }
    }

    // --------------------------------------------------------
    // 3. STORAGE INIT
    // --------------------------------------------------------
    safeChrome(() => {
        chrome.storage.local.get('enabled', (result) => {
            if (chrome.runtime.lastError) return;
            enabled = result.enabled === undefined ? true : result.enabled;
            if (enabled) {
                boot();
            }
        });
    });

    // --------------------------------------------------------
    // 3. SKIP BUTTON SELECTORS (legacy + modern)
    // --------------------------------------------------------
    const SKIP_SELECTORS = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-skip-ad-button',
        '.ytp-ad-skip-button-slot button',
        'button.ytp-ad-skip-button-modern',
        '[id^="skip-button"]',
        '.ytp-ad-overlay-close-button',
        '.ytp-ad-skip-button-container button',
        'button[data-tooltip-target-id="a]"',
    ];

    const SKIP_SELECTOR_STR = SKIP_SELECTORS.join(', ');

    // --------------------------------------------------------
    // 4. BANNER / OVERLAY SELECTORS
    // --------------------------------------------------------
    const BANNER_SELECTORS = [
        'ytd-banner-promo-renderer',
        'ytd-statement-banner-renderer',
        'ytd-in-feed-ad-layout-renderer',
        'ytd-ad-slot-renderer',
        '.ytp-ad-overlay-container',
        'ytd-promoted-sparkles-web-renderer',
        'ytd-promoted-video-renderer',
        'ytd-display-ad-renderer',
        '.ytd-promoted-sparkles-text-search-renderer',
        '#masthead-ad',
        'ytd-compact-promoted-video-renderer',
        'ytd-action-companion-ad-renderer',
        'ytd-player-legacy-desktop-watch-ads-renderer',
        '#player-ads',
        '#panels .ytd-ads-engagement-panel-content-renderer',
        'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
        '.ytd-merch-shelf-renderer',
        'ytd-merch-shelf-renderer',
        '.ytp-suggested-action',
        '.ytp-ad-survey',
    ];

    const BANNER_SELECTOR_STR = BANNER_SELECTORS.join(', ');

    // --------------------------------------------------------
    // 5. CORE AD SKIP LOGIC
    // --------------------------------------------------------

    /** Immediately attempt to skip/fast-forward a video ad */
    function nukeVideoAd() {
        if (!enabled) return;

        const player = document.querySelector('#movie_player');
        if (!player) return;

        const isAdShowing = player.classList.contains('ad-showing') ||
                            player.classList.contains('ad-interrupting') ||
                            document.querySelector('.ytp-ad-player-overlay');

        if (!isAdShowing) return;

        const video = document.querySelector('video');
        if (video) {
            // Fast-forward to the end instantly
            if (video.duration && isFinite(video.duration)) {
                video.currentTime = video.duration;
            }
            // Max speed in case currentTime set didn't end it
            try { video.playbackRate = 16; } catch (e) { /* some ads restrict this */ }
            // Ensure it's playing (not paused by ad logic)
            if (video.paused) {
                video.play().catch(() => {});
            }
            // Mute during ad so user hears nothing even if fast-forward is slow
            video.muted = true;
        }

        // Click every possible skip button
        clickSkipButtons();

        adStats.video++;
        updateStats('skippable');
    }

    /** Click all known skip / dismiss buttons */
    function clickSkipButtons() {
        document.querySelectorAll(SKIP_SELECTOR_STR).forEach(btn => {
            try {
                btn.click();
                // Also dispatch a synthetic pointer event for buttons that ignore .click()
                btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
            } catch (e) { /* ignore */ }
        });
    }

    /** Restore video state after an ad finishes */
    function restoreAfterAd() {
        const video = document.querySelector('video');
        if (video) {
            video.muted = false;
            try { video.playbackRate = 1; } catch (e) {}
        }
    }

    // --------------------------------------------------------
    // 6. BANNER / OVERLAY REMOVAL
    // --------------------------------------------------------
    let bannerRafPending = false;

    function removeBannerAds() {
        if (!enabled || bannerRafPending) return;
        bannerRafPending = true;
        requestAnimationFrame(() => {
            let removed = false;
            document.querySelectorAll(BANNER_SELECTOR_STR).forEach(el => {
                el.remove();
                removed = true;
            });
            if (removed) {
                adStats.banner++;
                updateStats('banner');
            }
            bannerRafPending = false;
        });
    }

    // --------------------------------------------------------
    // 7. ANTI-ADBLOCKER POPUP DISMISSAL
    // --------------------------------------------------------
    function dismissAdBlockPopups() {
        if (!enabled) return;

        // YouTube's enforcement / "ad blockers are not allowed" dialog
        const popupSelectors = [
            'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)',
            'ytd-popup-container:has(ytd-enforcement-message-view-model)',
            'tp-yt-paper-dialog.ytd-popup-container',
        ];

        popupSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(popup => {
                // Try to click dismiss / "Continue" button inside
                const dismiss = popup.querySelector('#dismiss-button, [aria-label="Dismiss"], .yt-spec-button-shape-next--filled');
                if (dismiss) {
                    dismiss.click();
                    adStats.popup++;
                }
                popup.remove();
            });
        });

        // Also handle any overlay that blocks interaction
        const overlays = document.querySelectorAll('ytd-enforcement-message-view-model');
        overlays.forEach(o => o.remove());
    }

    // --------------------------------------------------------
    // 8. MUTATION OBSERVERS
    // --------------------------------------------------------
    let playerObserver = null;
    let pageObserver = null;
    let wasAdShowing = false;

    function setupPlayerObserver() {
        if (playerObserver) playerObserver.disconnect();

        // Watch for the player element to appear, then observe it
        const attachToPlayer = () => {
            const player = document.querySelector('#movie_player');
            if (!player) return false;

            playerObserver = new MutationObserver(() => {
                if (!enabled) return;

                const isAd = player.classList.contains('ad-showing') ||
                             player.classList.contains('ad-interrupting');

                if (isAd) {
                    wasAdShowing = true;
                    nukeVideoAd();
                } else if (wasAdShowing) {
                    wasAdShowing = false;
                    restoreAfterAd();
                }
            });

            playerObserver.observe(player, {
                attributes: true,
                attributeFilter: ['class'],
                childList: true,
                subtree: true,
            });

            // Immediately check in case ad is already playing
            nukeVideoAd();
            return true;
        };

        if (!attachToPlayer()) {
            // Player not in DOM yet - watch for it
            const waitObserver = new MutationObserver(() => {
                if (attachToPlayer()) {
                    waitObserver.disconnect();
                }
            });
            waitObserver.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        }
    }

    function setupPageObserver() {
        if (pageObserver) pageObserver.disconnect();

        let throttleTimer = null;

        pageObserver = new MutationObserver(() => {
            if (!enabled) return;

            // Throttle banner removal to max once per 200ms
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    removeBannerAds();
                    dismissAdBlockPopups();
                    throttleTimer = null;
                }, 200);
            }
        });

        pageObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    // --------------------------------------------------------
    // 9. POLLING FALLBACK (catches anything observers miss)
    // --------------------------------------------------------
    let pollInterval = null;

    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => {
            if (!enabled) return;
            nukeVideoAd();
            removeBannerAds();
            dismissAdBlockPopups();
        }, 500);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // --------------------------------------------------------
    // 10. BOOT / SHUTDOWN
    // --------------------------------------------------------
    function boot() {
        setupPlayerObserver();
        setupPageObserver();
        startPolling();
        removeBannerAds();
        dismissAdBlockPopups();

        // YouTube SPA navigation events
        window.addEventListener('yt-navigate-finish', onNavigate);
        window.addEventListener('yt-page-data-updated', onNavigate);
    }

    function shutdown() {
        if (playerObserver) playerObserver.disconnect();
        if (pageObserver) pageObserver.disconnect();
        stopPolling();
        window.removeEventListener('yt-navigate-finish', onNavigate);
        window.removeEventListener('yt-page-data-updated', onNavigate);
        enabled = false;
    }

    function onNavigate() {
        if (!enabled) return;
        // Re-attach player observer in case YouTube replaced the player
        setupPlayerObserver();
        removeBannerAds();
        dismissAdBlockPopups();
    }

    // --------------------------------------------------------
    // 11. STATS
    // --------------------------------------------------------
    function updateStats(adType) {
        if (!enabled) return;
        const timeSaved = ({ skippable: 30, nonSkippable: 15, banner: 5, overlay: 5, popup: 2 })[adType] || 15;
        safeChrome(() => {
            chrome.storage.local.get(['adsBlocked', 'timeSaved', 'networkBlocked'], (result) => {
                if (chrome.runtime.lastError) return;
                chrome.storage.local.set({
                    adsBlocked: (result.adsBlocked || 0) + 1,
                    timeSaved: (result.timeSaved || 0) + (timeSaved / 60),
                    networkBlocked: (result.networkBlocked || 0) + 1,
                });
            });
        });
    }

    // --------------------------------------------------------
    // 12. MESSAGE LISTENER (from popup toggle)
    // --------------------------------------------------------
    safeChrome(() => {
        chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
            if (msg.action === 'toggleBlocker') {
                enabled = msg.enabled;
                safeChrome(() => {
                    chrome.storage.local.set({ enabled: msg.enabled }, () => {
                        if (chrome.runtime.lastError) return;
                        if (msg.enabled) {
                            boot();
                        } else {
                            shutdown();
                        }
                    });
                });
                sendResponse({ ok: true });
            }
        });
    });
}