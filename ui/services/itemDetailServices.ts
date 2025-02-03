import { NextRouter } from "next/router"

import { IContextDisplay } from "@/context/DisplayContextProvider"
import { IContextParameter } from "@/context/ParameterContextProvider"
import { IContextSearch } from "@/context/SearchResultContextProvider"
import { currentSearch, setCurrentPage } from "@/utils/currentPage"
import { closeMapPopups, flyToMarker, setSelectedMarker } from "@/utils/mapTools"
import pushHistory from "@/utils/pushHistory"

export const getCloseAndSelectFunctions = ({
  router,
  searchResultContext,
  displayContext,
  parameterContext,
  scopeContext = {
    isJob: true,
    isTraining: true,
    path: "/recherche",
  },
}: {
  router: NextRouter
  searchResultContext: IContextSearch
  displayContext: IContextDisplay
  parameterContext: IContextParameter
  scopeContext?: {
    isJob: boolean
    isTraining: boolean
    path?: string
  }
}) => {
  const { selectedItem, setSelectedItem, setItemToScrollTo } = searchResultContext
  const { formValues } = displayContext
  const { displayMap } = parameterContext

  const unSelectItem = (doNotSaveToHistory) => {
    setCurrentPage("")
    setSelectedItem(null)
    setSelectedMarker(null)
    if (selectedItem) {
      setItemToScrollTo(selectedItem)
    }

    if (!doNotSaveToHistory) {
      pushHistory({ router, scopeContext, searchParameters: formValues, searchTimestamp: currentSearch, displayMap })
    }
  }

  const handleClose = () => {
    setCurrentPage("")
    pushHistory({
      router,
      scopeContext,
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap,
    })
    unSelectItem("doNotSaveToHistory")
  }

  const handleSelectItem = (item) => {
    flyToMarker(item, 12)
    closeMapPopups()
    setSelectedItem(item)
    setSelectedMarker(item)

    setCurrentPage("fiche")

    pushHistory({
      router,
      scopeContext,
      item,
      page: "fiche",
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap,
    })
  }

  return {
    handleClose,
    handleSelectItem,
  }
}
