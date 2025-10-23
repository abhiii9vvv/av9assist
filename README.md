# 🚀 av9Assist - AI-Powered Chat Assistant

> *Free, Secure, and Privacy-Focused AI Chat Application*

A modern AI chat assistant built with **Next.js 14**, **Tailwind CSS**, and cutting-edge AI technology. All your conversations are stored locally for maximum privacy and security.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Key Features

### 🔒 Privacy First
- **Local Storage Only** - All conversations stored in your browser
- **No Registration** - Start chatting immediately
- **Complete Control** - Clear your data anytime
- **Zero Tracking** - Your privacy is our priority

### 💬 Smart Chat Interface
- **AI-Powered Conversations** - Natural and intelligent responses
- **Message History** - Never lose your conversations
- **Copy & Share** - Easily copy any message
- **Like/Dislike** - Rate responses with visual feedback
- **Message Regeneration** - Get alternative responses
- **Multi-Provider Support** - Auto fallback for reliability

### 🎨 Creative AI Features (NEW!)
- **🪄 AI Image Generation** - Create images from text descriptions
- **🔊 Text-to-Speech** - Listen to any message with 6 voice options
- **📸 Image Analysis** - Upload and analyze images with AI
- **🌸 Pollinations.AI** - Free AI service, no API key required!

### 🎨 Beautiful Design
- **Dark/Light Themes** - Choose your preferred mode
- **Smooth Animations** - Delightful user experience
- **Responsive Layout** - Perfect on all devices
- **Code Highlighting** - Beautiful syntax highlighting
- **Modern UI** - Clean and intuitive interface

### ⚡ Performance Optimized
- **Fast Loading** - Optimized for speed
- **SEO Friendly** - Better search engine visibility
- **PWA Ready** - Install as an app
- **Code Splitting** - Efficient resource loading
- **Parallel AI Requests** - Fastest response wins!

## 🚀 Quick Start

```bash
# Clone and install
npm install

# Start development
npm run dev

# Visit http://localhost:3000
```

## ⚙️ Configuration

Create `.env.local` with your AI provider keys:

```env
# AI Text Providers (at least one recommended)
GOOGLE_API_KEY=your_gemini_key          # Google Gemini (vision capable)
GOOGLE_API_KEY_2=your_backup_key        # Backup key (optional)
GOOGLE_API_KEY_3=your_third_key         # Third backup (optional)
SAMBANOVA_API_KEY=your_sambanova_key    # SambaNova (fast & free)
OPENROUTER_API_KEY=your_openrouter_key  # OpenRouter (various models)

# Provider Priority (optional)
PROVIDERS_ORDER=gemini,sambanova,openrouter,pollinations

# Pollinations.AI (No API key needed - always free!)
# Automatically included as fallback
```

**Note:** Pollinations.AI works without any API keys! 🎉

*App works even without keys (Pollinations.AI fallback enabled)*

## 🎨 New Feature Guide

### Generate AI Images
1. Click the **🪄 magic wand** button in the input area
2. Enter a creative prompt (e.g., "A futuristic city at sunset")
3. Click "Generate Image"
4. Image appears in your chat!

### Text-to-Speech
1. Click the **🔊 speaker** button to choose a voice
2. Hover over any message
3. Click the speaker icon to hear it read aloud

### Image Analysis
1. Click the **📷 camera** button
2. Upload an image (PNG/JPG, max 5MB)
3. Ask questions about the image

### Change AI Provider
1. Click **⚙️ Settings** in the header
2. Choose your preferred provider
3. Or use "Auto" for fastest response

📚 **Full Guide:** See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) for detailed instructions!

## 🌐 Deploy

**Vercel** (Recommended)
```bash
vercel --prod
```

**Netlify**
- Build: `npm run build`
- Publish: `.next`  
- Node: `18+`

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI primitives  
- **AI Providers**: 
  - Google Gemini (vision capable)
  - SambaNova (fast & free)
  - OpenRouter (various models)
  - **Pollinations.AI** (free, no API key required!)
- **Storage**: Browser localStorage
- **Additional APIs**:
  - Pollinations Image Generation
  - Pollinations Text-to-Speech

---

## 📚 Documentation

- [Quick Start Guide](./QUICK_START_GUIDE.md) - Get started with new features
- [Integration Details](./POLLINATIONS_INTEGRATION.md) - Technical implementation

---

*Built with ❤️ for seamless AI conversations and creative possibilities*

## Deploy

### Vercel
- This repo includes `vercel.json` using the Next.js build.
- Steps:
  1. Import the project in Vercel.
  2. Set your environment variables in Project Settings → Environment Variables.
  3. Deploy. (Node 18+ is automatically provided by Vercel.)

### Netlify
- This repo includes `netlify.toml` and the official Next.js plugin.
- Settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
  - Plugin: `@netlify/plugin-nextjs`
  - Environment → Node version: `18`
- Set environment variables in Site Settings → Build & deploy → Environment.

## Project structure (high level)
- `app/` – App Router pages and API routes
- `components/` – UI primitives and chat components
- `hooks/` – Toast and other hooks
- `lib/` – AI provider integration, utilities, client API
- `styles/` – Global styles

## Notes & troubleshooting
- If code copy doesn’t show feedback on iOS, ensure you’re testing over http(s) and not file://. A legacy clipboard fallback is implemented.
- History titles are derived from the first user prompt and de‑duplicated automatically.
- For Netlify, ensure the Next.js plugin is enabled; it handles server functions and routing.

---

Built for a smooth, friendly chat experience with reliable fallbacks and easy cloud deploys.