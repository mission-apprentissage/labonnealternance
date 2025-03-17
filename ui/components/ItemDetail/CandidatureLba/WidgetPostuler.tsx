import { Flex, Spinner } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { assertUnreachable } from "shared"
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

    try {
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
      setCaller(parameters.caller)
      setItem(item)
    } catch (err) {
      setHasError(err.message)
    }

    setIsLoading(false)
  }

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(null)
  const [item, setItem] = useState(null)
  const [caller, setCaller] = useState(null)

  return hasError ? (
    <WidgetPostulerError hasError={hasError} />
  ) : isLoading ? (
    <Flex alignItems="center" m="auto" width="250px" my={8}>
      <Spinner mr={4} />
      Veuillez patienter
    </Flex>
  ) : (
    <WidgetCandidatureLba item={item} caller={caller} />
  )
}

export default WidgetPostuler
