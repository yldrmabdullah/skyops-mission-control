/**
 * Managed Postgres (Render, etc.) often requires TLS; `pg` may need explicit ssl
 * when the URL does not carry `sslmode=require`.
 */
export function postgresSslForUrl(
  databaseUrl: string | undefined,
): { rejectUnauthorized: boolean } | undefined {
  if (!databaseUrl?.trim()) {
    return undefined;
  }
  const lower = databaseUrl.toLowerCase();
  if (
    lower.includes('render.com') ||
    lower.includes('sslmode=require') ||
    process.env.DATABASE_SSL === 'true'
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}
