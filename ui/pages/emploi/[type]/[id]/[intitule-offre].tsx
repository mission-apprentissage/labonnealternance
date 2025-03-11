import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useContext, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { ErrorMessage } from "@/components"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"
import LoadedItemDetail from "@/components/ItemDetail/loadedItemDetail"
import { fetchJobItemDetails, initContextFromQueryParameters, shouldFetchItemData, updateJobContext } from "@/components/SearchForTrainingsAndJobs/services/loadItem"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { ParameterContext } from "@/context/ParameterContextProvider"
import { SearchResultContext } from "@/context/SearchResultContextProvider"
import { getCloseAndSelectFunctions } from "@/services/itemDetailServices"

export default function DetailEmploi() {
  const router = useRouter()
  const searchResultContext = useContext(SearchResultContext)
  const displayContext = useContext(DisplayContext)
  const parameterContext = useContext(ParameterContext)

  const { handleClose, handleSelectItem } = getCloseAndSelectFunctions({ router, searchResultContext, displayContext, parameterContext })

  const [hasError, setHasError] = useState<string>("")

  /* TODO: - gérer l'affichage de la map */

  const { id, type } = router.query as { id: string; type: LBA_ITEM_TYPE }
  const intituleOffre = router.query["intitule-offre"] as string

  const { isSuccess, data } = useQuery(["itemDetail-offre", id, type], () => fetchJobItemDetails({ id, type, searchResultContext }), {
    enabled: shouldFetchItemData(id as string, type as LBA_ITEM_TYPE, searchResultContext),
    onError: (error: { message: string }) => setHasError(error.message),
  })

  useEffect(() => {
    if (isSuccess) {
      updateJobContext({ searchResultContext, job: data })
      if (!displayContext?.formValues) {
        initContextFromQueryParameters({ item: data, searchResultContext, displayContext })
      }
    }
  }, [data, isSuccess])

  return (
    <Box className="choiceCol">
      <NextSeo title={`Emploi en alternance | ${intituleOffre}`} description={`Offres de recrutement et entreprises pour trouver un contrat en alternance`} />
      {!hasError && searchResultContext.selectedItem?.detailsLoaded && <LoadedItemDetail handleClose={handleClose} handleSelectItem={handleSelectItem} />}
      {hasError ? (
        <ErrorMessage message={hasError === "not_found" ? "Fiche introuvable" : "Une erreur s'est produite. Détail de la fiche momentanément indisponible"} />
      ) : (
        !searchResultContext.selectedItem?.detailsLoaded && <ItemDetailLoading type={type} />
      )}
    </Box>
  )
}
