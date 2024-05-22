import { assertUnreachable } from "@/../shared"
import { Flex, Spinner } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"

import { initPostulerParametersFromQuery } from "../../../services/config"

import WidgetCandidatureLba from "./WidgetCandidatureLba"
import WidgetPostulerError from "./WidgetPostulerError"

const WidgetPostuler = () => {
  useEffect(() => {
    try {
      const parameters = initPostulerParametersFromQuery()
      fetchPostulerItem(parameters)
    } catch (err) {
      setHasError(err.message)
    }
  }, [])

  const fetchPostulerItem = async (parameters) => {
    let item = null

    switch (parameters.type) {
      case LBA_ITEM_TYPE_OLD.MATCHA: {
        item = await fetchLbaJobDetails({ id: parameters.itemId })
        break
      }
      case LBA_ITEM_TYPE_OLD.LBA: {
        item = await fetchLbaCompanyDetails({ id: parameters.itemId })
        break
      }
      default: {
        assertUnreachable("shouldNotHappen" as never)
        break
      }
    }

    if (item) {
      if (!item?.contact?.email || !item?.contact?.iv) {
        setHasError("missing_email")
      } else {
        setItem(item)
      }
    } else {
      setHasError("item_not_found")
    }

    setIsLoading(false)
  }

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(null)
  const [item, setItem] = useState(null)

  return hasError ? (
    <WidgetPostulerError hasError={hasError} />
  ) : isLoading ? (
    <Flex alignItems="center" m="auto" width="250px" my={8}>
      <Spinner mr={4} />
      Veuillez patienter
    </Flex>
  ) : (
    <WidgetCandidatureLba item={item} />
  )
}

export default WidgetPostuler
