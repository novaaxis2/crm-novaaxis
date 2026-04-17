import crypto from 'node:crypto';

import { downloadWhatsAppMedia, getWhatsAppMediaInfo } from './cloud-api';
import { normalizeWaIdToE164 } from './phone';
import { getS3MissingConfig } from './persistence-env';
import { upsertMediaObject } from './repository';
import { buildPhoneScopedMediaKey, uploadBufferToS3 } from './s3';
import type { WhatsAppMessageStatus, WhatsAppMessageType } from './types';

interface WebhookContact {
  wa_id?: string;
  profile?: {
    name?: string;
  };
}

interface WebhookMessage {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
  image?: {
    id?: string;
    mime_type?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    mime_type?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    id?: string;
    mime_type?: string;
  };
  video?: {
    id?: string;
    mime_type?: string;
    caption?: string;
  };
  sticker?: {
    id?: string;
    mime_type?: string;
  };
  contacts?: Array<{
    name?: {
      formatted_name?: string;
      first_name?: string;
      last_name?: string;
    };
    phones?: Array<{
      phone?: string;
      wa_id?: string;
      type?: string;
    }>;
  }>;
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
    url?: string;
  };
}

interface WebhookStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{
    title?: string;
    details?: string;
  }>;
}

interface WebhookValue {
  contacts?: WebhookContact[];
  messages?: WebhookMessage[];
  statuses?: WebhookStatus[];
}

interface WebhookChange {
  field?: string;
  value?: WebhookValue;
}

interface WebhookEntry {
  changes?: WebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WebhookEntry[];
}

export interface ExtractedInboundMessage {
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
}

export interface ExtractedStatusUpdate {
  externalMessageId: string;
  timestamp: string;
  status: WhatsAppMessageStatus;
  error?: string;
}

export function verifyWebhookSignature(options: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}) {
  const { rawBody, signatureHeader, appSecret } = options;

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function toIsoTimestamp(unixTimestamp?: string) {
  if (!unixTimestamp) {
    return new Date().toISOString();
  }

  const numeric = Number(unixTimestamp);
  if (!Number.isFinite(numeric)) {
    return new Date().toISOString();
  }

  return new Date(numeric * 1000).toISOString();
}

function mapMessageType(type?: string): WhatsAppMessageType {
  if (type === 'text') {
    return 'text';
  }

  if (type === 'image') {
    return 'image';
  }

  if (type === 'document') {
    return 'document';
  }

  if (type === 'audio') {
    return 'audio';
  }

  if (type === 'video') {
    return 'video';
  }

  if (type === 'sticker') {
    return 'sticker';
  }

  if (type === 'contacts') {
    return 'contacts';
  }

  if (type === 'location') {
    return 'location';
  }

  return 'unsupported';
}

function extractMessageText(message: WebhookMessage, mappedType: WhatsAppMessageType) {
  if (mappedType === 'text') {
    return message.text?.body?.trim() || '[Empty message]';
  }

  if (mappedType === 'image') {
    return message.image?.caption?.trim() || '[Image]';
  }

  if (mappedType === 'document') {
    const fileName = message.document?.filename?.trim();
    const caption = message.document?.caption?.trim();
    if (caption) {
      return caption;
    }
    if (fileName) {
      return `[Document: ${fileName}]`;
    }
    return '[Document]';
  }

  if (mappedType === 'audio') {
    return '[Audio]';
  }

  if (mappedType === 'video') {
    return message.video?.caption?.trim() || '[Video]';
  }

  if (mappedType === 'sticker') {
    return '[Sticker]';
  }

  if (mappedType === 'contacts') {
    const count = message.contacts?.length ?? 0;
    return count > 0 ? `[Contact card x${count}]` : '[Contact card]';
  }

  if (mappedType === 'location') {
    const name = message.location?.name?.trim();
    const address = message.location?.address?.trim();
    if (name && address) {
      return `[Location] ${name} - ${address}`;
    }
    if (name) {
      return `[Location] ${name}`;
    }
    return '[Location]';
  }

  return `[Unsupported message type: ${message.type || 'unknown'}]`;
}

function buildInboundMetadata(message: WebhookMessage, type: WhatsAppMessageType) {
  const metadata: Record<string, unknown> = {
    rawType: message.type,
  };

  if (type === 'image') {
    metadata.image = message.image ?? {};
  }

  if (type === 'document') {
    metadata.document = message.document ?? {};
  }

  if (type === 'audio') {
    metadata.audio = message.audio ?? {};
  }

  if (type === 'video') {
    metadata.video = message.video ?? {};
  }

  if (type === 'sticker') {
    metadata.sticker = message.sticker ?? {};
  }

  if (type === 'contacts') {
    metadata.contacts = message.contacts ?? [];
  }

  if (type === 'location') {
    metadata.location = message.location ?? {};
  }

  return metadata;
}

function resolveInboundMediaInfo(message: WebhookMessage, type: WhatsAppMessageType) {
  if (type === 'image') {
    return {
      mediaId: message.image?.id,
      mimeType: message.image?.mime_type,
      fileName: undefined,
    };
  }

  if (type === 'document') {
    return {
      mediaId: message.document?.id,
      mimeType: message.document?.mime_type,
      fileName: message.document?.filename,
    };
  }

  if (type === 'audio') {
    return {
      mediaId: message.audio?.id,
      mimeType: message.audio?.mime_type,
      fileName: undefined,
    };
  }

  if (type === 'video') {
    return {
      mediaId: message.video?.id,
      mimeType: message.video?.mime_type,
      fileName: undefined,
    };
  }

  if (type === 'sticker') {
    return {
      mediaId: message.sticker?.id,
      mimeType: message.sticker?.mime_type,
      fileName: undefined,
    };
  }

  return {
    mediaId: undefined,
    mimeType: undefined,
    fileName: undefined,
  };
}

async function mirrorInboundMediaToS3(message: ExtractedInboundMessage, storedMessageId: string) {
  if (!message.mediaId) {
    return;
  }

  try {
    const mediaInfo = await getWhatsAppMediaInfo(message.mediaId);
    if (!mediaInfo.url) {
      return;
    }

    const fileBuffer = await downloadWhatsAppMedia(mediaInfo.url);
    const s3Key = buildPhoneScopedMediaKey({
      phone: message.phone,
      direction: 'inbound',
      messageType: message.type,
      fileName: message.fileName,
      mimeType: message.mimeType ?? mediaInfo.mime_type,
      externalMediaId: message.mediaId,
      timestamp: message.timestamp,
    });

    const uploaded = await uploadBufferToS3({
      key: s3Key,
      body: fileBuffer,
      contentType: message.mimeType ?? mediaInfo.mime_type,
    });

    await upsertMediaObject({
      messageId: storedMessageId,
      phone: message.phone,
      direction: 'inbound',
      externalMediaId: message.mediaId,
      mimeType: message.mimeType ?? mediaInfo.mime_type,
      fileName: message.fileName,
      fileSizeBytes: mediaInfo.file_size,
      s3Bucket: uploaded.bucket,
      s3Key: uploaded.key,
      sha256: mediaInfo.sha256,
      metadata: {
        mediaInfo,
      },
    });
  } catch (error) {
    console.error('Failed to mirror inbound media to S3:', error);
  }
}

function mapStatusToInternal(status?: string): WhatsAppMessageStatus | null {
  if (!status) {
    return null;
  }

  if (status === 'sent' || status === 'delivered' || status === 'read' || status === 'failed') {
    return status;
  }

  return null;
}

export function extractInboundMessages(payload: WhatsAppWebhookPayload): ExtractedInboundMessage[] {
  const result: ExtractedInboundMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) {
        continue;
      }

      const contactByWaId = new Map<string, string>();
      for (const contact of value.contacts ?? []) {
        if (contact.wa_id && contact.profile?.name) {
          contactByWaId.set(contact.wa_id, contact.profile.name);
        }
      }

      for (const message of value.messages ?? []) {
        if (!message.from) {
          continue;
        }

        let phone: string;
        try {
          phone = normalizeWaIdToE164(message.from);
        } catch {
          continue;
        }

        const type = mapMessageType(message.type);
        const extracted: ExtractedInboundMessage = {
          phone,
          name: contactByWaId.get(message.from),
          externalMessageId: message.id,
          timestamp: toIsoTimestamp(message.timestamp),
          type,
          text: extractMessageText(message, type),
          metadata: buildInboundMetadata(message, type),
        };

        const mediaInfo = resolveInboundMediaInfo(message, type);
        extracted.mediaId = mediaInfo.mediaId;
        extracted.mimeType = mediaInfo.mimeType;
        extracted.fileName = mediaInfo.fileName;

        result.push(extracted);
      }
    }
  }

  return result;
}

export function extractStatusUpdates(payload: WhatsAppWebhookPayload): ExtractedStatusUpdate[] {
  const result: ExtractedStatusUpdate[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) {
        continue;
      }

      for (const statusItem of value.statuses ?? []) {
        if (!statusItem.id) {
          continue;
        }

        const mapped = mapStatusToInternal(statusItem.status);
        if (!mapped) {
          continue;
        }

        const firstError = statusItem.errors?.[0];
        const error = firstError
          ? [firstError.title, firstError.details].filter(Boolean).join(': ')
          : undefined;

        result.push({
          externalMessageId: statusItem.id,
          timestamp: toIsoTimestamp(statusItem.timestamp),
          status: mapped,
          error,
        });
      }
    }
  }

  return result;
}

export async function handleWebhookEvent(payload: WhatsAppWebhookPayload) {
  // Import repository here to avoid circular dependencies
  const { storeInboundMessage, storeStatusUpdate } = await import('./repository');
  const s3Ready = getS3MissingConfig().length === 0;

  const messages = extractInboundMessages(payload);
  for (const msg of messages) {
    const stored = await storeInboundMessage(msg);
    if (s3Ready && msg.mediaId) {
      await mirrorInboundMediaToS3(msg, stored.id);
    }
  }

  const statuses = extractStatusUpdates(payload);
  for (const status of statuses) {
    await storeStatusUpdate({
      ...status,
      raw: {
        payload,
      },
    });
  }
}

