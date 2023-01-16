import React, { useEffect } from "react"

import { fetchAddressFromCoordinates } from "services/baseAdresse"

import { logError } from "utils/tools"

import { ParameterContext } from "../../context/ParameterContextProvider"

const InitWidgetSearchParameters = ({ setIsLoading, handleSearchSubmit, handleItemLoad }) => {
  const { widgetParameters, itemParameters, setWidgetParameters, setItemParameters } = React.useContext(ParameterContext)

  useEffect(() => {
    // initialisation par les query params
    if (widgetParameters && widgetParameters.applyWidgetParameters && itemParameters && itemParameters.applyItemParameters) {
      // launchWidget AND item
      launchWidgetSearch({ selectItem: true })
      setWidgetParameters({ ...widgetParameters, applyWidgetParameters: false }) // action one shot
      setItemParameters({ ...itemParameters, applyItemParameters: false }) // action one shot
    } else if (widgetParameters && widgetParameters.applyWidgetParameters) {
      // launchWidget only
      launchWidgetSearch({ selectItem: false })
      setWidgetParameters({ ...widgetParameters, applyWidgetParameters: false }) // action one shot
    } else if (itemParameters && itemParameters.applyItemParameters) {
      // launchItem only
      launchItemFetch()
      setItemParameters({ ...itemParameters, applyItemParameters: false }) // action one shot
    } else {
      setIsLoading(false)
    }
  })

  const launchWidgetSearch = async ({ selectItem = false }) => {
    setIsLoading(true)
    const p = widgetParameters.parameters
    try {
      if (widgetParameters.applyFormValues) {
        handleSearchSubmit({ values: widgetParameters.formValues, followUpItem: selectItem ? itemParameters : null })
      } else {
        let values = {
          job: {
            romes: p.romes.split(","),
          },
          radius: p.radius || 30,
        }

        if (p.lon || p.lat) {
          // récupération du code insee depuis la base d'adresse
          let addresses

          addresses = await fetchAddressFromCoordinates([p.lon, p.lat])

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
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      logError("WidgetSearch error", err)
    }
  }

  const launchItemFetch = async () => {
    setIsLoading(true)
    const p = itemParameters.parameters
    try {
      await handleItemLoad(p)

      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      logError("WidgetSearch error", err)
    }
  }

  return ""
}

export default InitWidgetSearchParameters
