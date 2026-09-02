export const SESSION_COOKIE_NAME = "lba_session"

// Paramètre de requête posé sur une redirection vers /espace-pro/authentification quand la session
// n'a pas pu être exploitée (panne API côté proxy, ou session illisible dans le layout connecté).
// Quand il est présent, le proxy UI affiche la page de connexion sans jamais renvoyer vers la
// page protégée, ce qui casse toute boucle de redirections (issue #5245, incident du 2026-09-02).
export const SESSION_RETRY_PARAM = "sessionRetry"

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
