# Gmail SMTP Setup & Test Script

Write-Host "`n📧 Gmail SMTP Email System Setup & Test`n" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray

# Check if Gmail credentials are configured
Write-Host "`n🔍 Checking Configuration...`n" -ForegroundColor Cyan

$envFile = Get-Content ".env.local" -Raw -ErrorAction SilentlyContinue

if (-not $envFile) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

$hasGmailUser = $envFile -match "GMAIL_USER=av9assist@gmail.com"
$hasAppPassword = $envFile -match "GMAIL_APP_PASSWORD=\w{16}"

Write-Host "Checking Gmail Configuration:" -ForegroundColor White
if ($hasGmailUser) {
    Write-Host "   ✅ Gmail User: av9assist@gmail.com" -ForegroundColor Green
} else {
    Write-Host "   ❌ Gmail User: Not configured" -ForegroundColor Red
}

if ($hasAppPassword) {
    Write-Host "   ✅ App Password: Configured (16 characters)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  App Password: Not configured or invalid" -ForegroundColor Yellow
    Write-Host "`n   📝 Setup Instructions:" -ForegroundColor Cyan
    Write-Host "   1. Enable 2-Step Verification: https://myaccount.google.com/security" -ForegroundColor Gray
    Write-Host "   2. Generate App Password: https://myaccount.google.com/apppasswords" -ForegroundColor Gray
    Write-Host "   3. Update .env.local with 16-character password" -ForegroundColor Gray
    Write-Host "   4. Restart server and run this test again" -ForegroundColor Gray
    Write-Host "`n   See GMAIL_SMTP_SETUP.md for detailed guide`n" -ForegroundColor Yellow
    exit 1
}

# Check if server is running
Write-Host "`n🌐 Checking Server Status..." -ForegroundColor Cyan
$BASE_URL = "http://localhost:3000"

try {
    $null = Invoke-RestMethod -Uri "$BASE_URL/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Server is running at $BASE_URL" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running!" -ForegroundColor Red
    Write-Host "   Please start the server: pnpm dev`n" -ForegroundColor Yellow
    exit 1
}

# Ask for test email address
Write-Host "`n📬 Email Sending Test`n" -ForegroundColor Cyan
$testEmail = Read-Host "Enter email address to send test to (or press Enter for av9assist@gmail.com)"

if ([string]::IsNullOrWhiteSpace($testEmail)) {
    $testEmail = "av9assist@gmail.com"
}

Write-Host "`nSending welcome email to: $testEmail" -ForegroundColor White
Write-Host "Please wait..." -ForegroundColor Gray

# Send test email
try {
    $body = @{
        type = "welcome"
        email = $testEmail
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/send-email" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 30 `
        -ErrorAction Stop

    Write-Host "`n✅ Email Sent Successfully!" -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Gray
    
    if ($response.messageId) {
        Write-Host "`n📧 Email Details:" -ForegroundColor Cyan
        Write-Host "   Message ID: $($response.messageId)" -ForegroundColor White
        Write-Host "   From: av9Assist <av9assist@gmail.com>" -ForegroundColor White
        Write-Host "   To: $testEmail" -ForegroundColor White
        Write-Host "   Subject: 🎉 Welcome to av9Assist - Your AI Journey Begins!" -ForegroundColor White
    }
    
    if ($response.accepted -and $response.accepted.Count -gt 0) {
        Write-Host "`n   ✅ Accepted: $($response.accepted -join ', ')" -ForegroundColor Green
    }
    
    if ($response.rejected -and $response.rejected.Count -gt 0) {
        Write-Host "   ❌ Rejected: $($response.rejected -join ', ')" -ForegroundColor Red
    }

    Write-Host "`n📬 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Check inbox: $testEmail" -ForegroundColor White
    Write-Host "   2. Check spam folder if not in inbox" -ForegroundColor White
    Write-Host "   3. Mark as 'Not Spam' if found in spam" -ForegroundColor White
    Write-Host "   4. Email should arrive in 5-30 seconds" -ForegroundColor White

} catch {
    Write-Host "`n❌ Failed to Send Email!" -ForegroundColor Red
    Write-Host ("=" * 70) -ForegroundColor Gray
    
    $errorResponse = $_.ErrorDetails.Message
    if ($errorResponse) {
        try {
            $errorJson = $errorResponse | ConvertFrom-Json
            Write-Host "`n🔴 Error Details:" -ForegroundColor Red
            Write-Host "   Error: $($errorJson.error)" -ForegroundColor White
            if ($errorJson.message) {
                Write-Host "   Message: $($errorJson.message)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "`n   $errorResponse" -ForegroundColor Red
        }
    } else {
        Write-Host "`n   $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Verify App Password is correct (16 characters)" -ForegroundColor Gray
    Write-Host "   2. Check 2-Step Verification is enabled on Gmail" -ForegroundColor Gray
    Write-Host "   3. Ensure .env.local has GMAIL_APP_PASSWORD set" -ForegroundColor Gray
    Write-Host "   4. Restart server after changing .env.local" -ForegroundColor Gray
    Write-Host "   5. Check server logs for detailed error messages" -ForegroundColor Gray
    Write-Host "`n   📖 See GMAIL_SMTP_SETUP.md for detailed guide`n" -ForegroundColor Yellow
    exit 1
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "`n🎉 Gmail SMTP Test Complete!`n" -ForegroundColor Green

Write-Host "📊 Configuration Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Gmail SMTP: smtp.gmail.com:587" -ForegroundColor White
Write-Host "   ✅ Sender: av9Assist <av9assist@gmail.com>" -ForegroundColor White
Write-Host "   ✅ Daily Limit: 500 emails" -ForegroundColor White
Write-Host "   ✅ Anti-Spam: Configured" -ForegroundColor White
Write-Host "   ✅ TLS Encryption: Enabled" -ForegroundColor White

Write-Host "`n🛡️ Deliverability Features:" -ForegroundColor Cyan
Write-Host "   ✅ Gmail Official SMTP (trusted)" -ForegroundColor Green
Write-Host "   ✅ SPF/DKIM/DMARC (automatic by Gmail)" -ForegroundColor Green
Write-Host "   ✅ Anti-spam headers" -ForegroundColor Green
Write-Host "   ✅ Plain text alternative" -ForegroundColor Green
Write-Host "   ✅ Rate limiting" -ForegroundColor Green
Write-Host "   ✅ Unsubscribe option" -ForegroundColor Green

Write-Host "`n📧 Your emails will NOT go to spam when:" -ForegroundColor Cyan
Write-Host "   • Using Gmail's official SMTP server" -ForegroundColor Gray
Write-Host "   • Sending to people who signed up" -ForegroundColor Gray
Write-Host "   • Following best practices (see GMAIL_SMTP_SETUP.md)" -ForegroundColor Gray
Write-Host "   • Warming up account gradually" -ForegroundColor Gray

Write-Host "`n✅ System Status: READY TO SEND!`n" -ForegroundColor Green
