import { NextResponse } from 'next/server'
import { updateUserEmailPreferences } from '@/lib/db'

export async function POST(request) {
  try {
    const { email, type, preferences } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    let updatedPreferences

    if (type === 'all') {
      // Unsubscribe from all emails
      updatedPreferences = {
        daily: false,
        updates: false,
        engagement: false,
        tips: false
      }
    } else if (type === 'custom' && preferences) {
      // Update custom preferences
      updatedPreferences = {
        daily: !!preferences.daily,
        updates: !!preferences.updates,
        engagement: !!preferences.engagement,
        tips: !!preferences.tips
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid unsubscribe type' },
        { status: 400 }
      )
    }

    // Update user preferences in database
    const result = await updateUserEmailPreferences(email, updatedPreferences)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update preferences' },
        { status: 400 }
      )
    }

    console.log(`✅ Email preferences updated for ${email}:`, updatedPreferences)

    return NextResponse.json({
      success: true,
      message: type === 'all' 
        ? 'Successfully unsubscribed from all emails'
        : 'Email preferences updated successfully',
      preferences: updatedPreferences
    })

  } catch (error) {
    console.error('Error updating email preferences:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update email preferences',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
