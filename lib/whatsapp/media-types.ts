export const MEDIA_MIME_CANDIDATE_KEYS = [
  'mime_type',
  'mimeType',
  'mimetype',
  'content_type',
  'contentType',
] as const;

type Primitive = string | number | boolean | null | undefined;

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function firstString(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function readCandidateValue(obj: Record<string, unknown>, key: string): Primitive {
  const value = obj[key];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return value;
  }

  return undefined;
}

export function inferMimeTypeFromMetadata(metadata: unknown): string | undefined {
  const obj = asObject(metadata);
  if (!obj) {
    return undefined;
  }

  const directCandidates = MEDIA_MIME_CANDIDATE_KEYS.map((key) => readCandidateValue(obj, key));
  const nestedFields = ['image', 'document', 'audio', 'video', 'sticker']
    .map((field) => asObject(obj[field]))
    .filter(Boolean) as Record<string, unknown>[];

  const nestedCandidates = nestedFields.flatMap((nested) =>
    MEDIA_MIME_CANDIDATE_KEYS.map((key) => readCandidateValue(nested, key)),
  );

  return firstString([...directCandidates, ...nestedCandidates]);
}

export function inferFileNameFromMetadata(metadata: unknown): string | undefined {
  const obj = asObject(metadata);
  if (!obj) {
    return undefined;
  }

  const candidates: unknown[] = [
    obj.fileName,
    obj.filename,
    obj.file_name,
    asObject(obj.document)?.filename,
    asObject(obj.document)?.file_name,
  ];

  return firstString(candidates);
}

export function inferFileSizeFromMetadata(metadata: unknown): number | undefined {
  const obj = asObject(metadata);
  if (!obj) {
    return undefined;
  }

  const candidates: unknown[] = [
    obj.fileSizeBytes,
    obj.file_size_bytes,
    obj.fileSize,
    obj.size,
    asObject(obj.document)?.file_size,
    asObject(obj.document)?.size,
    asObject(obj.image)?.file_size,
    asObject(obj.video)?.file_size,
    asObject(obj.audio)?.file_size,
    asObject(obj.sticker)?.file_size,
  ];

  for (const candidate of candidates) {
    const numeric = typeof candidate === 'number' ? candidate : typeof candidate === 'string' ? Number(candidate) : NaN;
    if (Number.isFinite(numeric) && numeric >= 0) {
      return Math.floor(numeric);
    }
  }

  return undefined;
}

function guessMimeTypeFromExtension(fileName?: string): string | undefined {
  if (!fileName) {
    return undefined;
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.3gp')) return 'video/3gpp';
  return undefined;
}

export function normalizeMimeType(input?: string | null): string | undefined {
  if (!input) {
    return undefined;
  }

  const normalized = input.trim().toLowerCase();
  return normalized || undefined;
}

export function resolveMimeTypeFromMetadata(metadata: unknown) {
  const explicit = normalizeMimeType(inferMimeTypeFromMetadata(metadata));
  if (explicit) {
    return explicit;
  }

  const fileName = inferFileNameFromMetadata(metadata);
  return guessMimeTypeFromExtension(fileName);
}

export function safeJsonValue(input: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(input ?? {}));
  } catch {
    return {};
  }
}

