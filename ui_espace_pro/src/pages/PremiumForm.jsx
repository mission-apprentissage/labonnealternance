import { Box, Button, Container, Flex, Stack, Text } from "@chakra-ui/react"
import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { _get, _post } from "../common/httpClient"
import { setTitle } from "../common/utils/pageUtils"
import { Layout } from "../components"
import { InfoCircleFilled, SuccessCircle } from "../theme/components/icons"

/**
 * @description Premium form component.
 * @returns {JSX.Element}
 */
const PremiumForm = () => {
  const { id } = useParams()
  const [hasRefused, setHasRefused] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [isAffelnet, setIsAffelnet] = useState(false)
  const [etablissement, setEtablissement] = useState()

  const title = "Parcoursup"
  setTitle(title)

  /**
   * @description Accept terms.
   * @returns {Promise<void>}
   */
  const accept = async () => {
    await _post(`/api/etablissements/${id}/premium/accept`)
    window.scrollTo(0, 0)
    setHasAccepted(true)
  }

  /**
   * @description Refuse invite.
   * @returns {Promise<void>}
   */
  const refuse = async () => {
    await _post(`/api/etablissements/${id}/premium/refuse`)
    window.scrollTo(0, 0)
    setHasRefused(true)
  }

  useEffect(async () => {
    const etablissement = await _get(`/api/etablissements/${id}`)

    console.log(JSON.stringify(etablissement, null, 2))

    if (etablissement.premium_refusal_date) {
      setHasRefused(true)
    }

    if (etablissement.premium_activation_date) {
      setHasAccepted(true)
    }

    if (etablissement.affelnet_perimetre) {
      setIsAffelnet(true)
    }

    setEtablissement(etablissement)
  }, [id])

  if (!etablissement) {
    return null
  }

  console.log(etablissement)

  return (
    <Layout>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
        <Container border="1px solid #000091" mt={8} mb={20} maxW="container.lg" px={20} py={10}>
          {hasRefused && !hasAccepted && (
            <Stack direction="row" alignItems="flex-start">
              <SuccessCircle width={33} fillHexaColor="#000091" mt={2} />
              <Box w="100%">
                <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800" ml={2}>
                  Votre choix a bien été pris en compte
                </Text>
                <Text mt={4} color="grey.800" ml={2}>
                  Le service RDV Apprentissage n'a pas été activé pour vos formations. Si vous changez d'avis, merci de nous contacter à l'adresse suivante:{" "}
                  <a href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Formulaire%20premium%20-%20Activer%20RDVA">labonnealternance@apprentissage.beta.gouv.fr</a>.
                </Text>
              </Box>
            </Stack>
          )}
          {hasAccepted && (
            <Stack direction="row" alignItems="flex-start">
              <SuccessCircle width={33} fillHexaColor="#000091" mt={2} />
              <Box w="100%">
                <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800" ml={2}>
                  Félicitations, votre choix a bien été pris en compte.
                </Text>
                <Text mt={4} color="grey.800" ml={2}>
                  {isAffelnet
                    ? "Le service RDV Apprentissage est désormais activé sur Choisir sont affectation après la 3e."
                    : "Le service RDV Apprentissage est désormais activé sur Parcoursup."}
                  <br />
                  Afin de recevoir les demandes de RDV, assurez-vous que vos coordonnées de contact CARIF FOREF soient à jour.
                </Text>
              </Box>
            </Stack>
          )}
          {!hasRefused && !hasAccepted && (
            <>
              <Box>
                <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800">
                  {isAffelnet ? "Activation du service “RDV Apprentissage” sur Choisir son affectation après la 3e" : "Activation du service “RDV Apprentissage” sur Parcoursup"}
                </Text>
              </Box>
              <Text fontWeight="700" my={5}>
                Afin de bénéficier de la parution du service RDV Apprentissage, je m'engage auprès de {isAffelnet ? "Choisir son affectation après la 3e" : "Parcoursup"} à
              </Text>
              <Stack direction="row" align="center">
                <SuccessCircle fillHexaColor="#00AC8C" />
                <Text fontWeight="700">Contacter par email ou téléphone tous les candidats qui feront une demande sur cette plateforme</Text>
              </Stack>
              <Stack direction="row" align="center">
                <SuccessCircle fillHexaColor="#00AC8C" />
                <Text fontWeight="700">Répondre dans un délai de 4 jours ouvrés après réception de la demande par e-mail</Text>
              </Stack>
              <Text mt={6}>
                Je prends acte du fait que la{" "}
                <a style={{ textDecoration: "underline", cursor: "pointer" }} href="https://mission-apprentissage.gitbook.io/general/" target="_blank">
                  Mission interministérielle pour l’apprentissage
                </a>{" "}
                pourra prendre toutes les mesures utiles pour mesurer le fait que cet engagement soit tenu (dont enquêtes en ligne ou orales auprès des candidats et des CFA).
              </Text>
              <Text mt={6}>
                En cas de non-respect de mon engagement, je bénéficierai d’un avertissement m’invitant à remédier à cette défaillance puis d’une éventuelle suspension du service.
              </Text>
              <Button mt={5} mr={6} variant="primary" onClick={accept}>
                J’accepte les conditions
              </Button>
              <Button mt={5} variant="secondary" onClick={refuse}>
                Non je ne suis pas prêt
              </Button>
              <Flex align="center" borderColor="pinksoft.400" borderLeftWidth="4px" bg="grey.100" py={4} my={8}>
                <Text fontSize="14px">
                  <Box float="left" pr={3} pl={3}>
                    <InfoCircleFilled width={6} fillHexaColor="#FF8D7E" />
                  </Box>{" "}
                  Cette action n’aura aucun impact sur le référencement de vos formations dans {isAffelnet ? "Choisir son affectation après la 3e" : "Parcoursup"}
                </Text>
              </Flex>
              <Box>
                <Text mt="-7px">
                  Le service sera activé sur toutes les formations référencées dans {isAffelnet ? "Choisir son affectation après la 3e" : "Parcoursup"} de l’organisme suivant :
                </Text>
                <Stack dir="column" bg="#F9F8F6" px={10} py={6} mt={3} spacing={4}>
                  <Text>
                    Raison sociale :{" "}
                    <Text as="span" fontWeight="700">
                      {etablissement.raison_sociale}
                    </Text>
                  </Text>
                  <Text>
                    SIRET Gestionnaire :{" "}
                    <Text as="span" fontWeight="700">
                      {etablissement.gestionnaire_siret}
                    </Text>
                  </Text>
                  <Text>
                    SIRET Formateur :{" "}
                    <Text as="span" fontWeight="700">
                      {etablissement.formateur_siret}
                    </Text>
                  </Text>
                  <Text>
                    Adresse :{" "}
                    <Text as="span" fontWeight="700">
                      {etablissement.formateur_address}
                    </Text>
                  </Text>
                  <Text>
                    Code postal :{" "}
                    <Text as="span" fontWeight="700">
                      {etablissement.formateur_zip_code}
                    </Text>
                  </Text>
                  <Text>
                    Ville :{" "}
                    <Text as="span" fontWeight="700">
                      {etablissement.formateur_city}
                    </Text>
                  </Text>
                </Stack>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </Layout>
  )
}

export default PremiumForm
