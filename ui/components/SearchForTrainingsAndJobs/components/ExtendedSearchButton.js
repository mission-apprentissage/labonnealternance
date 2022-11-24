import { Button } from "@chakra-ui/react"
import React, { useContext } from "react"
import { ScopeContext } from "../../../context/ScopeContext"

const ExtendedSearchButton = ({ title, handleExtendedSearch }) => {
  const handleClick = async () => {
    handleExtendedSearch()
  }

  const scopeContext = useContext(ScopeContext)

  return scopeContext.isJob ? (
    <Button title={title} variant="blackButton" my={4} onClick={handleClick}>
      {title}
    </Button>
  ) : (
    ""
  )
}

export default ExtendedSearchButton
