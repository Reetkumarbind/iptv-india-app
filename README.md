# 🚀 REET TV CHANNEL - Enhanced IPTV Streaming Platform

A powerful, feature-rich web-based IPTV player with advanced streaming capabilities, built with React, TypeScript, and modern web technologies.

**Live Demo:** [https://iptv-india-app.netlify.app](https://iptv-india-app.netlify.app)

## ✨ Features

### 🎯 Core Streaming
- **Advanced Video Player** with HLS.js support
- **Multi-quality streaming** (Auto, 1080p, 720p, 480p)
- **Playback speed control** (0.5x to 2x)
- **Audio track selection** for multi-language streams
- **Picture-in-Picture** support
- **Auto-retry** failed streams with intelligent fallback

### 🎨 Enhanced User Experience
- **Mini Player Mode** - Draggable floating player
- **Recently Watched** - Quick access to your viewing history
- **Trending Channels** - Popular content based on viewing patterns
- **Voice Search** - Search channels using speech recognition
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Dark/Light Theme** toggle
- **Responsive Design** - Optimized for all devices

### 🔍 Advanced Discovery
- **Smart Search** with voice input
- **Category Filtering** (News, Sports, Movies, Music, Kids, etc.)
- **Language Filtering** - Filter by broadcast language
- **Multiple Sort Options** - Name, Category, Trending, Recent
- **Favorites System** with persistent storage

### 📊 Analytics & Performance
- **Stream Health Monitoring** - Real-time connection quality
- **Bandwidth Usage Tracking** - Monitor data consumption
- **Watch History** - Detailed viewing analytics
- **Performance Optimization** - Lazy loading and caching

### 🔒 Security & Privacy
- **HTTPS Encryption** - Secure SSL/TLS connections
- **Content Security Policy** - XSS and injection protection
- **Input Sanitization** - Prevents malicious data injection
- **Rate Limiting** - API abuse protection
- **Secure Storage** - Encrypted local data storage
- **URL Validation** - Prevents unsafe stream sources
- **Security Headers** - HSTS, X-Frame-Options, CSP
- **Real-time Threat Detection** - Security monitoring

### ⚙️ Settings & Customization
- **User Preferences** - Personalized experience
- **Export/Import** - Backup and restore your data
- **Keyboard Shortcuts** - Customizable hotkeys
- **Auto-play Settings** - Control playback behavior

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS with custom animations
- **Video:** HLS.js for adaptive streaming
- **Icons:** Lucide React
- **Storage:** LocalStorage with structured data management
- **Audio:** Web Speech API for voice search
- **Performance:** Code splitting and lazy loading

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone https://github.com/ipradipnalwaya/iptv-india-app.git
cd iptv-india-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` `→` | Previous/Next Channel |
| `↑` `↓` | Volume Up/Down |
| `F` | Toggle Favorite |
| `M` | Toggle Mute |
| `Esc` | Back to Gallery |
| `S` | Open Settings |
| `?` | Show Shortcuts |

## 📱 Mobile Features

- **Touch-optimized** controls
- **Swipe gestures** for navigation
- **Responsive layout** adapts to screen size
- **Touch targets** meet accessibility standards
- **Mobile-first** design approach

## 🔧 Advanced Configuration

### Custom M3U Playlist
Update the `M3U_URL` in `App.tsx` to use your own playlist:

```typescript
const M3U_URL = 'https://your-playlist-url.com/playlist.m3u';
```

### Theme Customization
Modify `index.css` for custom themes:

```css
.light {
  --tw-bg-slate-950: #ffffff;
  --tw-text-slate-100: #0f172a;
  /* Add your custom colors */
}
```

## 📊 Data Management

### Storage Structure
```typescript
// Favorites
iptv_favorites_v2: string[]

// Watch History
iptv_watch_history_v1: WatchHistoryItem[]

// User Preferences
iptv_user_preferences_v1: UserPreferences

// Stream Health
iptv_stream_health_v1: StreamHealth[]

// Bandwidth Usage
iptv_bandwidth_usage_v1: { [date: string]: number }
```

### Export/Import
- **Export:** Download JSON backup of all user data
- **Import:** Restore from backup file
- **Reset:** Clear all stored data

## 🌐 Browser Support

| Browser | Version | Features |
|---------|---------|----------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |

**Note:** Voice search requires HTTPS in production.

## 🚀 Deployment

### Netlify (Recommended)
1. Fork this repository
2. Connect to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

### Vercel
```bash
npm i -g vercel
vercel --prod
```

## 🔒 Security Features

### 🛡️ Built-in Security
- **HTTPS Enforcement** - All connections encrypted with SSL/TLS
- **Content Security Policy** - Comprehensive CSP headers prevent XSS attacks
- **Input Sanitization** - All user inputs are sanitized and validated
- **URL Validation** - Stream URLs are validated for security
- **Rate Limiting** - Prevents API abuse and DoS attacks
- **Secure Storage** - Local data encrypted with custom encryption
- **Security Headers** - HSTS, X-Frame-Options, X-Content-Type-Options
- **Threat Detection** - Real-time monitoring for security threats

### 🔐 Security Indicator
The app includes a real-time security status indicator showing:
- HTTPS connection status
- Security headers status
- Data encryption status
- Active security threats (if any)
- Security feature status

### 🚨 Security Best Practices
- Always use HTTPS in production
- Regularly update dependencies
- Validate all external content
- Monitor for security threats
- Use secure streaming sources only

## 🔒 Privacy & Security

- **No data collection** - All data stored locally with encryption
- **HTTPS enforced** - Secure connections with SSL/TLS
- **CORS-compliant** streaming sources with validation
- **No external tracking** - Complete privacy protection
- **Security monitoring** - Real-time threat detection
- **Input validation** - All data sanitized and validated

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is provided for **educational and personal use only**.
Please comply with local laws and streaming regulations.

## 👨‍💻 Author

**Reet Kumar Bind**
- Portfolio: [https://reetkumarbind-portfolio.vercel.app/](https://reetkumarbind-portfolio.vercel.app/)
- GitHub: [@reetkumarbind](https://github.com/reetkumarbind@gmail.com)

## 🙏 Acknowledgments

- [IPTV-org](https://github.com/iptv-org/iptv) for the channel database
- [HLS.js](https://github.com/video-dev/hls.js/) for video streaming
- [Lucide](https://lucide.dev/) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📈 Roadmap

- [ ] **Chromecast Support** - Cast to TV devices
- [ ] **EPG Integration** - Electronic Program Guide
- [ ] **Multi-language UI** - Internationalization
- [ ] **Channel Groups** - Custom organization
- [ ] **Parental Controls** - Content filtering
- [ ] **Social Features** - Share and rate channels
- [ ] **PWA Support** - Offline functionality
- [ ] **Cloud Sync** - Cross-device synchronization

---

<div align="center">
  <strong>Built with ❤️ for the streaming community</strong>
</div>
