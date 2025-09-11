"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { RechercheMobileForm } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMobileForm"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RechercheMobileFormUpdate(props: { rechercheParams: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.rechercheParams)

  return (
    <Box
      sx={{
        py: fr.spacing("2w"),
        px: fr.spacing("1w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
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
          marginTop: fr.spacing("3w"),
          marginBottom: fr.spacing("1w"),
        }}
      >
        Que recherchez-vous ?
      </Typography>
      <RechercheMobileForm {...props} />
    </Box>
  )
}
