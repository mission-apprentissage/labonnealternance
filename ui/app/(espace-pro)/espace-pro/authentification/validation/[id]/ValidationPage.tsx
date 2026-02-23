"use client"

import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { fr } from "@codegouvfr/react-dsfr"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { publicConfig } from "@/config.public"

const EmailEnValidationManuelle = () => (
  <Box sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
    <Typography component="h1" sx={{ fontSize: "28px", mb: 3 }}>
      Merci ! Votre adresse email est bien confirmée.
    </Typography>
    <Typography sx={{ fontSize: "18px" }}>Nos équipes se chargent à présent de valider votre compte. Vous serez notifié par email dès que ce sera fait.</Typography>
    <Typography sx={{ fontSize: "18px" }}>À bientôt sur La bonne alternance !</Typography>
    <Typography sx={{ fontSize: "18px", pt: 1 }}>Vous allez être redirigé automatiquement dans quelques instants...</Typography>
  </Box>
)

const ErreurValidation = () => (
  <Box sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
    <Typography component="h1" sx={{ fontSize: "28px", mb: 3 }}>
      Mail invalide
    </Typography>
    <Typography sx={{ fontSize: "18px" }}>
      La validation de votre email a échoué. Merci de{" "}
      <Link sx={{ ml: fr.spacing("2v") }} href={`mailto:${publicConfig.publicEmail}?subject=Authentification%20LBAR%20-%20Mail%20invalide`}>
        Contacter l'équipe La bonne alternance
      </Link>
    </Typography>
  </Box>
)

export default function ConfirmationValidationEmail() {
  const router = useRouter()
  const token = useSearchParams().get("token")

  const validateUser = (token) =>
    apiPost("/etablissement/validation", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

  const response = useQuery({
    queryKey: ["postValidation", token],
    queryFn: () => validateUser(token),
    enabled: Boolean(token),
  })

  useEffect(() => {
    if (!response.isFetched || !response.data) return

    if (response.data.status_current === ETAT_UTILISATEUR.ATTENTE) {
      setTimeout(() => router.push(PAGES.static.accesRecruteur.getPath()), 10000)
    } else {
      router.push(PAGES.static.authentification.getPath())
    }
  }, [response.isFetched, router, response.data])

  if (response.isLoading) {
    return <LoadingEmptySpace label="Vérification en cours" />
  }

  if (response.isError) {
    return <ErreurValidation />
  }

  return <EmailEnValidationManuelle />
}
