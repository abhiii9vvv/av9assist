# 🚀 av9Assist

> *Modern AI chat interface with elegant design and smart fallbacks*

A sleek chat application built with **Next.js 14** and **Tailwind CSS v4**, featuring multi-provider AI integration, conversation history, and beautiful code rendering.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)

## ✨ Features
🎨 **Beautiful Interface** - Light/dark theme with subtle animations  
💬 **Smart Conversations** - History, editing, regenerate, export  
🔧 **Code Rendering** - Syntax highlighting with one-click copy  
⚡ **Multi-Provider AI** - Gemini, SambaNova, OpenRouter, HuggingFace  
📱 **Responsive Design** - Works seamlessly on all devices  

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
# Choose any provider(s)
GOOGLE_API_KEY=your_gemini_key
SAMBANOVA_API_KEY=your_sambanova_key
OPENROUTER_API_KEY=your_openrouter_key
HF_API_KEY=your_huggingface_key
```

*App works without keys (fallback responses enabled)*

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
- **AI**: Multi-provider with fallbacks
- **Storage**: Browser localStorage

---

*Built with ❤️ for seamless AI conversations*

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