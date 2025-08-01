import { Box, Button, Flex } from "@chakra-ui/react"
import { ILbaItemJobsGlobal } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { useLocalStorage } from "@/app/hooks/useLocalStorage"

import { SendPlausibleEvent } from "../../utils/plausible"

interface GoingToContactQuestionProps {
  kind: LBA_ITEM_TYPE
  item: ILbaItemJobsGlobal
}

const GoingToContactQuestion = ({ kind, item }: GoingToContactQuestionProps) => {
  const { storedValue, setLocalStorage } = useLocalStorage(getGoingtoId(kind, item))

  const workplace = kind === LBA_ITEM_TYPE.FORMATION ? "cet établissement" : "cette entreprise"

  const getType = () => {
    if (kind === LBA_ITEM_TYPE.FORMATION) {
      return "formation"
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
      justifyContent="space-around"
      position="relative"
      background="white"
      padding={["6px 12px 8px 12px", "6px 24px 8px 24px", "6px 12px 8px 12px"]}
      maxWidth="970px"
      mx={["0", "30px", "30px", "auto"]}
    >
      <Box fontSize="14px" fontWeight={700}>
        Allez-vous contacter {workplace} ?
      </Box>
      {storedValue ? (
        <Box borderRadius="10px" px="3" py="2" background="grey.100" fontSize="14px" fontWeight={700}>
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
              setLocalStorage(true)
              SendPlausibleEvent(`Clic Je vais contacter - Fiche ${typeForEventTracking}`, {
                info_fiche: item.id,
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
              setLocalStorage(true)
              SendPlausibleEvent(`Clic Je ne vais pas contacter - Fiche ${typeForEventTracking}`, {
                info_fiche: item.id,
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

export function getGoingtoId(kind: LBA_ITEM_TYPE_OLD | LBA_ITEM_TYPE, item: ILbaItemJobsGlobal) {
  return `goingto-${kind}-${item.id}`
}

export default GoingToContactQuestion
