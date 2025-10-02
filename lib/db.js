// MongoDB Atlas Database for user storage
// Free tier: 512 MB storage, perfect for user management

import { MongoClient } from 'mongodb'

let client = null
let clientPromise = null

// MongoDB client options for serverless
const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  family: 4
}

function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  if (clientPromise) {
    return clientPromise
  }

  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, options)
  }

  clientPromise = client.connect()
  return clientPromise
}

async function getDB() {
  try {
    const client = await getMongoClient()
    return client.db('av9assist')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    // Reset connection on error
    clientPromise = null
    client = null
    throw error
  }
}

async function getCollection() {
  const db = await getDB()
  return db.collection('users')
}

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const collection = await getCollection()
    const users = await collection.find({}).toArray()
    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

/**
 * Get a single user by email
 */
export async function getUser(email) {
  try {
    const collection = await getCollection()
    const user = await collection.findOne({ email })
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Save or update a user
 */
export async function saveUser(userData) {
  try {
    const collection = await getCollection()
    
    const result = await collection.updateOne(
      { email: userData.email },
      { $set: userData },
      { upsert: true }
    )
    
    console.log(`✅ User saved: ${userData.email}`)
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
    const collection = await getCollection()
    
    const result = await collection.updateOne(
      { email },
      { 
        $set: { 
          emailPreferences: preferences,
          lastActive: new Date().toISOString()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }
    
    return await getUser(email)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw error
  }
}

/**
 * Update user email preferences (for unsubscribe functionality)
 */
export async function updateUserEmailPreferences(email, emailPreferences) {
  try {
    const collection = await getCollection()
    
    const result = await collection.updateOne(
      { email },
      { 
        $set: { 
          emailPreferences: emailPreferences,
          lastActive: new Date().toISOString()
        }
      },
      { upsert: true } // Create user if doesn't exist
    )
    
    console.log(`✅ Email preferences updated for ${email}:`, emailPreferences)
    
    return {
      success: true,
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    }
  } catch (error) {
    console.error('Error updating email preferences:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  try {
    const collection = await getCollection()
    const totalUsers = await collection.countDocuments()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const activeToday = await collection.countDocuments({
      lastActive: { $gte: today.toISOString() }
    })
    
    return {
      totalUsers,
      activeToday
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalUsers: 0,
      activeToday: 0
    }
  }
}
