"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { NeighborNavigationLinks } from "@/app/(espace-pro)/espace-pro/(connected)/_components/NeighborNavigationLinks"
import { getModerationQueueNeighbors } from "@/utils/api"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import type { IModerationUserType } from "./moderation.types"
import { readModerationQueueState, toModerationQueueQuery } from "./moderation-queue-state"

export const ModerationJobNavigationLinks = ({ previous, next, userType }: { previous: string | null; next: string | null; userType: IModerationUserType }) => {
  const toHref = (jobId: string | null) => (jobId ? MODERATION_PAGES.offre({ job_id: jobId, userType }).getPath() : null)
  return (
    <NeighborNavigationLinks
      ariaLabel="Navigation entre les offres de la file"
      previous={{ href: toHref(previous), label: "Offre précédente" }}
      next={{ href: toHref(next), label: "Offre suivante" }}
    />
  )
}

/**
 * Offres voisines dans la file, avec les filtres et le tri laissés sur la liste (#5868). L'état de la file est lu au
 * premier rendu client : le rendu serveur n'affiche rien, l'hydratation non plus tant que la réponse n'est pas là.
 * Sans réponse (chargement, erreur), rien n'est affiché : un bouton désactivé signifierait « bout de la file ».
 */
export function ModerationJobNavigation({ jobId, userType }: { jobId: string; userType: IModerationUserType }) {
  const [filters] = useState(() => {
    if (typeof window === "undefined") return undefined
    const queueState = readModerationQueueState(userType)
    return queueState ? toModerationQueueQuery(queueState) : {}
  })

  const { data } = useQuery({
    queryKey: ["moderation-neighbors", jobId, filters],
    queryFn: () => getModerationQueueNeighbors(jobId, filters ?? {}),
    enabled: filters !== undefined,
    retry: false,
  })

  if (!data) return null
  return <ModerationJobNavigationLinks previous={data.previous} next={data.next} userType={userType} />
}
