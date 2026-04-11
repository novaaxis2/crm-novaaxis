import { getWhatsAppConfig } from './env';
import { normalizeToE164 } from './phone';
import type {
  OutboundSendMessageInput,
  WhatsAppMediaUploadResult,
  WhatsAppSendMessageResult,
} from './types';

interface GraphApiError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

async function parseErrorResponse(response: Response) {
  let details: GraphApiError | null = null;
  try {
    details = (await response.json()) as GraphApiError;
  } catch {
    details = null;
  }

  const code = details?.error?.code ? ` code=${details.error.code}` : '';
  const subcode = details?.error?.error_subcode ? ` subcode=${details.error.error_subcode}` : '';
  const trace = details?.error?.fbtrace_id ? ` trace=${details.error.fbtrace_id}` : '';
  const message = details?.error?.message || response.statusText || 'Unknown Graph API error';

  if (details?.error?.code === 190 && details?.error?.error_subcode === 463) {
    return 'WhatsApp access token has expired. Generate a new permanent token in Meta and update WHATSAPP_ACCESS_TOKEN.';
  }

  if (details?.error?.code === 190) {
    return 'WhatsApp access token is invalid. Regenerate token in Meta and update WHATSAPP_ACCESS_TOKEN.';
  }

  return `WhatsApp Cloud API request failed: ${response.status} ${message}${code}${subcode}${trace}`;
}

function getMessagesUrl() {
  const { apiVersion, phoneNumberId } = getWhatsAppConfig();
  return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
}

function getMediaUploadUrl() {
  const { apiVersion, phoneNumberId } = getWhatsAppConfig();
  return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`;
}

function getRequestHeaders() {
  const { accessToken } = getWhatsAppConfig();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function sendWhatsAppMessage(input: OutboundSendMessageInput): Promise<WhatsAppSendMessageResult> {
  const to = normalizeToE164(input.to);

  let payload: Record<string, unknown>;

  if (input.type === 'text') {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: input.text,
      },
    };
  } else if (input.type === 'image') {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: {
        id: input.mediaId,
        ...(input.caption ? { caption: input.caption } : {}),
      },
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        id: input.mediaId,
        ...(input.caption ? { caption: input.caption } : {}),
        ...(input.fileName ? { filename: input.fileName } : {}),
      },
    };
  }

  const response = await fetch(getMessagesUrl(), {
    method: 'POST',
    headers: {
      ...getRequestHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = (await response.json()) as {
    messages?: Array<{ id: string }>;
  };

  const messageId = data.messages?.[0]?.id;
  if (!messageId) {
    throw new Error('WhatsApp send response did not include a message id.');
  }

  return {
    messageId,
    rawResponse: data,
  };
}

const SUPPORTED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export function assertSupportedUploadType(mimeType: string) {
  if (!SUPPORTED_UPLOAD_TYPES.has(mimeType)) {
    throw new Error('Unsupported file type. Allowed: JPEG, JPG, PNG, WEBP, PDF.');
  }
}

export async function uploadWhatsAppMedia(file: File): Promise<WhatsAppMediaUploadResult> {
  assertSupportedUploadType(file.type);

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', file, file.name);

  const response = await fetch(getMediaUploadUrl(), {
    method: 'POST',
    headers: {
      ...getRequestHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = (await response.json()) as WhatsAppMediaUploadResult;
  if (!data.id) {
    throw new Error('WhatsApp media upload response did not include media id.');
  }

  return data;
}

