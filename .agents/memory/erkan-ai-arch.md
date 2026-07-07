---
name: ERKAN AI Architecture
description: Key decisions and constraints for the ERKAN AI app (Arabic AI assistant with subscriptions)
---

# ERKAN AI Architecture

## Auth
- Bearer token in localStorage key `erkan_auth_token`
- In-memory `tokenStore` Map on API server (tokens lost on server restart — users must re-login)
- No cookies/sessions

## AI Config
- Env: `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`
- Chat model: `gpt-5.4`
- Image model: `gpt-image-1` (Pro Max only)

## Subscription Tiers & Daily Limits
- free: 30 msgs/day
- pro: 120 msgs/day ($9.99)
- pro_max: 10000 msgs/day ($19.99, image gen enabled)

## Activation Codes
- 16-char alphanumeric (charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
- Stored in `subscription_codes` DB table, single-use
- Admin generates via POST /api/admin/codes with `Authorization: Bearer <ADMIN_KEY>`

## Admin Panel
- `ADMIN_KEY` env var (set to `ERKAN-ADMIN-2025-SECRET`)
- Accessible: ProfileScreen → الإعدادات المتقدمة → لوحة الإدارة
- Admin enters ADMIN_KEY in-app to authenticate

**Why:** User wanted zero external admin dashboard — all code management inside the app itself.
