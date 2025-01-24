import { Box } from "@chakra-ui/react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useContext, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { ErrorMessage, ItemDetail } from "@/components"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"
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
  const searchParams = useSearchParams()

  const { handleClose, handleSelectItem } = getCloseAndSelectFunctions({ router, searchParams, searchResultContext, displayContext, parameterContext })

  const [hasError, setHasError] = useState<string>("")

  /*
  TODO:
  - mauvaise initialisation des offres de formations et d'emplois lors d'un chargement direct sans paramètres
  - gérer l'affichage de la map
  - réparer le sticky
  - réparer l'affichage formulaire par défaut si pas de résultat en version mobile
  */

  const { id, type } = router.query

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
      <NextSeo
        title={`TODO: change here and below Tous les emplois et formations en alternance | La bonne alternance | Trouvez votre alternance`}
        description={`Liste de métiers où trouver une formation ou un emploi en alternance`}
      />
      {!hasError && searchResultContext.selectedItem?.detailsLoaded && <ItemDetail handleClose={handleClose} handleSelectItem={handleSelectItem} />}
      {hasError ? (
        <ErrorMessage message={hasError === "not_found" ? "Fiche introuvable" : "Une erreur s'est produite. Détail de la fiche momentanément indisponible"} />
      ) : (
        !searchResultContext.selectedItem?.detailsLoaded && <ItemDetailLoading type={type} />
      )}
    </Box>
  )
}
