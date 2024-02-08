import { Box } from "@chakra-ui/react"
import React, { useContext } from "react"

import { ScopeContext } from "../../../context/ScopeContext"

const NoJobResult = () => {
  const scopeContext = useContext(ScopeContext)

  return (
    scopeContext.isJob && (
      <Box id="jobList" textAlign="center" mb={6} fontWeight={700}>
        Aucune entreprise trouvée pour votre recherche
      </Box>
    )
  )
}

export default NoJobResult
