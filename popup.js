document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleButton');
    const adsBlockedCounter = document.getElementById('adsBlocked');
    const timeSavedCounter = document.getElementById('timeSaved');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status span');

    // Load saved state
    chrome.storage.local.get(['enabled', 'adsBlocked', 'timeSaved'], (result) => {
        // Set toggle state
        toggleButton.checked = result.enabled === undefined ? true : result.enabled;
        updateStatus(toggleButton.checked);

        // Set counters
        const adsBlocked = result.adsBlocked || 0;
        const timeSaved = result.timeSaved || 0;
        
        // Animate counters
        animateCounter(adsBlockedCounter, 0, adsBlocked);
        animateCounter(timeSavedCounter, 0, timeSaved);
    });

    // Handle toggle button with error handling
    toggleButton.addEventListener('change', () => {
        const enabled = toggleButton.checked;
        chrome.storage.local.set({ enabled }, () => {
            updateStatus(enabled);

            // Send message to content script with error handling
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
                    try {
                        // Try to send message to content script
                        await chrome.tabs.sendMessage(tabs[0].id, { 
                            action: 'toggleBlocker', 
                            enabled 
                        }).catch(() => {
                            // If message fails, just reload the tab
                            console.log('Content script not ready, reloading tab...');
                        });
                        // Reload the tab regardless
                        chrome.tabs.reload(tabs[0].id);
                    } catch (error) {
                        console.log('Error communicating with content script:', error);
                        // Reload the tab anyway
                        chrome.tabs.reload(tabs[0].id);
                    }
                }
            });
        });
    });

    // Function to update status indicator
    function updateStatus(enabled) {
        if (enabled) {
            statusDot.classList.add('active');
            statusText.textContent = 'Protection Active';
        } else {
            statusDot.classList.remove('active');
            statusText.textContent = 'Protection Disabled';
        }
    }

    // Animate counter function
    function animateCounter(element, start, end) {
        const duration = 1500;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Add easing function for smoother animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            const current = Math.floor(start + (end - start) * easeOutCubic);
            
            // Format numbers over 1000 to K format
            if (current >= 1000) {
                element.textContent = (current / 1000).toFixed(1) + 'K';
            } else {
                element.textContent = current.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Add hover effect for stats
    document.querySelector('.stats-card').addEventListener('mouseenter', () => {
        // Refresh stats on hover
        chrome.storage.local.get(['adsBlocked', 'timeSaved'], (result) => {
            const adsBlocked = result.adsBlocked || 0;
            const timeSaved = result.timeSaved || 0;
            
            animateCounter(document.getElementById('adsBlocked'), 
                parseInt(document.getElementById('adsBlocked').textContent.replace(/[^0-9]/g, '')), 
                adsBlocked);
            animateCounter(document.getElementById('timeSaved'), 
                parseInt(document.getElementById('timeSaved').textContent.replace(/[^0-9]/g, '')), 
                Math.round(timeSaved));
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(e) {
            let ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            let x = e.clientX - e.target.offsetLeft;
            let y = e.clientY - e.target.offsetTop;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            setTimeout(() => ripple.remove(), 600);
        });
    });
}); 