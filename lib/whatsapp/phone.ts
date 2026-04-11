const E164_REGEX = /^\+[1-9]\d{6,14}$/;

function sanitizePhoneInput(input: string) {
  const trimmed = input.trim();
  const withPlusPrefix = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  return withPlusPrefix.replace(/[^\d+]/g, '');
}

export function normalizeToE164(input: string) {
  const sanitized = sanitizePhoneInput(input);

  if (!sanitized) {
    throw new Error('Phone number is required.');
  }

  const normalized = sanitized.startsWith('+') ? sanitized : `+${sanitized}`;

  if (!E164_REGEX.test(normalized)) {
    throw new Error('Phone number must include country code in E.164 format (example: +97798XXXXXXX).');
  }

  return normalized;
}

export function normalizeWaIdToE164(waId: string) {
  const digits = waId.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Invalid WhatsApp wa_id.');
  }

  return normalizeToE164(`+${digits}`);
}

