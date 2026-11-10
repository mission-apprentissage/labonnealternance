"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { getModerationQueueNeighbors } from "@/utils/api"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import type { IModerationUserType } from "./moderation.types"
import type { IModerationQueueState } from "./moderation-queue-state"
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

/** Offres voisines dans la file, avec les filtres et le tri laissés sur la liste (#5868). */
export function ModerationJobNavigation({ jobId, userType }: { jobId: string; userType: IModerationUserType }) {
  const [queueState, setQueueState] = useState<IModerationQueueState | null | undefined>(undefined)
  useEffect(() => {
    setQueueState(readModerationQueueState(userType))
  }, [userType])

  const filters = queueState ? toModerationQueueQuery(queueState) : {}
  const { data } = useQuery({
    queryKey: ["moderation-neighbors", jobId, filters],
    queryFn: () => getModerationQueueNeighbors(jobId, filters),
    enabled: queueState !== undefined,
    retry: false,
  })

  return <ModerationJobNavigationLinks previous={data?.previous ?? null} next={data?.next ?? null} userType={userType} />
}
