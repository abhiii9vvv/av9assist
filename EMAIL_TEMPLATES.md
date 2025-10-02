# 📧 av9Assist Email Templates

This document shows all the email templates used in the av9Assist application.

---

## 🎯 Email Types Overview

We send **3 types** of emails to users:

| Type | Purpose | Subject Line | When Sent |
|------|---------|-------------|-----------|
| **Welcome** | Onboard new users | "Welcome to av9Assist - Your AI Journey Begins!" | When user first signs up |
| **Update** | Announce new features | "New Features in av9Assist - Check Out What's New!" | When admin broadcasts updates |
| **Engagement** | Re-engage inactive users | "We Miss You at av9Assist!" | When admin broadcasts to inactive users |

---

## 1. 📨 Welcome Email

### Subject
```
Welcome to av9Assist - Your AI Journey Begins!
```

### Content Preview
```
┌─────────────────────────────────────────┐
│  🎉 Welcome to av9Assist!               │
│  (Purple gradient header)               │
└─────────────────────────────────────────┘

Hi there!

We're thrilled to have you join the av9Assist community! 
Your AI-powered assistant is ready to help you with:

✓ Intelligent conversations and problem-solving
✓ Image analysis and understanding
✓ Creative content generation
✓ Instant answers to your questions

[Start Chatting Now] (Blue button)

Quick Tips to Get Started:
1. Ask me anything - I'm here to help!
2. Upload images for AI-powered analysis
3. Use keyboard shortcuts (Ctrl+Enter to send)
4. Check your conversation history anytime

Have questions? Just start chatting and ask away!

Best regards,
The av9Assist Team
```

### Features
- **Gradient Header**: Purple to violet gradient
- **Clear Call-to-Action**: "Start Chatting Now" button
- **Feature Highlights**: Bullet list of capabilities
- **Quick Tips**: Numbered list for easy onboarding
- **Professional Footer**: Unsubscribe info & copyright

### User Preference Required
- Email preference: `tips` must be enabled

---

## 2. 🚀 Update Email (New Features)

### Subject
```
New Features in av9Assist - Check Out What's New!
```

### Content Preview
```
┌─────────────────────────────────────────┐
│  ✨ What's New in av9Assist             │
│  (Purple gradient header)               │
└─────────────────────────────────────────┘

Exciting Updates!

We've been working hard to make av9Assist even better for you. 
Here's what's new:

┌────────────────────────────────────────┐
│ 🧠 Smarter AI                          │
│ Enhanced responses with better         │
│ context understanding                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ⚡ Faster Performance                  │
│ Optimized for lightning-fast           │
│ interactions                           │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🎨 Better UI                           │
│ Cleaner interface for a smoother       │
│ experience                             │
└────────────────────────────────────────┘

[Try New Features] (Blue button)

We'd love to hear your feedback! Reply to this email or chat with us.

Happy chatting!
The av9Assist Team
```

### Features
- **Dynamic Feature Cards**: Each feature has icon, title, and description
- **White Cards with Purple Border**: Clean, professional design
- **Customizable**: Admin can pass different features when sending
- **Feedback Encouragement**: Invites user replies
- **Manage Preferences Link**: Allows users to control emails

### Default Features (if none specified)
1. **Smarter AI** - Enhanced responses with better context understanding
2. **Faster Performance** - Optimized for lightning-fast interactions
3. **Better UI** - Cleaner interface for a smoother experience

### User Preference Required
- Email preference: `updates` must be enabled

---

## 3. 💌 Engagement Email (Re-engagement)

### Subject
```
We Miss You at av9Assist!
```

### Content Preview
```
┌─────────────────────────────────────────┐
│  👋 Come Back and Chat!                 │
│  (Purple gradient header)               │
└─────────────────────────────────────────┘

We Miss You!

It's been 7 days since your last visit. 
Your AI assistant is ready and waiting to help!

Things You Can Try Today:

┌────────────────────────────────────────┐
│ Quick Question?                        │
│ Ask me anything - from coding help     │
│ to creative ideas!                     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Image Analysis                         │
│ Upload any image and I'll help you     │
│ understand it better.                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Content Creation                       │
│ Need help writing? I'm great at        │
│ brainstorming and drafting!            │
└────────────────────────────────────────┘

[Start Chatting Again] (Blue button)

Looking forward to helping you again!

Best,
Your av9Assist Team
```

### Features
- **Personalized Message**: Shows exact days since last activity
- **Activity Suggestions**: 3 concrete ways to re-engage
- **Friendly Tone**: "We Miss You!" creates emotional connection
- **Unsubscribe Option**: Specific to engagement emails
- **Dynamic Days Calculation**: Automatically calculates inactivity period

### User Preference Required
- Email preference: `engagement` must be enabled

---

## 📊 Email Sending Logic

### Individual Email (POST Request)
```javascript
POST /api/send-email
{
  "type": "welcome",           // welcome | update | engagement
  "email": "user@example.com",
  "data": {                    // Optional, type-specific
    "features": [...],         // For update emails
    "daysSinceActive": 7       // For engagement emails
  }
}
```

### Broadcast Email (GET Request)
```javascript
GET /api/send-email?type=welcome&adminKey=YOUR_ADMIN_KEY
```

**Broadcast Features:**
- Sends to all users with matching email preferences
- Filters users based on their opt-in settings
- Returns detailed results (sent/failed count)
- Respects user privacy preferences

---

## 🎨 Email Design Specifications

### Color Palette
- **Primary Gradient**: `#667eea` → `#764ba2` (Purple to Violet)
- **Button Color**: `#667eea` (Blue)
- **Background**: `#f9f9f9` (Light Gray)
- **Text**: `#333` (Dark Gray)
- **Footer Text**: `#666` (Medium Gray)

### Layout
- **Max Width**: 600px (optimal for all email clients)
- **Font**: Arial, sans-serif
- **Border Radius**: 10px (header/content), 8px (cards), 5px (buttons)
- **Padding**: 30px (sections), 15px (cards)
- **Button Style**: Inline-block, 12px vertical, 30px horizontal padding

### Responsive Design
✅ Works on desktop email clients
✅ Works on mobile email apps
✅ Works on webmail (Gmail, Outlook, Yahoo)
✅ Includes text-only version for accessibility

---

## 🔒 Anti-Spam Configuration

### Gmail SMTP Settings
- **Service**: Gmail SMTP
- **Port**: 587 (TLS encryption)
- **Security**: TLSv1.2 minimum
- **Rate Limit**: 5 emails/second
- **Connection Pooling**: Yes (max 5 connections)

### Email Headers (Anti-Spam)
```
X-Mailer: av9Assist
X-Priority: 3 (Normal)
Importance: normal
List-Unsubscribe: <mailto:avassist9@gmail.com?subject=unsubscribe>
Precedence: bulk
```

### Deliverability Score
**Estimated: 9-10/10** 🎯
- ✅ Valid SPF/DKIM records (Gmail)
- ✅ TLS encryption
- ✅ Proper headers
- ✅ Text + HTML versions
- ✅ Unsubscribe links
- ✅ Rate limiting
- ✅ Connection pooling

---

## 📋 User Email Preferences

Users can control which emails they receive through their preferences:

| Preference Key | Controls | Default |
|---------------|----------|---------|
| `tips` | Welcome emails | `true` |
| `updates` | Update/feature announcement emails | `true` |
| `engagement` | Re-engagement emails for inactive users | `true` |

**Location in Database:**
```json
{
  "email": "user@example.com",
  "emailPreferences": {
    "tips": true,
    "updates": true,
    "engagement": true
  }
}
```

---

## 🔐 Authentication

### Email Credentials (Environment Variables)
```bash
GMAIL_USER=avassist9@gmail.com
GMAIL_APP_PASSWORD=kfosqaqrumwtyekb
```

### Admin Key (for broadcasts)
```bash
ADMIN_KEY=10729
```

---

## 📈 Broadcast Statistics

When sending broadcast emails, the API returns:

```json
{
  "success": true,
  "message": "Broadcast complete: 45 sent, 2 failed",
  "sent": 45,
  "failed": 2,
  "results": [
    { "email": "user1@example.com", "status": "sent" },
    { "email": "user2@example.com", "status": "failed", "error": "Invalid email" }
  ]
}
```

---

## 🎯 Best Practices

### ✅ DO:
- Keep subject lines under 50 characters
- Use clear call-to-action buttons
- Include both HTML and text versions
- Respect user preferences
- Add unsubscribe links
- Use proper anti-spam headers
- Test emails before broadcasting

### ❌ DON'T:
- Send to users who opted out
- Use ALL CAPS in subject lines
- Include too many links
- Send too frequently (respect rate limits)
- Forget to handle errors gracefully
- Use purchased email lists

---

## 📝 Testing Emails

### Test Individual Email
```bash
POST /api/send-email
{
  "type": "welcome",
  "email": "test@example.com"
}
```

### Preview Email HTML
The email templates are visible in:
- `app/api/send-email/route.jsx` (lines 18-172)
- Each template has a `getHtml()` function

---

## 🚀 Future Enhancements

Potential improvements for email system:

1. **Email Analytics**: Track open rates, click rates
2. **A/B Testing**: Test different subject lines/content
3. **Scheduled Emails**: Send at optimal times
4. **Email Templates Editor**: Visual editor for admins
5. **Personalization**: Use user's name in emails
6. **More Email Types**: Feedback requests, surveys, etc.
7. **Email Verification**: Verify emails before sending
8. **Bounce Handling**: Track and handle bounced emails

---

## 📞 Support

For questions about emails:
- **Email**: avassist9@gmail.com
- **Admin Dashboard**: https://av9assist.vercel.app/admin
- **Repository**: https://github.com/abhiii9vvv/av9assist

---

*Last Updated: October 2, 2025*
*Version: 1.1*
