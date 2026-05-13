<div align="center">

# 🛡️ YouTube Ad Blocker v2.0

> Because life's too short to watch "Skip Ad in 5...4...3..." for the 42nd time today

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/sh13y/youtube-ad-blocker?style=social)](https://github.com/sh13y/youtube-ad-blocker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sh13y/youtube-ad-blocker?style=social)](https://github.com/sh13y/youtube-ad-blocker/network/members)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=googlechrome)](https://chrome.google.com/webstore)

<p align="center">
  <img src="assets/icon-128.png" alt="YouTube Ad Blocker Logo" width="128" height="128">
</p>

[Features](#-features) •
[What's New](#-whats-new-in-v20) •
[Installation](#-installation) •
[How It Works](#%EF%B8%8F-how-it-works) •
[Contributing](#-contributing) •
[Support](#-support)

<p align="center">
  <img src="assets/preview v2.png" alt="Extension Preview" width="300" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <br>
  <i>Premium glassmorphism UI that sparks joy ✨</i>
</p>

</div>

---

## 🎭 What's This?
A powerful Chrome extension that makes YouTube ads disappear faster than your productivity during a cat video marathon. Built with modern JavaScript, network-level blocking, and a UI so clean it would make Marie Kondo proud.

## 🆕 What's New in v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Network-level blocking | ❌ | ✅ Blocks ad requests before they load |
| CSS instant hiding | ❌ | ✅ Ads hidden before page paints |
| Video ad detection | 3s timeout | ✅ Persistent observer - never misses |
| Skip button selectors | 1 | ✅ 9 selectors (legacy + modern) |
| Banner selectors | 10 | ✅ 20+ selectors |
| Anti-adblocker popup | ❌ | ✅ Auto-dismisses YouTube warnings |
| Sub-frame ads | ❌ | ✅ Blocks ads in embedded players |
| Popup UI | Basic dark | ✅ Premium glassmorphism design |

## ✨ Features

<table>
<tr>
<td>

- 🎯 **Video Ad Assassination**
  > Terminates pre-roll, mid-roll, and post-roll ads faster than you can say "but wait, there's more!"

- 🌐 **Network-Level Blocking**
  > Stops ad requests at the network layer - ads don't even get a chance to load

- 🚫 **Banner Begone**
  > Removes banner ads, overlays, merch shelves, and promotional content

</td>
<td>

- ⚡ **Lightning Fast**
  > CSS injection at document_start means zero ad flicker

- 🛡️ **Anti-Adblocker Shield**
  > Auto-dismisses YouTube's "ad blockers not allowed" popups

- 📊 **Stats Dashboard**
  > Tracks ads blocked, time saved, and network requests blocked

- 🎨 **Premium UI**
  > Dark glassmorphism popup with animated shield and live stats

</td>
</tr>
</table>

## 🚀 Installation

### From Chrome Web Store
> Coming soon! 🎉

### Manual Installation (Developer Mode)

1. Clone this repo (or download it, we don't judge)
```bash
git clone https://github.com/sh13y/youtube-ad-blocker.git
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top-right corner)
4. Click "Load unpacked" and select the extension directory
5. Enjoy YouTube like it's premium (except it's free... shhh! 🤫)

## 🛠️ How It Works

This extension works on three layers:

- **Network Layer** (`rules.json`): Blocks ad-serving domains (doubleclick, googlesyndication, etc.) via `declarativeNetRequest` before they even load
- **CSS Layer** (instant injection): Hides all known ad containers at `document_start` - zero flicker
- **DOM Layer** (`content.js`): MutationObserver watches the player non-stop, skips video ads instantly, removes banners, and dismisses anti-adblocker popups

## 🎯 Technical Stack

- Manifest V3 with `declarativeNetRequest` for network-level blocking
- 15 network blocking rules targeting ad-serving domains
- Persistent MutationObserver (not intervals that die after 3 seconds)
- CSS injection at `document_start` for instant ad hiding
- Safe Chrome API wrappers to prevent extension context errors
- Modern ES6+ JavaScript throughout

## 🤝 Contributing

Found a bug? Want to add a feature? Have a better joke for this README?

1. Fork it (like a boss)
2. Create your feature branch:
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes:
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch:
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request (and maybe include a meme)

## ⚠️ Disclaimer

This extension was created for educational purposes only. Please support content creators you love!
(But maybe not the ones who put 5 ads in a 3-minute video... just kidding! Or are we? 🤔)

## 🎮 Usage Tips

- 💡 **Toggle On/Off**: Use the toggle switch in the popup
- 📈 **Watch Stats Grow**: More satisfying than bubble wrap
- 🎥 **Video Ads**: Gone faster than your weekend
- 🛡️ **Shield Icon**: Animated when protection is active

## 📜 License

MIT License - Feel free to use it, just don't blame us if YouTube gets mad!

## 🙏 Credits

- Built with love, caffeine, and a slight vendetta against mid-video ads
- Powered by the collective frustration of YouTube users worldwide
- Special thanks to Stack Overflow (our true MVP)
- Dedicated to everyone who's ever rage-clicked a "Skip Ad" button

## 💖 Support

If this project helped you skip an ad, consider:
- Giving it a ⭐️ (it's free, just like YouTube should be!)
- Sharing it with friends (spread the joy of ad-free viewing)
- [Buying me a coffee](https://www.buymeacoffee.com/sh13y) (because debugging requires fuel) ☕

---

Made with 💻 by [sh13y](https://github.com/sh13y)

*Remember: Time saved from ads = More time for cat videos* 😺
