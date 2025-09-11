"use client"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson, JobCollectionName } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import WidgetCandidatureLba from "@/components/ItemDetail/CandidatureLba/WidgetCandidatureLba"
import { WidgetPostulerError } from "@/components/ItemDetail/CandidatureLba/WidgetPostulerError"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
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

  const fetchPostulerItem = (parameters) => {
    switch (parameters.type) {
      case JobCollectionName.recruiters:
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
        return fetchLbaJobDetails({ id: parameters.itemId })
      }
      case JobCollectionName.recruteur:
      case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
        return fetchLbaCompanyDetails({ id: parameters.itemId })
      }
      case JobCollectionName.partners:
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
        return fetchPartnerJobDetails({ id: parameters.itemId })
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
    queryFn: () => fetchPostulerItem({ type, itemId, caller }),
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
        <CircularProgress sx={{ mr: 4 }} />
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
