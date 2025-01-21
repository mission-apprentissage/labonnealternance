import { useRouter } from "next/router"
import { useContext, useEffect } from "react"

import { ScopeContext } from "@/context/ScopeContext"
import { SearchResultContext } from "@/context/SearchResultContextProvider"

import { ParameterContext } from "../../context/ParameterContextProvider"
import { fetchAddressFromCoordinates } from "../../services/baseAdresse"
import { logError } from "../../utils/tools"

const InitWidgetSearchParameters = ({ handleSearchSubmit, handleItemLoad }) => {
  const { displayMap, widgetParameters, itemParameters, setWidgetParameters, setItemParameters } = useContext(ParameterContext)
  const { jobs, trainings } = useContext(SearchResultContext)
  const router = useRouter()
  const scopeContext = useContext(ScopeContext)

  useEffect(() => {
    // initialisation par les query params
    if (!jobs && !trainings) {
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
    }
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
