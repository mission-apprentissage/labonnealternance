import { Box, Button, Flex, Image, Text, useDisclosure } from "@chakra-ui/react"
import { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob, JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { getItemId } from "../../../utils/getItemId"
import { SendPlausibleEvent } from "../../../utils/plausible"
import ItemDetailApplicationsStatus, { hasApplied } from "../ItemDetailServices/ItemDetailApplicationStatus"

import { CandidatureLbaModal } from "./CandidatureLbaModal"
import { useSubmitCandidature } from "./services/submitCandidature"

export const NoCandidatureLba = () => {
  return (
    <Flex alignItems="center" maxWidth="640px" my={4} backgroundColor="#FEF7DA" p={1}>
      <Box fontSize="20px" mr={2}>
        🕵️
      </Box>
      <Text color="#66673D" fontSize="12px" fontStyle="italic">
        Nous n’avons pas de contact pour cette entreprise, peut-être que vous en trouverez un sur internet !
      </Text>
    </Flex>
  )
}

export const CandidatureLba = ({ item }: { item: ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemPartnerJob }) => {
  const modalControls = useDisclosure()
  const submitControls = useSubmitCandidature(item)
  const { onOpen } = modalControls
  const kind: LBA_ITEM_TYPE_OLD | null = item.ideaType || null

  const openApplicationForm = () => {
    onOpen()
    SendPlausibleEvent(kind === LBA_ITEM_TYPE_OLD.MATCHA ? "Clic Postuler - Fiche entreprise Offre LBA" : "Clic Postuler - Fiche entreprise Algo", {
      info_fiche: getItemId(item),
    })
  }

  const hasAppliedValue = hasApplied(item)
  const isActive = kind !== LBA_ITEM_TYPE_OLD.MATCHA || (item as ILbaItemLbaJob).job.status === JOB_STATUS.ACTIVE

  return (
    <Box data-testid="CandidatureSpontanee">
      <CandidatureLbaModal item={item} modalControls={modalControls} submitControls={submitControls} />
      <Box>
        {hasAppliedValue ? (
          <ItemDetailApplicationsStatus item={item} />
        ) : isActive ? (
          <>
            <Box my={4}>
              <Button
                ml={1}
                padding="8px 24px"
                color="white"
                background="bluefrance.500"
                borderRadius="8px"
                sx={{
                  textDecoration: "none",
                  _hover: {
                    background: "bluesoft.500",
                  },
                }}
                onClick={openApplicationForm}
                aria-label="Ouvrir le formulaire d'envoi de candidature spontanée"
                data-testid="postuler-button"
              >
                J&apos;envoie ma candidature{kind === LBA_ITEM_TYPE_OLD.LBA ? " spontanée" : ""}
              </Button>
            </Box>
            {item.company?.mandataire && (
              <Box display="flex" alignItems="center" my={4}>
                <Text as="span">
                  <Image src="/images/icons/small_info.svg" alt="" />
                </Text>
                <Text as="span" ml={2} fontSize="12px" fontStyle="italic">
                  Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l’entreprise.{" "}
                </Text>
              </Box>
            )}
          </>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  )
}
