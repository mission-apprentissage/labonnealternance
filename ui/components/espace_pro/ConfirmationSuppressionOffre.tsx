import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"
import { useQueryClient } from "react-query"

import { ArrowRightLine, Close } from "../../theme/components/icons"
import { putOffre } from "../../utils/api"

export default function ConfirmationSuppressionOffre(props) {
  const [job_status_comment, SetjobStatusComment] = useState("")
  const extraOption = useDisclosure()
  const reason = useDisclosure()
  const toast = useToast()
  const client = useQueryClient()

  const { isOpen, onClose, offre } = props

  const resetState = () => {
    SetjobStatusComment("")
    reason.onClose()
    extraOption.onClose()
    onClose()
  }

  const handleReasonSelect = (reason) => {
    if (reason === "Autre") {
      SetjobStatusComment("")
      extraOption.onOpen()
    } else {
      SetjobStatusComment(reason)
    }
  }

  const updateOffer = (job_status) => {
    putOffre(offre._id, { ...offre, job_status, job_status_comment: job_status_comment ?? undefined })
      .then(() => {
        toast({
          title: `Offre ${job_status}`,
          position: "top-right",
          status: "success",
          duration: 2000,
          isClosable: true,
        })
      })
      .then(() => resetState())
      .finally(() => client.invalidateQueries("offre-liste"))
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={resetState} variant="unstyled" p={6} fontWeight={400}>
          fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Flex>
              <Text as={"span"}>
                <ArrowRightLine boxSize={26} />
              </Text>
              <Text as={"span"} ml={4}>
                l'offre a t'elle été pourvue ?
              </Text>
            </Flex>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}></ModalBody>

        {!reason.isOpen && (
          <ModalFooter>
            <Button variant="secondary" mr={3} onClick={() => reason.onOpen()}>
              Non
            </Button>
            <Button variant="primary" onClick={() => updateOffer("Pourvue")}>
              Oui
            </Button>
          </ModalFooter>
        )}
        {reason.isOpen && !extraOption.isOpen && (
          <ModalFooter alignItems="flex-end">
            <FormControl isRequired>
              <FormLabel>Raison de l'annulation</FormLabel>
              <Select variant="outline" placeholder="Selectionner une option" onChange={(v) => handleReasonSelect(v.target.value)}>
                <option value="Je ne suis plus à la recherche">Je ne suis plus à la recherche</option>
                <option value="Je ne reçois pas de candidature">Je ne reçois pas de candidature</option>
                <option value="Les candidatures reçues ne sont pas assez qualifiées">Les candidatures reçues ne sont pas assez qualifiées</option>
                <option value="Autre">Autre</option>
              </Select>
            </FormControl>
            <Button variant="secondary" ml={3} onClick={() => updateOffer("Annulée")} isDisabled={job_status_comment.length < 3}>
              Enregistrer
            </Button>
          </ModalFooter>
        )}

        {extraOption.isOpen && (
          <ModalBody>
            <FormLabel>Raison de l'annulation</FormLabel>
            <FormControl isRequired>
              <Input onChange={(e) => SetjobStatusComment(e.target.value)} isRequired minLength={3} />
            </FormControl>
            <Flex justify="flex-end">
              <Button variant="secondary" mt={3} onClick={() => updateOffer("Annulée")} isDisabled={job_status_comment.length < 3}>
                Enregistrer
              </Button>
            </Flex>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  )
}
