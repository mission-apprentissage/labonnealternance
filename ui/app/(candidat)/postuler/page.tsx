"use client"
import { Flex, Spinner } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import WidgetCandidatureLba from "@/components/ItemDetail/CandidatureLba/WidgetCandidatureLba"
import { WidgetPostulerError } from "@/components/ItemDetail/CandidatureLba/WidgetPostulerError"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import fetchPartnerJobDetails from "@/services/fetchPartnerJobDetails"

export default function WidgetPostuler() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type")
  const itemId = searchParams.get("itemId")
  const caller = searchParams.get("caller")

  const fetchPostulerItem = (parameters) => {
    switch (parameters.type) {
      case LBA_ITEM_TYPE_OLD.MATCHA: // To remove when 1J1S switched to V2
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
        return fetchLbaJobDetails({ id: parameters.itemId })
      }
      case LBA_ITEM_TYPE_OLD.LBA: // To remove when 1J1S switched to V2
      case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
        return fetchLbaCompanyDetails({ id: parameters.itemId })
      }
      case LBA_ITEM_TYPE_OLD.PARTNER_JOB: // To remove when 1J1S switched to V2
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
      <Flex alignItems="center" m="auto" width="250px" my={8}>
        <Spinner mr={4} />
        Veuillez patienter
      </Flex>
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
