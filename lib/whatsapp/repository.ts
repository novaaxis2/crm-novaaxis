import { randomUUID, createHash } from 'node:crypto';

import { queryDb } from './db';
import {
  inferFileNameFromMetadata,
  inferFileSizeFromMetadata,
  resolveMimeTypeFromMetadata,
  safeJsonValue,
} from './media-types';
import { getPresignedMediaUrl } from './s3';
import type {
  WhatsAppConversationSummary,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppStoredMessage,
} from './types';

interface ContactRow {
  id: string;
  phone_e164: string;
  display_name: string;
}

interface ConversationRow {
  id: string;
  phone_e164: string;
  display_name: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  phone_e164: string;
  direction: WhatsAppMessageDirection;
  type: WhatsAppMessageType;
  text: string;
  wa_media_id: string | null;
  mime_type: string | null;
  file_name: string | null;
  external_message_id: string | null;
  status: WhatsAppMessageStatus;
  timestamp: string;
  error: string | null;
  metadata: unknown;
  s3_key: string | null;
}

async function findMessageById(messageId: string) {
  const result = await queryDb<MessageRow>(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.phone_e164,
        m.direction,
        m.type,
        m.text,
        m.wa_media_id,
        m.mime_type,
        m.file_name,
        m.external_message_id,
        m.status,
        m.timestamp,
        m.error,
        m.metadata,
        mo.s3_key
      FROM whatsapp_messages m
      LEFT JOIN whatsapp_media_objects mo ON mo.message_id = m.id
      WHERE m.id = $1
      LIMIT 1
    `,
    [messageId],
  );

  return result.rows[0] ?? null;
}

function conversationIdFromPhone(phone: string) {
  return `conv_${phone.replace(/\D/g, '')}`;
}

function contactIdFromPhone(phone: string) {
  return `contact_${phone.replace(/\D/g, '')}`;
}

function toConversationSummary(row: ConversationRow): WhatsAppConversationSummary {
  return {
    id: row.id,
    phone: row.phone_e164,
    name: row.display_name,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: new Date(row.last_message_at).toISOString(),
    unreadCount: Number(row.unread_count ?? 0),
  };
}

async function maybePresignMediaKey(s3Key: string | null) {
  if (!s3Key) {
    return undefined;
  }

  try {
    return await getPresignedMediaUrl(s3Key);
  } catch {
    return undefined;
  }
}

async function toStoredMessage(row: MessageRow): Promise<WhatsAppStoredMessage> {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    phone: row.phone_e164,
    direction: row.direction,
    type: row.type,
    text: row.text,
    mediaId: row.wa_media_id ?? undefined,
    mimeType: row.mime_type ?? undefined,
    fileName: row.file_name ?? undefined,
    externalMessageId: row.external_message_id ?? undefined,
    status: row.status,
    timestamp: new Date(row.timestamp).toISOString(),
    error: row.error ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    s3Key: row.s3_key ?? undefined,
    mediaUrl: await maybePresignMediaKey(row.s3_key),
  };
}

async function upsertContactAndConversation(phone: string, name?: string) {
  const conversationId = conversationIdFromPhone(phone);
  const contactId = contactIdFromPhone(phone);
  const displayName = name?.trim() || phone;

  await queryDb(
    `
      INSERT INTO whatsapp_contacts (id, phone_e164, display_name, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (phone_e164)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
    `,
    [contactId, phone, displayName],
  );

  await queryDb(
    `
      INSERT INTO whatsapp_conversations (
        id,
        contact_id,
        phone_e164,
        last_message_preview,
        last_message_at,
        unread_count,
        updated_at
      )
      VALUES ($1, $2, $3, 'No messages yet', NOW(), 0, NOW())
      ON CONFLICT (phone_e164)
      DO UPDATE SET
        contact_id = EXCLUDED.contact_id,
        updated_at = NOW()
    `,
    [conversationId, contactId, phone],
  );

  return {
    conversationId,
    contactId,
  };
}

async function resolveConversation(conversationId: string) {
  const result = await queryDb<ConversationRow>(
    `
      SELECT
        c.id,
        c.phone_e164,
        ct.display_name,
        c.last_message_preview,
        c.last_message_at,
        c.unread_count
      FROM whatsapp_conversations c
      JOIN whatsapp_contacts ct ON ct.id = c.contact_id
      WHERE c.id = $1
      LIMIT 1
    `,
    [conversationId],
  );

  const row = result.rows[0];
  return row ? toConversationSummary(row) : null;
}

export async function ensureConversation(phone: string, name?: string) {
  const { conversationId } = await upsertContactAndConversation(phone, name);
  return conversationId;
}

export interface AppendMessageInput {
  phone: string;
  name?: string;
  direction: WhatsAppMessageDirection;
  type: WhatsAppMessageType;
  text: string;
  status: WhatsAppMessageStatus;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
  externalMessageId?: string;
  timestamp?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

async function findMessageByExternalId(externalMessageId: string) {
  const result = await queryDb<MessageRow>(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.phone_e164,
        m.direction,
        m.type,
        m.text,
        m.wa_media_id,
        m.mime_type,
        m.file_name,
        m.external_message_id,
        m.status,
        m.timestamp,
        m.error,
        m.metadata,
        mo.s3_key
      FROM whatsapp_messages m
      LEFT JOIN whatsapp_media_objects mo ON mo.message_id = m.id
      WHERE m.external_message_id = $1
      LIMIT 1
    `,
    [externalMessageId],
  );

  return result.rows[0] ?? null;
}

export async function appendMessage(input: AppendMessageInput): Promise<WhatsAppStoredMessage> {
  if (input.externalMessageId) {
    const existing = await findMessageByExternalId(input.externalMessageId);
    if (existing) {
      return toStoredMessage(existing);
    }
  }

  const { conversationId } = await upsertContactAndConversation(input.phone, input.name);
  const messageId = randomUUID();
  const timestamp = input.timestamp ? new Date(input.timestamp).toISOString() : new Date().toISOString();

  const normalizedMimeType = input.mimeType ?? resolveMimeTypeFromMetadata(input.metadata);
  const normalizedFileName = input.fileName ?? inferFileNameFromMetadata(input.metadata);
  const metadata = safeJsonValue(input.metadata ?? {});

  await queryDb(
    `
      INSERT INTO whatsapp_messages (
        id,
        conversation_id,
        phone_e164,
        direction,
        type,
        text,
        status,
        wa_media_id,
        mime_type,
        file_name,
        external_message_id,
        timestamp,
        error,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
      ON CONFLICT (external_message_id)
      WHERE external_message_id IS NOT NULL
      DO NOTHING
    `,
    [
      messageId,
      conversationId,
      input.phone,
      input.direction,
      input.type,
      input.text,
      input.status,
      input.mediaId ?? null,
      normalizedMimeType ?? null,
      normalizedFileName ?? null,
      input.externalMessageId ?? null,
      timestamp,
      input.error ?? null,
      JSON.stringify(metadata),
    ],
  );

  await queryDb(
    `
      UPDATE whatsapp_conversations
      SET
        last_message_preview = $2,
        last_message_at = $3,
        unread_count = CASE WHEN $4 = 'inbound' THEN unread_count + 1 ELSE unread_count END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [conversationId, input.text, timestamp, input.direction],
  );

  const insertedRow = await findMessageById(messageId);
  if (insertedRow) {
    return toStoredMessage(insertedRow);
  }

  if (input.externalMessageId) {
    const existing = await findMessageByExternalId(input.externalMessageId);
    if (existing) {
      return toStoredMessage(existing);
    }
  }

  throw new Error('Failed to persist WhatsApp message.');
}

export async function getMessageById(messageId: string) {
  const row = await findMessageById(messageId);
  if (!row) {
    return null;
  }

  return toStoredMessage(row);
}

export async function findMessageByExternalMessageId(externalMessageId: string) {
  const row = await findMessageByExternalId(externalMessageId);
  if (!row) {
    return null;
  }

  return toStoredMessage(row);
}

export async function listConversations() {
  const result = await queryDb<ConversationRow>(
    `
      SELECT
        c.id,
        c.phone_e164,
        ct.display_name,
        c.last_message_preview,
        c.last_message_at,
        c.unread_count
      FROM whatsapp_conversations c
      JOIN whatsapp_contacts ct ON ct.id = c.contact_id
      ORDER BY c.last_message_at DESC
    `,
  );

  return result.rows.map(toConversationSummary);
}

export async function getConversationById(conversationId: string) {
  return resolveConversation(conversationId);
}

export async function getMessagesByConversation(conversationId: string) {
  const result = await queryDb<MessageRow>(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.phone_e164,
        m.direction,
        m.type,
        m.text,
        m.wa_media_id,
        m.mime_type,
        m.file_name,
        m.external_message_id,
        m.status,
        m.timestamp,
        m.error,
        m.metadata,
        mo.s3_key
      FROM whatsapp_messages m
      LEFT JOIN whatsapp_media_objects mo ON mo.message_id = m.id
      WHERE m.conversation_id = $1
      ORDER BY m.timestamp ASC
    `,
    [conversationId],
  );

  const messages: WhatsAppStoredMessage[] = [];
  for (const row of result.rows) {
    messages.push(await toStoredMessage(row));
  }

  return messages;
}

export async function markConversationRead(conversationId: string) {
  await queryDb(
    `
      UPDATE whatsapp_conversations
      SET
        unread_count = 0,
        updated_at = NOW()
      WHERE id = $1
    `,
    [conversationId],
  );

  return resolveConversation(conversationId);
}

export async function markMessageStatusByExternalId(
  externalMessageId: string,
  status: WhatsAppMessageStatus,
  error?: string,
) {
  const updated = await queryDb<MessageRow>(
    `
      UPDATE whatsapp_messages
      SET
        status = $2,
        error = $3
      WHERE external_message_id = $1
      RETURNING
        id,
        conversation_id,
        phone_e164,
        direction,
        type,
        text,
        wa_media_id,
        mime_type,
        file_name,
        external_message_id,
        status,
        timestamp,
        error,
        metadata,
        NULL::text AS s3_key
    `,
    [externalMessageId, status, error ?? null],
  );

  if (!updated.rows[0]) {
    return null;
  }

  return toStoredMessage(updated.rows[0]);
}

export async function storeInboundMessage(extracted: {
  phone: string;
  name?: string;
  externalMessageId?: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text: string;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
}) {
  return appendMessage({
    phone: extracted.phone,
    name: extracted.name,
    direction: 'inbound',
    type: extracted.type,
    text: extracted.text,
    status: 'delivered',
    mediaId: extracted.mediaId,
    mimeType: extracted.mimeType,
    fileName: extracted.fileName,
    externalMessageId: extracted.externalMessageId,
    timestamp: extracted.timestamp,
    metadata: extracted.metadata,
  });
}

export async function storeStatusUpdate(extracted: {
  externalMessageId: string;
  timestamp: string;
  status: WhatsAppMessageStatus;
  error?: string;
  raw?: Record<string, unknown>;
}) {
  const statusEventId = randomUUID();

  await queryDb(
    `
      INSERT INTO whatsapp_status_events (
        id,
        external_message_id,
        status,
        error,
        timestamp,
        raw
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT (external_message_id, status, timestamp)
      DO NOTHING
    `,
    [
      statusEventId,
      extracted.externalMessageId,
      extracted.status,
      extracted.error ?? null,
      extracted.timestamp,
      JSON.stringify(safeJsonValue(extracted.raw ?? {})),
    ],
  );

  return markMessageStatusByExternalId(extracted.externalMessageId, extracted.status, extracted.error);
}

export async function saveWebhookEventAudit(options: {
  rawBody: string;
  payload: Record<string, unknown>;
  signatureValid: boolean;
}) {
  const payloadHash = createHash('sha256').update(options.rawBody).digest('hex');
  const id = randomUUID();

  const insert = await queryDb<{ id: string }>(
    `
      INSERT INTO whatsapp_webhook_events (
        id,
        payload_hash,
        payload,
        signature_valid,
        processed,
        processing_error,
        received_at,
        updated_at
      )
      VALUES ($1, $2, $3::jsonb, $4, FALSE, NULL, NOW(), NOW())
      ON CONFLICT (payload_hash)
      DO NOTHING
      RETURNING id
    `,
    [id, payloadHash, JSON.stringify(safeJsonValue(options.payload)), options.signatureValid],
  );

  return {
    id: insert.rows[0]?.id ?? null,
    payloadHash,
    inserted: Boolean(insert.rows[0]?.id),
  };
}

export async function markWebhookAuditProcessed(payloadHash: string, error?: string) {
  await queryDb(
    `
      UPDATE whatsapp_webhook_events
      SET
        processed = $2,
        processing_error = $3,
        updated_at = NOW()
      WHERE payload_hash = $1
    `,
    [payloadHash, !error, error ?? null],
  );
}

export async function upsertMediaObject(options: {
  messageId: string;
  phone: string;
  direction: WhatsAppMessageDirection;
  externalMediaId?: string;
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  s3Bucket: string;
  s3Key: string;
  sha256?: string;
  metadata?: Record<string, unknown>;
}) {
  const metadata = options.metadata ?? {};
  const resolvedMimeType = options.mimeType ?? resolveMimeTypeFromMetadata(metadata);
  const resolvedFileName = options.fileName ?? inferFileNameFromMetadata(metadata);
  const resolvedFileSize = options.fileSizeBytes ?? inferFileSizeFromMetadata(metadata);

  await queryDb(
    `
      INSERT INTO whatsapp_media_objects (
        id,
        message_id,
        phone_e164,
        direction,
        external_media_id,
        mime_type,
        file_name,
        file_size_bytes,
        s3_bucket,
        s3_key,
        sha256,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (message_id)
      DO UPDATE SET
        external_media_id = EXCLUDED.external_media_id,
        mime_type = EXCLUDED.mime_type,
        file_name = EXCLUDED.file_name,
        file_size_bytes = EXCLUDED.file_size_bytes,
        s3_bucket = EXCLUDED.s3_bucket,
        s3_key = EXCLUDED.s3_key,
        sha256 = EXCLUDED.sha256
    `,
    [
      randomUUID(),
      options.messageId,
      options.phone,
      options.direction,
      options.externalMediaId ?? null,
      resolvedMimeType ?? null,
      resolvedFileName ?? null,
      resolvedFileSize ?? null,
      options.s3Bucket,
      options.s3Key,
      options.sha256 ?? null,
    ],
  );
}

