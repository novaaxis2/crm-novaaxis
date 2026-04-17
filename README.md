# NovaAxis WhatsApp Cloud API + Neon + S3 Persistence

This project supports direct live messaging from dashboard chat UI to real WhatsApp users using Meta WhatsApp Cloud API, with durable persistence in Neon PostgreSQL and phone-scoped media storage in AWS S3.

Current scope:

- Two-way text messages
- Two-way image messages
- Two-way document/PDF messages
- Two-way audio messages
- Two-way video messages
- Two-way sticker messages
- Contacts/location metadata capture from inbound webhook payloads
- Live webhook receive + status updates
- Idempotent webhook audit/event persistence in Neon
- Private S3 media storage + presigned URL access

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
- `DATABASE_URL` (or `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`)
- `DATABASE_MAX_POOL_SIZE` (optional, default `5`)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `AWS_S3_PRESIGN_TTL_SECONDS` (optional, default `900`)

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

- Messages, conversations, statuses, and webhook audits are persisted in Neon via [`lib/whatsapp/repository.ts`](lib/whatsapp/repository.ts).
- Phone number is treated as unique identity (`E.164`) for conversation grouping.
- Media binaries are mirrored to private S3 by phone-specific prefix via [`lib/whatsapp/s3.ts`](lib/whatsapp/s3.ts).
- Media is accessed from APIs using presigned URLs.

---

## 7) Phone-scoped S3 key format

Media is stored in S3 with per-user path isolation:

- `whatsapp/{phoneDigits}/{direction}/{type}/{YYYY}/{MM}/{DD}/{generated_name}`

Example:

- `whatsapp/97798XXXXXXXX/inbound/image/2026/04/17/...`

This guarantees separation by unique mobile number.

---

## 8) Security notes

- Keep S3 bucket private.
- Use presigned URLs only for temporary access.
- Rotate exposed secrets immediately if they were ever committed/shared.
- Ensure production webhook signature verification remains enabled in [`app/api/whatsapp/webhook/route.ts`](app/api/whatsapp/webhook/route.ts).

