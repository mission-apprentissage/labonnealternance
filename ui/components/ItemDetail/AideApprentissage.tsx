import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const AideApprentissage = () => {
  return (
    <Box sx={{ pb: 0, mt: fr.spacing("6v"), position: "relative", backgroundColor: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
      <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
        Futur alternant ? Découvrez les aides auxquelles vous avez droit et parlez-en avec vos proches
      </Typography>

      <Typography>Avec 1jeune1solution, évaluez les aides financières auxquelles vous avez droit en matière de logement, transport, santé, formation, emploi, culture, sport et alimentation.</Typography>

      <Typography sx={{ mt: fr.spacing("4v") }}>
        Accéder à{" "}
        <DsfrLink href="https://www.1jeune1solution.gouv.fr/mes-aides" aria-label="Accès à l'outil de simulation de 1jeune1solution - nouvelle fenêtre">
          l'outil de simulation 1jeune1solution
        </DsfrLink>
      </Typography>
    </Box>
  )
}

export default AideApprentissage
