"use client"
import { Box, Flex, Image, Text, useDisclosure } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useState } from "react"
import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson, JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { notifyJobPostulerV3 } from "@/utils/api"

import { getItemId } from "../../../utils/getItemId"
import { SendPlausibleEvent } from "../../../utils/plausible"
import ItemDetailApplicationsStatus from "../ItemDetailServices/ItemDetailApplicationStatus"

import { CandidatureLbaModal } from "./CandidatureLbaModal"
import { useSubmitCandidature } from "./services/submitCandidature"

export const NoCandidatureLba = () => {
  return (
    <Flex alignItems="center" maxWidth="640px" my={4} backgroundColor="#FEF7DA" p={1}>
      <Box fontSize="20px" mr={2}>
        🕵️
      </Box>
      <Box color="#66673D" fontSize="12px" fontStyle="italic">
        Nous n’avons pas de contact pour cette entreprise, peut-être que vous en trouverez un sur internet !
      </Box>
    </Flex>
  )
}

export function CandidatureLba({ item }: { item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson }) {
  const [modalId, setModalId] = useState<number>(Math.random())
  const modalControls = useDisclosure()
  const submitControls = useSubmitCandidature(item)
  const { applicationDate } = submitControls
  const { onOpen } = modalControls
  const kind = item.ideaType

  const openApplicationForm = () => {
    // re-instancie la modal
    setModalId(Math.random())
    onOpen()
    SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: kind, info_fiche: getItemId(item) })
    notifyJobPostulerV3(item.id)
  }

  const hasAppliedValue = Boolean(applicationDate)
  const isActive = kind !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || (item as ILbaItemLbaJobJson).job.status === JOB_STATUS.ACTIVE

  return (
    <Box data-testid="CandidatureSpontanee">
      <CandidatureLbaModal key={modalId} item={item} modalControls={modalControls} submitControls={submitControls} />
      <Box>
        {hasAppliedValue ? (
          /* @ts-ignore TODO */

          <ItemDetailApplicationsStatus item={item} />
        ) : isActive ? (
          <>
            <Box my={2}>
              <Button onClick={openApplicationForm} aria-label="Ouvrir le formulaire d'envoi de candidature spontanée" data-testid="postuler-button">
                J&apos;envoie ma candidature{kind === LBA_ITEM_TYPE.RECRUTEURS_LBA ? " spontanée" : ""}
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
