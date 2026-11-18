import { publicConfig } from "@/config.public"

/**
 * Base de l'API pour les appels faits par le serveur Next (rendu, BFF). LBA_INTERNAL_API_URL vise
 * http://server:5000/api sur le réseau docker en production, recette et pentest ; à défaut (local,
 * previews), l'URL publique, qui passe par nginx depuis une IP privée.
 */
export function getServerApiEndpoint(): string {
  const endpoint = process.env.LBA_INTERNAL_API_URL || publicConfig.apiEndpoint
  return endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint
}
