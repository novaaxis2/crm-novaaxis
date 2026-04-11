import { normalizeToE164 } from './phone';

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  apiVersion: string;
  appSecret: string;
}

const REQUIRED_ENV = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'META_APP_SECRET',
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV)[number];

function readEnv(name: string) {
  return process.env[name]?.trim() ?? '';
}

export function getWhatsAppMissingConfig() {
  return REQUIRED_ENV.filter((key) => !readEnv(key));
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const missing = getWhatsAppMissingConfig();
  if (missing.length > 0) {
    throw new Error(`Missing WhatsApp environment variables: ${missing.join(', ')}`);
  }

  return {
    accessToken: readEnv('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: readEnv('WHATSAPP_PHONE_NUMBER_ID'),
    verifyToken: readEnv('WHATSAPP_VERIFY_TOKEN'),
    apiVersion: readEnv('WHATSAPP_API_VERSION') || 'v23.0',
    appSecret: readEnv('META_APP_SECRET'),
  };
}

export function getWhatsAppOperationalStatus() {
  const missing = getWhatsAppMissingConfig();
  return {
    configured: missing.length === 0,
    missing,
  };
}

export function isEnvReadyForSending() {
  const needed: RequiredEnvKey[] = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
  ];

  const missing = needed.filter((key) => !readEnv(key));
  return {
    ready: missing.length === 0,
    missing,
  };
}

function normalizeDefaultTargetNumber(raw: string) {
  const sanitized = raw.trim().replace(/[^\d+]/g, '');
  if (!sanitized) {
    return null;
  }

  if (sanitized.startsWith('+')) {
    return normalizeToE164(sanitized);
  }

  if (sanitized.startsWith('977')) {
    return normalizeToE164(`+${sanitized}`);
  }

  if (sanitized.startsWith('0') && sanitized.length >= 10) {
    return normalizeToE164(`+977${sanitized.slice(1)}`);
  }

  if (sanitized.startsWith('9') && sanitized.length >= 10) {
    return normalizeToE164(`+977${sanitized}`);
  }

  return normalizeToE164(`+${sanitized}`);
}

export function getWhatsAppDefaultTargetNumber() {
  const raw = readEnv('WHATSAPP_DEFAULT_TARGET_NUMBER');
  if (!raw) {
    return null;
  }

  try {
    return normalizeDefaultTargetNumber(raw);
  } catch {
    return null;
  }
}

