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
import { putOffre } from "../api"
import { ArrowRightLine, Close } from "../theme/components/icons"

export default (props) => {
  const [raison_statut, setRaisonStatut] = useState("")
  const extraOption = useDisclosure()
  const raison = useDisclosure()
  const toast = useToast()
  const client = useQueryClient()

  let { isOpen, onClose, offre } = props

  const resetState = () => {
    setRaisonStatut("")
    raison.onClose()
    extraOption.onClose()
    onClose()
  }

  const handleRaisonSelect = (raison) => {
    if (raison === "Autre") {
      setRaisonStatut("")
      extraOption.onOpen()
    } else {
      setRaisonStatut(raison)
    }
  }

  const updateOffer = (statut) => {
    putOffre(offre._id, { ...offre, statut, raison_statut: raison_statut ?? undefined })
      .then(() => {
        toast({
          title: `Offre ${statut}`,
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

        {!raison.isOpen && (
          <ModalFooter>
            <Button variant="secondary" mr={3} onClick={() => raison.onOpen()}>
              Non
            </Button>
            <Button variant="primary" onClick={() => updateOffer("Pourvue")}>
              Oui
            </Button>
          </ModalFooter>
        )}
        {raison.isOpen && !extraOption.isOpen && (
          <ModalFooter alignItems="flex-end">
            <FormControl isRequired>
              <FormLabel>Raison de l'annulation</FormLabel>
              <Select variant="outline" placeholder="Selectionner une option" onChange={(v) => handleRaisonSelect(v.target.value)}>
                <option defaultValue value="Mon offre est pourvue">
                  Mon offre est pourvue
                </option>
                <option value="Je ne suis plus à la recherche">Je ne suis plus à la recherche</option>
                <option value="Je ne reçois pas de candidature">Je ne reçois pas de candidature</option>
                <option value="Les candidatures reçues ne sont pas assez qualifiées">Les candidatures reçues ne sont pas assez qualifiées</option>
                <option value="Autre">Autre</option>
              </Select>
            </FormControl>
            <Button variant="secondary" ml={3} onClick={() => updateOffer("Annulée")} isDisabled={raison_statut.length < 3}>
              Enregistrer
            </Button>
          </ModalFooter>
        )}

        {extraOption.isOpen && (
          <ModalBody isRequired>
            <FormLabel>Raison de l'annulation</FormLabel>
            <FormControl isRequired>
              <Input onChange={(e) => setRaisonStatut(e.target.value)} isRequired minLength="3" />
            </FormControl>
            <Flex justify="flex-end">
              <Button variant="secondary" mt={3} onClick={() => updateOffer("Annulée")} isDisabled={raison_statut.length < 3}>
                Enregistrer
              </Button>
            </Flex>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  )
}
