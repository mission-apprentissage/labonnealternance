import { CloseIcon } from "@chakra-ui/icons"
import { Box, Button, Image, Modal, ModalContent, ModalHeader, ModalOverlay, Text, useDisclosure } from "@chakra-ui/react"
import { useFormik } from "formik"
import React, { useEffect, useState } from "react"
import { getItemId } from "../../../utils/getItemId"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { string_wrapper as with_str } from "../../../utils/wrapper_utils"
import CandidatureLbaFailed from "./CandidatureLbaFailed"
import CandidatureLbaModalBody from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import { getInitialSchemaValues, getValidationSchema } from "./services/getSchema"
import hasAlreadySubmittedCandidature from "./services/hasAlreadySubmittedCandidature"
import submitCandidature from "./services/submitCandidature"
import useLocalStorage from "./services/useLocalStorage"

const CandidatureLba = ({ item, fakeLocalStorage }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [sendingState, setSendingState] = useState("not_sent")
  const kind = item?.ideaType || ""

  const onModalClose = () => {
    setSendingState("not_sent")
    onClose()
  }

  const uniqId = `candidaturespontanee-${kind}-${getItemId(item)}`

  const actualLocalStorage = fakeLocalStorage || window.localStorage || {}

  const openApplicationForm = () => {
    onOpen()
    SendPlausibleEvent(kind === "matcha" ? "Clic Postuler - Fiche entreprise Offre LBA" : "Clic Postuler - Fiche entreprise Algo", {
      info_fiche: getItemId(item),
    })
  }

  const [applied, setApplied] = useLocalStorage(uniqId(), null, actualLocalStorage)

  useEffect(() => {
    onModalClose()

    // HACK HERE : reapply setApplied to currentUniqId to re-detect
    // if user already applied each time the user swap to another item.
    let currentUniqId = actualLocalStorage.getItem(uniqId)
    if (currentUniqId) {
      setApplied(currentUniqId)
    } else {
      // setApplied(null) is MANDATORY to avoid "already-applied message" when user swaps.
      setApplied(null)
    }
  }, [item])

  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: getValidationSchema(kind),
    onSubmit: async (applicantValues) => {
      let success = await submitCandidature({ applicantValues, setSendingState, item })
      if (success) {
        setApplied(Date.now().toString())
      }
    },
  })

  return (
    <Box data-testid="CandidatureSpontanee">
      <Box>
        {hasAlreadySubmittedCandidature({ applied, isOpen }) ? (
          <Box data-testid="already-applied">
            Vous avez déjà postulé le{" "}
            {new Date(parseInt(applied, 10)).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Box>
        ) : (
          (kind !== "matcha" || item.job.status === "Active") && (
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
                >
                  J&apos;envoie ma candidature{with_str(kind).amongst(["lbb", "lba"]) ? " spontanée" : ""}
                </Button>
                <Modal isOpen={isOpen} onClose={onModalClose} closeOnOverlayClick={false} size="3xl">
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader align="right" paddingTop="8px" paddingBottom="0">
                      <Button
                        fontSize="14px"
                        color="bluefrance.500"
                        fontWeight={400}
                        background="none"
                        alignItems="baseline"
                        height="1.5rem"
                        sx={{
                          _hover: {
                            background: "none",
                            textDecoration: "none",
                          },
                          _active: {
                            background: "none",
                          },
                        }}
                        onClick={onModalClose}
                      >
                        Fermer <CloseIcon w={2} h={2} ml={2} />
                      </Button>
                    </ModalHeader>
                    <form onSubmit={formik.handleSubmit}>
                      {with_str(sendingState).amongst(["not_sent", "currently_sending"]) && (
                        <CandidatureLbaModalBody formik={formik} sendingState={sendingState} company={item?.company?.name} item={item} kind={kind} />
                      )}
                      {with_str(sendingState).amongst(["ok_sent"]) && <CandidatureLbaWorked kind={kind} email={formik.values.email} company={item?.company?.name} />}
                      {!with_str(sendingState).amongst(["not_sent", "ok_sent", "currently_sending"]) && <CandidatureLbaFailed sendingState={sendingState} />}
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
          )
        )}
      </Box>
    </Box>
  )
}

export default CandidatureLba
