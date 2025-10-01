# Troubleshooting Image Input Issues

## Common Issues and Solutions

### 1. ❌ "Request timeout" Error

**Symptoms:**
```
🔄 Trying gemini...
❌ gemini failed: Request timeout
[v1] All AI providers failed: All AI providers failed
```

**Causes:**
- Image processing takes longer than text-only requests
- Large image files (close to 5MB limit)
- Slow network connection to Google API
- API rate limiting or temporary service issues

**Solutions:**

✅ **Already Fixed:** Timeout increased from 6s to 30s for image requests

**Additional Steps:**

1. **Check your internet connection:**
   ```bash
   ping generativelanguage.googleapis.com
   ```

2. **Verify your API key has vision access:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Ensure your API key is active and has Gemini 1.5 access
   - Vision models require Gemini 1.5 (Flash or Pro)

3. **Test with smaller images:**
   - Try a small image first (< 500KB)
   - Gradually increase size to find the limit
   - Compress images before uploading if needed

4. **Check API quotas:**
   - Free tier: 15 requests per minute
   - Vision requests may count as multiple requests
   - Wait a minute and try again if rate-limited

### 2. 🔑 Invalid API Key

**Symptoms:**
```
❌ gemini failed: Gemini API Error: API_KEY_INVALID
```

**Solution:**
1. Check your `.env.local` file has the correct API key:
   ```env
   GOOGLE_API_KEY=AIzaSy...
   ```
2. Restart the dev server after changing `.env.local`
3. Generate a new API key if needed from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. 🚫 Model Doesn't Support Vision

**Symptoms:**
```
❌ gemini failed: Model does not support image inputs
```

**Solution:**
Change your model to a vision-capable one in `.env.local`:
```env
# ✅ Vision-capable models:
GOOGLE_MODEL=gemini-1.5-flash
# or
GOOGLE_MODEL=gemini-1.5-pro

# ❌ NOT vision-capable:
# GOOGLE_MODEL=gemini-pro
# GOOGLE_MODEL=gemini-1.0-pro
```

### 4. 📏 Image Too Large

**Symptoms:**
- Error: "Image size must be less than 5MB"
- Request timeout with very large images

**Solutions:**

1. **Client-side compression** (not yet implemented):
   ```javascript
   // Future enhancement: compress before sending
   const compressedImage = await compressImage(file, { maxSizeMB: 2 })
   ```

2. **Manual compression:**
   - Use online tools: [TinyPNG](https://tinypng.com/), [Squoosh](https://squoosh.app/)
   - Reduce image dimensions (e.g., 1920x1080 → 1280x720)
   - Convert to more efficient format (PNG → JPEG)

3. **Temporary workaround - increase size limit:**
   ```javascript
   // In app/chat/page.jsx, handleImageSelect function
   if (file.size > 10 * 1024 * 1024) { // Changed from 5MB to 10MB
     setError('Image size must be less than 10MB')
     return
   }
   ```
   ⚠️ Note: Larger images = slower upload + processing

### 5. 🔒 CORS or Network Issues

**Symptoms:**
```
❌ gemini failed: Network request failed
Failed to fetch
```

**Solutions:**

1. **Check if behind firewall/VPN:**
   - Try disabling VPN temporarily
   - Check corporate firewall settings
   - Ensure `generativelanguage.googleapis.com` is not blocked

2. **Browser console errors:**
   - Open DevTools (F12)
   - Check Network tab for failed requests
   - Look for CORS errors (red text)

3. **Proxy issues:**
   - If using proxy, ensure it allows Google API requests
   - Add exception for `*.googleapis.com`

## Testing Checklist

### ✅ Quick Test
1. **Verify environment:**
   ```bash
   # Check if API key is set
   echo $GOOGLE_API_KEY  # Linux/Mac
   echo %GOOGLE_API_KEY% # Windows
   ```

2. **Test with curl:**
   ```bash
   curl -H 'Content-Type: application/json' \
        -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
        -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY'
   ```
   ✅ Should return JSON response
   ❌ If error, API key or network issue

3. **Test image upload:**
   - Use a **small test image** (< 100KB)
   - Simple question: "What's in this image?"
   - Should respond in < 10 seconds

### 📊 Performance Benchmarks

| Image Size | Expected Response Time |
|-----------|------------------------|
| < 500KB   | 3-8 seconds           |
| 500KB-1MB | 5-12 seconds          |
| 1-2MB     | 8-18 seconds          |
| 2-5MB     | 12-30 seconds         |

If times are much longer, check:
- Network speed (run speed test)
- API region (closer = faster)
- Server load (try off-peak hours)

## Debug Mode

### Enable Detailed Logging

The system already logs vision requests. Check your terminal for:

```
🖼️ Gemini Vision Request: {
  hasImage: true,
  messageLength: 24,
  imageSize: 145678,
  mimeType: 'image/jpeg',
  contentsCount: 1
}
```

### Additional Debug Info

Add to `app/api/chat/route.jsx`:
```javascript
console.log('Image data preview:', imageData?.substring(0, 100))
console.log('Selected provider:', process.env.PROVIDERS_ORDER)
```

## Alternative: Text Fallback

If vision keeps failing, you can temporarily disable image uploads:

```javascript
// In app/chat/page.jsx, comment out the paperclip button:
{/* <Button onClick={() => fileInputRef.current?.click()}>
  <Paperclip className="w-4 h-4" />
</Button> */}
```

Or show a warning:
```javascript
const handleImageSelect = (e) => {
  if (!process.env.NEXT_PUBLIC_VISION_ENABLED) {
    setError('Image analysis is temporarily unavailable')
    return
  }
  // ... rest of code
}
```

## Environment Variable Reference

Required for image support:
```env
# .env.local
GOOGLE_API_KEY=AIzaSy...                    # Required
GOOGLE_MODEL=gemini-1.5-flash              # Must be 1.5+ for vision
PROVIDERS_ORDER=gemini,sambanova,...       # Gemini should be first
```

Optional tuning:
```env
AI_PROVIDER_TIMEOUT_MS=30000               # Increase if needed (default: 10000)
```

## Getting Help

If issues persist:

1. **Check Gemini API Status:**
   - [Google Cloud Status](https://status.cloud.google.com/)
   - [AI Studio Status](https://ai.google.dev/)

2. **Review API Docs:**
   - [Gemini Vision Guide](https://ai.google.dev/gemini-api/docs/vision)
   - [API Reference](https://ai.google.dev/api/rest/v1/models/generateContent)

3. **Common Error Codes:**
   - `400` - Invalid request format
   - `401` - Invalid API key
   - `403` - Permission denied / Quota exceeded
   - `404` - Model not found
   - `429` - Rate limit exceeded
   - `500` - Internal server error
   - `503` - Service unavailable

4. **Test API Key:**
   Visit [Google AI Studio](https://makersuite.google.com/) and try uploading an image there. If it works there but not in your app, it's a code issue. If it doesn't work there either, it's an API access issue.

## Success Indicators

When working correctly, you should see:
```
🔄 Trying gemini...
🖼️ Gemini Vision Request: { hasImage: true, ... }
✅ gemini succeeded
[v1] Fast AI response using gemini
=== AI Response Debug ===
Raw AI: I can see in this image...
```

Happy debugging! 🐛🔍
