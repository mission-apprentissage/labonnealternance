import { Box, Button, Text } from "@chakra-ui/react"
import React, { useContext } from "react"

import { ScopeContext } from "../../../context/ScopeContext"

const ExtendedSearchButton = ({ title, handleExtendedSearch }: { title?: string; handleExtendedSearch: any }) => {
  const handleClick = async () => {
    handleExtendedSearch()
  }

  const scopeContext = useContext(ScopeContext)

  return scopeContext.isJob ? (
    <Box mt={6} textAlign="center">
      {title && <Text>{title}</Text>}
      <Button title="Rechercher sur la France entière" variant="primary" my={4} onClick={handleClick}>
        Rechercher sur la France entière
      </Button>
    </Box>
  ) : (
    ""
  )
}

export default ExtendedSearchButton
