import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useContext, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { ErrorMessage } from "@/components"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"
import LoadedItemDetail from "@/components/ItemDetail/loadedItemDetail"
import { fetchTrainingItemDetails, initContextFromQueryParameters, shouldFetchItemData, updateTrainingContext } from "@/components/SearchForTrainingsAndJobs/services/loadItem"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { ParameterContext } from "@/context/ParameterContextProvider"
import { SearchResultContext } from "@/context/SearchResultContextProvider"
import { getCloseAndSelectFunctions } from "@/services/itemDetailServices"

export default function DetailFormation() {
  const router = useRouter()
  const searchResultContext = useContext(SearchResultContext)
  const displayContext = useContext(DisplayContext)
  const parameterContext = useContext(ParameterContext)

  const { handleClose, handleSelectItem } = getCloseAndSelectFunctions({ router, searchResultContext, displayContext, parameterContext })
  const [hasError, setHasError] = useState<string>("")
  const { id } = router.query
  const intituleFormation = router.query["intitule-formation"] as string

  const { isSuccess, data } = useQuery(["itemDetail-offre", id, LBA_ITEM_TYPE.FORMATION], () => fetchTrainingItemDetails({ id, searchResultContext }), {
    enabled: shouldFetchItemData(id as string, LBA_ITEM_TYPE.FORMATION, searchResultContext),
    onError: (error: { message: string }) => setHasError(error.message),
  })

  useEffect(() => {
    if (isSuccess) {
      updateTrainingContext(searchResultContext, data)
      if (!displayContext?.formValues) {
        initContextFromQueryParameters({ item: data, searchResultContext, displayContext })
      }
    }
  }, [data, isSuccess])

  return (
    <Box className="choiceCol">
      <NextSeo title={`Formation en alternance | ${intituleFormation}`} description={`Offres de formations en alternance pour trouver une alternance`} />
      {!hasError && searchResultContext.selectedItem?.detailsLoaded && <LoadedItemDetail handleClose={handleClose} handleSelectItem={handleSelectItem} />}
      {hasError ? (
        <ErrorMessage message={hasError === "not_found" ? "Fiche introuvable" : "Une erreur s'est produite. Détail de la fiche momentanément indisponible"} />
      ) : (
        !searchResultContext.selectedItem?.detailsLoaded && <ItemDetailLoading type={LBA_ITEM_TYPE.FORMATION} />
      )}
    </Box>
  )
}
