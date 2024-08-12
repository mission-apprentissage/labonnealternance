import { Box, Button, Flex, Image, Modal, ModalContent, ModalHeader, ModalOverlay, Text, useDisclosure } from "@chakra-ui/react"
import { useFormik } from "formik"
import { useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { JOB_STATUS } from "shared/models/job.model"

import LBAModalCloseButton from "@/components/lbaModalCloseButton"

import { getItemId } from "../../../utils/getItemId"
import { SendPlausibleEvent } from "../../../utils/plausible"
import ItemDetailApplicationsStatus from "../ItemDetailServices/ItemDetailApplicationStatus"

import CandidatureLbaFailed from "./CandidatureLbaFailed"
import CandidatureLbaModalBody from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import { getInitialSchemaValues, getValidationSchema } from "./services/getSchema"
import submitCandidature from "./services/submitCandidature"

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

const CandidatureLba = ({ item, hasApplied, setHasApplied }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [sendingState, setSendingState] = useState("not_sent")
  const kind: LBA_ITEM_TYPE_OLD = item?.ideaType || ""

  const onModalClose = () => {
    setSendingState("not_sent")
    onClose()
  }

  const openApplicationForm = () => {
    onOpen()
    SendPlausibleEvent(kind === LBA_ITEM_TYPE_OLD.MATCHA ? "Clic Postuler - Fiche entreprise Offre LBA" : "Clic Postuler - Fiche entreprise Algo", {
      info_fiche: getItemId(item),
    })
  }

  useEffect(() => {
    onModalClose()
  }, [item])

  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: getValidationSchema(),
    onSubmit: async (formValues) => {
      await submitCandidature({ formValues, setSendingState, setHasApplied, LbaJob: item })
    },
  })

  return (
    <Box data-testid="CandidatureSpontanee">
      <Box>
        <ItemDetailApplicationsStatus item={item} hasApplied={hasApplied} />
        {(kind !== LBA_ITEM_TYPE_OLD.MATCHA || item.job.status === JOB_STATUS.ACTIVE) && !hasApplied && (
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
              <Modal isOpen={isOpen} onClose={onModalClose} closeOnOverlayClick={false} size="3xl">
                <ModalOverlay />
                <ModalContent>
                  {/* @ts-expect-error: Chakra error */}
                  <ModalHeader paddingTop="8px" paddingBottom="0" align="right">
                    <LBAModalCloseButton onClose={onModalClose} />
                  </ModalHeader>
                  <form onSubmit={formik.handleSubmit}>
                    {["not_sent", "currently_sending"].includes(sendingState) && (
                      <CandidatureLbaModalBody formik={formik} sendingState={sendingState} company={item?.company?.name} item={item} kind={kind} />
                    )}
                    {["ok_sent"].includes(sendingState) && <CandidatureLbaWorked email={formik.values.email} company={item?.company?.name} />}
                    {!["not_sent", "ok_sent", "currently_sending"].includes(sendingState) && <CandidatureLbaFailed sendingState={sendingState} />}
                  </form>
                </ModalContent>
              </Modal>
            </Box>
            {item?.company?.mandataire && (
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
        )}
      </Box>
    </Box>
  )
}

export default CandidatureLba
