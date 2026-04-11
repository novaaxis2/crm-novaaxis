import { NextRequest, NextResponse } from 'next/server';

import { sendWhatsAppMessage } from '@/lib/whatsapp/cloud-api';
import { getWhatsAppDefaultTargetNumber, isEnvReadyForSending } from '@/lib/whatsapp/env';
import { normalizeToE164 } from '@/lib/whatsapp/phone';
import { appendMessage } from '@/lib/whatsapp/store';
import type { OutboundSendMessageInput } from '@/lib/whatsapp/types';

export async function POST(request: NextRequest) {
  const envStatus = isEnvReadyForSending();
  if (!envStatus.ready) {
    return NextResponse.json(
      {
        error: 'WhatsApp sending is not configured.',
        missing: envStatus.missing,
      },
      { status: 500 },
    );
  }

  let resolvedTo = '';

  try {
    const body = await request.json();
    const { to, type, text, mediaId, caption, fileName } = body;

    const defaultTarget = getWhatsAppDefaultTargetNumber();
    const toValue = String(to ?? defaultTarget ?? '').trim();

    if (!toValue || !type) {
      return NextResponse.json(
        {
          error: 'Missing required fields: type and to (or configure WHATSAPP_DEFAULT_TARGET_NUMBER)',
        },
        { status: 400 },
      );
    }

    resolvedTo = normalizeToE164(toValue);

    let input: OutboundSendMessageInput;

    if (type === 'text') {
      const trimmedText = String(text ?? '').trim();
      if (!trimmedText) {
        return NextResponse.json({ error: 'Missing text field for text message' }, { status: 400 });
      }
      input = { to: resolvedTo, type: 'text', text: trimmedText };
    } else if (type === 'image') {
      if (!mediaId) {
        return NextResponse.json({ error: 'Missing mediaId field for image message' }, { status: 400 });
      }
      input = {
        to: resolvedTo,
        type: 'image',
        mediaId: String(mediaId).trim(),
        ...(caption ? { caption: String(caption) } : {}),
      };
    } else if (type === 'document') {
      if (!mediaId) {
        return NextResponse.json({ error: 'Missing mediaId field for document message' }, { status: 400 });
      }
      input = {
        to: resolvedTo,
        type: 'document',
        mediaId: String(mediaId).trim(),
        ...(caption ? { caption: String(caption) } : {}),
        ...(fileName ? { fileName: String(fileName) } : {}),
      };
    } else {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    console.log(`📤 Sending ${type} message to ${resolvedTo}`);

    const result = await sendWhatsAppMessage(input);

    const previewText =
      input.type === 'text'
        ? input.text
        : input.type === 'image'
          ? input.caption?.trim() || '[Image]'
          : input.caption?.trim() || `[Document${input.fileName ? `: ${input.fileName}` : ''}]`;

    const storedMessage = appendMessage({
      phone: resolvedTo,
      direction: 'outbound',
      type: input.type,
      text: previewText,
      mediaId: input.type === 'text' ? undefined : input.mediaId,
      fileName: input.type === 'document' ? input.fileName : undefined,
      externalMessageId: result.messageId,
      status: 'sent',
    });

    console.log(`✓ Message sent successfully to ${resolvedTo}`, result);

    return NextResponse.json({
      ok: true,
      ...result,
      storedMessage,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Message send error:', errorMessage);

    if (resolvedTo) {
      appendMessage({
        phone: resolvedTo,
        direction: 'outbound',
        type: 'text',
        text: '[Failed message]',
        status: 'failed',
        error: errorMessage,
      });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST to send messages' },
    { status: 405 }
  );
}
