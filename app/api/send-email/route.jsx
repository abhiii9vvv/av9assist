import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import nodemailer from 'nodemailer'

const DB_FILE = path.join(process.cwd(), 'data', 'users.json')

// Read users from database
async function readUsers() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Email templates
const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to av9Assist - Your AI Journey Begins!',
    getHtml: (email) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to av9Assist!</h1>
            </div>
            <div class="content">
              <h2>Hi there!</h2>
              <p>We're thrilled to have you join the av9Assist community! Your AI-powered assistant is ready to help you with:</p>
              <ul>
                <li>Intelligent conversations and problem-solving</li>
                <li>Image analysis and understanding</li>
                <li>Creative content generation</li>
                <li>Instant answers to your questions</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                Start Chatting Now
              </a>
              <h3>Quick Tips to Get Started:</h3>
              <ol>
                <li>Ask me anything - I'm here to help!</li>
                <li>Upload images for AI-powered analysis</li>
                <li>Use keyboard shortcuts (Ctrl+Enter to send)</li>
                <li>Check your conversation history anytime</li>
              </ol>
              <p>Have questions? Just start chatting and ask away!</p>
              <p>Best regards,<br><strong>The av9Assist Team</strong></p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you signed up for av9Assist.</p>
              <p>© 2025 av9Assist. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  
  update: {
    subject: 'New Features in av9Assist - Check Out What\'s New!',
    getHtml: (email, features = []) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .feature { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>What's New in av9Assist</h1>
            </div>
            <div class="content">
              <h2>Exciting Updates!</h2>
              <p>We've been working hard to make av9Assist even better for you. Here's what's new:</p>
              ${features.map(feature => `
                <div class="feature">
                  <h3>${feature.icon} ${feature.title}</h3>
                  <p>${feature.description}</p>
                </div>
              `).join('')}
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                Try New Features
              </a>
              <p>We'd love to hear your feedback! Reply to this email or chat with us.</p>
              <p>Happy chatting!<br><strong>The av9Assist Team</strong></p>
            </div>
            <div class="footer">
              <p>Don't want these updates? <a href="#">Manage email preferences</a></p>
              <p>© 2025 av9Assist. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  
  engagement: {
    subject: 'We Miss You at av9Assist!',
    getHtml: (email, daysSinceActive) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .tip { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Come Back and Chat!</h1>
            </div>
            <div class="content">
              <h2>We Miss You!</h2>
              <p>It's been ${daysSinceActive} days since your last visit. Your AI assistant is ready and waiting to help!</p>
              
              <h3>Things You Can Try Today:</h3>
              <div class="tip">
                <strong>Quick Question?</strong><br>
                Ask me anything - from coding help to creative ideas!
              </div>
              <div class="tip">
                <strong>Image Analysis</strong><br>
                Upload any image and I'll help you understand it better.
              </div>
              <div class="tip">
                <strong>Content Creation</strong><br>
                Need help writing? I'm great at brainstorming and drafting!
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/chat" class="button">
                Start Chatting Again
              </a>
              
              <p>Looking forward to helping you again!</p>
              <p>Best,<br><strong>Your av9Assist Team</strong></p>
            </div>
            <div class="footer">
              <p>Not interested? <a href="#">Unsubscribe from engagement emails</a></p>
              <p>© 2025 av9Assist. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
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
    if (type === 'welcome') {
      html = template.getHtml(email)
    } else if (type === 'update') {
      html = template.getHtml(email, data?.features || [])
    } else if (type === 'engagement') {
      html = template.getHtml(email, data?.daysSinceActive || 7)
    }

    const result = await sendEmailWithGmail(email, template.subject, html)

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

    if (!type || !['welcome', 'update', 'engagement'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid email type required' },
        { status: 400 }
      )
    }

    const users = await readUsers()
    const results = []
    let sent = 0
    let failed = 0

    for (const user of users) {
      // Check email preferences
      if (!user.emailPreferences?.[type === 'update' ? 'updates' : type === 'engagement' ? 'engagement' : 'tips']) {
        continue
      }

      try {
        const template = EMAIL_TEMPLATES[type]
        let html

        if (type === 'welcome') {
          html = template.getHtml(user.email)
        } else if (type === 'update') {
          // Default features for update email
          const features = [
            { icon: '', title: 'Smarter AI', description: 'Enhanced responses with better context understanding' },
            { icon: '', title: 'Faster Performance', description: 'Optimized for lightning-fast interactions' },
            { icon: '', title: 'Better UI', description: 'Cleaner interface for a smoother experience' }
          ]
          html = template.getHtml(user.email, features)
        } else if (type === 'engagement') {
          const lastActive = new Date(user.lastActive)
          const now = new Date()
          const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24))
          html = template.getHtml(user.email, daysSinceActive)
        }

        await sendEmailWithGmail(user.email, template.subject, html)
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

