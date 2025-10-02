// Vercel KV Database for user storage
// This replaces the JSON file system which doesn't work on Vercel

import { kv } from '@vercel/kv'

// Key prefix for organization
const USER_KEY_PREFIX = 'user:'
const USERS_LIST_KEY = 'users:list'

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const userEmails = await kv.smembers(USERS_LIST_KEY) || []
    const users = []
    
    for (const email of userEmails) {
      const user = await kv.get(`${USER_KEY_PREFIX}${email}`)
      if (user) {
        users.push(user)
      }
    }
    
    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

/**
 * Get user by email
 */
export async function getUser(email) {
  try {
    return await kv.get(`${USER_KEY_PREFIX}${email}`)
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Create or update user
 */
export async function saveUser(userData) {
  try {
    const { email } = userData
    
    // Add to users list
    await kv.sadd(USERS_LIST_KEY, email)
    
    // Save user data
    await kv.set(`${USER_KEY_PREFIX}${email}`, userData)
    
    return userData
  } catch (error) {
    console.error('Error saving user:', error)
    throw error
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(email, preferences) {
  try {
    const user = await getUser(email)
    if (!user) {
      throw new Error('User not found')
    }
    
    user.emailPreferences = {
      ...user.emailPreferences,
      ...preferences
    }
    user.lastActive = new Date().toISOString()
    
    await saveUser(user)
    return user
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw error
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  try {
    const users = await getAllUsers()
    const today = new Date().toDateString()
    
    return {
      totalUsers: users.length,
      activeToday: users.filter(u => {
        const lastActive = new Date(u.lastActive)
        return lastActive.toDateString() === today
      }).length
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalUsers: 0,
      activeToday: 0
    }
  }
}
