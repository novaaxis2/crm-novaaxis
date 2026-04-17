'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Plus,
  Search,
  Send,
  Video,
  X,
} from 'lucide-react';

import type { WhatsAppConversationSummary, WhatsAppStoredMessage } from '@/lib/whatsapp/types';

function WhatsAppIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

interface StatusResponse {
  configured: boolean;
  missing: string[];
  defaultTarget?: string | null;
}

interface ConversationsResponse {
  conversations: WhatsAppConversationSummary[];
}

interface ConversationMessagesResponse {
  messages: WhatsAppStoredMessage[];
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
}

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizePhoneClient(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Phone number is required.');
  }

  const withPlusPrefix = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  const sanitized = withPlusPrefix.replace(/[^\d+]/g, '');
  const normalized = sanitized.startsWith('+') ? sanitized : `+${sanitized}`;

  if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
    throw new Error('Use valid E.164 format, e.g. +97798XXXXXXXX.');
  }

  return normalized;
}

const MAX_UPLOAD_SIZE = 64 * 1024 * 1024;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function getMessageTypeLabel(message: WhatsAppStoredMessage) {
  if (message.type === 'image') return 'Image';
  if (message.type === 'document') return message.fileName || 'Document';
  if (message.type === 'audio') return 'Audio';
  if (message.type === 'video') return 'Video';
  if (message.type === 'sticker') return 'Sticker';
  if (message.type === 'contacts') return 'Contact';
  if (message.type === 'location') return 'Location';
  return 'Message';
}

function imageUrlFromMessage(message: WhatsAppStoredMessage) {
  if (message.type !== 'image') {
    return null;
  }

  if (typeof message.mediaUrl === 'string' && message.mediaUrl.trim()) {
    return message.mediaUrl;
  }

  const metadata = message.metadata as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    metadata?.imageUrl,
    metadata?.url,
    metadata?.mediaUrl,
    (metadata?.image as Record<string, unknown> | undefined)?.url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');
  const [activePhone, setActivePhone] = useState('');
  const [defaultTargetNumber, setDefaultTargetNumber] = useState<string | null>(null);

  const [conversations, setConversations] = useState<WhatsAppConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppStoredMessage[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileKind, setSelectedFileKind] = useState<'image' | 'document' | 'audio' | 'video' | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);

  const [statusConfigured, setStatusConfigured] = useState(false);
  const [missingConfig, setMissingConfig] = useState<string[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const selectedConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      return (
        conversation.name.toLowerCase().includes(query)
        || conversation.phone.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery]);

  const unreadTotal = useMemo(() => {
    return conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  }, [conversations]);

  const targetPhone = selectedConversation?.phone || activePhone;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load status.');
      }

      const data = (await response.json()) as StatusResponse;
      setStatusConfigured(Boolean(data.configured));
      setMissingConfig(Array.isArray(data.missing) ? data.missing : []);
      setDefaultTargetNumber(typeof data.defaultTarget === 'string' ? data.defaultTarget : null);

      if (!activePhone && data.defaultTarget) {
        setActivePhone(data.defaultTarget);
      }
    } catch {
      setStatusConfigured(false);
      setMissingConfig(['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN', 'META_APP_SECRET']);
      setDefaultTargetNumber(null);
    }
  };

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/whatsapp/conversations', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load conversations.');
      }

      const data = (await response.json()) as ConversationsResponse;
      const nextConversations = Array.isArray(data.conversations) ? data.conversations : [];
      setConversations(nextConversations);

      setSelectedConversationId((currentId) => {
        if (!currentId) {
          return currentId;
        }

        const stillExists = nextConversations.some((conversation) => conversation.id === currentId);
        return stillExists ? currentId : null;
      });

      return nextConversations;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load conversations.';
      setError(message);
      return [] as WhatsAppConversationSummary[];
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}/messages`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load messages.');
      }

      const data = (await response.json()) as ConversationMessagesResponse;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load messages.';
      setError(message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadStatus();
    void loadConversations();

    const poll = window.setInterval(() => {
      void loadConversations();
      if (selectedConversationId && view === 'chat') {
        void loadMessages(selectedConversationId);
      }
    }, 7000);

    return () => {
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedConversationId, view]);

  useEffect(() => {
    if (!isOpen || !selectedConversationId || view !== 'chat') {
      return;
    }

    void loadMessages(selectedConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedConversationId, view]);

  const clearSelectedFile = () => {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedFile(null);
    setSelectedFileKind(null);
    setSelectedImagePreviewUrl(null);
  };

  const handleSelectConversation = async (conversation: WhatsAppConversationSummary) => {
    setError(null);
    setSelectedConversationId(conversation.id);
    setActivePhone(conversation.phone);
    setView('chat');
    await loadMessages(conversation.id);
  };

  const handleOpenNewChat = () => {
    setError(null);

    let normalized = '';
    try {
      normalized = normalizePhoneClient(newChatPhone);
    } catch (phoneError) {
      const message = phoneError instanceof Error ? phoneError.message : 'Invalid phone number.';
      setError(message);
      return;
    }

    setSelectedConversationId(null);
    setMessages([]);
    setActivePhone(normalized);
    setView('chat');
  };

  const handleAttachmentFile = (kind: 'image' | 'document' | 'audio' | 'video', file: File | null) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      setError('File too large. Maximum supported size is 64MB.');
      return;
    }

    if (kind === 'image' && !file.type.startsWith('image/')) {
      setError('Only image files are allowed for image attachment.');
      return;
    }

    if (kind === 'document' && file.type !== 'application/pdf') {
      setError('Only PDF is allowed for document attachment in this phase.');
      return;
    }

    if (kind === 'audio' && !file.type.startsWith('audio/')) {
      setError('Only audio files are allowed for audio attachment.');
      return;
    }

    if (kind === 'video' && !file.type.startsWith('video/')) {
      setError('Only video files are allowed for video attachment.');
      return;
    }

    setError(null);

    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedFile(file);
    setSelectedFileKind(kind);

    if (kind === 'image') {
      setSelectedImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedImagePreviewUrl(null);
    }
  };

  const handleSendMessage = async () => {
    setError(null);

    if (!statusConfigured) {
      setError('WhatsApp API is not configured yet. Add required environment variables first.');
      return;
    }

    if (!inputValue.trim() && !selectedFile) {
      return;
    }

    let to = '';
    try {
      to = normalizePhoneClient(targetPhone);
    } catch (phoneError) {
      const message = phoneError instanceof Error ? phoneError.message : 'Invalid target phone.';
      setError(message);
      return;
    }

    setIsSending(true);

    try {
      let payload: Record<string, unknown>;

      if (selectedFile && selectedFileKind) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('phone', to);

        const uploadResponse = await fetch('/api/whatsapp/media', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = (await uploadResponse.json()) as {
          mediaId?: string;
          error?: string;
          s3Key?: string;
          s3Bucket?: string;
          mimeType?: string;
          size?: number;
        };
        if (!uploadResponse.ok || !uploadResult.mediaId) {
          throw new Error(uploadResult.error || 'Media upload failed.');
        }

        if (selectedFileKind === 'image') {
          payload = {
            to,
            type: 'image',
            mediaId: uploadResult.mediaId,
            caption: inputValue.trim() || undefined,
            s3Key: uploadResult.s3Key,
            s3Bucket: uploadResult.s3Bucket,
            mimeType: uploadResult.mimeType,
            fileSizeBytes: uploadResult.size,
          };
        } else if (selectedFileKind === 'document') {
          payload = {
            to,
            type: 'document',
            mediaId: uploadResult.mediaId,
            caption: inputValue.trim() || undefined,
            fileName: selectedFile.name,
            s3Key: uploadResult.s3Key,
            s3Bucket: uploadResult.s3Bucket,
            mimeType: uploadResult.mimeType,
            fileSizeBytes: uploadResult.size,
          };
        } else if (selectedFileKind === 'audio') {
          payload = {
            to,
            type: 'audio',
            mediaId: uploadResult.mediaId,
            fileName: selectedFile.name,
            s3Key: uploadResult.s3Key,
            s3Bucket: uploadResult.s3Bucket,
            mimeType: uploadResult.mimeType,
            fileSizeBytes: uploadResult.size,
          };
        } else {
          payload = {
            to,
            type: 'video',
            mediaId: uploadResult.mediaId,
            caption: inputValue.trim() || undefined,
            fileName: selectedFile.name,
            s3Key: uploadResult.s3Key,
            s3Bucket: uploadResult.s3Bucket,
            mimeType: uploadResult.mimeType,
            fileSizeBytes: uploadResult.size,
          };
        }
      } else {
        payload = {
          to,
          type: 'text',
          text: inputValue.trim(),
        };
      }

      const sendResponse = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const sendResult = (await sendResponse.json()) as {
        error?: string;
      };

      if (!sendResponse.ok) {
        throw new Error(sendResult.error || 'Failed to send message.');
      }

      setInputValue('');
      clearSelectedFile();

      const refreshedConversations = await loadConversations();
      const createdOrUpdatedConversation = refreshedConversations.find((conversation) => conversation.phone === to);

      if (createdOrUpdatedConversation) {
        setSelectedConversationId(createdOrUpdatedConversation.id);
        setActivePhone(createdOrUpdatedConversation.phone);
        setView('chat');
        await loadMessages(createdOrUpdatedConversation.id);
      }
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Failed to send WhatsApp message.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setView('list');
          setError(null);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-green-600 hover:shadow-xl"
        title="Open WhatsApp Chat"
      >
        <div className="relative">
          <WhatsAppIcon className="h-6 w-6" />
          {unreadTotal > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[620px] w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <div>
          <h3 className="text-base font-semibold">WhatsApp</h3>
          <p className="text-xs text-green-100">Cloud API Connected Chat</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-2 transition hover:bg-green-700/50"
          title="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {!statusConfigured && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">WhatsApp is not configured yet.</p>
              {missingConfig.length > 0 && (
                <p className="mt-1 break-words">Missing: {missingConfig.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
      )}

      <div className="flex-1 overflow-hidden bg-gray-50">
        {view === 'list' ? (
          <div className="flex h-full flex-col">
            <div className="space-y-3 border-b border-gray-200 bg-white p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or phone"
                  className="w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newChatPhone}
                  onChange={(event) => setNewChatPhone(event.target.value)}
                  placeholder={defaultTargetNumber ? `Start new chat (default: ${defaultTargetNumber})` : 'Start new chat: +977...'}
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleOpenNewChat}
                  className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600"
                >
                  Open
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading conversations...</span>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => void handleSelectConversation(conversation)}
                    className="flex w-full items-start gap-3 border-b border-gray-100 p-3 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                      {conversation.avatarUrl ? (
                        <img
                          src={conversation.avatarUrl}
                          alt={conversation.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-gray-600">
                          {getInitials(conversation.name)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold text-gray-900">{conversation.name}</h4>
                        <span className="text-xs text-gray-500">{formatRelativeTime(conversation.lastMessageAt)}</span>
                      </div>
                      <p className="truncate text-xs text-gray-500">{conversation.phone}</p>
                      <p className="truncate text-xs text-gray-700">{conversation.lastMessagePreview}</p>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <WhatsAppIcon className="mb-2 h-12 w-12 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="mt-1 text-xs">When users message your WhatsApp number, they appear here.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-gray-200 bg-white p-3">
              <button
                onClick={() => setView('list')}
                className="rounded-full p-2 transition hover:bg-gray-100"
                title="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>

              {selectedConversation && (
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {selectedConversation.avatarUrl ? (
                    <img
                      src={selectedConversation.avatarUrl}
                      alt={selectedConversation.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-600">
                      {getInitials(selectedConversation.name)}
                    </span>
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {selectedConversation?.name || 'New WhatsApp Chat'}
                </h3>
                {selectedConversation ? (
                  <p className="truncate text-xs text-gray-500">{selectedConversation.phone}</p>
                ) : (
                  <input
                    type="text"
                    value={activePhone}
                    onChange={(event) => setActivePhone(event.target.value)}
                    placeholder="Target phone +977..."
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => {
                  const isOutbound = message.direction === 'outbound';
                  const inboundDisplayName = selectedConversation?.name || message.phone;

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOutbound && (
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                          {selectedConversation?.avatarUrl ? (
                            <img
                              src={selectedConversation.avatarUrl}
                              alt={inboundDisplayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-semibold text-gray-600">
                              {getInitials(inboundDisplayName)}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2 ${
                          isOutbound
                            ? 'rounded-br-none bg-green-500 text-white'
                            : 'rounded-bl-none border border-gray-200 bg-white text-gray-900'
                        }`}
                      >
                        {message.type !== 'text' && (
                          <p className={`mb-1 flex items-center gap-1 text-xs ${isOutbound ? 'text-green-100' : 'text-gray-500'}`}>
                            {(message.type === 'image' || message.type === 'sticker') && <ImageIcon className="h-3.5 w-3.5" />}
                            {message.type === 'document' && <FileText className="h-3.5 w-3.5" />}
                            {message.type === 'audio' && <Mic className="h-3.5 w-3.5" />}
                            {message.type === 'video' && <Video className="h-3.5 w-3.5" />}
                            {getMessageTypeLabel(message)}
                          </p>
                        )}

                        <p className="break-words text-sm">{message.text}</p>

                        {message.type === 'image' && imageUrlFromMessage(message) && (
                          <a
                            href={imageUrlFromMessage(message) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block"
                          >
                            <img
                              src={imageUrlFromMessage(message) || ''}
                              alt="Image message"
                              className="max-h-64 w-auto rounded-xl border border-black/10 object-cover"
                            />
                          </a>
                        )}

                        {message.mediaUrl && (
                          <a
                            href={message.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-1 inline-flex text-xs underline ${isOutbound ? 'text-green-100' : 'text-blue-600'}`}
                          >
                            Open media
                          </a>
                        )}

                        <div className="mt-1 flex items-center justify-end gap-2">
                          <p className={`text-xs ${isOutbound ? 'text-green-100' : 'text-gray-500'}`}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                          {isOutbound && (
                            <p className="text-[10px] uppercase tracking-wide text-green-100">{message.status}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  <p className="text-sm">No messages yet. Send first message to start this chat.</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-2 border-t border-gray-200 bg-white p-3">
              {selectedFile && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                  {selectedFileKind === 'image' && selectedImagePreviewUrl ? (
                    <img
                      src={selectedImagePreviewUrl}
                      alt="Selected"
                      className="mb-2 max-h-36 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={clearSelectedFile}
                      className="rounded bg-red-500 px-2 py-1 text-white transition hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => {
                      if (selectedFile) {
                        clearSelectedFile();
                        return;
                      }

                      imageInputRef.current?.click();
                    }}
                    className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                    title="Attach image"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleAttachmentFile('image', file);
                      event.target.value = '';
                    }}
                  />

                  <input
                    ref={documentInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleAttachmentFile('document', file);
                      event.target.value = '';
                    }}
                  />

                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleAttachmentFile('audio', file);
                      event.target.value = '';
                    }}
                  />

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleAttachmentFile('video', file);
                      event.target.value = '';
                    }}
                  />
                </div>

                <button
                  onClick={() => documentInputRef.current?.click()}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                  title="Attach PDF"
                >
                  <FileText className="h-5 w-5" />
                </button>

                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                  title="Attach audio"
                >
                  <Mic className="h-5 w-5" />
                </button>

                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                  title="Attach video"
                >
                  <Video className="h-5 w-5" />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Type a message"
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  onClick={() => void handleSendMessage()}
                  disabled={isSending || (!inputValue.trim() && !selectedFile)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Send"
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

