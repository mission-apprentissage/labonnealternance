"use client"

import { Box, Container, Stack, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { IEtablissementJson } from "shared"

import { apiGet, apiPost } from "@/utils/api.utils"

import { SuccessCircle } from "../../../../theme/components/icons"

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

export default function PremiumParcoursup() {
  const { id } = useParams() as { id: string }
  const token = useSearchParams().get("token")

  const [hasRefused, setHasRefused] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [etablissement, setEtablissement]: [IPremiumEtablissement | null, (e: any) => void] = useState()

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
      const etablissement2 = (await apiGet("/etablissements/:id", {
        params: { id },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })) as IEtablissementJson

      if (etablissement2.premium_refusal_date) {
        setHasRefused(true)
      }

      if (etablissement2.premium_activation_date) {
        setHasAccepted(true)
      }

      setEtablissement(etablissement2)
    }

    if (id) {
      fetchData().catch(console.error)
    }
  }, [id, token])

  if (!etablissement) {
    return null
  }

  return (
    <Box w="100%" py={[4, 4, 8]} px={[1, 1, 12, 24]}>
      <Container maxW="996px" pl={20} pr={24}>
        {hasRefused && !hasAccepted && (
          <Stack direction="row" alignItems="flex-start">
            <SuccessCircle width={33} fillHexaColor="#000091" mt={2} />
            <Box w="100%">
              <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800" ml={2}>
                Votre choix a bien été pris en compte
              </Text>
              <Text mt={4} color="grey.800" ml={2}>
                Le service RDV Apprentissage ne sera pas activé pour vos formations. Si vous changez d'avis, merci de nous contacter à l'adresse suivante:{" "}
                <a style={{ textDecoration: "underline" }} href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Formulaire%20premium%20-%20Activer%20RDVA">
                  labonnealternance@apprentissage.beta.gouv.fr
                </a>
                .
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
            <Text mt={6}>En activant le service RDV Apprentissage, je m'engage auprès de Parcoursup à :</Text>
            <Stack direction="row" align="center">
              <SuccessCircle fillHexaColor="#00AC8C" />
              <Text fontWeight="700">Répondre par email ou téléphone à tous les candidats qui me contacteront</Text>
            </Stack>
            <Stack direction="row" align="center">
              <SuccessCircle fillHexaColor="#00AC8C" />
              <Text fontWeight="700">Dans un délai de 4 jours ouvrés après réception de la demande par e-mail</Text>
            </Stack>
            <Box mt={5} mr={6}>
              <Button onClick={accept}>Oui, j’accepte les conditions</Button>
            </Box>
            <Box mt={5}>
              <Button priority="secondary" onClick={refuse}>
                Non, je ne suis pas prêt
              </Button>
            </Box>
            <Box>
              <Text mt={5}>
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
  )
}
