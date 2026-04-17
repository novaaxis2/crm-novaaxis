import { NextRequest, NextResponse } from 'next/server';

import { uploadWhatsAppMedia, assertSupportedUploadType } from '@/lib/whatsapp/cloud-api';
import { isEnvReadyForSending } from '@/lib/whatsapp/env';
import { normalizeToE164 } from '@/lib/whatsapp/phone';
import { getS3Config, getS3MissingConfig } from '@/lib/whatsapp/persistence-env';
import { buildPhoneScopedMediaKey, uploadBufferToS3 } from '@/lib/whatsapp/s3';

const MAX_UPLOAD_SIZE_BYTES = 64 * 1024 * 1024;

function mediaTypeFromMimeType(mimeType: string): 'image' | 'document' | 'audio' | 'video' | 'sticker' {
  if (mimeType.startsWith('image/')) {
    return mimeType === 'image/webp' ? 'sticker' : 'image';
  }

  if (mimeType === 'application/pdf') {
    return 'document';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return 'document';
}

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

  const s3Missing = getS3MissingConfig();
  if (s3Missing.length > 0) {
    return NextResponse.json(
      {
        error: 'S3 is not configured for media persistence.',
        missing: s3Missing,
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const filePart = formData.get('file');
    const phonePart = formData.get('phone');

    if (!(filePart instanceof File)) {
      return NextResponse.json(
        { error: 'Missing file in request' },
        { status: 400 }
      );
    }

    const phoneRaw = String(phonePart ?? '').trim();
    if (!phoneRaw) {
      return NextResponse.json(
        { error: 'Missing phone in request for per-user S3 storage.' },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizeToE164(phoneRaw);

    const file = filePart;

    if (!file.type) {
      return NextResponse.json(
        { error: 'File mime type is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum supported size is 64MB.' },
        { status: 413 }
      );
    }

    console.log(`📁 Uploading media: ${file.name} (${file.type})`);

    assertSupportedUploadType(file.type);
    const result = await uploadWhatsAppMedia(file);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const s3Config = getS3Config();
    const messageType = mediaTypeFromMimeType(file.type);
    const s3Key = buildPhoneScopedMediaKey({
      phone: normalizedPhone,
      direction: 'outbound',
      messageType,
      fileName: file.name,
      mimeType: file.type,
      externalMediaId: result.id,
    });

    const uploaded = await uploadBufferToS3({
      key: s3Key,
      body: fileBuffer,
      contentType: file.type,
    });

    console.log(`✓ Media uploaded successfully:`, result);

    return NextResponse.json({
      ok: true,
      mediaId: result.id,
      id: result.id,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      phone: normalizedPhone,
      s3Bucket: uploaded.bucket,
      s3Key: uploaded.key,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Media upload error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST to upload media' },
    { status: 405 }
  );
}
