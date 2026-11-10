"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { getModerationQueueNeighbors } from "@/utils/api"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import type { IModerationUserType } from "./moderation.types"
import { readModerationQueueState, toModerationQueueQuery } from "./moderation-queue-state"

const ICONS = {
  previous: { iconId: "fr-icon-arrow-left-s-line", iconPosition: "left" },
  next: { iconId: "fr-icon-arrow-right-s-line", iconPosition: "right" },
} as const

type INeighborLinkProps = { jobId: string | null; userType: IModerationUserType; label: string; direction: keyof typeof ICONS }

// Un lien ne se désactive pas : sans offre voisine, un bouton désactivé prend sa place.
const NeighborLink = ({ jobId, userType, label, direction }: INeighborLinkProps) =>
  jobId ? (
    <Button priority="secondary" size="small" {...ICONS[direction]} linkProps={{ href: MODERATION_PAGES.offre({ job_id: jobId, userType }).getPath() }}>
      {label}
    </Button>
  ) : (
    <Button priority="secondary" size="small" {...ICONS[direction]} disabled>
      {label}
    </Button>
  )

export const ModerationJobNavigationLinks = ({ previous, next, userType }: { previous: string | null; next: string | null; userType: IModerationUserType }) => (
  <Box component="nav" aria-label="Navigation entre les offres de la file" sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
    <NeighborLink jobId={previous} userType={userType} label="Offre précédente" direction="previous" />
    <NeighborLink jobId={next} userType={userType} label="Offre suivante" direction="next" />
  </Box>
)

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
