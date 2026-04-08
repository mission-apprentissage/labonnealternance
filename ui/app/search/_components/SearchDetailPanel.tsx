"use client"

import Alert from "@codegouvfr/react-dsfr/Alert"
import { Box, Skeleton } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
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
}

function DetailSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={24} sx={{ mb: 2, borderRadius: "4px", width: "60%" }} />
      <Skeleton variant="rectangular" height={32} sx={{ mb: 1, borderRadius: "4px" }} />
      <Skeleton variant="rectangular" height={20} sx={{ mb: 3, borderRadius: "4px", width: "75%" }} />
      <Skeleton variant="rectangular" height={120} sx={{ borderRadius: "4px" }} />
    </Box>
  )
}

function EmptyState() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        color: "#94A3B8",
        p: 4,
        textAlign: "center",
      }}
    >
      <Box component="span" sx={{ fontSize: "3rem" }}>
        📋
      </Box>
      <Box sx={{ fontSize: "1rem", fontWeight: 500 }}>Cliquez sur une offre pour voir le détail</Box>
    </Box>
  )
}

export function SearchDetailPanel({ hit, currentParams }: SearchDetailPanelProps) {
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
    return <EmptyState />
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (isError || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" title="Erreur" description="Impossible de charger le détail de cette offre." />
      </Box>
    )
  }

  if (isFormation) {
    return <FormationDetailPanel training={data as ILbaItemFormation2Json} currentParams={currentParams} />
  }

  return <JobDetailPanel job={data as ILbaItemJobsGlobal} currentParams={currentParams} />
}
