import { useRouter } from "next/router"
import { useContext, useEffect } from "react"

// import { DisplayContext } from "@/context/DisplayContextProvider"
import { ScopeContext } from "@/context/ScopeContext"
// import { SearchResultContext } from "@/context/SearchResultContextProvider"
// import { setCurrentSearch } from "@/utils/currentPage"
// import { flyToCenter } from "@/utils/mapTools"

import { ParameterContext } from "../../context/ParameterContextProvider"
import { fetchAddressFromCoordinates } from "../../services/baseAdresse"
import { logError } from "../../utils/tools"

const InitWidgetSearchParameters = ({ handleSearchSubmit, handleItemLoad /*setShouldShowWelcomeMessage, setSearchRadius, searchForJobs, searchForTrainings*/ }) => {
  const { displayMap, widgetParameters, itemParameters, setWidgetParameters, setItemParameters } = useContext(ParameterContext)
  const router = useRouter()

  // const { widgetParameters, setWidgetParameters } = useContext(ParameterContext)
  // const searchResultContext = useContext(SearchResultContext)
  // const { setIsFormVisible, setFormValues } = useContext(DisplayContext)
  const scopeContext = useContext(ScopeContext)

  // const { setExtendedSearch } = searchResultContext

  useEffect(() => {
    // initialisation par les query params
    // @ts-expect-error: TODO
    if (widgetParameters && widgetParameters.applyWidgetParameters && itemParameters && itemParameters.applyItemParameters) {
      // launchWidget AND item
      launchWidgetSearch({ selectItem: true })
      setWidgetParameters({ ...widgetParameters, applyWidgetParameters: false }) // action one shot
      setItemParameters({ ...itemParameters, applyItemParameters: false }) // action one shot
      // @ts-expect-error: TODO
    } else if (widgetParameters && widgetParameters.applyWidgetParameters) {
      // launchWidget only
      launchWidgetSearch({ selectItem: false })
      setWidgetParameters({ ...widgetParameters, applyWidgetParameters: false }) // action one shot
      // @ts-expect-error: TODO
    } else if (itemParameters && itemParameters.applyItemParameters) {
      // launchItem only
      launchItemFetch()
      setItemParameters({ ...itemParameters, applyItemParameters: false }) // action one shot
    }

    // // @ts-expect-error: TODO
    // if (widgetParameters && widgetParameters.applyWidgetParameters) {
    //   // launchWidget only
    //   if (!searchResultContext.hasSearch) {
    //     launchWidgetSearch()
    //   }
    //   setWidgetParameters({ ...widgetParameters, applyWidgetParameters: false }) // action one shot
    // }
  })

  const launchWidgetSearch = async ({ selectItem = false }) => {
    // @ts-expect-error: TODO
    const p = widgetParameters.parameters
    try {
      // @ts-expect-error: TODO
      if (widgetParameters.applyFormValues) {
        // @ts-expect-error: TODO
        handleSearchSubmit({ values: widgetParameters.formValues, followUpItem: selectItem ? itemParameters : null })
      } else {
        let values = {
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
            values = {
              ...values,
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
        handleSearchSubmit({ values, followUpItem: selectItem ? itemParameters : null })
      }

      // const searchTimestamp = new Date().getTime()
      // setShouldShowWelcomeMessage(false)
      // setSearchRadius(formValues.radius || 30)
      // setExtendedSearch(false)
      // flyToCenter(formValues)
      // setFormValues({ ...formValues })
      // if (scopeContext.isTraining) {
      //   searchForTrainings({ values: formValues, searchTimestamp })
      // }
      // if (scopeContext.isJob) {
      //   searchForJobs({ values: formValues, searchTimestamp })
      // }

      // setIsFormVisible(false)
      // setCurrentSearch(searchTimestamp)
    } catch (err) {
      logError("WidgetSearch error", err)
    }
  }

  const launchItemFetch = async () => {
    // @ts-expect-error: TODO
    const p = itemParameters.parameters
    p.router = router
    try {
      await handleItemLoad({ item: p, router, scopeContext, displayMap })
    } catch (err) {
      logError("WidgetSearch error", err)
    }
  }

  return ""
}

export default InitWidgetSearchParameters
