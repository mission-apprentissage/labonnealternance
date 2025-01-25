import { currentSearch, setCurrentPage } from "@/utils/currentPage"
import { closeMapPopups, flyToMarker, setSelectedMarker } from "@/utils/mapTools"
import pushHistory from "@/utils/pushHistory"

export const getCloseAndSelectFunctions = ({ router, searchParams, searchResultContext, displayContext, parameterContext }) => {
  const { selectedItem, setSelectedItem, setItemToScrollTo } = searchResultContext
  const { formValues } = displayContext
  const { displayMap } = parameterContext
  const path = searchParams.get("path")?.startsWith("/recherche") ? searchParams.get("path") : "/recherche"

  const unSelectItem = (doNotSaveToHistory) => {
    setCurrentPage("")
    setSelectedItem(null)
    setSelectedMarker(null)
    if (selectedItem) {
      setItemToScrollTo(selectedItem)
    }

    if (!doNotSaveToHistory) {
      pushHistory({ router, searchParameters: formValues, searchTimestamp: currentSearch, displayMap, path })
    }
  }

  const handleClose = () => {
    setCurrentPage("")
    pushHistory({
      router,
      page: "list",
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap,
      path,
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
      item,
      page: "fiche",
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap,
      path,
    })
  }

  return {
    handleClose,
    handleSelectItem,
  }
}
