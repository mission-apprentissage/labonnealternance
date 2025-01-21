import { Box } from "@chakra-ui/react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useContext } from "react"

import { ItemDetail } from "@/components"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { ParameterContext } from "@/context/ParameterContextProvider"
import { SearchResultContext } from "@/context/SearchResultContextProvider"
import { getCloseAndSelectFunctions } from "@/services/itemDetailServices"

export default function DetailFormation() {
  const router = useRouter()
  const searchResultContext = useContext(SearchResultContext)
  const displayContext = useContext(DisplayContext)
  const parameterContext = useContext(ParameterContext)
  const searchParams = useSearchParams()

  const { handleClose, handleSelectItem } = getCloseAndSelectFunctions({ router, searchParams, searchResultContext, displayContext, parameterContext })

  return (
    searchResultContext.selectedItem && (
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
