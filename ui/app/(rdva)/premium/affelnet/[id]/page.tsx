"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Typography, Box, Container, Stack } from "@mui/material"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { IEtablissementJson } from "shared"

import { SuccessCircle } from "@/theme/components/icons"
import { apiGet, apiPost } from "@/utils/api.utils"
import { publicConfig } from "@/config.public"

type IAffelnetEtablissement = {
  raison_sociale: string
  gestionnaire_siret: string
  formateur_siret: string
  formateur_address: string
  formateur_zip_code: string
  formateur_city: string
  premium_affelnet_refusal_date: any
  premium_affelnet_activation_date: any
}

export default function PremiumAffelnet() {
  const { id } = useParams() as { id: string }
  const token = useSearchParams().get("token")

  const [hasRefused, setHasRefused] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [etablissement, setEtablissement]: [IAffelnetEtablissement | null, (e: any) => void] = useState()

  /**
   * @description Accept terms.
   * @returns {Promise<void>}
   */
  const accept = async () => {
    await apiPost("/etablissements/:id/premium/affelnet/accept", {
      params: { id },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    setHasAccepted(true)
    window.scrollTo(0, 0)
  }

  /**
   * @description Refuse terms.
   * @returns {Promise<void>}
   */
  const refuse = async () => {
    await apiPost("/etablissements/:id/premium/affelnet/refuse", {
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

      if (etablissement2.premium_affelnet_refusal_date) {
        setHasRefused(true)
      }

      if (etablissement2.premium_affelnet_activation_date) {
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
    <Container sx={{ my: fr.spacing("6w") }}>
      <Box sx={{ border: `1px solid ${fr.colors.decisions.text.actionHigh.blueFrance.default}`, px: fr.spacing("7w") }}>
        <Typography variant="h3" sx={{ my: fr.spacing("3w") }}>
          Activation du service “RDV Apprentissage” sur Choisir son affectation après la 3e
        </Typography>
        {hasRefused && !hasAccepted && (
          <Box sx={{ display: "flex", gap: fr.spacing("2w"), mb: fr.spacing("3w"), alignItems: "center" }}>
            <SuccessCircle width={33} fillHexaColor="#000091" />

            <Typography sx={{ fontWeight: 700 }}>
              Votre choix a bien été pris en compte Le service RDV Apprentissage ne sera pas activé pour vos formations. <br /> Si vous changez d'avis, merci de nous contacter à
              l'adresse suivante:{" "}
              <a style={{ textDecoration: "underline" }} href={`mailto:${publicConfig.publicEmail}?subject=Formulaire%20premium%20-%20Activer%20RDVA`}>
                {publicConfig.publicEmail}
              </a>
            </Typography>
          </Box>
        )}
        {hasAccepted && (
          <Box sx={{ display: "flex", gap: fr.spacing("2w"), mb: fr.spacing("3w"), alignItems: "center" }}>
            <SuccessCircle width={33} fillHexaColor="#000091" />
            <Typography sx={{ fontWeight: 700 }}>
              Félicitations, votre choix a bien été pris en compte.
              <br />
              Le service RDV Apprentissage est désormais activé sur Choisir son affectation après la 3e.
            </Typography>
          </Box>
        )}
        {!hasRefused && !hasAccepted && (
          <>
            <Typography>En activant le service RDV Apprentissage, je m'engage auprès de Choisir son affectation après la 3e à :</Typography>

            <Stack
              sx={{
                gap: fr.spacing("1w"),
                mt: fr.spacing("2w"),
              }}
            >
              <Box sx={{ display: "flex", gap: fr.spacing("2w") }}>
                <SuccessCircle fillHexaColor="#00AC8C" />
                <Typography
                  sx={{
                    fontWeight: "700",
                  }}
                >
                  Répondre par email ou téléphone à tous les candidats qui me contacteront
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: fr.spacing("2w") }}>
                <SuccessCircle fillHexaColor="#00AC8C" />
                <Typography
                  sx={{
                    fontWeight: "700",
                  }}
                >
                  Dans un délai de 4 jours ouvrés après réception de la demande par e-mail
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "column", md: "row" }, gap: fr.spacing("2w"), my: fr.spacing("3w") }}>
              <Button onClick={accept}>Oui, j’accepte les conditions</Button>

              <Button priority="secondary" onClick={refuse}>
                Non, je ne suis pas prêt
              </Button>
            </Box>
            <Box sx={{ mb: fr.spacing("3w") }}>
              <Typography>
                Le service sera activé sur toutes les formations éligibles à être affichées sur Choisir son affectation après la 3e, <br /> liées à votre SIRET{" "}
                <strong>{etablissement.gestionnaire_siret}</strong>.
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Container>
  )
}
