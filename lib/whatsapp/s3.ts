import { randomUUID } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getS3Config } from './persistence-env';

declare global {
  // eslint-disable-next-line no-var
  var __novaAxisWhatsAppS3Client: S3Client | undefined;
}

function getS3Client() {
  if (!globalThis.__novaAxisWhatsAppS3Client) {
    const config = getS3Config();
    globalThis.__novaAxisWhatsAppS3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return globalThis.__novaAxisWhatsAppS3Client;
}

function phoneToKeySegment(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits || 'unknown';
}

function safeFileNameSegment(fileName?: string) {
  if (!fileName) {
    return 'file';
  }

  const cleaned = fileName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');

  return cleaned || 'file';
}

function extensionFromMimeType(mimeType?: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    case 'audio/mpeg':
      return '.mp3';
    case 'audio/ogg':
      return '.ogg';
    case 'audio/aac':
      return '.aac';
    case 'audio/mp4':
      return '.m4a';
    case 'video/mp4':
      return '.mp4';
    case 'video/3gpp':
      return '.3gp';
    default:
      return '';
  }
}

function ensureExtension(fileName: string, mimeType?: string) {
  if (fileName.includes('.')) {
    return fileName;
  }

  const ext = extensionFromMimeType(mimeType);
  return `${fileName}${ext}`;
}

export function buildPhoneScopedMediaKey(options: {
  phone: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  fileName?: string;
  mimeType?: string;
  externalMediaId?: string;
  timestamp?: string;
}) {
  const { phone, direction, messageType, fileName, mimeType, externalMediaId, timestamp } = options;
  const date = timestamp ? new Date(timestamp) : new Date();

  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  const safeName = ensureExtension(safeFileNameSegment(fileName), mimeType);
  const mediaIdSegment = externalMediaId ? externalMediaId.replace(/[^a-zA-Z0-9_-]/g, '') : 'na';

  return `whatsapp/${phoneToKeySegment(phone)}/${direction}/${messageType}/${year}/${month}/${day}/${Date.now()}_${mediaIdSegment}_${randomUUID()}_${safeName}`;
}

export async function uploadBufferToS3(options: {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
}) {
  const { key, body, contentType } = options;
  const config = getS3Config();
  const s3 = getS3Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: undefined,
    }),
  );

  return {
    bucket: config.bucket,
    key,
  };
}

export async function getPresignedMediaUrl(key: string) {
  const config = getS3Config();
  const s3 = getS3Client();

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
    {
      expiresIn: config.presignTtlSeconds,
    },
  );

  return url;
}

