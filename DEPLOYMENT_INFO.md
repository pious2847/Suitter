# Deployment Information

## Contract Deployment Details

**Transaction Digest:** `BABzKbugpRPp4c8Jxhu2FMbZUPK1xTo9P1BDEsARm8Uf`

**Network:** Sui Testnet

**Deployed At:** Epoch 921

**Gas Used:** 104,377,480 MIST (~0.104 SUI)

---

## Published Package

**Package ID:** `0x85adced0fe590c6d94a07ba8d8034868227d3de4e7d540c1cded78fd6cb38183`

**Modules:**
- `interactions` - Like, comment, retweet functionality
- `messaging` - Chat and messaging system
- `profile` - User profiles and usernames
- `suits` - Post creation and management (with content type support)
- `tipping` - Tipping functionality

---

## Shared Object IDs (Registries)

### SuitRegistry
**Object ID:** `0xdf6309497d5dcb7e5a4aefb8e90392d10675e4efc4bcf85470978c181e18c63e`
- Manages all posts (suits)
- Stores post IDs and creator mappings

### InteractionRegistry
**Object ID:** `0xb602fa6e7d602d95ae48b1c5735d02b7448ad91fea33bae2be0c0c42666f1bc5`
- Tracks likes and retweets
- Prevents duplicate interactions

### UsernameRegistry
**Object ID:** `0x4fb3b92339aee9f4c8282b5eaee221eb5ffba8796d90a48a6b7a26b1fc94260a`
- Manages username registrations
- Ensures unique usernames

### TipBalanceRegistry
**Object ID:** `0xeba4d8d3f39db0c4cc650d4c22e846f7b4a96c6c08de15f1081aadd0c71cea00`
- Tracks tip balances
- Manages tipping system

### ChatRegistry
**Object ID:** `0x352e601455695225ee3d6b1231da6ab8cd6e497ce7f5183c0dae6dbced2fd9dc`
- Manages chat conversations
- Stores message data

---

## Environment Variables

All constants have been updated in:
- `next-frontend/.env` - Environment variables
- `next-frontend/config/index.ts` - Configuration file with fallbacks

### Required Environment Variables

```env
# Package ID (Published Contract)
VITE_PACKAGE_ID=0x85adced0fe590c6d94a07ba8d8034868227d3de4e7d540c1cded78fd6cb38183

# Registry Object IDs
VITE_SUIT_REGISTRY=0xdf6309497d5dcb7e5a4aefb8e90392d10675e4efc4bcf85470978c181e18c63e
VITE_INTERACTION_REGISTRY=0xb602fa6e7d602d95ae48b1c5735d02b7448ad91fea33bae2be0c0c42666f1bc5
VITE_USERNAME_REGISTRY=0x4fb3b92339aee9f4c8282b5eaee221eb5ffba8796d90a48a6b7a26b1fc94260a
VITE_TIP_BALANCE_REGISTRY=0xeba4d8d3f39db0c4cc650d4c22e846f7b4a96c6c08de15f1081aadd0c71cea00
VITE_CHAT_REGISTRY=0x352e601455695225ee3d6b1231da6ab8cd6e497ce7f5183c0dae6dbced2fd9dc

# Walrus Configuration
VITE_WALRUS_URL=https://walrus-testnet-publisher.nodes.guru
```

---

## New Features in This Deployment

### Content Type Support
- Posts now have a `content_type` field: "text", "image", or "video"
- Enables filtering by content type
- Supports TikTok-style video feed

### Smart Contract Changes
- Added `content_type: String` to `Suit` struct
- Updated `create_suit()` to accept content type parameter
- Added `get_content_type()` getter function

### Frontend Changes
- Auto-detects content type from uploaded files
- `fetchVideoFeed()` - filters for video posts only
- `fetchImageFeed()` - filters for image posts only
- Updated compose modal to pass content type

---

## Testing the Deployment

1. **Start the frontend:**
   ```bash
   cd next-frontend
   npm run dev
   ```

2. **Test creating posts:**
   - Text post (no media)
   - Image post (upload image)
   - Video post (upload video)

3. **Test video feed:**
   - Click "Feed" tab
   - Should show only video posts

4. **Verify on-chain:**
   ```bash
   sui client object <SUIT_REGISTRY_ID>
   ```

---

## Upgrade Cap

**Object ID:** `0x0d56ffe83cb0f66edb9d0a166aeafddd4ac52cf76decfc0359875885bd4feca5`

**Owner:** `0xda31b8127cd23f42be99f904cc61f69c5e0693138b2f5cc25eef4a8f94493b87`

This upgrade cap allows you to upgrade the contract in the future.

---

## Explorer Links

**Package:** https://suiscan.xyz/testnet/object/0x85adced0fe590c6d94a07ba8d8034868227d3de4e7d540c1cded78fd6cb38183

**Transaction:** https://suiscan.xyz/testnet/tx/BABzKbugpRPp4c8Jxhu2FMbZUPK1xTo9P1BDEsARm8Uf

**SuitRegistry:** https://suiscan.xyz/testnet/object/0xdf6309497d5dcb7e5a4aefb8e90392d10675e4efc4bcf85470978c181e18c63e

---

## Notes

- All registry objects are **Shared Objects** - accessible by all users
- Package is **Immutable** - cannot be modified (only upgraded)
- Content type feature is backward compatible with old posts
- Falls back to URL-based detection for posts without content_type field
