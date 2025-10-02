// MongoDB Atlas Database for user storage
// Free tier: 512 MB storage, perfect for user management

import { MongoClient } from 'mongodb'

let client = null
let db = null

async function connectDB() {
  if (db) return db
  
  try {
    const uri = process.env.MONGODB_URI
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set')
    }
    
    client = new MongoClient(uri)
    await client.connect()
    db = client.db('av9assist')
    
    console.log('✅ Connected to MongoDB')
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

async function getCollection() {
  const database = await connectDB()
  return database.collection('users')
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
