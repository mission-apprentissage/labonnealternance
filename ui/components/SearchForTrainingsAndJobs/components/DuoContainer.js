import { Box, Text } from "@chakra-ui/react"
import React, { useContext } from "react"
import { ScopeContext } from "../../../context/ScopeContext"

const DuoContainer = () => {
  const scopeContext = useContext(ScopeContext)

  return (
    <Box id="duoContainer" mx="3" p="5" bg="white" borderRadius="10px">
      <Box>
        <Text as="h2" my="0" variant="editorialContentH2">
          Fonctionnalité à venir...
        </Text>
      </Box>
      <Box mt="3" fontSize="14px">
        La bonne alternance souhaite à terme proposer aux candidats{" "}
        <Text as="span" color="pinksoft.600" fontWeight={700}>
          des offres combinant formation et emploi
        </Text>
        . Merci pour l'intérêt que vous y portez.
      </Box>
    </Box>
  )
}

export default DuoContainer
