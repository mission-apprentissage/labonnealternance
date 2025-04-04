import { EmailIcon } from "@chakra-ui/icons"
import { Box, Editable, EditableInput, EditablePreview, Flex, Grid, Tag, Text, useDisclosure, useToast } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { createRef, useEffect, useState } from "react"

import "react-dates/initialize"
import "react-dates/lib/css/_datepicker.css"

import { apiGet, apiPatch } from "@/utils/api.utils"

import { dayjs } from "../../../../../common/dayjs"
import { Disquette } from "../../../../../theme/components/icons"

const EtablissementComponent = ({ id }: { id?: string }) => {
  const emailGestionnaireFocusRef = createRef()
  const emailGestionnaireRef = createRef()

  const [etablissement, setEtablissement]: [any, (t: any) => void] = useState(undefined)
  const toast = useToast()
  const { onOpen } = useDisclosure()

  const fetchData = async () => {
    try {
      const response = await apiGet("/admin/etablissements/:id", { params: { id } })
      setEtablissement(response ?? null)
    } catch (error) {
      toast({
        title: "Une erreur est survenue durant la récupération des informations.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
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
      const response = await apiPatch("/admin/etablissements/:id", { params: { id: etablissement?._id }, body: { gestionnaire_email: email } })
      setEtablissement(response)
      putSuccess()
    } catch (error) {
      putError()
    }
  }

  if (etablissement === null) {
    return <Text>Etablissement introuvable</Text>
  }

  return (
    <Box bg="white" border="1px solid #E0E5ED" borderRadius="4px" mt={10} pb="5">
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
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10" mt={10}>
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
              {etablissement?.formateur_zip_code}
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
        {/*  @ts-expect-error: TODO */}
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
              {/*  @ts-expect-error: TODO */}
              <EditablePreview ref={emailGestionnaireFocusRef} />
              {/*  @ts-expect-error: TODO */}
              <EditableInput ref={emailGestionnaireRef} type="email" _focus={{ border: "none" }} />
            </Editable>
            <Box>
              {/*  @ts-expect-error: TODO */}
              <Button onClick={() => upsertEmailDecisionnaire(emailGestionnaireRef.current.value.toLowerCase())}>
                <Disquette w="16px" h="16px" />
              </Button>
            </Box>
          </Flex>
        </Box>
      </Grid>
    </Box>
  )
}

// EtablissementComponent.propTypes = {
//   id: PropTypes.string.isRequired,
// }

export default EtablissementComponent
