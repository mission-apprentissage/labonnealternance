import { useContext, useEffect } from "react"

import { DisplayContext } from "@/context/DisplayContextProvider"
import { ScopeContext } from "@/context/ScopeContext"
import { SearchResultContext } from "@/context/SearchResultContextProvider"
import { setCurrentSearch } from "@/utils/currentPage"
import { flyToCenter } from "@/utils/mapTools"

import { ParameterContext } from "../../context/ParameterContextProvider"
import { fetchAddressFromCoordinates } from "../../services/baseAdresse"
import { logError } from "../../utils/tools"

const InitWidgetSearchParameters = ({ setShouldShowWelcomeMessage, setSearchRadius, searchForJobs, searchForTrainings }) => {
  const { widgetParameters, setWidgetParameters } = useContext(ParameterContext)
  const searchResultContext = useContext(SearchResultContext)
  const { setIsFormVisible, setFormValues } = useContext(DisplayContext)
  const scopeContext = useContext(ScopeContext)

  const { setExtendedSearch } = searchResultContext

  useEffect(() => {
    // @ts-expect-error: TODO
    if (widgetParameters && widgetParameters.applyWidgetParameters) {
      // launchWidget only
      if (!searchResultContext.hasSearch) {
        launchWidgetSearch()
      }
      setWidgetParameters({ ...widgetParameters, applyWidgetParameters: false }) // action one shot
    }
  })

  const launchWidgetSearch = async () => {
    console.log("launchWidgetSearch")

    // @ts-expect-error: TODO
    const p = widgetParameters.parameters
    try {
      let formValues: any = null
      // @ts-expect-error: TODO
      if (widgetParameters.applyFormValues) {
        // @ts-expect-error: TODO
        formValues = widgetParameters.formValues
      } else {
        formValues = {
          job: {
            romes: p.romes ? p.romes.split(",") : "",
            rncp: p.rncp || "",
          },
          radius: p.radius || 30,
          diploma: p.diploma || "",
        }

        if (p.lon || p.lat) {
          // récupération du code insee depuis la base d'adresse
          const addresses = await fetchAddressFromCoordinates([p.lon, p.lat])

          if (addresses.length) {
            formValues = {
              ...formValues,
              location: {
                value: {
                  type: "Point",
                  coordinates: [p.lon, p.lat],
                },
                insee: addresses[0].insee,
              },
              ...addresses[0],
            }
          }
        }
      }

      const searchTimestamp = new Date().getTime()
      setShouldShowWelcomeMessage(false)
      setSearchRadius(formValues.radius || 30)
      setExtendedSearch(false)
      flyToCenter(formValues)
      setFormValues({ ...formValues })
      if (scopeContext.isTraining) {
        searchForTrainings({ values: formValues, searchTimestamp })
      }
      if (scopeContext.isJob) {
        searchForJobs({ values: formValues, searchTimestamp })
      }

      setIsFormVisible(false)
      setCurrentSearch(searchTimestamp)
    } catch (err) {
      logError("WidgetSearch error", err)
    }
  }

  return ""
}

export default InitWidgetSearchParameters
