import { Box, Button, Container, Flex, Stack, Text } from "@chakra-ui/react"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { IEtablissementJson } from "shared"

import { apiGet, apiPost } from "@/utils/api.utils"

import { Layout } from "../../../../components/espace_pro"
import { InfoCircleFilled, SuccessCircle } from "../../../../theme/components/icons"

type IPremiumEtablissement = {
  raison_sociale: string
  gestionnaire_siret: string
  formateur_siret: string
  formateur_address: string
  formateur_zip_code: string
  formateur_city: string
  premium_refusal_date: any
  premium_activation_date: any
}

/**
 * @description Premium form component.
 * @returns {JSX.Element}
 */
export default function PremiumForm() {
  const router = useRouter()
  const { id, token } = router.query as { id: string; token: string }
  const [hasRefused, setHasRefused] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [etablissement, setEtablissement]: [IPremiumEtablissement | null, (e: any) => void] = useState()

  const title = "Parcoursup"

  /**
   * @description Accept terms.
   * @returns {Promise<void>}
   */
  const accept = async () => {
    await apiPost("/etablissements/:id/premium/accept", {
      params: { id },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    setHasAccepted(true)
    window.scrollTo(0, 0)
  }

  /**
   * @description Refuse invite.
   * @returns {Promise<void>}
   */
  const refuse = async () => {
    await apiPost("/etablissements/:id/premium/refuse", {
      params: { id },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    setHasRefused(true)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const fetchData = async () => {
      const etablissement = (await apiGet("/etablissements/:id", {
        params: { id },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })) as IEtablissementJson

      if (etablissement.premium_refusal_date) {
        setHasRefused(true)
      }

      if (etablissement.premium_activation_date) {
        setHasAccepted(true)
      }

      setEtablissement(etablissement)
    }

    if (id) {
      fetchData().catch(console.error)
    }
  }, [id])

  if (!etablissement) {
    return null
  }

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>
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
                  Le service RDV Apprentissage est désormais activé sur Parcoursup.
                  <br />
                  Afin de recevoir les demandes de RDV, assurez-vous que vos coordonnées de contact CARIF OREF sont à jour.
                </Text>
              </Box>
            </Stack>
          )}
          {!hasRefused && !hasAccepted && (
            <>
              <Box>
                <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800">
                  Activation du service “RDV Apprentissage” sur Parcoursup
                </Text>
              </Box>
              <Text fontWeight="700" my={5}>
                Afin de bénéficier de l'activation du service RDV Apprentissage, je m'engage auprès de Parcoursup à:
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
                <a style={{ textDecoration: "underline", cursor: "pointer" }} href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html" target="_blank" rel="noreferrer">
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
                    <InfoCircleFilled fillHexaColor="#FF8D7E" />
                  </Box>{" "}
                  Cette action n’aura aucun impact sur le référencement de vos formations dans Parcoursup
                </Text>
              </Flex>
              <Box>
                <Text mt="-7px">
                  Le service sera activé sur toutes les formations éligibles à être affichées sur Parcoursup, liées à votre SIRET{" "}
                  <Text as="span" fontWeight="700">
                    {etablissement.gestionnaire_siret}
                  </Text>
                  .
                </Text>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </Layout>
  )
}
