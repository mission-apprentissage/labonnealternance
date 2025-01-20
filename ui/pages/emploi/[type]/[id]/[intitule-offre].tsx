import { Box } from "@chakra-ui/react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useContext } from "react"

import { ItemDetail } from "@/components"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { ParameterContext } from "@/context/ParameterContextProvider"
import { SearchResultContext } from "@/context/SearchResultContextProvider"
import { currentSearch, setCurrentPage } from "@/utils/currentPage"
import { closeMapPopups, flyToMarker, setSelectedMarker } from "@/utils/mapTools"
import pushHistory from "@/utils/pushHistory"

export default function DetailEmploi() {
  const router = useRouter()

  const { /*extendedSearch, jobs,*/ selectedItem, setSelectedItem, setItemToScrollTo /*setJobsAndSelectedItem, setTrainingsAndSelectedItem, trainings*/ } =
    useContext(SearchResultContext)
  const { formValues } = useContext(DisplayContext)
  const { displayMap } = useContext(ParameterContext)
  const searchParams = useSearchParams()

  // const intituleOffre = router.query["intitule-offre"]
  // const type = router.query.type
  // const id = router.query.id
  const path = searchParams.get("path")
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

  /*
  TODO:
  - mettre à jour tous les push history
  - éviter les rechargements de requêtes lors d'un close sur détail
  - charger les data sur accès direct
  - gérer l'affichage de la map






  */

  return (
    selectedItem && (
      <Box className="choiceCol">
        <NextSeo
          title={`TODO: change here and below Tous les emplois et formations en alternance | La bonne alternance | Trouvez votre alternance`}
          description={`Liste de métiers où trouver une formation ou un emploi en alternance`}
        />
        {<ItemDetail handleSelectItem={handleSelectItem} handleClose={handleClose} />}
      </Box>
    )
  )
}
