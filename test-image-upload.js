/**
 * Image Upload & Vision API Test Script
 * Tests the complete flow of sending images to Gemini Vision API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

// Test 1: Check if image file exists
function testImageFileExists(imagePath) {
  logSection('TEST 1: Image File Validation');
  
  if (!imagePath) {
    log('❌ FAILED: No image path provided', colors.red);
    return null;
  }
  
  log(`📁 Checking: ${imagePath}`, colors.blue);
  
  if (!fs.existsSync(imagePath)) {
    log('❌ FAILED: Image file not found', colors.red);
    return null;
  }
  
  const stats = fs.statSync(imagePath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  log(`✅ SUCCESS: File exists`, colors.green);
  log(`   Size: ${fileSizeInMB} MB`, colors.blue);
  log(`   Max allowed: 5 MB`, colors.blue);
  
  if (stats.size > 5 * 1024 * 1024) {
    log('⚠️  WARNING: File size exceeds 5MB limit', colors.yellow);
  }
  
  return imagePath;
}

// Test 2: Convert image to base64
function testImageToBase64(imagePath) {
  logSection('TEST 2: Image to Base64 Conversion');
  
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64String}`;
    
    log(`✅ SUCCESS: Converted to base64`, colors.green);
    log(`   MIME Type: ${mimeType}`, colors.blue);
    log(`   Base64 Length: ${base64String.length} characters`, colors.blue);
    log(`   Data URL Length: ${dataUrl.length} characters`, colors.blue);
    
    return { dataUrl, base64String, mimeType };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, colors.red);
    return null;
  }
}

// Test 3: Check API keys configuration
function testAPIKeysConfiguration() {
  logSection('TEST 3: API Keys Configuration');
  
  const apiKey1 = process.env.GOOGLE_API_KEY;
  const apiKey2 = process.env.GOOGLE_API_KEY_2;
  const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash';
  
  log('Checking Gemini API Keys...', colors.blue);
  
  if (!apiKey1 && !apiKey2) {
    log('❌ FAILED: No Gemini API keys configured', colors.red);
    return null;
  }
  
  if (apiKey1) {
    log(`✅ Primary Key: ${apiKey1.substring(0, 15)}...`, colors.green);
  } else {
    log('⚠️  Primary Key: Not configured', colors.yellow);
  }
  
  if (apiKey2) {
    log(`✅ Secondary Key: ${apiKey2.substring(0, 15)}...`, colors.green);
  } else {
    log('⚠️  Secondary Key: Not configured', colors.yellow);
  }
  
  log(`✅ Model: ${model}`, colors.green);
  
  return { apiKey: apiKey1 || apiKey2, model };
}

// Test 4: Send image to Gemini Vision API
function testGeminiVisionAPI(imageData, config) {
  return new Promise((resolve, reject) => {
    logSection('TEST 4: Gemini Vision API Request');
    
    const { base64String, mimeType } = imageData;
    const { apiKey, model } = config;
    
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    
    log('🔄 Sending request to Gemini Vision API...', colors.blue);
    log(`   Model: ${model}`, colors.blue);
    log(`   Endpoint: v1 (production)`, colors.blue);
    
    const payload = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: 'What do you see in this image? Describe it in detail.' },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64String
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });
    
    const startTime = Date.now();
    
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          
          if (res.statusCode === 200 && json.candidates) {
            const response = json.candidates[0]?.content?.parts?.[0]?.text || 'No response';
            log(`✅ SUCCESS (${duration}ms)`, colors.green);
            log(`\n📝 AI Response:\n${'─'.repeat(60)}`, colors.cyan);
            console.log(response);
            log('─'.repeat(60), colors.cyan);
            
            resolve({
              success: true,
              response,
              duration,
              statusCode: res.statusCode
            });
          } else {
            log(`❌ FAILED (${duration}ms)`, colors.red);
            log(`   Status Code: ${res.statusCode}`, colors.red);
            if (json.error) {
              log(`   Error: ${json.error.message}`, colors.red);
            } else {
              log(`   Response: ${JSON.stringify(json)}`, colors.red);
            }
            
            resolve({
              success: false,
              error: json.error?.message || 'Unknown error',
              statusCode: res.statusCode,
              duration
            });
          }
        } catch (e) {
          log(`❌ FAILED: Invalid JSON response`, colors.red);
          log(`   Error: ${e.message}`, colors.red);
          resolve({
            success: false,
            error: 'Invalid JSON response',
            rawData: data.substring(0, 500)
          });
        }
      });
    });
    
    req.on('error', (e) => {
      log(`❌ FAILED: Network error`, colors.red);
      log(`   Error: ${e.message}`, colors.red);
      resolve({
        success: false,
        error: e.message
      });
    });
    
    req.write(payload);
    req.end();
  });
}

// Test 5: Test with both API keys (if available)
async function testBothAPIKeys(imageData) {
  logSection('TEST 5: API Key Fallback Test');
  
  const apiKey1 = process.env.GOOGLE_API_KEY;
  const apiKey2 = process.env.GOOGLE_API_KEY_2;
  const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash';
  
  const results = [];
  
  if (apiKey1) {
    log('Testing Primary API Key...', colors.blue);
    const result1 = await testGeminiVisionAPI(imageData, { apiKey: apiKey1, model });
    results.push({ key: 'Primary', ...result1 });
    
    if (!result1.success) {
      log('⚠️  Primary key failed, trying secondary...', colors.yellow);
    }
  }
  
  if (apiKey2 && (!apiKey1 || !results[0]?.success)) {
    log('\nTesting Secondary API Key...', colors.blue);
    const result2 = await testGeminiVisionAPI(imageData, { apiKey: apiKey2, model });
    results.push({ key: 'Secondary', ...result2 });
  }
  
  return results;
}

// Main test execution
async function runTests() {
  console.clear();
  log('\n🧪 IMAGE UPLOAD & VISION API TEST SUITE', colors.bright + colors.cyan);
  log('Testing complete image sending workflow\n', colors.cyan);
  
  // Get image path from command line argument or use default
  const imagePath = process.argv[2] || 'C:\\Users\\abhin\\Downloads\\Gemini_Generated_Image_vh2ja1vh2ja1vh2j.png';
  
  const results = {
    fileValidation: false,
    base64Conversion: false,
    apiKeysConfig: false,
    apiRequest: false,
    overallSuccess: false
  };
  
  try {
    // Test 1: File exists
    const validPath = testImageFileExists(imagePath);
    if (!validPath) {
      throw new Error('Image file validation failed');
    }
    results.fileValidation = true;
    
    // Test 2: Convert to base64
    const imageData = testImageToBase64(validPath);
    if (!imageData) {
      throw new Error('Base64 conversion failed');
    }
    results.base64Conversion = true;
    
    // Test 3: Check API keys
    const config = testAPIKeysConfiguration();
    if (!config) {
      throw new Error('API keys configuration failed');
    }
    results.apiKeysConfig = true;
    
    // Test 4 & 5: Send to API (with fallback)
    const apiResults = await testBothAPIKeys(imageData);
    
    const successfulResult = apiResults.find(r => r.success);
    if (successfulResult) {
      results.apiRequest = true;
      results.overallSuccess = true;
    }
    
  } catch (error) {
    log(`\n❌ Test Suite Error: ${error.message}`, colors.red);
  }
  
  // Final summary
  logSection('TEST SUMMARY');
  
  log(`File Validation:     ${results.fileValidation ? '✅ PASSED' : '❌ FAILED'}`, 
      results.fileValidation ? colors.green : colors.red);
  log(`Base64 Conversion:   ${results.base64Conversion ? '✅ PASSED' : '❌ FAILED'}`, 
      results.base64Conversion ? colors.green : colors.red);
  log(`API Keys Config:     ${results.apiKeysConfig ? '✅ PASSED' : '❌ FAILED'}`, 
      results.apiKeysConfig ? colors.green : colors.red);
  log(`API Request:         ${results.apiRequest ? '✅ PASSED' : '❌ FAILED'}`, 
      results.apiRequest ? colors.green : colors.red);
  
  console.log('\n' + '='.repeat(60));
  
  if (results.overallSuccess) {
    log('\n🎉 ALL TESTS PASSED! Image sending is working correctly!', colors.bright + colors.green);
  } else {
    log('\n⚠️  SOME TESTS FAILED. Image sending may not work properly.', colors.bright + colors.yellow);
    log('\nTroubleshooting:', colors.yellow);
    if (!results.fileValidation) log('  • Check if the image file path is correct', colors.yellow);
    if (!results.base64Conversion) log('  • Ensure the image file is not corrupted', colors.yellow);
    if (!results.apiKeysConfig) log('  • Verify API keys in .env.local file', colors.yellow);
    if (!results.apiRequest) log('  • Check internet connection and API quotas', colors.yellow);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Usage instructions
  log('💡 Usage:', colors.cyan);
  log('   node test-image-upload.js', colors.blue);
  log('   node test-image-upload.js "path/to/your/image.png"', colors.blue);
  console.log();
}

// Run tests
runTests().catch(console.error);
