type MaybeString = string | undefined;

function readEnv(name: string): MaybeString {
  const value = process.env[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function firstPostgresUrl(raw: string) {
  const postgresIndex = raw.indexOf('postgres://');
  const postgresqlIndex = raw.indexOf('postgresql://');
  const firstStart = [postgresIndex, postgresqlIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (firstStart === undefined) {
    return raw;
  }

  const tail = raw.slice(firstStart);
  const nextPostgresIndex = tail.indexOf('postgres://', 1);
  const nextPostgresqlIndex = tail.indexOf('postgresql://', 1);
  const nextStart = [nextPostgresIndex, nextPostgresqlIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (nextStart === undefined) {
    return tail;
  }

  return tail.slice(0, nextStart);
}

function sanitizeDatabaseUrl(raw: string) {
  const compact = raw.replace(/\s+/g, '');
  return firstPostgresUrl(compact);
}

function buildFallbackDatabaseUrl() {
  const host = readEnv('PGHOST');
  const port = readEnv('PGPORT') ?? '5432';
  const user = readEnv('PGUSER');
  const password = readEnv('PGPASSWORD');
  const database = readEnv('PGDATABASE');

  if (!host || !user || !password || !database) {
    return undefined;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const encodedDatabase = encodeURIComponent(database);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDatabase}?sslmode=require`;
}

export function getResolvedDatabaseUrl() {
  const rawDatabaseUrl = readEnv('DATABASE_URL');
  if (rawDatabaseUrl) {
    return sanitizeDatabaseUrl(rawDatabaseUrl);
  }

  return buildFallbackDatabaseUrl();
}

export function getDatabasePoolMax() {
  const raw = readEnv('DATABASE_MAX_POOL_SIZE');
  if (!raw) {
    return 5;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 5;
  }

  return Math.floor(parsed);
}

export function getDatabaseMissingConfig() {
  const resolved = getResolvedDatabaseUrl();
  if (resolved) {
    return [] as string[];
  }

  return ['DATABASE_URL (or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE)'];
}

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  presignTtlSeconds: number;
}

export function getS3MissingConfig() {
  const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME'] as const;
  return required.filter((key) => !readEnv(key));
}

export function getS3Config(): S3Config {
  const missing = getS3MissingConfig();
  if (missing.length > 0) {
    throw new Error(`Missing S3 environment variables: ${missing.join(', ')}`);
  }

  const ttlRaw = readEnv('AWS_S3_PRESIGN_TTL_SECONDS');
  const parsedTtl = ttlRaw ? Number(ttlRaw) : 900;
  const presignTtlSeconds = Number.isFinite(parsedTtl) && parsedTtl > 0 ? Math.floor(parsedTtl) : 900;

  return {
    accessKeyId: readEnv('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: readEnv('AWS_SECRET_ACCESS_KEY')!,
    region: readEnv('AWS_REGION')!,
    bucket: readEnv('AWS_BUCKET_NAME')!,
    presignTtlSeconds,
  };
}

export function getPersistenceOperationalStatus() {
  const databaseMissing = getDatabaseMissingConfig();
  const s3Missing = getS3MissingConfig();

  return {
    databaseConfigured: databaseMissing.length === 0,
    databaseMissing,
    s3Configured: s3Missing.length === 0,
    s3Missing,
  };
}

