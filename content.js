'use strict';

// Prevent multiple initializations
if (window.youtubeAdBlockerInitialized) {
    console.log('YouTube Ad Blocker already initialized');
} else {
    window.youtubeAdBlockerInitialized = true;

    // Store the last known video URL to prevent unnecessary processing
    let lastUrl = '';
    let enabled = true;

    // Initialize enabled state from storage
    chrome.storage.local.get('enabled', (result) => {
        enabled = result.enabled === undefined ? true : result.enabled;
    });

    // Banner ad selectors to remove
    const bannerSelectors = [
        'ytd-banner-promo-renderer',
        'ytd-statement-banner-renderer',
        'ytd-in-feed-ad-layout-renderer',
        'ytd-ad-slot-renderer',
        '.ytp-ad-overlay-container',
        'ytd-promoted-sparkles-web-renderer',
        'ytd-promoted-video-renderer',
        'ytd-display-ad-renderer',
        '.ytd-promoted-sparkles-text-search-renderer',
        '#masthead-ad'
    ];

    // Function to calculate time saved based on ad type
    function calculateTimeSaved(adType) {
        // Average ad durations based on YouTube's common ad formats
        const adDurations = {
            skippable: 30,    // Skippable ads are typically 15-30 seconds
            nonSkippable: 15, // Non-skippable ads are usually 15-20 seconds
            banner: 5,        // Banner ads take about 5 seconds of attention
            overlay: 5        // Overlay ads also take about 5 seconds to dismiss
        };
        return adDurations[adType] || 15; // Default to 15 seconds if type unknown
    }

    // Function to update statistics
    function updateStats(adType) {
        if (!enabled) return;
        chrome.storage.local.get(['adsBlocked', 'timeSaved'], (result) => {
            const timeSaved = calculateTimeSaved(adType);
            const stats = {
                adsBlocked: (result.adsBlocked || 0) + 1,
                timeSaved: (result.timeSaved || 0) + (timeSaved / 60) // Convert to minutes
            };
            chrome.storage.local.set(stats);
        });
    }

    // Optimize banner ad removal with RequestAnimationFrame
    function removeBannerAds() {
        if (!enabled) return;
        
        if (!removeBannerAds.frameRequested) {
            removeBannerAds.frameRequested = true;
            requestAnimationFrame(() => {
                let removed = false;
                bannerSelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(ad => {
                        ad.remove();
                        removed = true;
                    });
                });
                
                if (removed) updateStats('banner');
                removeBannerAds.frameRequested = false;
            });
        }
    }

    // Function to stop ad blocking
    function stopAdBlocking() {
        if (observer) {
            observer.disconnect();
        }
        enabled = false;
        // Clear any existing intervals
        if (window.adBlockerIntervals) {
            window.adBlockerIntervals.forEach(interval => clearInterval(interval));
            window.adBlockerIntervals = [];
        }
    }

    // Function to start ad blocking
    function startAdBlocking() {
        enabled = true;
        if (!window.adBlockerIntervals) {
            window.adBlockerIntervals = [];
        }
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        
        if (window.location.pathname === '/watch') {
            handleVideoAds();
        }
        removeBannerAds();
    }

    // More efficient observer that handles both video and banner ads
    const observer = new MutationObserver(() => {
        if (!enabled) return;

        // Handle page navigation (using existing lastUrl variable)
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            if (window.location.pathname === '/watch') {
                handleVideoAds();
            }
        }
        
        // Remove banner ads (throttled to run max once every 100ms)
        if (!observer.timeout) {
            observer.timeout = setTimeout(() => {
                removeBannerAds();
                observer.timeout = null;
            }, 100);
        }
    });

    // Start observing with optimized configuration
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Optimize video ad handling
    function handleVideoAds() {
        if (!enabled) return;

        const skipInterval = setInterval(() => {
            if (!enabled) {
                clearInterval(skipInterval);
                return;
            }

            const video = document.querySelector('video');
            if (video && document.querySelector('.ad-showing')) {
                requestAnimationFrame(() => {
                    video.currentTime = video.duration;
                    if (video.paused) video.play();
                    updateStats(document.querySelector('.ytp-ad-skip-button') ? 'skippable' : 'nonSkippable');
                });
            }

            const skipButton = document.querySelector('.ytp-ad-skip-button');
            if (skipButton) {
                skipButton.click();
            }
        }, 250);

        // Store interval for cleanup
        if (!window.adBlockerIntervals) {
            window.adBlockerIntervals = [];
        }
        window.adBlockerIntervals.push(skipInterval);

        // Clear interval after 3 seconds
        setTimeout(() => {
            clearInterval(skipInterval);
            const index = window.adBlockerIntervals.indexOf(skipInterval);
            if (index > -1) {
                window.adBlockerIntervals.splice(index, 1);
            }
        }, 3000);
    }

    // Handle initial page load
    chrome.storage.local.get('enabled', (result) => {
        enabled = result.enabled === undefined ? true : result.enabled;
        if (enabled) {
            startAdBlocking();
        } else {
            stopAdBlocking();
        }
    });

    // Handle navigation events
    window.addEventListener('yt-navigate-finish', () => {
        if (enabled) {
            if (window.location.pathname === '/watch') {
                handleVideoAds();
            }
            removeBannerAds();
        }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggleBlocker') {
            enabled = message.enabled;
            chrome.storage.local.set({ enabled: message.enabled }, () => {
                if (message.enabled) {
                    startAdBlocking();
                } else {
                    stopAdBlocking();
                }
            });
        }
    });
} 