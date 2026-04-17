import { NextRequest, NextResponse } from 'next/server';

import { sendWhatsAppMessage } from '@/lib/whatsapp/cloud-api';
import { getWhatsAppDefaultTargetNumber, isEnvReadyForSending } from '@/lib/whatsapp/env';
import { normalizeToE164 } from '@/lib/whatsapp/phone';
import { appendMessage, findMessageByExternalMessageId, upsertMediaObject } from '@/lib/whatsapp/repository';
import { getS3Config, getS3MissingConfig } from '@/lib/whatsapp/persistence-env';
import { buildPhoneScopedMediaKey, uploadBufferToS3 } from '@/lib/whatsapp/s3';
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
    const { to, type, text, mediaId, caption, fileName, s3Key, s3Bucket, mimeType, fileSizeBytes } = body;

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
    } else if (type === 'audio') {
      if (!mediaId) {
        return NextResponse.json({ error: 'Missing mediaId field for audio message' }, { status: 400 });
      }
      input = {
        to: resolvedTo,
        type: 'audio',
        mediaId: String(mediaId).trim(),
      };
    } else if (type === 'video') {
      if (!mediaId) {
        return NextResponse.json({ error: 'Missing mediaId field for video message' }, { status: 400 });
      }
      input = {
        to: resolvedTo,
        type: 'video',
        mediaId: String(mediaId).trim(),
        ...(caption ? { caption: String(caption) } : {}),
      };
    } else if (type === 'sticker') {
      if (!mediaId) {
        return NextResponse.json({ error: 'Missing mediaId field for sticker message' }, { status: 400 });
      }
      input = {
        to: resolvedTo,
        type: 'sticker',
        mediaId: String(mediaId).trim(),
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
          : input.type === 'document'
            ? input.caption?.trim() || `[Document${input.fileName ? `: ${input.fileName}` : ''}]`
            : input.type === 'audio'
              ? '[Audio]'
              : input.type === 'video'
                ? input.caption?.trim() || '[Video]'
                : '[Sticker]';

    const storedMessage = await appendMessage({
      phone: resolvedTo,
      direction: 'outbound',
      type: input.type,
      text: previewText,
      mediaId: input.type === 'text' ? undefined : input.mediaId,
      fileName: input.type === 'document' ? input.fileName : undefined,
      externalMessageId: result.messageId,
      status: 'sent',
      metadata: {
        rawResponse: result.rawResponse,
        outboundPayload: input,
        providedUploadMetadata: {
          s3Key,
          s3Bucket,
          mimeType,
          fileSizeBytes,
        },
      },
    });

    const s3Ready = getS3MissingConfig().length === 0;
    if (s3Ready && input.type !== 'text') {
      let persistedS3Key: string;
      let persistedS3Bucket: string;

      if (typeof s3Key === 'string' && s3Key.trim() && typeof s3Bucket === 'string' && s3Bucket.trim()) {
        persistedS3Key = s3Key.trim();
        persistedS3Bucket = s3Bucket.trim();
      } else {
        const generatedKey = buildPhoneScopedMediaKey({
          phone: resolvedTo,
          direction: 'outbound',
          messageType: input.type,
          fileName: input.type === 'document' ? input.fileName : undefined,
          externalMediaId: input.mediaId,
        });

        // Metadata-only mirror for outbound media ID to S3 namespace, without binary duplication.
        await uploadBufferToS3({
          key: `${generatedKey}.json`,
          body: Buffer.from(
            JSON.stringify(
              {
                messageId: storedMessage.id,
                externalMessageId: result.messageId,
                mediaId: input.mediaId,
                type: input.type,
                phone: resolvedTo,
                createdAt: new Date().toISOString(),
              },
              null,
              2,
            ),
            'utf-8',
          ),
          contentType: 'application/json',
        });

        persistedS3Key = `${generatedKey}.json`;
        persistedS3Bucket = getS3Config().bucket;
      }

      const latestStoredMessage = await findMessageByExternalMessageId(result.messageId);
      const messageId = latestStoredMessage?.id ?? storedMessage.id;

      await upsertMediaObject({
        messageId,
        phone: resolvedTo,
        direction: 'outbound',
        externalMediaId: input.mediaId,
        mimeType: typeof mimeType === 'string' ? mimeType : undefined,
        fileName: input.type === 'document' ? input.fileName : typeof fileName === 'string' ? fileName : undefined,
        fileSizeBytes: typeof fileSizeBytes === 'number' ? fileSizeBytes : undefined,
        s3Bucket: persistedS3Bucket,
        s3Key: persistedS3Key,
        metadata: {
          outboundReferenceOnly: persistedS3Key.endsWith('.json'),
        },
      });
    }

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
      await appendMessage({
        phone: resolvedTo,
        direction: 'outbound',
        type: 'text',
        text: '[Failed message]',
        status: 'failed',
        error: errorMessage,
        metadata: {
          failure: true,
        },
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
