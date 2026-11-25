import { captureException } from "@sentry/nextjs"
import { apiGet } from "@/utils/api.utils"

// Sans réponse de l'API, on renvoie undefined : le sitemap publie alors tous les secteurs plutôt que d'en retirer à tort.
export async function fetchSecteursIndexables(): Promise<string[] | undefined> {
  try {
    return await apiGet("/_private/seo/secteurs/indexables", {})
  } catch (error) {
    captureException(error)
    return undefined
  }
}
