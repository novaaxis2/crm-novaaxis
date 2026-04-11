# NovaAxis WhatsApp Cloud API Setup (Live Chat Only)

This project now supports direct live messaging from your dashboard chat UI to real WhatsApp users using Meta WhatsApp Cloud API.

Current scope:

- Text messages
- Image messages
- PDF messages
- Live webhook receive + status updates
- No database persistence (intentional as requested)

---

## 1) Required environment variables

Configure these in local [`.env.local`](.env.local) and in Vercel production environment:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `META_APP_SECRET`
- `WHATSAPP_API_VERSION` (default `v23.0`)
- `WHATSAPP_DEFAULT_TARGET_NUMBER` (optional default receiver)

Example key template in [`.env.example`](.env.example).

---

## 2) Your Nepal default number

To use your requested number as default target, set:

```env
WHATSAPP_DEFAULT_TARGET_NUMBER=+97797090900392
```

The API will also normalize typical Nepal inputs like `97090900392`.

---

## 3) Webhook configuration in Meta

Set callback URL to:

- `https://<your-domain>/api/whatsapp/webhook`

Set verify token exactly equal to `WHATSAPP_VERIFY_TOKEN`.

Subscribe at least:

- `messages`
- `message_status`

Webhook route is secured with signature verification in [`app/api/whatsapp/webhook/route.ts`](app/api/whatsapp/webhook/route.ts).

---

## 4) API routes

- Status: [`GET /api/whatsapp/status`](app/api/whatsapp/status/route.ts)
- Send message: [`POST /api/whatsapp/messages`](app/api/whatsapp/messages/route.ts)
- Upload media: [`POST /api/whatsapp/media`](app/api/whatsapp/media/route.ts)
- Conversations: [`GET /api/whatsapp/conversations`](app/api/whatsapp/conversations/route.ts)
- Conversation messages: [`GET /api/whatsapp/conversations/[id]/messages`](app/api/whatsapp/conversations/[id]/messages/route.ts)
- Webhook verify/receive: [`GET/POST /api/whatsapp/webhook`](app/api/whatsapp/webhook/route.ts)

---

## 5) Run locally

```bash
npm install
npm run dev
```

Open dashboard and use widget in [`app/components/whatsapp-chat.tsx`](app/components/whatsapp-chat.tsx).

---

## 6) Important behavior (as requested)

- Messages are not persisted permanently.
- In-memory runtime store is used in [`lib/whatsapp/store.ts`](lib/whatsapp/store.ts).
- Data resets when server restarts/redeploys.

