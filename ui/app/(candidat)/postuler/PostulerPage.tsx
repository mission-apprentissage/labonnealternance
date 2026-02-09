"use client"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { JobCollectionName } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { fr } from "@codegouvfr/react-dsfr"
import WidgetCandidatureLba from "@/components/ItemDetail/CandidatureLba/WidgetCandidatureLba"
import { WidgetPostulerError } from "@/components/ItemDetail/CandidatureLba/WidgetPostulerError"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import fetchPartnerJobDetails from "@/services/fetchPartnerJobDetails"

export default function WidgetPostuler() {
  const searchParams = useSearchParams()
  let type = searchParams.get("type")
  let itemId = searchParams.get("itemId")
  const recipient_id = searchParams.get("recipient_id")
  if (recipient_id) {
    ;[type, itemId] = recipient_id.split("_")
  }
  const caller = searchParams.get("caller")

  const fetchPostulerItem = ({ type, itemId }: { type: string; itemId: string }) => {
    switch (type) {
      case JobCollectionName.recruiters:
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
        return fetchLbaJobDetails({ id: itemId })
      }
      case JobCollectionName.partners:
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
        return fetchPartnerJobDetails({ id: itemId })
      }
      default: {
        const error = new Error("unexpected_type")
        error.name = "unexpected_type"
        throw error
      }
    }
  }

  // @ts-ignore TODO
  const { isLoading, isFetching, isError, data, error }: { data: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson } = useQuery({
    queryKey: ["jobDetail"],
    queryFn: () => fetchPostulerItem({ type, itemId }),
    enabled: Boolean(type) && Boolean(itemId) && Boolean(caller),
    retry: false,
  })

  if (!type) {
    return <WidgetPostulerError error={"missing_type_parameter"} />
  }
  if (!caller) {
    return <WidgetPostulerError error={"missing_caller_parameter"} />
  }
  if (!itemId) {
    return <WidgetPostulerError error={"missing_item_id_parameter"} />
  }

  if (!isError && (isLoading || isFetching)) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", m: "auto", width: "250px", my: 8 }}>
        <CircularProgress sx={{ mr: fr.spacing("8v") }} />
        <Typography>Veuillez patienter</Typography>
      </Box>
    )
  }

  if (isError) {
    return <WidgetPostulerError error={error.name} />
  }

  if (data?.contact?.email === null) {
    return <WidgetPostulerError error={BusinessErrorCodes.INTERNAL_EMAIL} />
  }

  return <WidgetCandidatureLba item={data} caller={caller} />
}
