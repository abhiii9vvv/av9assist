#!/usr/bin/env node

/**
 * Email System Test Script
 * Tests the av9Assist email functionality
 */

const TEST_EMAIL = '2023281975.abhinav@ug.sharda.ac.in';
const BASE_URL = 'http://localhost:3000';

console.log('\n🧪 av9Assist Email System Test\n');
console.log('Testing with email:', TEST_EMAIL);
console.log('─'.repeat(50));

// Test 1: Register User
async function testUserRegistration() {
  console.log('\n1️⃣ Testing User Registration...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User registered successfully!');
      console.log('   Email:', data.user.email);
      console.log('   Joined:', new Date(data.user.joinedAt).toLocaleString());
      console.log('   Visit Count:', data.user.visitCount);
      return true;
    } else {
      console.log('❌ Registration failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('   Make sure the dev server is running: pnpm dev');
    return false;
  }
}

// Test 2: Get User Info
async function testGetUser() {
  console.log('\n2️⃣ Testing Get User Info...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users?email=${encodeURIComponent(TEST_EMAIL)}`);
    const data = await response.json();
    
    if (response.ok && data.user) {
      console.log('✅ User found!');
      console.log('   Email:', data.user.email);
      console.log('   Visit Count:', data.user.visitCount);
      console.log('   Last Active:', new Date(data.user.lastActive).toLocaleString());
      console.log('   Preferences:', JSON.stringify(data.user.emailPreferences, null, 2));
      return true;
    } else {
      console.log('❌ User not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 3: Send Welcome Email
async function testWelcomeEmail() {
  console.log('\n3️⃣ Testing Welcome Email...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        email: TEST_EMAIL
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      if (data.message === 'Email sent successfully') {
        console.log('✅ Welcome email sent!');
        console.log('   Check your inbox:', TEST_EMAIL);
      } else if (data.error?.includes('RESEND_API_KEY')) {
        console.log('⚠️  Resend API key not configured');
        console.log('   To send real emails:');
        console.log('   1. Sign up at https://resend.com');
        console.log('   2. Get your API key');
        console.log('   3. Add to .env.local: RESEND_API_KEY=your_key');
        console.log('   4. Update EMAIL_FROM with verified domain');
      } else {
        console.log('ℹ️  Email system ready but needs configuration');
      }
      return true;
    } else {
      console.log('❌ Failed to send email:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 4: Get All Users
async function testGetAllUsers() {
  console.log('\n4️⃣ Testing Get All Users...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Retrieved user list!');
      console.log('   Total Users:', data.total);
      console.log('   Active Today:', data.stats.activeToday);
      console.log('   Total Visits:', data.stats.totalVisits);
      
      if (data.users.length > 0) {
        console.log('\n   Recent Users:');
        data.users.slice(0, 3).forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} (${user.visitCount} visits)`);
        });
      }
      return true;
    } else {
      console.log('❌ Failed to get users:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 5: Update Preferences
async function testUpdatePreferences() {
  console.log('\n5️⃣ Testing Update Preferences...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        emailPreferences: {
          updates: true,
          tips: true,
          engagement: true
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Preferences updated!');
      console.log('   Updates:', data.user.emailPreferences.updates ? '✅' : '❌');
      console.log('   Tips:', data.user.emailPreferences.tips ? '✅' : '❌');
      console.log('   Engagement:', data.user.emailPreferences.engagement ? '✅' : '❌');
      return true;
    } else {
      console.log('❌ Failed to update preferences:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Email System Tests...\n');
  
  const results = {
    registration: await testUserRegistration(),
    getUser: await testGetUser(),
    welcomeEmail: await testWelcomeEmail(),
    allUsers: await testGetAllUsers(),
    preferences: await testUpdatePreferences()
  };
  
  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 Test Results Summary:\n');
  console.log('   User Registration:', results.registration ? '✅' : '❌');
  console.log('   Get User Info:', results.getUser ? '✅' : '❌');
  console.log('   Send Welcome Email:', results.welcomeEmail ? '✅' : '❌');
  console.log('   Get All Users:', results.allUsers ? '✅' : '❌');
  console.log('   Update Preferences:', results.preferences ? '✅' : '❌');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log('\n   Total: ' + passed + '/' + total + ' tests passed');
  
  if (passed === total) {
    console.log('\n✨ All tests passed! Email system is working! ✨\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.\n');
  }
  
  console.log('─'.repeat(50));
  console.log('\n📝 Next Steps:\n');
  console.log('1. Visit http://localhost:3000 and enter your email');
  console.log('2. Visit http://localhost:3000/admin (key: admin123)');
  console.log('3. Configure Resend API for real email sending');
  console.log('4. Check EMAIL_SYSTEM_GUIDE.md for full documentation\n');
}

// Run tests
runAllTests().catch(console.error);
