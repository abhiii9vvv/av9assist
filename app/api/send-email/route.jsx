import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAllUsers } from '@/lib/db'

// -----------------------------------------
// Personalization utilities
// -----------------------------------------

const HERO_TITLE_VARIANTS = [
  "Your AI co-pilot is ready.",
  "A smarter creative partner just joined your team.",
  "Launch faster with av9Assist at your side.",
  "Your ideas, now on fast-forward.",
  "Every breakthrough needs the right sidekick."
]

const HERO_SUBTITLE_VARIANTS = [
  "From quick answers to deep research, av9Assist keeps pace with whatever you're building.",
  "Share your goals and I'll help brainstorm, plan, and ship with confidence.",
  "Think of me as your always-on teammate for ideation, writing, and technical problem solving.",
  "Bring the spark — I'll handle the heavy lifting across your workflow.",
  "Fresh insights, instant drafts, and smarter support in every conversation."
]

const INTRO_HIGHLIGHTS = [
  "You just unlocked your personal AI co-pilot for faster ideas, better focus, and effortless execution.",
  "Consider this your launchpad: smarter research, sharper copy, and calmer workflows in one space.",
  "Welcome to the workspace where curiosity meets clarity — and you stay in flow.",
  "You've joined thousands of builders who let av9Assist accelerate their next big win."
]

const ONBOARDING_MESSAGES = [
  "Set one goal for the week and I'll nudge you toward it each time we chat.",
  "Kick things off by telling me what you're building — I'll map the steps with you.",
  "Drop your current challenge into chat and let's co-create the solution.",
  "Pin me in your browser and treat av9Assist like your creative whiteboard on demand.",
  "Try starting with ‘/plan’ + your project idea to get a structured plan in seconds."
]

const ONBOARDING_TIPS = [
  "Pro tip: Press Ctrl+Enter (Cmd+Enter on Mac) to send messages instantly.",
  "Pro tip: Use /remember to store project context I can recall later.",
  "Shortcut: Drag images into the chat — I'll analyze them right away.",
  "Speed boost: Summon past answers with /history to keep momentum.",
  "Customise: Try dark mode from the sidebar for late-night focus sessions."
]

const MILESTONE_TITLES = [
  "Here's your personalized jumpstart:",
  "Kickoff checklist built for you:",
  "Three moves to make right now:",
  "Your first-week momentum plan:",
  "Unlock your flow with these quick wins:"
]

const MILESTONE_POOL = [
  { icon: '⚡', text: 'Bookmark favourite prompts with /bookmark so you can reuse them on demand.' },
  { icon: '🧠', text: 'Create a knowledge pack with /remember to keep key facts handy.' },
  { icon: '🎯', text: 'Use /plan to break down a project into milestones and daily actions.' },
  { icon: '🖼️', text: 'Upload a design or screenshot — I\'ll critique, summarise, or extract text.' },
  { icon: '🗂️', text: 'Label chats with /tag to organise updates across teams or clients.' },
  { icon: '🔁', text: 'Ask me to “rewrite this more friendly” to iterate on copy instantly.' },
  { icon: '📌', text: 'Pin av9Assist as a desktop app for one-tap access all day.' },
  { icon: '⌛', text: 'Schedule daily reminders with /daily so progress stays visible.' }
]

const ACTION_LABELS = [
  'Open av9Assist',
  'Jump back into chat',
  'Start your first conversation',
  'Continue building with av9Assist',
  'Launch your workspace'
]

const SIGNATURE_TITLES = [
  "We're cheering for you every step of the way.",
  'Big leaps start with small prompts. I\'ve got your back.',
  'Reply to this email with your goal — we read every message.',
  'Momentum loves company. Let\'s keep yours going.',
  'Your breakthroughs are why we built av9Assist.'
]

const SIGNATURE_NAMES = [
  'Team av9Assist',
  'Your av9Assist Crew',
  'The av9Assist Studio',
  'av9Assist Support',
  'The av9Assist Builders'
]

const UPDATE_FEATURE_POOL = [
  { icon: '🧠', title: 'Context upgrades', description: 'Longer conversations stay sharp with smarter memory cues.' },
  { icon: '⚙️', title: 'Workflow recipes', description: 'Save multi-step prompts as reusable templates for your team.' },
  { icon: '🎨', title: 'Visual polish', description: 'Cleaner UI, adaptive themes, and better accessibility out of the box.' },
  { icon: '🔍', title: 'Instant research', description: 'Drop in URLs or PDFs and get bullet-friendly summaries instantly.' },
  { icon: '🤝', title: 'Collaboration spaces', description: 'Share chats, annotate feedback, and keep everyone aligned.' },
  { icon: '🚀', title: 'Performance boost', description: 'Faster responses and more reliable uptime wherever you log in.' }
]

function formatNameFromEmail(email = '') {
  const base = email.split('@')[0] || 'there'
  return base
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function hashEmail(email = '') {
  let hash = 0
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash << 5) - hash + email.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pickFrom(array, hash, offset = 0) {
  if (!array.length) return undefined
  return array[(hash + offset) % array.length]
}

function pickMultiple(array, hash, count) {
  if (!array.length) return []
  const items = [...array]
  const result = []
  let localHash = hash

  for (let i = 0; i < count && items.length; i += 1) {
    localHash = (localHash * 31 + i) >>> 0
    const index = localHash % items.length
    result.push(items.splice(index, 1)[0])
  }

  return result
}

function buildWelcomePersonalization(email) {
  const hash = hashEmail(email)
  const name = formatNameFromEmail(email)

  return {
    greeting: `Welcome aboard, ${name}!`,
    introHighlight: pickFrom(INTRO_HIGHLIGHTS, hash) || INTRO_HIGHLIGHTS[0],
    heroTitle: pickFrom(HERO_TITLE_VARIANTS, hash >> 1) || HERO_TITLE_VARIANTS[0],
    heroSubtitle: pickFrom(HERO_SUBTITLE_VARIANTS, hash >> 3) || HERO_SUBTITLE_VARIANTS[0],
    milestoneTitle: pickFrom(MILESTONE_TITLES, hash >> 5) || MILESTONE_TITLES[0],
    milestoneItems: pickMultiple(MILESTONE_POOL, hash >> 7, 3),
    actionLabel: pickFrom(ACTION_LABELS, hash >> 9) || ACTION_LABELS[0],
    onboardingMessage: pickFrom(ONBOARDING_MESSAGES, hash >> 11) || ONBOARDING_MESSAGES[0],
    onboardingTip: pickFrom(ONBOARDING_TIPS, hash >> 13) || ONBOARDING_TIPS[0],
    signatureTitle: pickFrom(SIGNATURE_TITLES, hash >> 15) || SIGNATURE_TITLES[0],
    signatureName: pickFrom(SIGNATURE_NAMES, hash >> 17) || SIGNATURE_NAMES[0]
  }
}

function buildUpdateFeatures(email, featuresOverride) {
  if (Array.isArray(featuresOverride) && featuresOverride.length > 0) {
    return featuresOverride
  }
  const hash = hashEmail(email)
  return pickMultiple(UPDATE_FEATURE_POOL, hash >> 2, 3)
}

// Email templates
const EMAIL_TEMPLATES = {
  welcome: {
    subject: '🌟 Welcome to av9Assist — Your AI Co-Pilot Awaits!',
    getHtml: (email, personalization = {}) => {
      const base = buildWelcomePersonalization(email)
      const {
        greeting,
        introHighlight,
        heroTitle,
        heroSubtitle,
        milestoneTitle,
        milestoneItems,
        actionLabel,
        onboardingMessage,
        onboardingTip,
        signatureTitle,
        signatureName
      } = { ...base, ...personalization }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'
      const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`
      const contactEmail = process.env.GMAIL_USER || 'support@av9assist.com'
      const steps = Array.isArray(milestoneItems) && milestoneItems.length > 0
        ? milestoneItems
        : pickMultiple(MILESTONE_POOL, Date.now(), 3)

      return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Welcome to av9Assist</title>
          <style>
            body { margin:0; padding:0; background-color:#f2f4fb; }
            table { border-collapse:collapse; }
            img { border:0; line-height:100%; }
            @media screen and (max-width: 600px) {
              .mobile-padding { padding:24px !important; }
              .full-width { width:100% !important; display:block !important; }
              .hero-text { font-size:26px !important; line-height:34px !important; }
              .sub-text { font-size:16px !important; }
            }
          </style>
          <!--[if mso]>
          <style type="text/css">
            body, table, td { font-family: 'Segoe UI', Arial, sans-serif !important; }
          </style>
          <![endif]-->
        </head>
        <body style="margin:0; padding:0; background-color:#f2f4fb;">
          <center style="width:100%; background-color:#f2f4fb; padding:32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px; margin:0 auto;">
              <tr>
                <td style="padding:0 20px;" class="mobile-padding">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 18px 45px rgba(76, 81, 191, 0.18);">
                    <tr>
                      <td style="background:linear-gradient(135deg,#5c6cff 0%,#8f53ff 100%); padding:48px 40px; text-align:left; color:#ffffff;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="font-size:16px; letter-spacing:0.4px; opacity:0.9; text-transform:uppercase; font-weight:600;">${greeting}</td>
                          </tr>
                          <tr>
                            <td class="hero-text" style="padding-top:16px; font-size:30px; line-height:38px; font-weight:700; font-family:'Segoe UI', Arial, sans-serif;">${heroTitle}</td>
                          </tr>
                          <tr>
                            <td class="sub-text" style="padding-top:14px; font-size:18px; line-height:28px; opacity:0.92; font-family:'Segoe UI', Arial, sans-serif;">${heroSubtitle}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 40px 16px; font-family:'Segoe UI', Arial, sans-serif; color:#2d3361; font-size:17px; line-height:28px;">
                        <strong style="color:#5c6cff;">${introHighlight}</strong>
                        <p style="margin:18px 0 0;">${onboardingMessage}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 40px 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f7f9ff 0%,#eef1ff 100%); border-radius:18px;">
                          <tr>
                            <td style="padding:28px 28px 10px; font-family:'Segoe UI', Arial, sans-serif; color:#404673; font-size:18px; font-weight:600;">${milestoneTitle}</td>
                          </tr>
                          ${steps.map(item => `
                          <tr>
                            <td style="padding:12px 28px; font-family:'Segoe UI', Arial, sans-serif; color:#4d5382; font-size:16px; border-top:1px solid rgba(92,108,255,0.12);">
                              <span style="font-size:20px; margin-right:8px;">${item.icon}</span>${item.text}
                            </td>
                          </tr>
                          `).join('')}
                          <tr>
                            <td style="padding:24px 28px 30px; text-align:center;">
                              <a href="${appUrl}/chat" style="display:inline-block; background:linear-gradient(135deg,#5c6cff 0%,#8f53ff 100%); color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:38px; font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; box-shadow:0 10px 24px rgba(92,108,255,0.35);">
                                ${actionLabel} →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 40px 32px; font-family:'Segoe UI', Arial, sans-serif; color:#555b87; font-size:15px; line-height:24px; background:#f9f9fe;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom:12px; font-size:15px; font-weight:600; color:#5c6cff;">Quick boost</td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:18px;">${onboardingTip}</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#7b80a7;">${signatureTitle}<br /><strong style="color:#414675;">${signatureName}</strong></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:28px 40px 36px; text-align:center; font-family:'Segoe UI', Arial, sans-serif; font-size:13px; line-height:20px; color:#8690c0;">
                        <p style="margin:0 0 12px;">You\'re receiving this email because you created an av9Assist account. If this wasn\'t you, let us know right away.</p>
                        <p style="margin:0 0 12px;">Need help? <a href="mailto:${contactEmail}" style="color:#5c6cff; text-decoration:none;">Contact our team</a></p>
                        <p style="margin:0 0 12px;">Prefer fewer emails? <a href="${unsubscribeUrl}" style="color:#5c6cff; text-decoration:underline;">Update your preferences</a></p>
                        <p style="margin:12px 0 0; font-size:12px; color:#a1a7d4;">© ${new Date().getFullYear()} av9Assist — Built to accelerate your ideas.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </center>
        </body>
      </html>
      `
    }
  },
  
  update: {
    subject: '✨ Exciting News - We Just Got Better!',
    getHtml: (email, features = []) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center; }
            .emoji { font-size: 3em; margin-bottom: 10px; }
            .content { background: #ffffff; padding: 40px 30px; }
            .feature { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; margin: 20px 0; border-radius: 12px; border-left: 5px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; margin: 25px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 13px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🎉</div>
              <h1 style="margin: 0; font-size: 2.2em;">Guess What?</h1>
              <p style="margin-top: 10px; font-size: 1.1em; opacity: 0.95;">We've got some cool updates for you!</p>
            </div>
            <div class="content">
              <p style="font-size: 1.1em;">Hey friend! 👋</p>
              <p>We've been cooking up some awesome improvements just for you! Check out what's new:</p>
              ${features.map(feature => `
                <div class="feature">
                  <h3 style="margin-top: 0; color: #667eea;">${feature.icon} ${feature.title}</h3>
                  <p style="margin-bottom: 0;">${feature.description}</p>
                </div>
              `).join('')}
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                  🚀 Try It Now!
                </a>
              </div>
              <p style="margin-top: 30px;">We'd love to know what you think! Hit reply and share your thoughts - we read every message! 💙</p>
              <p style="margin-top: 25px; font-size: 1.05em;">
                Keep being awesome!<br>
                <strong>Your Friends at av9Assist 🤖</strong>
              </p>
            </div>
            <div class="footer">
              <p>Want to adjust your email preferences? <a href="#" style="color: #667eea;">Click here</a></p>
              <p style="margin-top: 10px;">© 2025 av9Assist - Always improving for you! ✨</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  
  engagement: {
    subject: '👋 Hey! We Miss You - Come Say Hi!',
    getHtml: (email, daysSinceActive) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center; }
            .emoji { font-size: 3em; margin-bottom: 10px; }
            .content { background: #ffffff; padding: 40px 30px; }
            .tip { background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); padding: 20px; margin: 15px 0; border-radius: 12px; border-left: 5px solid #fc8181; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; margin: 25px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 13px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🥺</div>
              <h1 style="margin: 0; font-size: 2.2em;">We Miss You!</h1>
              <p style="margin-top: 10px; font-size: 1.1em; opacity: 0.95;">It's been ${daysSinceActive} days since we last chatted</p>
            </div>
            <div class="content">
              <p style="font-size: 1.1em;">Hey there! 👋</p>
              <p>Your AI buddy has been waiting for you! We've been keeping your chat history safe and ready for when you come back. 💙</p>
              
              <p style="font-weight: bold; color: #667eea; font-size: 1.15em; margin-top: 25px;">Here are some fun things we can do together:</p>
              
              <div class="tip">
                <strong>💬 Quick Question Mode</strong><br>
                Got a burning question? Ask me anything - from "how to center a div" to "best pizza toppings" (yes, really!)
              </div>
              <div class="tip">
                <strong>🖼️ Image Detective</strong><br>
                Upload any image and I'll help you understand it, extract text, or just chat about what we see!
              </div>
              <div class="tip">
                <strong>✍️ Creative Partner</strong><br>
                Need help writing? Let's brainstorm together! Emails, stories, code - you name it!
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                  💬 Let's Chat Again!
                </a>
              </div>
              
              <p style="margin-top: 30px; font-style: italic; color: #718096;">P.S. - I promise I won't judge your 3am questions 😄</p>
              
              <p style="margin-top: 25px; font-size: 1.05em;">
                Can't wait to see you again!<br>
                <strong>Missing you 🤗</strong><br>
                <span style="color: #667eea;">Your AI Friend at av9Assist</span>
              </p>
            </div>
            <div class="footer">
              <p>Taking a break? No worries! <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/settings" style="color: #667eea;">Adjust your email settings</a></p>
              <p style="margin-top: 10px;">Don't want these emails? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #667eea; text-decoration: underline;">Unsubscribe here</a></p>
              <p style="margin-top: 10px; font-size: 12px; color: #a0aec0;">av9Assist | AI Assistant Platform | <a href="mailto:${process.env.GMAIL_USER || 'support@av9assist.com'}" style="color: #667eea;">Contact Us</a></p>
              <p style="margin-top: 5px;">© 2025 av9Assist - Always here when you need us! 💙</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  daily: {
    subject: (date) => `🌟 Your Daily Boost - ${date}`,
    getHtml: (email, data = {}) => {
      const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
        { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
        { text: "First, solve the problem. Then, write the code.", author: "John Johnson" }
      ]
      
      const quote = data.quote || quotes[Math.floor(Math.random() * quotes.length)]
      const reminders = data.reminders || [
        { icon: "💻", text: "Solve at least 1 LeetCode problem", done: false },
        { icon: "📚", text: "Read 10 pages of a technical book", done: false },
        { icon: "🏃", text: "Take a 10-minute walk break", done: false },
        { icon: "💧", text: "Drink 8 glasses of water", done: false }
      ]
      
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center; }
            .emoji { font-size: 3.5em; margin-bottom: 10px; animation: bounce 2s infinite; }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .content { background: #ffffff; padding: 40px 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .quote-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: 25px 0; border-radius: 15px; position: relative; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
            .quote-text { font-size: 1.3em; font-style: italic; margin: 0; line-height: 1.6; }
            .quote-author { font-size: 1em; margin-top: 15px; text-align: right; opacity: 0.9; font-weight: bold; }
            .reminder-section { margin: 30px 0; }
            .reminder-item { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; margin: 12px 0; border-radius: 12px; border-left: 5px solid #48bb78; display: flex; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; }
            .reminder-item:hover { transform: translateX(5px); }
            .reminder-icon { font-size: 2em; margin-right: 15px; }
            .reminder-text { flex: 1; font-size: 1.05em; }
            .motivational-section { background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #fc8181; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; margin: 25px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 13px; padding: 20px; }
            .tip-box { background: #fff8e1; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 5px solid #ffa726; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🌅</div>
              <h1 style="margin: 0; font-size: 2.5em;">Good Morning, Champ!</h1>
              <p style="margin-top: 10px; font-size: 1.2em; opacity: 0.95;">Time to make today AMAZING! ✨</p>
            </div>
            <div class="content">
              <p style="font-size: 1.15em; color: #667eea; font-weight: bold;">Hey there, superstar! 👋</p>
              <p style="font-size: 1.05em;">Hope you're having an awesome day! Here's your daily dose of motivation to keep you crushing it! 💪</p>
              
              <div class="quote-box">
                <p class="quote-text">"${quote.text}"</p>
                <p class="quote-author">— ${quote.author}</p>
              </div>

              <div class="reminder-section">
                <h2 style="color: #667eea; font-size: 1.5em; margin-bottom: 20px;">📝 Today's Mission (if you choose to accept it!):</h2>
                ${reminders.map(reminder => `
                  <div class="reminder-item">
                    <div class="reminder-icon">${reminder.icon}</div>
                    <div class="reminder-text">${reminder.text}</div>
                  </div>
                `).join('')}
              </div>

              <div class="motivational-section">
                <h3 style="margin-top: 0; color: #e53e3e;">💡 Quick Pep Talk:</h3>
                <p style="margin: 10px 0; font-size: 1.05em;">
                  Remember: Every expert was once a beginner. Every line of code you write, every problem you solve, every challenge you face - they're all making you stronger! 🚀
                </p>
                <p style="margin: 10px 0; font-style: italic;">
                  You're doing better than you think. Keep going, friend! 🌟
                </p>
              </div>

              <div class="tip-box">
                <strong>🔥 Pro Tip of the Day:</strong><br>
                Feeling stuck on a problem? Take a 5-minute break! Sometimes your brain just needs a quick reset. Come back fresh and you'll be surprised how clear things become! 🧠✨
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                  💬 Need Help? Let's Chat!
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 1.05em; text-align: center; color: #718096;">
                Remember: Progress over perfection! 🎯<br>
                You got this! 💪
              </p>
              
              <p style="margin-top: 30px; font-size: 1.05em;">
                Cheering for you always!<br>
                <strong>Your Daily Motivation Buddy 🤗</strong><br>
                <span style="color: #667eea;">av9Assist Team</span>
              </p>
            </div>
            <div class="footer">
              <p>Want to change when you get these emails? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/settings" style="color: #667eea;">Update your preferences</a></p>
              <p style="margin-top: 10px;">Don't want these emails? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #667eea; text-decoration: underline;">Unsubscribe here</a></p>
              <p style="margin-top: 10px; font-size: 12px; color: #a0aec0;">av9Assist | AI Assistant Platform | <a href="mailto:${process.env.GMAIL_USER || 'support@av9assist.com'}" style="color: #667eea;">Contact Us</a></p>
              <p style="margin-top: 5px;">© 2025 av9Assist - Helping you stay motivated, one day at a time! 🌟</p>
            </div>
          </div>
        </body>
      </html>
      `
    }
  }
}

// Send email using Gmail SMTP with Nodemailer
async function sendEmailWithGmail(to, subject, html) {
  const GMAIL_USER = process.env.GMAIL_USER
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
  
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log('Email preview (Gmail credentials not configured):')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`HTML: ${html.substring(0, 200)}...`)
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local')
  }

  try {
    // Create Gmail transporter with proper anti-spam configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
      },
      // Anti-spam configurations
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    })

    // Verify transporter configuration
    await transporter.verify()
    console.log('Gmail SMTP server is ready to send emails')

    // Email options with comprehensive anti-spam headers
    const mailOptions = {
      from: {
        name: 'av9Assist Team',
        address: GMAIL_USER
      },
      replyTo: {
        name: 'av9Assist Support',
        address: GMAIL_USER
      },
      to: to,
      subject: subject,
      html: html,
      // Comprehensive anti-spam headers for better deliverability
      headers: {
        'X-Mailer': 'av9Assist Email System v1.0',
        'X-Priority': '3',
        'Importance': 'normal',
        'X-MSMail-Priority': 'Normal',
        'X-Entity-Ref-ID': `av9assist-${Date.now()}`,
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/unsubscribe?email=${encodeURIComponent(to)}>, <mailto:${GMAIL_USER}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'Message-ID': `<${Date.now()}.${Math.random().toString(36).substring(7)}@av9assist.com>`,
        'Reply-To': GMAIL_USER,
        'Return-Path': GMAIL_USER,
        // Prevent threading issues
        'References': `<av9assist-${Date.now()}@av9assist.com>`,
        'In-Reply-To': null
      },
      // Add text version for better deliverability (required by most email providers)
      text: html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      // Encoding
      encoding: 'utf-8',
      textEncoding: 'base64'
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    })

    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    }
  } catch (error) {
    console.error('Error sending email via Gmail:', error)
    throw error
  }
}

// POST - Send email
export async function POST(request) {
  try {
    const { type, email, emails, data } = await request.json()

    // Handle multiple emails (from admin dashboard)
    if (emails && Array.isArray(emails)) {
      const results = {
        sent: 0,
        failed: 0,
        errors: []
      }

      for (const recipientEmail of emails) {
        try {
          const template = EMAIL_TEMPLATES[type]
          if (!template) {
            throw new Error('Invalid email type')
          }

          let html, subject

          if (type === 'welcome') {
            const personalization = buildWelcomePersonalization(recipientEmail)
            html = template.getHtml(recipientEmail, personalization)
            subject = template.subject
          } else if (type === 'update') {
            const features = buildUpdateFeatures(recipientEmail, data?.features)
            html = template.getHtml(recipientEmail, features)
            subject = template.subject
          } else if (type === 'engagement') {
            html = template.getHtml(recipientEmail, data?.daysSinceActive || 7)
            subject = template.subject
          } else if (type === 'daily' || type === 'missing') {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            html = EMAIL_TEMPLATES.daily.getHtml(recipientEmail, data)
            subject = EMAIL_TEMPLATES.daily.subject(today)
          }

          await sendEmailWithGmail(recipientEmail, subject, html)
          results.sent++
        } catch (error) {
          console.error(`Failed to send email to ${recipientEmail}:`, error)
          results.failed++
          results.errors.push({ email: recipientEmail, error: error.message })
        }
      }

      return NextResponse.json({
        success: results.sent > 0,
        message: `Sent ${results.sent} emails, ${results.failed} failed`,
        ...results
      })
    }

    // Handle single email
    if (!type || !email) {
      return NextResponse.json(
        { error: 'Email type and recipient are required' },
        { status: 400 }
      )
    }

    const template = EMAIL_TEMPLATES[type]
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    let html
    let subject
    
    if (type === 'welcome') {
      const personalization = buildWelcomePersonalization(email)
      html = template.getHtml(email, personalization)
      subject = template.subject
    } else if (type === 'update') {
      const features = buildUpdateFeatures(email, data?.features)
      html = template.getHtml(email, features)
      subject = template.subject
    } else if (type === 'engagement') {
      html = template.getHtml(email, data?.daysSinceActive || 7)
      subject = template.subject
    } else if (type === 'daily') {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      html = template.getHtml(email, data)
      subject = template.subject(today)
    }

    const result = await sendEmailWithGmail(email, subject, html)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      ...result
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Send broadcast emails to all users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminKey = searchParams.get('adminKey')

    console.log(`📧 Broadcast email request: type=${type}, hasAdminKey=${!!adminKey}`)

    // Simple admin authentication (replace with proper auth later)
    if (adminKey !== process.env.ADMIN_KEY) {
      console.error('❌ Unauthorized broadcast attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!type || !['welcome', 'update', 'engagement', 'daily'].includes(type)) {
      console.error(`❌ Invalid email type: ${type}`)
      return NextResponse.json(
        { error: 'Valid email type required' },
        { status: 400 }
      )
    }

    console.log(`📊 Fetching users from database...`)
    const users = await getAllUsers()
    console.log(`📊 Found ${users.length} users in database`)
    
    if (users.length === 0) {
      console.log('⚠️ No users found in database')
      return NextResponse.json({
        success: false,
        message: 'No users found in database',
        sent: 0,
        failed: 0,
        total: 0,
        results: []
      })
    }

    const results = []
    let sent = 0
    let failed = 0

    for (const user of users) {
      // Check email preferences - daily emails use 'daily' preference
      const prefKey = type === 'update' ? 'updates' : type === 'engagement' ? 'engagement' : type === 'daily' ? 'daily' : 'tips'
      if (!user.emailPreferences?.[prefKey]) {
        continue
      }

      try {
        const template = EMAIL_TEMPLATES[type]
        let html
        let subject

        if (type === 'welcome') {
          const personalization = buildWelcomePersonalization(user.email)
          html = template.getHtml(user.email, personalization)
          subject = template.subject
        } else if (type === 'update') {
          const features = buildUpdateFeatures(user.email)
          html = template.getHtml(user.email, features)
          subject = template.subject
        } else if (type === 'engagement') {
          const lastActive = new Date(user.lastActive)
          const now = new Date()
          const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24))
          html = template.getHtml(user.email, daysSinceActive)
          subject = template.subject
        } else if (type === 'daily') {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
          html = template.getHtml(user.email)
          subject = template.subject(today)
        }

        await sendEmailWithGmail(user.email, subject, html)
        sent++
        results.push({ email: user.email, status: 'sent', type })
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error.message)
        failed++
        results.push({ email: user.email, status: 'failed', error: error.message })
      }
    }

    console.log(`📧 Broadcast summary: ${sent} sent, ${failed} failed out of ${users.length} total users`)

    return NextResponse.json({
      success: sent > 0, // Only success if at least one email sent
      message: `Broadcast complete: ${sent} sent, ${failed} failed`,
      sent,
      failed,
      total: users.length,
      results
    })
  } catch (error) {
    console.error('Error sending broadcast:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}

