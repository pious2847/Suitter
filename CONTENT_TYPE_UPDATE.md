# Content Type Feature Update

## Overview
This update adds content type support to the Suiter smart contract, allowing posts to be categorized as text, image, or video. This enables filtering for video-only feeds (TikTok-style) and better content organization.

## Smart Contract Changes

### Updated Suit Structure
The `Suit` struct now includes a `content_type` field:

```move
public struct Suit has key, store {
    id: UID,
    creator: address,
    content: String,
    media_urls: vector<String>,
    content_type: String, // "text", "image", "video"
    created_at: u64,
    like_count: u64,
    comment_count: u64,
    retweet_count: u64,
    tip_total: u64,
}
```

### Updated create_suit Function
Now accepts a `content_type` parameter:

```move
public fun create_suit(
    registry: &mut SuitRegistry,
    content: vector<u8>,
    media_urls: vector<vector<u8>>,
    content_type: vector<u8>, // "text", "image", "video"
    clock: &Clock,
    ctx: &mut TxContext
)
```

### New Getter Function
```move
public fun get_content_type(suit: &Suit): String
```

## Frontend Changes

### Updated `hooks/useSuits.ts`
Added new functions for content-type filtering:

- `postSuit(content, mediaUrls, contentType)` - Now accepts content type parameter
- `fetchVideoFeed(limit, offset)` - Fetch video posts only
- `fetchImageFeed(limit, offset)` - Fetch image posts only
- `fetchSuitsByContentType(contentType, limit, offset)` - Generic content type filter

### Updated `components/compose-modal.tsx`
- Automatically detects content type from selected file
- Passes content type to `postSuit` function
- Video files → `contentType: 'video'`
- Image files → `contentType: 'image'`
- No media → `contentType: 'text'`

### Updated `components/home-feed.tsx`
- Uses `fetchVideoFeed()` for the Feed tab (video-only)
- Uses `content_type` field from smart contract
- Fallback to URL-based detection for backward compatibility

### Updated `services/walrus.ts`
Added helper functions:
- `getContentTypeFromFile(file)` - Detect content type from File object
- `getContentTypeFromUrl(url)` - Detect content type from URL

## Usage Examples

### Creating a Post with Content Type

The compose modal automatically detects content type:

```typescript
// When user uploads a video
await postSuit("Check out this video!", ["https://..."], "video");

// When user uploads an image
await postSuit("Beautiful sunset", ["https://..."], "image");

// Text-only post
await postSuit("Just my thoughts", [], "text");
```

### Fetching Video Feed

```typescript
import { useSuits } from '../hooks/useSuits';

function VideoFeedComponent() {
  const { fetchVideoFeed } = useSuits();
  
  useEffect(() => {
    const loadVideos = async () => {
      const videos = await fetchVideoFeed(20, 0);
      // videos contains only posts with contentType === 'video'
    };
    loadVideos();
  }, []);
}
```

### Filtering by Content Type

```typescript
const { fetchSuitsByContentType } = useSuits();

// Fetch only video posts
const videos = await fetchSuitsByContentType('video', 20, 0);

// Fetch only image posts
const images = await fetchSuitsByContentType('image', 20, 0);

// Fetch all posts (text)
const textPosts = await fetchSuitsByContentType('text', 20, 0);
```

## Deployment Steps

1. **Update Smart Contract**
   ```bash
   cd Suits
   sui move build
   sui client publish --gas-budget 100000000
   ```

2. **Update Package ID**
   - Copy the new package ID from deployment
   - Update `VITE_PACKAGE_ID` in your `.env` file

3. **Test the Changes**
   - Create posts with different content types (text, image, video)
   - Verify the Feed tab shows only video posts
   - Check that content type is correctly stored on-chain

## Benefits

1. **Better Content Organization**: Posts are categorized by type
2. **Efficient Filtering**: Filter feeds by content type (video-only feed)
3. **TikTok-Style Experience**: Dedicated video feed
4. **Automatic Detection**: Content type is auto-detected from uploaded files
5. **Backward Compatible**: Falls back to URL detection for old posts

## Future Enhancements

- Add content type validation in smart contract
- Implement content type-specific UI components
- Add analytics for different content types
- Support mixed media posts (multiple content types)
- Add content type icons/badges in feed
- Implement infinite scroll for video feed
