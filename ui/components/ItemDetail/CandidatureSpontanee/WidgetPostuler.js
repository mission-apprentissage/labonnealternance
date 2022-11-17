import React, { useEffect, useState } from "react"
import axios from "axios"
import { initPostulerParametersFromQuery } from "services/config"
import WidgetPostulerError from "./WidgetPostulerError"
import { matchaApi, companyApi } from "components/SearchForTrainingsAndJobs/services/utils"
import WidgetCandidatureSpontanee from "./WidgetCandidatureSpontanee"
import { Spinner } from "reactstrap"

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
      case "matcha": {
        const response = await axios.get(matchaApi + "/" + parameters.itemId)
        if (!response?.data?.message) {
          item = response.data.matchas[0]
        }

        break
      }

      default: {
        const response = await axios.get(`${companyApi}/${parameters.itemId}?type=${parameters.type}`)
        if (!response?.data?.message) {
          let companies = parameters.type === "lbb" ? response.data.lbbCompanies : response.data.lbaCompanies
          item = companies[0]
        }

        break
      }
    }

    if (item) {
      if (!item?.contact?.email || !item?.contact?.iv) {
        setHasError("missing_email")
      } else {
        setCaller(parameters.caller)
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
  const [caller, setCaller] = useState(null)

  return hasError ? (
    <WidgetPostulerError hasError={hasError} />
  ) : isLoading ? (
    <div className="text-center my-2">
      <Spinner className="mb-3" />
      Veuillez patienter
    </div>
  ) : (
    <WidgetCandidatureSpontanee item={item} caller={caller} />
  )
}

export default WidgetPostuler
