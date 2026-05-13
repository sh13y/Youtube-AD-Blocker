# Privacy Policy - YouTube AD Blocker

**Last Updated: May 13, 2026**

## Overview

YouTube AD Blocker ("the Extension") is committed to protecting your privacy. This Privacy Policy explains how the Extension handles your data.

## Data Collection & Usage

### We Do NOT Collect:
- ❌ Personal identification information (name, email, address)
- ❌ Browsing history
- ❌ IP addresses or location data
- ❌ Cookies or tracking identifiers
- ❌ Payment or financial information
- ❌ Any user activity logs
- ❌ Website content or page data

### Local Storage Only

The Extension stores only the following information **locally on your device**:
- User preferences and settings
- Custom blocking rules you create
- Extension configuration state

**All data remains on your computer and is never transmitted to external servers or third parties.**

## How the Extension Works

1. **Content Script Execution**: The Extension injects a content script on YouTube.com to identify and remove ads
2. **Network Request Blocking**: Uses declarativeNetRequest rules to block ad-serving requests
3. **Local Processing**: All ad detection and blocking occurs locally on your device
4. **No External Communications**: The Extension does not communicate with external servers

## Permissions Explained

| Permission | Purpose | Data Collected |
|-----------|---------|-----------------|
| **scripting** | Inject scripts on YouTube to block ads | None |
| **webNavigation** | Detect YouTube page loads | None |
| **storage** | Save your preferences locally | User settings only |
| **declarativeNetRequest** | Block ad network requests | None |
| **Host Permission (youtube.com)** | Access YouTube pages | None |

## Data Sharing

**We do NOT share, sell, or transfer any data to:**
- Third-party advertisers
- Analytics services
- Data brokers
- Any external companies or services
- Google or other tech companies

All functionality is completely self-contained within your browser.

## Open Source

This Extension is open-source software. You can review the complete source code at:
https://github.com/sh13y/Youtube-AD-Blocker

This transparency ensures there are no hidden data collection mechanisms.

## Third-Party Services

The Extension does NOT use:
- Analytics services (Google Analytics, Mixpanel, etc.)
- Crash reporting services
- CDNs or external resource loaders
- Any third-party libraries that collect data

## Changes to This Policy

We may update this Privacy Policy occasionally. Any changes will be posted on this page with an updated "Last Updated" date. Continued use of the Extension constitutes your acceptance of any changes.

## Contact

For privacy concerns or questions, please open an issue on our GitHub repository:
https://github.com/sh13y/Youtube-AD-Blocker/issues

## Compliance

This Extension complies with:
- Chrome Web Store Developer Program Policies
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Other applicable privacy laws

---

**In Summary**: YouTube AD Blocker respects your privacy completely. We collect no personal data, track no activity, and use only local storage for settings. Your data stays on your device, always.
