"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { RechercheMobileForm } from "./RechercheMobileForm"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function RechercheMobileFormUpdate(props: { rechercheParams: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.rechercheParams)

  return (
    <Box
      sx={{
        py: fr.spacing("4v"),
        px: fr.spacing("2v"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <Button iconId="fr-icon-arrow-left-line" priority="secondary" onClick={() => navigateToRecherchePage({ displayMobileForm: false }, true)}>
        Retour
      </Button>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          lineHeight: "24px",
          marginTop: fr.spacing("6v"),
          marginBottom: fr.spacing("2v"),
        }}
      >
        Que recherchez-vous ?
      </Typography>
      <RechercheMobileForm {...props} />
    </Box>
  )
}
