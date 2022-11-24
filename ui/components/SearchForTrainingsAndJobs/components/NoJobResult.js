import { Box } from "@chakra-ui/react"
import React, { useContext } from "react"
import { ScopeContext } from "../../../context/ScopeContext"

const NoJobResult = () => {
  const scopeContext = useContext(ScopeContext)

  return scopeContext.isJob ? <Box fw={700}>Aucune entreprise trouvée pour votre recherche</Box> : ""
}

export default NoJobResult
