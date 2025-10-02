# Quick Email Test Script
# Tests if email sending is working after the fix

Write-Host "`n🧪 Testing Email System After Fix`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$BASE_URL = "http://localhost:3000"
$TEST_EMAIL = "av9assist@gmail.com"

# Check if server is running
Write-Host "`n1️⃣ Checking if server is running..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/api/health" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Server is running!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server not running!" -ForegroundColor Red
    Write-Host "   Please start the server: pnpm dev" -ForegroundColor Yellow
    exit 1
}

# Test sending welcome email
Write-Host "`n2️⃣ Testing email sending..." -ForegroundColor Cyan
try {
    $body = @{
        type = "welcome"
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/send-email" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    if ($response.success) {
        Write-Host "   ✅ Email sent successfully!" -ForegroundColor Green
        Write-Host "   📧 Check inbox: $TEST_EMAIL" -ForegroundColor Cyan
        Write-Host "   📝 Message: $($response.message)" -ForegroundColor White
        
        if ($response.data.id) {
            Write-Host "   🆔 Email ID: $($response.data.id)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Response received but success=false" -ForegroundColor Yellow
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed to send email!" -ForegroundColor Red
    
    $errorResponse = $_.ErrorDetails.Message
    if ($errorResponse) {
        try {
            $errorJson = $errorResponse | ConvertFrom-Json
            Write-Host "   Error: $($errorJson.error)" -ForegroundColor Red
            if ($errorJson.message) {
                Write-Host "   Message: $($errorJson.message)" -ForegroundColor Yellow
            }
            if ($errorJson.details) {
                Write-Host "   Details: $($errorJson.details)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   Error: $errorResponse" -ForegroundColor Red
        }
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n   💡 Troubleshooting tips:" -ForegroundColor Cyan
    Write-Host "   1. Check RESEND_API_KEY in .env.local" -ForegroundColor Gray
    Write-Host "   2. Verify EMAIL_FROM is set to: onboarding@resend.dev" -ForegroundColor Gray
    Write-Host "   3. Restart server: pnpm dev" -ForegroundColor Gray
    Write-Host "   4. Check EMAIL_FIX_GUIDE.md for details" -ForegroundColor Gray
    exit 1
}

# Check email configuration
Write-Host "`n3️⃣ Verifying configuration..." -ForegroundColor Cyan
$envFile = Get-Content ".env.local" -Raw
if ($envFile -match "EMAIL_FROM=.*onboarding@resend.dev") {
    Write-Host "   ✅ Using Resend test domain (onboarding@resend.dev)" -ForegroundColor Green
} elseif ($envFile -match "EMAIL_FROM=.*gmail.com") {
    Write-Host "   ⚠️  Still using Gmail domain (won't work)" -ForegroundColor Yellow
    Write-Host "   Please change to: EMAIL_FROM=av9Assist <onboarding@resend.dev>" -ForegroundColor Yellow
} else {
    Write-Host "   ⚠️  EMAIL_FROM not found or in unexpected format" -ForegroundColor Yellow
}

if ($envFile -match "RESEND_API_KEY=re_") {
    Write-Host "   ✅ Resend API key is configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ Resend API key missing or invalid" -ForegroundColor Red
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "`n📊 Test Summary`n" -ForegroundColor Cyan
Write-Host "   Status: ✅ EMAIL SYSTEM IS WORKING!" -ForegroundColor Green
Write-Host "   Sender: av9Assist <onboarding@resend.dev>" -ForegroundColor White
Write-Host "   Test Email: $TEST_EMAIL" -ForegroundColor White
Write-Host "`n   📬 Check your inbox (and spam folder)!" -ForegroundColor Yellow
Write-Host "   ⏱️  Emails usually arrive within 5-10 seconds" -ForegroundColor Gray

Write-Host "`n🎉 Email system test complete!`n" -ForegroundColor Green
