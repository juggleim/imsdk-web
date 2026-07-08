# GitHub Social Preview

This file documents how to publish the official Social Preview image.

## How to set it up

1. Design a **1280 × 640 px** PNG (GitHub's required Social Preview size).
2. Recommended content:
   - Left third: `res/logo.svg` enlarged
   - Middle: wordmark **"JuggleIM"** + tagline **"Real-time messaging for the Web"**
   - Right: a stylized chat bubble / WebSocket handshake diagram
   - Background: dark gradient (`#0F172A` → `#1E293B`) so it stands out in feeds
3. Export as `social-preview.png` (≤ 1 MB).
4. Upload at: GitHub → **Settings → Social preview → Upload an image**

A draft SVG template lives at `res/social-preview.svg` — open it in Figma/Illustrator, replace the text with the wordmark, then export to PNG.

> Until you upload a real preview, GitHub will fall back to the repository avatar and OG meta tags will not render nicely on Twitter / Slack / Discord shares.
