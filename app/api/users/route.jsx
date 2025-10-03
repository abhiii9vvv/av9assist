import { NextResponse } from 'next/server'
import { getAllUsers, getUser, saveUser, updateUserPreferences, getUserStats } from '@/lib/db'

// POST - Register/update user
export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const existingUser = await getUser(email)
    const isNewUser = !existingUser

    let user
    if (existingUser) {
      // Update last active
      user = {
        ...existingUser,
        lastActive: new Date().toISOString(),
        visitCount: (existingUser.visitCount || 1) + 1
      }
    } else {
      // Add new user
      user = {
        email,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        visitCount: 1,
        emailPreferences: {
          updates: true,
          tips: true,
          engagement: true,
          daily: true
        }
      }
    }

    await saveUser(user)
    console.log(`✅ User saved to database: ${email} (${isNewUser ? 'NEW' : 'RETURNING'})`)

    // Send welcome email to new users
    if (isNewUser) {
      try {
        // Send welcome email asynchronously (don't wait for it)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://av9assist.vercel.app'}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'welcome',
            email: email
          })
        }).catch(err => {
          console.error('Failed to send welcome email:', err)
        })
        
        console.log(`🎉 New user registered: ${email} - Welcome email queued`)
      } catch (emailError) {
        console.error('Error queueing welcome email:', emailError)
        // Don't fail registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Registration successful!' : 'Welcome back!',
      isNewUser,
      user
    })
  } catch (error) {
    console.error('❌ Error registering user:', error)
    return NextResponse.json(
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get all users (admin only)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      // Get specific user
      const user = await getUser(email)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ user })
    }

    // Return all users (for admin)
    const users = await getAllUsers()
    const stats = await getUserStats()

    return NextResponse.json({
      users,
      total: users.length,
      stats
    })
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update user preferences
export async function PUT(request) {
  try {
    const { email, emailPreferences } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await updateUserPreferences(email, emailPreferences)

    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
      user
    })
  } catch (error) {
    console.error('❌ Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    )
  }
}
