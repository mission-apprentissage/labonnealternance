"use client"

import { useParams } from "next/navigation"

/**
 * Paramètres des pages de candidatures, lus côté client comme sur les autres pages de l'espace pro : une page qui
 * attend `params` hors `<Suspense>` bloque la navigation (cacheComponents). L'offre s'appelle `job_id` côté entreprise
 * et `jobId` côté CFA, dont les pages portent aussi l'entreprise gérée (`establishment_id`).
 */
export const useApplicationRouteParams = () => {
  const { job_id, jobId, establishment_id, application_id, intention } = useParams<{
    job_id?: string
    jobId?: string
    establishment_id?: string
    application_id?: string
    intention?: string
  }>()
  return { job_id: job_id ?? jobId ?? "", cfaEstablishmentId: establishment_id, application_id: application_id ?? "", intention: intention ?? "" }
}
