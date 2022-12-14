import React from "react"

import { useSessionStorage } from "../../utils/useSessionStorage"
import { getItemId } from "../../utils/getItemId"
import { SendPlausibleEvent } from "../../utils/plausible"
import { capitalizeFirstLetter } from "../../utils/strutils"
import { Box, Button, Flex } from "@chakra-ui/react"

const GoingToContactQuestion = ({ kind, uniqId, item }) => {
  const [thanks, setThanks] = useSessionStorage(uniqId, false)

  const workplace = kind === "formation" ? "cet établissement" : "cette entreprise"

  const getType = () => {
    if (kind === "formation") {
      return "formation"
    }
    if (kind === "peJob") {
      return "entreprise Offre PE"
    }
    return "entreprise Algo"
  }

  const typeForEventTracking = getType()

  return (
    <Flex
      data-testid="GoingToContactQuestion"
      pb="0px"
      mt={6}
      alignItems="center"
      justifyContent="center"
      position="relative"
      background="white"
      padding={["6px 12px 8px 12px", "6px 24px 8px 24px", "6px 12px 8px 12px"]}
      mx={["0", "30px"]}
    >
      <Box fontSize="14px" fontWeight={700}>
        Allez-vous contacter {workplace} ?
      </Box>
      {thanks ? (
        <Box borderRadius="10px" padding={6} background="grey.100" fontSize="16px" fontWeight={700}>
          Merci pour votre réponse ! 👌
        </Box>
      ) : (
        <>
          <Button
            type="button"
            ml={1}
            border="none"
            background="inherit"
            _hover={{
              border: "none",
              background: "inherit",
            }}
            fontSize="14px"
            onClick={() => {
              setThanks(true)
              SendPlausibleEvent(`Clic Je vais contacter - Fiche ${typeForEventTracking}`, {
                info_fiche: getItemId(item),
              })
            }}
          >
            👍 Oui
          </Button>
          <Button
            type="button"
            ml={1}
            border="none"
            background="inherit"
            _hover={{
              border: "none",
              background: "inherit",
            }}
            fontSize="14px"
            onClick={() => {
              setThanks(true)
              SendPlausibleEvent(`Clic Je ne vais pas contacter - Fiche ${typeForEventTracking}`, {
                info_fiche: getItemId(item),
              })
            }}
          >
            👎 Non
          </Button>
        </>
      )}
    </Flex>
  )
}

export function getGoingtoId(kind, item) {
  return `goingto-${kind}-${getItemId(item)}`
}

export default GoingToContactQuestion
