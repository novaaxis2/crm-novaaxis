import { NextRequest, NextResponse } from 'next/server';

import { uploadWhatsAppMedia, assertSupportedUploadType } from '@/lib/whatsapp/cloud-api';
import { isEnvReadyForSending } from '@/lib/whatsapp/env';

const MAX_UPLOAD_SIZE_BYTES = 16 * 1024 * 1024;

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

  try {
    const formData = await request.formData();
    const filePart = formData.get('file');

    if (!(filePart instanceof File)) {
      return NextResponse.json(
        { error: 'Missing file in request' },
        { status: 400 }
      );
    }

    const file = filePart;

    if (!file.type) {
      return NextResponse.json(
        { error: 'File mime type is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum supported size is 16MB.' },
        { status: 413 }
      );
    }

    console.log(`📁 Uploading media: ${file.name} (${file.type})`);

    assertSupportedUploadType(file.type);
    const result = await uploadWhatsAppMedia(file);

    console.log(`✓ Media uploaded successfully:`, result);

    return NextResponse.json({
      ok: true,
      mediaId: result.id,
      id: result.id,
      mimeType: file.type,
      name: file.name,
      size: file.size,
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
