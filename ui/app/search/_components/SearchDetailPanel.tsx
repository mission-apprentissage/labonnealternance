"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Skeleton, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import type { ReactNode } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { ILbaItemFormation2Json, ILbaItemJobsGlobal } from "shared/models/lbaItem.model"

import { apiGet } from "@/utils/api.utils"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { FormationDetailPanel } from "./FormationDetailPanel"
import { JobDetailPanel } from "./JobDetailPanel"
import type { Hit } from "./SearchHitCard"

interface SearchDetailPanelProps {
  hit: Hit | null
  currentParams: ISearchPageParams
  /** Fourni en mobile : affiche le bouton « Retour ». */
  onBack?: () => void
}

/** Carte blanche arrondie DSFR posée sur le fond gris du panneau. */
function DetailCard({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <Box>
      {onBack && (
        <Box sx={{ mb: fr.spacing("2v") }}>
          <Button priority="tertiary no outline" size="small" iconId="fr-icon-arrow-left-line" onClick={onBack}>
            Retour
          </Button>
        </Box>
      )}
      <Box
        sx={{
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          boxShadow: "0 1px 6px rgba(0,0,18,0.08)",
          p: { xs: fr.spacing("5v"), lg: fr.spacing("8v") },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="rectangular" height={24} sx={{ mb: 2, borderRadius: "4px", width: "40%" }} />
      <Skeleton variant="rectangular" height={32} sx={{ mb: 1, borderRadius: "4px" }} />
      <Skeleton variant="rectangular" height={20} sx={{ mb: 3, borderRadius: "4px", width: "70%" }} />
      <Skeleton variant="rectangular" height={140} sx={{ borderRadius: "4px" }} />
    </Box>
  )
}

/** Placeholder affiché dans la carte de droite tant qu'aucune offre/formation n'est sélectionnée. */
function EmptyState() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: 280,
        gap: fr.spacing("6v"),
        py: fr.spacing("6v"),
      }}
    >
      <Image src="/images/dosearch.svg" width={269} height={216} alt="" aria-hidden="true" unoptimized style={{ maxWidth: "100%", height: "auto" }} />
      <Box>
        <Typography variant="h1">
          Trouvez votre{" "}
          <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
            alternance
          </Box>
        </Typography>
        <Typography className={fr.cx("fr-text--lead")} sx={{ maxWidth: 460, mx: "auto" }}>
          Sélectionnez une offre ou une formation dans la liste pour afficher le détail
        </Typography>
      </Box>
    </Box>
  )
}

export function SearchDetailPanel({ hit, currentParams, onBack }: SearchDetailPanelProps) {
  const isFormation = hit?.type === LBA_ITEM_TYPE.FORMATION

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hit-detail", hit?.type, hit?.sub_type, hit?.url_id],
    queryFn: () => {
      if (!hit) return null
      if (isFormation) {
        return apiGet("/_private/formations/:id", { params: { id: hit.url_id ?? "" } })
      }
      return apiGet("/_private/jobs/:source/:id", { params: { source: hit.sub_type as never, id: hit.url_id ?? "" } })
    },
    enabled: !!hit,
    staleTime: 5 * 60 * 1000,
  })

  if (!hit) {
    return (
      <DetailCard>
        <EmptyState />
      </DetailCard>
    )
  }

  if (isLoading) {
    return (
      <DetailCard onBack={onBack}>
        <DetailSkeleton />
      </DetailCard>
    )
  }

  if (isError || !data) {
    return (
      <DetailCard onBack={onBack}>
        <Alert severity="error" title="Erreur" description="Impossible de charger le détail de cette offre." />
      </DetailCard>
    )
  }

  return (
    <DetailCard onBack={onBack}>
      {isFormation ? (
        <FormationDetailPanel training={data as ILbaItemFormation2Json} currentParams={currentParams} />
      ) : (
        <JobDetailPanel job={data as ILbaItemJobsGlobal} currentParams={currentParams} />
      )}
    </DetailCard>
  )
}
