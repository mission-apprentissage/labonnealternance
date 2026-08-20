"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { SxProps, Theme } from "@mui/material/styles"

// Textes mutualisés entre la page /espace-pro/entreprise/offre/:id/mise-en-relation (MiseEnRelation.tsx)
// et l'étape 3 du tunnel de dépôt d'offre rapide (FormulaireEditionOffreStep3CFA.tsx).

export function InfoDelegation() {
  return (
    <Box sx={{ ml: fr.spacing("10v"), display: { xs: "none", lg: "block" } }}>
      <Box sx={{ border: "1px solid #000091", p: fr.spacing("6v") }}>
        <Typography component="h2" sx={{ fontSize: "24px", lineHeight: "32px", fontWeight: "700", mb: fr.spacing("3v") }}>
          Partager votre offre aux CFA à proximité :
        </Typography>
        <Box>
          <Typography sx={{ mt: fr.spacing("6v") }}>
            <strong>Gagner du temps : </strong>Accélérez votre recrutement, et trouvez des candidats qualifiés en partageant votre offre aux acteurs de l’apprentissage de votre
            région.
          </Typography>
          <Typography sx={{ mt: fr.spacing("6v") }}>
            <strong>Rejoindre le réseau des acteurs de l'apprentissage de votre territoire : </strong>
            Développez des relations de confiance avec les acteurs de l'apprentissage de votre territoire afin de promouvoir votre entreprise et vos métiers auprès des jeunes.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export function CfaSolicitationIntro({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Typography sx={sx}>
      Les CFA suivants proposent des formations en lien avec votre offre et sont localisés dans un rayon de 100km près de votre entreprise.
      <br />
      Choisissez ceux que vous souhaitez solliciter : <strong>votre offre et vos informations de contact leur seront partagées par email.</strong>
    </Typography>
  )
}
