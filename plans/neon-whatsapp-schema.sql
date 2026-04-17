-- Neon PostgreSQL schema for WhatsApp persistence
-- Run this entire script in Neon SQL editor.

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL UNIQUE,
  last_message_preview TEXT NOT NULL DEFAULT 'No messages yet',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message_at
  ON whatsapp_conversations (last_message_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type TEXT NOT NULL CHECK (
    type IN (
      'text',
      'image',
      'document',
      'audio',
      'video',
      'sticker',
      'contacts',
      'location',
      'unsupported'
    )
  ),
  text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'received')),
  wa_media_id TEXT,
  mime_type TEXT,
  file_name TEXT,
  external_message_id TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_messages_external_message_id
  ON whatsapp_messages (external_message_id)
  WHERE external_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_time
  ON whatsapp_messages (conversation_id, timestamp ASC);

CREATE TABLE IF NOT EXISTS whatsapp_media_objects (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL UNIQUE REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  external_media_id TEXT,
  mime_type TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL UNIQUE,
  sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_objects_message_id
  ON whatsapp_media_objects (message_id);

CREATE TABLE IF NOT EXISTS whatsapp_status_events (
  id TEXT PRIMARY KEY,
  external_message_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'received')),
  error TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_status_events_external_message_id
  ON whatsapp_status_events (external_message_id, timestamp DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_status_events_dedupe
  ON whatsapp_status_events (external_message_id, status, timestamp);

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

