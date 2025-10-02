import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAllUsers } from '@/lib/db'

// Email templates
const EMAIL_TEMPLATES = {
  welcome: {
    subject: '🎉 Hey! Welcome to av9Assist - Let\'s Get Started!',
    getHtml: (email) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center; }
            .emoji { font-size: 3em; margin-bottom: 10px; }
            .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .feature-box { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; margin: 15px 0; border-radius: 12px; border-left: 5px solid #667eea; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; margin: 25px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
            .tip { background: #fff8e1; padding: 15px; margin: 10px 0; border-radius: 10px; border-left: 4px solid #ffa726; }
            .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 13px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">👋</div>
              <h1 style="margin: 0; font-size: 2.2em;">Hey there, friend!</h1>
              <p style="margin-top: 10px; font-size: 1.1em; opacity: 0.95;">Welcome to the av9Assist family 💙</p>
            </div>
            <div class="content">
              <p style="font-size: 1.1em;">Wow, we're so excited to have you here! 🎊</p>
              <p>You've just unlocked your personal AI buddy who's ready to help you crush your goals. Think of me as your friendly sidekick! 🚀</p>
              
              <div class="feature-box">
                <h3 style="margin-top: 0; color: #667eea;">🎯 Here's what we can do together:</h3>
                <ul style="margin: 10px 0;">
                  <li>💬 Chat about literally anything (yes, even your random 3am thoughts!)</li>
                  <li>🖼️ Analyze images and get instant insights</li>
                  <li>✨ Brainstorm creative ideas together</li>
                  <li>💡 Solve problems and answer your burning questions</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                  🚀 Let's Chat!
                </a>
              </div>

              <div class="tip">
                <strong>🔥 Pro tip:</strong> Press Ctrl+Enter to send messages faster. You're gonna love it!
              </div>

              <p style="margin-top: 30px;">Got questions? Feeling stuck? Just hit me up in the chat - I'm here for you! 😊</p>
              
              <p style="margin-top: 25px; font-size: 1.05em;">
                Can't wait to get started!<br>
                <strong>Your AI Friend 🤖</strong><br>
                <span style="color: #667eea;">av9Assist Team</span>
              </p>
            </div>
            <div class="footer">
              <p>You're getting this because you joined av9Assist. Pretty cool, right? 😎</p>
              <p style="margin-top: 10px;">© 2025 av9Assist - Made with ❤️ for awesome people like you</p>
            </div>
          </div>
        </body>
      </html>
    `
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
              <p>Taking a break? No worries! <a href="#" style="color: #667eea;">Adjust your email settings</a></p>
              <p style="margin-top: 10px;">© 2025 av9Assist - Always here when you need us! 💙</p>
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
              <p>Want to change when you get these emails? <a href="#" style="color: #667eea;">Update your preferences</a></p>
              <p style="margin-top: 10px;">© 2025 av9Assist - Helping you stay motivated, one day at a time! 🌟</p>
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

    // Email options with anti-spam headers
    const mailOptions = {
      from: {
        name: 'av9Assist',
        address: GMAIL_USER
      },
      to: to,
      subject: subject,
      html: html,
      // Important anti-spam headers
      headers: {
        'X-Mailer': 'av9Assist',
        'X-Priority': '3',
        'Importance': 'normal',
        'List-Unsubscribe': `<mailto:${GMAIL_USER}?subject=unsubscribe>`,
        'Precedence': 'bulk'
      },
      // Add text version for better deliverability
      text: html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
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
    const { type, email, data } = await request.json()

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
      html = template.getHtml(email)
      subject = template.subject
    } else if (type === 'update') {
      html = template.getHtml(email, data?.features || [])
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

    // Simple admin authentication (replace with proper auth later)
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!type || !['welcome', 'update', 'engagement', 'daily'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid email type required' },
        { status: 400 }
      )
    }

    const users = await getAllUsers()
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
          html = template.getHtml(user.email)
          subject = template.subject
        } else if (type === 'update') {
          // Default features for update email
          const features = [
            { icon: '🧠', title: 'Smarter AI', description: 'Enhanced responses with better context understanding' },
            { icon: '⚡', title: 'Faster Performance', description: 'Optimized for lightning-fast interactions' },
            { icon: '🎨', title: 'Better UI', description: 'Cleaner interface for a smoother experience' }
          ]
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
        results.push({ email: user.email, status: 'sent' })
      } catch (error) {
        failed++
        results.push({ email: user.email, status: 'failed', error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast complete: ${sent} sent, ${failed} failed`,
      sent,
      failed,
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

