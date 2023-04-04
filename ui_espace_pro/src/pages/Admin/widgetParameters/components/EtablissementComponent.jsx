import { createRef, useState, useEffect } from "react"
import { EmailIcon } from "@chakra-ui/icons"
import * as PropTypes from "prop-types"
import "react-dates/initialize"
import "react-dates/lib/css/_datepicker.css"
import {
  Box,
  Text,
  Flex,
  EditablePreview,
  EditableInput,
  Editable,
  Button,
  Grid,
  Tag,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Table,
  Thead,
  Th,
  Tr,
  Tbody,
  Td,
} from "@chakra-ui/react"
import { Disquette } from "../../../../theme/components/icons"
import { _get, _patch } from "../../../../common/httpClient"
import { dayjs, formatDate } from "../../../../common/dayjs"
import { emailStatus } from "../constants/email"

/**
 * @description Etablissement component.
 * @param {string} id
 * @returns {JSX.Element}
 */
const EtablissementComponent = ({ id }) => {
  const emailGestionnaireFocusRef = createRef()
  const emailGestionnaireRef = createRef()

  const [loading, setLoading] = useState(false)
  const [etablissement, setEtablissement] = useState()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  /**
   * @description Initial fetching.
   * @return {Promise<void>}
   */
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await _get(`/api/admin/etablissements/${id}`)
      setEtablissement(response)
    } catch (error) {
      toast({
        title: "Une erreur est survenue durant la récupération des informations.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * @description Returns toast common error for etablissement updates.
   * @return {string | number}
   */
  const putError = () =>
    toast({
      title: "Une erreur est survenue durant l'enregistrement.",
      status: "error",
      isClosable: true,
      position: "bottom-right",
    })

  /**
   * @description Call succes Toast.
   * @return {string | number}
   */
  const putSuccess = () =>
    toast({
      title: "Enregistrement effectué avec succès.",
      status: "success",
      isClosable: true,
      position: "bottom-right",
    })

  useEffect(() => {
    fetchData()
  }, [])

  /**
   * @description Upserts "gestionnaire_email"
   * @param {string} email
   * @return {Promise<void>}
   */
  const upsertEmailDecisionnaire = async (email) => {
    try {
      const response = await _patch(`/api/admin/etablissements/${etablissement._id}`, { gestionnaire_email: email })
      setEtablissement(response)
      putSuccess()
    } catch (error) {
      putError()
    }
  }

  return (
    <Box bg="white" border="1px solid #E0E5ED" borderRadius="4px" mt={10} pb="5" loading={loading}>
      <Box borderBottom="1px solid #E0E5ED">
        <Text fontSize="16px" p={5}>
          Etablissement
          <Text as="span" fontSize="16px" float="right" onClick={onOpen}>
            <EmailIcon cursor="pointer" fontSize={30} />
          </Text>
        </Text>
      </Box>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5">
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Raison sociale <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.raison_sociale}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            SIRET Formateur <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.formateur_siret}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            SIRET Gestionnaire <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.gestionnaire_siret}
            </Text>
          </Text>
        </Box>
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Adresse
            <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.formateur_address}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Code postal <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.zip_code}
            </Text>
          </Text>
        </Box>
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        {etablissement?.optout_invitation_date && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Date d'invitation à l'opt-out <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.optout_invitation_date).format("DD/MM/YYYY")}
              </Tag>
            </Text>
            <Modal isOpen={isOpen} onClose={onClose} size={"full"}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Détails des emails</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Box>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Campagne</Th>
                          <Th>Statut</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {etablissement?.to_etablissement_emails.map((mail) => (
                          <Tr>
                            <Td>{formatDate(mail?.webhook_status_at) || formatDate(mail.email_sent_at)}</Td>
                            <Td>{mail.campaign}</Td>
                            <Td>{emailStatus[mail.status] || "Envoyé"}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Fermer
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Box>
        )}
        {etablissement?.optout_activation_date && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Date d'activation des formations
              <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.optout_activation_date).format("DD/MM/YYYY")}
              </Tag>
            </Text>
          </Box>
        )}
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        {etablissement?.optout_refusal_date && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Date de refus de l'opt-out
              <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.optout_refusal_date).format("DD/MM/YYYY")}
              </Tag>
            </Text>
          </Box>
        )}
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        <Box onClick={() => emailGestionnaireFocusRef.current.focus()}>
          <Text textStyle="sm" fontWeight="600">
            Email décisionnaire <br />
            <br />
          </Text>
          <Flex>
            <Editable
              defaultValue={etablissement?.gestionnaire_email}
              key={etablissement?.gestionnaire_email || "gestionnaire_email"}
              style={{
                border: "solid #dee2e6 1px",
                padding: 5,
                marginRight: 10,
                borderRadius: 4,
                minWidth: "70%",
              }}
            >
              <EditablePreview ref={emailGestionnaireFocusRef} />
              <EditableInput ref={emailGestionnaireRef} type="email" _focus={{ border: "none" }} />
            </Editable>
            <Button RootComponent="a" variant="primary" onClick={() => upsertEmailDecisionnaire(emailGestionnaireRef.current.value.toLowerCase())}>
              <Disquette w="16px" h="16px" />
            </Button>
          </Flex>
        </Box>
      </Grid>
    </Box>
  )
}

EtablissementComponent.propTypes = {
  id: PropTypes.string.isRequired,
}

export default EtablissementComponent
