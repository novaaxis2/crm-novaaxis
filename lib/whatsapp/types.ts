export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'unsupported';

export type WhatsAppMessageDirection = 'inbound' | 'outbound';

export type WhatsAppMessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'received';

export interface WhatsAppConversationSummary {
  id: string;
  phone: string;
  name: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface WhatsAppStoredMessage {
  id: string;
  conversationId: string;
  phone: string;
  direction: WhatsAppMessageDirection;
  type: WhatsAppMessageType;
  text: string;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
  externalMessageId?: string;
  status: WhatsAppMessageStatus;
  timestamp: string;
  error?: string;
}

export type OutboundSendMessageInput =
  | {
      to: string;
      type: 'text';
      text: string;
    }
  | {
      to: string;
      type: 'image';
      mediaId: string;
      caption?: string;
    }
  | {
      to: string;
      type: 'document';
      mediaId: string;
      caption?: string;
      fileName?: string;
    };

export interface WhatsAppSendMessageResult {
  messageId: string;
  rawResponse: unknown;
}

export interface WhatsAppMediaUploadResult {
  id: string;
}

