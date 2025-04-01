"use client"
import { Flex, Spinner } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import WidgetCandidatureLba from "@/components/ItemDetail/CandidatureLba/WidgetCandidatureLba"
import WidgetPostulerError from "@/components/ItemDetail/CandidatureLba/WidgetPostulerError"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"

export default function WidgetPostuler() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type")
  const itemId = searchParams.get("itemId")
  const caller = searchParams.get("caller")

  const fetchPostulerItem = (parameters) => {
    switch (parameters.type) {
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
        return fetchLbaJobDetails({ id: parameters.itemId })
      }
      case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
        return fetchLbaCompanyDetails({ id: parameters.itemId })
      }
    }
  }

  // @ts-ignore TODO
  const { isLoading, isFetching, isError, data } = useQuery({
    queryKey: ["jobDetail"],
    queryFn: () => fetchPostulerItem({ type, itemId, caller }),
    enabled: Boolean(type) && Boolean(itemId) && Boolean(caller),
  })

  if (!searchParams.has("type")) {
    return <WidgetPostulerError hasError={"missing_type_parameter"} />
  }
  if (!caller) {
    return <WidgetPostulerError hasError={"missing_caller_parameter"} />
  }
  if (!itemId) {
    return <WidgetPostulerError hasError={"missing_item_id_parameter"} />
  }

  if (isLoading || isFetching) {
    return (
      <Flex alignItems="center" m="auto" width="250px" my={8}>
        <Spinner mr={4} />
        Veuillez patienter
      </Flex>
    )
  }

  if (isError) {
    return <WidgetPostulerError hasError={""} />
  }

  return <WidgetCandidatureLba item={data} caller={caller} />
}
