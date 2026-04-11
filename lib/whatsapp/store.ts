import type {
  WhatsAppConversationSummary,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppStoredMessage,
} from './types';

interface InMemoryWhatsAppStore {
  conversations: Map<string, WhatsAppConversationSummary>;
  conversationIdByPhone: Map<string, string>;
  messagesByConversation: Map<string, WhatsAppStoredMessage[]>;
  messageLocatorByExternalId: Map<string, { conversationId: string; messageId: string }>;
}

declare global {
  // eslint-disable-next-line no-var
  var __novaAxisWhatsAppStore: InMemoryWhatsAppStore | undefined;
}

function createStore(): InMemoryWhatsAppStore {
  return {
    conversations: new Map<string, WhatsAppConversationSummary>(),
    conversationIdByPhone: new Map<string, string>(),
    messagesByConversation: new Map<string, WhatsAppStoredMessage[]>(),
    messageLocatorByExternalId: new Map<string, { conversationId: string; messageId: string }>(),
  };
}

function getStore() {
  if (!globalThis.__novaAxisWhatsAppStore) {
    globalThis.__novaAxisWhatsAppStore = createStore();
  }

  return globalThis.__novaAxisWhatsAppStore;
}

function conversationIdFromPhone(phone: string) {
  return `conv_${phone.replace(/\D/g, '')}`;
}

export function ensureConversation(phone: string, name?: string) {
  const store = getStore();
  const existingConversationId = store.conversationIdByPhone.get(phone);

  if (existingConversationId) {
    const existingConversation = store.conversations.get(existingConversationId);
    if (existingConversation && name && existingConversation.name !== name) {
      existingConversation.name = name;
      store.conversations.set(existingConversation.id, existingConversation);
    }
    return existingConversationId;
  }

  const id = conversationIdFromPhone(phone);
  const newConversation: WhatsAppConversationSummary = {
    id,
    phone,
    name: name || phone,
    lastMessagePreview: 'No messages yet',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  };

  store.conversations.set(id, newConversation);
  store.conversationIdByPhone.set(phone, id);
  store.messagesByConversation.set(id, []);

  return id;
}

interface AppendMessageInput {
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
}

export function appendMessage(input: AppendMessageInput): WhatsAppStoredMessage {
  const store = getStore();
  const conversationId = ensureConversation(input.phone, input.name);
  const messages = store.messagesByConversation.get(conversationId) ?? [];
  const timestamp = input.timestamp ?? new Date().toISOString();

  const message: WhatsAppStoredMessage = {
    id: crypto.randomUUID(),
    conversationId,
    phone: input.phone,
    direction: input.direction,
    type: input.type,
    text: input.text,
    status: input.status,
    mediaId: input.mediaId,
    mimeType: input.mimeType,
    fileName: input.fileName,
    externalMessageId: input.externalMessageId,
    timestamp,
    error: input.error,
  };

  messages.push(message);
  store.messagesByConversation.set(conversationId, messages);

  if (input.externalMessageId) {
    store.messageLocatorByExternalId.set(input.externalMessageId, {
      conversationId,
      messageId: message.id,
    });
  }

  const conversation = store.conversations.get(conversationId);
  if (conversation) {
    conversation.lastMessagePreview = input.text;
    conversation.lastMessageAt = timestamp;
    if (input.direction === 'inbound') {
      conversation.unreadCount += 1;
    }
    if (input.name) {
      conversation.name = input.name;
    }
    store.conversations.set(conversationId, conversation);
  }

  return message;
}

export function listConversations() {
  const store = getStore();
  return [...store.conversations.values()].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export function getConversationById(conversationId: string) {
  const store = getStore();
  return store.conversations.get(conversationId) ?? null;
}

export function getMessagesByConversation(conversationId: string) {
  const store = getStore();
  const messages = store.messagesByConversation.get(conversationId) ?? [];
  return [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function markConversationRead(conversationId: string) {
  const store = getStore();
  const conversation = store.conversations.get(conversationId);
  if (!conversation) {
    return null;
  }

  conversation.unreadCount = 0;
  store.conversations.set(conversationId, conversation);
  return conversation;
}

export function markMessageStatusByExternalId(
  externalMessageId: string,
  status: WhatsAppMessageStatus,
  error?: string,
) {
  const store = getStore();
  const locator = store.messageLocatorByExternalId.get(externalMessageId);
  if (!locator) {
    return null;
  }

  const messages = store.messagesByConversation.get(locator.conversationId);
  if (!messages) {
    return null;
  }

  const index = messages.findIndex((message) => message.id === locator.messageId);
  if (index === -1) {
    return null;
  }

  const existing = messages[index];
  const updated: WhatsAppStoredMessage = {
    ...existing,
    status,
    error,
  };

  messages[index] = updated;
  store.messagesByConversation.set(locator.conversationId, messages);

  return updated;
}

export function storeInboundMessage(extracted: {
  phone: string;
  name?: string;
  externalMessageId?: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text: string;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
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
  });
}

export function storeStatusUpdate(extracted: {
  externalMessageId: string;
  timestamp: string;
  status: WhatsAppMessageStatus;
  error?: string;
}) {
  return markMessageStatusByExternalId(extracted.externalMessageId, extracted.status, extracted.error);
}

