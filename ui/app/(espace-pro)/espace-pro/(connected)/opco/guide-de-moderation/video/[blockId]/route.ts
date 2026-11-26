import { AUTHTYPE } from "shared/constants/recruteur"
import { fetchOpcoGuideVideoUrl, forgetOpcoGuideVideoUrl } from "../../_lib/fetch-opco-guide"

const FORWARDED_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]

const isOpcoSession = (raw: string | null) => {
  try {
    return raw !== null && JSON.parse(raw)?.user?.type === AUTHTYPE.OPCO
  } catch {
    return false
  }
}

const fetchVideo = (url: string, request: Request) => {
  const range = request.headers.get("range")
  return fetch(url, { headers: range ? { range } : {}, cache: "no-store", signal: request.signal })
}

/**
 * Vidéo du guide, relayée depuis le stockage Notion : le lien Notion reste côté serveur (il ouvre le fichier
 * sans authentification pendant une heure) et la CSP n'a pas à autoriser un hôte tiers.
 * Les requêtes Range passent telles quelles pour l'avance rapide.
 */
export async function GET(request: Request, { params }: { params: Promise<{ blockId: string }> }) {
  // x-session est posé par le proxy, qui retire celui envoyé par le client.
  if (!isOpcoSession(request.headers.get("x-session"))) return new Response(null, { status: 403 })

  const { blockId } = await params
  let url = await fetchOpcoGuideVideoUrl(blockId)
  if (!url) return new Response(null, { status: 404 })

  let upstream = await fetchVideo(url, request)
  if (upstream.status === 403) {
    forgetOpcoGuideVideoUrl(blockId)
    url = await fetchOpcoGuideVideoUrl(blockId)
    if (!url) return new Response(null, { status: 404 })
    upstream = await fetchVideo(url, request)
  }
  if (!upstream.ok && upstream.status !== 416) return new Response(null, { status: 502 })

  const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff" })
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  return new Response(upstream.body, { status: upstream.status, headers })
}
