import crypto from 'node:crypto';

import { normalizeWaIdToE164 } from './phone';
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

  return `[Unsupported message type: ${message.type || 'unknown'}]`;
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
        };

        if (type === 'image') {
          extracted.mediaId = message.image?.id;
          extracted.mimeType = message.image?.mime_type;
        }

        if (type === 'document') {
          extracted.mediaId = message.document?.id;
          extracted.mimeType = message.document?.mime_type;
          extracted.fileName = message.document?.filename;
        }

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
  // Import store here to avoid circular dependencies
  const { storeInboundMessage, storeStatusUpdate } = await import('./store');

  // Process inbound messages
  const messages = extractInboundMessages(payload);
  for (const msg of messages) {
    storeInboundMessage(msg);
  }

  // Process status updates
  const statuses = extractStatusUpdates(payload);
  for (const status of statuses) {
    storeStatusUpdate(status);
  }
}

