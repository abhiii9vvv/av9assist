import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DB_FILE = path.join(process.cwd(), 'data', 'users.json')

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read users from database
async function readUsers() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

// Write users to database
async function writeUsers(users) {
  await ensureDataDir()
  await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2))
}

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

    const users = await readUsers()
    const existingUserIndex = users.findIndex(u => u.email === email)

    if (existingUserIndex >= 0) {
      // Update last active
      users[existingUserIndex].lastActive = new Date().toISOString()
      users[existingUserIndex].visitCount = (users[existingUserIndex].visitCount || 1) + 1
    } else {
      // Add new user
      users.push({
        email,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        visitCount: 1,
        emailPreferences: {
          updates: true,
          tips: true,
          engagement: true
        }
      })
    }

    await writeUsers(users)

    return NextResponse.json({
      success: true,
      message: existingUserIndex >= 0 ? 'Welcome back!' : 'Registration successful!',
      user: users[existingUserIndex >= 0 ? existingUserIndex : users.length - 1]
    })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}

// GET - Get all users (admin only - add authentication later)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const users = await readUsers()

    if (email) {
      // Get specific user
      const user = users.find(u => u.email === email)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ user })
    }

    // Return all users (for admin)
    return NextResponse.json({
      users,
      total: users.length,
      stats: {
        totalUsers: users.length,
        activeToday: users.filter(u => {
          const lastActive = new Date(u.lastActive)
          const today = new Date()
          return lastActive.toDateString() === today.toDateString()
        }).length
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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

    const users = await readUsers()
    const userIndex = users.findIndex(u => u.email === email)

    if (userIndex < 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update preferences
    users[userIndex].emailPreferences = {
      ...users[userIndex].emailPreferences,
      ...emailPreferences
    }
    users[userIndex].lastActive = new Date().toISOString()

    await writeUsers(users)

    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
      user: users[userIndex]
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
