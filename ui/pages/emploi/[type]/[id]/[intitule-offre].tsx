import { Box } from "@chakra-ui/react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useContext, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { ErrorMessage } from "@/components"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"
import LoadedItemDetail from "@/components/ItemDetail/loadedItemDetail"
import { fetchJobItemDetails, shouldFetchItemData, updateJobContext } from "@/components/SearchForTrainingsAndJobs/services/loadItem"
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
  - fixer les résultats de load de détail job dans le contexte
  - éviter les rechargements de requêtes lors d'un close sur détail ---> ctrl contexte vs. param ? enregistrer params avec contexte de résultat
  - pkoi rechargement sans cache sur useQuery ?
  - charger les data des formations / jobs sur accès direct avec param sans rien dans contexte
  - charger les data des jobs sur accès direct formation sans param
  - gérer l'affichage de la map
  - réparer le sticky
  - réparer le double pushHistory et l'écrasement de l'historique quand retour sur la liste des offres




  */

  const { id, type } = router.query

  const { isSuccess, data } = useQuery(["itemDetail-offre", id, type], () => fetchJobItemDetails({ id, type, searchResultContext }), {
    enabled: shouldFetchItemData(id as string, type as LBA_ITEM_TYPE, searchResultContext),
    onError: (error: { message: string }) => setHasError(error.message),
  })

  useEffect(() => {
    if (isSuccess) {
      updateJobContext({ searchResultContext, job: data })
    }
  }, [data, isSuccess])

  return (
    <Box className="choiceCol">
      <NextSeo
        title={`TODO: change here and below Tous les emplois et formations en alternance | La bonne alternance | Trouvez votre alternance`}
        description={`Liste de métiers où trouver une formation ou un emploi en alternance`}
      />
      {!hasError && searchResultContext.selectedItem?.detailsLoaded && <LoadedItemDetail handleClose={handleClose} handleSelectItem={handleSelectItem} />}
      {hasError ? (
        <ErrorMessage message={hasError === "not_found" ? "Fiche introuvable" : "Une erreur s'est produite. Détail de la fiche momentanément indisponible"} />
      ) : (
        !searchResultContext.selectedItem?.detailsLoaded && <ItemDetailLoading type={type} />
      )}
    </Box>
  )
}
