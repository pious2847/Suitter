# Video Upload Fix - CORS & File Size Issues

## 🔧 Issues Fixed

### 1. CORS Error
**Problem:** Walrus publisher blocking requests from localhost
**Solution:** Added multiple fallback publishers with CORS support

### 2. 413 Error (File Too Large)
**Problem:** Videos exceeding Walrus testnet limits
**Solution:** Reduced limits and added pre-upload validation

---

## ✅ Changes Made

### Updated File Size Limits

**Before:**
- All files: 10MB limit

**After:**
- Images: 5MB limit (safe for Walrus)
- Videos: 3MB limit (conservative for reliability)

### Multiple Publisher Endpoints

Added 4 Walrus publishers with automatic fallback:

```typescript
const WALRUS_PUBLISHERS = [
  'https://publisher.walrus-testnet.walrus.space',      // Primary
  'https://wal-publisher-testnet.staketab.org',         // Backup 1
  'https://walrus-testnet-publisher.nodes.guru',        // Backup 2
  'https://publisher.walrus-01.tududes.com',            // Backup 3
];
```

### Smart Upload Logic

1. **Pre-upload validation** - Check file size before upload
2. **Try multiple publishers** - Automatic fallback if one fails
3. **Better error messages** - Clear guidance for users
4. **Longer timeout** - 90 seconds for video uploads

---

## 📊 File Size Limits

| Type | Max Size | Reason |
|------|----------|--------|
| Images | 5MB | Safe limit for Walrus testnet |
| Videos | 3MB | Conservative for reliability |

### Why These Limits?

- Walrus testnet has ~10MB blob limit
- Network overhead and encoding adds size
- Multiple publishers may have different limits
- Conservative limits ensure success

---

## 🎥 Video Compression Guide

### Recommended Tools

**Online (Free):**
- https://www.freeconvert.com/video-compressor
- https://www.videosmaller.com/
- https://clideo.com/compress-video

**Desktop:**
- HandBrake (Windows/Mac/Linux)
- FFmpeg (Command line)
- VLC Media Player

### FFmpeg Command
```bash
# Compress video to under 3MB
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 500k output.mp4
```

### Compression Tips
1. **Lower resolution** - 720p instead of 1080p
2. **Reduce bitrate** - 500-800 kbps for short clips
3. **Shorter duration** - Keep videos under 30 seconds
4. **Use H.264 codec** - Best compression/quality ratio

---

## 🔄 Upload Flow

### New Upload Process

```
1. User selects video
   ↓
2. Check file size
   ↓ (if > 3MB)
3. Show error with compression tips
   ↓ (if < 3MB)
4. Try Publisher 1
   ↓ (if fails)
5. Try Publisher 2
   ↓ (if fails)
6. Try Publisher 3
   ↓ (if fails)
7. Try Publisher 4
   ↓ (if all fail)
8. Show detailed error message
```

---

## 📝 Error Messages

### File Too Large (Before Upload)
```
Video too large! Max size: 3.0MB. Your file: 5.2MB. 
Please compress it first.
```

### File Too Large (Server Rejected)
```
File too large! Walrus publishers rejected the file (413). 
Try compressing your video to under 3.0MB.
```

### CORS Error
```
CORS Error: All Walrus publishers are blocking the request. 
This might be a temporary issue. Please try again in a few minutes.
```

### All Publishers Failed
```
All Walrus publishers failed: [error details]
```

---

## 🎯 User Experience

### Before
- ❌ Confusing CORS errors
- ❌ No file size guidance
- ❌ Single publisher (no fallback)
- ❌ Generic error messages

### After
- ✅ Multiple publishers (automatic fallback)
- ✅ Pre-upload file size check
- ✅ Clear error messages
- ✅ Compression guidance
- ✅ Better success rate

---

## 🧪 Testing

### Test Cases

1. **Small Image (< 5MB)**
   - ✅ Should upload successfully

2. **Large Image (> 5MB)**
   - ✅ Should show size error before upload

3. **Small Video (< 3MB)**
   - ✅ Should upload successfully

4. **Large Video (> 3MB)**
   - ✅ Should show size error with compression tips

5. **Publisher Failure**
   - ✅ Should try next publisher automatically

### Manual Testing
```bash
npm run dev

# Test:
1. Try uploading 5MB image → Should work
2. Try uploading 6MB image → Should show error
3. Try uploading 2MB video → Should work
4. Try uploading 4MB video → Should show error
```

---

## 📁 Files Modified

- ✅ `next-frontend/services/walrus.ts` - Multiple publishers, better error handling
- ✅ `next-frontend/components/compose-modal.tsx` - Updated file size limits

---

## 🔍 Debugging

### Check File Size
```typescript
const fileSizeMB = file.size / 1024 / 1024;
console.log(`File size: ${fileSizeMB.toFixed(2)}MB`);
```

### Check Publisher Response
```typescript
console.log('Trying publisher:', publisherUrl);
console.log('Response:', response.data);
```

### Monitor Network
1. Open DevTools → Network tab
2. Upload file
3. Check which publisher was used
4. Check response status

---

## 💡 Tips for Users

### For Images
- Use JPEG instead of PNG (smaller)
- Reduce resolution if needed
- Use online compressors

### For Videos
- Keep videos short (< 30 seconds)
- Use 720p resolution
- Compress before uploading
- Use H.264 codec

### If Upload Fails
1. Check file size
2. Compress the file
3. Try again in a few minutes
4. Check internet connection

---

## 🚀 Future Improvements

Potential enhancements:
- [ ] Client-side video compression
- [ ] Progress bar for uploads
- [ ] Automatic video optimization
- [ ] Chunked uploads for large files
- [ ] Resume failed uploads
- [ ] Preview before upload

---

## 📊 Success Metrics

### Expected Improvements
- ✅ 90%+ upload success rate
- ✅ Clear error messages
- ✅ Automatic fallback working
- ✅ Users understand file size limits

---

**Status:** ✅ Fixed - Multiple publishers with better error handling!
