export const SESSION_COOKIE_NAME = "lba_session"

// Attributs du cookie de session, partagés entre le serveur (@fastify/cookie) et le proxy UI
// (NextResponse.cookies) : les deux sérialisent maxAge en secondes (Max-Age, RFC 6265).
// L'expiration des sessions en base (expires_at) se dérive de cette même durée.
export const SESSION_COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 3600,
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: true,
} as const
