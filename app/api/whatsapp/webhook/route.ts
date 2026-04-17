import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp/env';
import { markWebhookAuditProcessed, saveWebhookEventAudit } from '@/lib/whatsapp/repository';
import {
  handleWebhookEvent,
  verifyWebhookSignature,
  type WhatsAppWebhookPayload,
} from '@/lib/whatsapp/webhook';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const challenge = searchParams.get('hub.challenge');
  const token = searchParams.get('hub.verify_token');

  try {
    const { verifyToken } = getWhatsAppConfig();

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('✓ Webhook verified successfully');
      return new NextResponse(challenge);
    }

    console.error('✗ Webhook verification failed: invalid token or mode');
    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('Webhook verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let parsedBody: WhatsAppWebhookPayload | null = null;
  let payloadHash: string | null = null;

  try {
    const { appSecret } = getWhatsAppConfig();
    const signatureHeader = request.headers.get('x-hub-signature-256');
    const rawBody = await request.text();

    try {
      parsedBody = JSON.parse(rawBody) as WhatsAppWebhookPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid webhook JSON payload' }, { status: 400 });
    }

    const isSignatureValid = verifyWebhookSignature({
      rawBody,
      signatureHeader,
      appSecret,
    });

    const audit = await saveWebhookEventAudit({
      rawBody,
      payload: parsedBody as Record<string, unknown>,
      signatureValid: isSignatureValid,
    });
    payloadHash = audit.payloadHash;

    if (!isSignatureValid) {
      console.error('✗ Webhook signature verification failed');
      await markWebhookAuditProcessed(payloadHash, 'Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    console.log('📨 Webhook event received:', JSON.stringify(parsedBody, null, 2));

    // Handle the incoming webhook event
    await handleWebhookEvent(parsedBody);

    await markWebhookAuditProcessed(payloadHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);

    if (payloadHash) {
      const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
      await markWebhookAuditProcessed(payloadHash, errorMessage);
    }

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
