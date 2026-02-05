import type { Metadata } from "next"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.dynamic.backCreateCFAConfirmation({ email: "" }).getMetadata().title,
}

export default function ConfirmationCreationCompte() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      <Typography component="h1" sx={{ fontSize: { sx: "32px", sm: "40px" }, lineHeight: { sx: "40px", sm: "48px" }, fontWeight: "bold" }} data-testid="validation-email-title">
        Vérifiez votre messagerie
      </Typography>
      <Box
        sx={{
          mt: 4,
        }}
      >
        <Typography>Nous vous avons envoyé un email renseigné précédement avec un lien de confirmation. Celui-ci sera valide pour les 60 prochaines minutes.</Typography>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography component="h2" sx={{ fontSize: { sx: "18px", sm: "32px" }, mb: 3, lineHeight: { sx: "24px", sm: "32px" }, fontWeight: "bold" }}>
          Vous n'avez rien reçu ?
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <div className="ri-mail-line" style={{ color: fr.colors.decisions.text.active.blueFrance.default }} />
          <Link sx={{ marginLeft: fr.spacing("1w") }} href={`mailto:${publicConfig.publicEmail}?subject=Creation%20compte%20LBAR%20-%20Mail%20non%20recu`} underline="hover">
            Contacter l'équipe La bonne alternance
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
