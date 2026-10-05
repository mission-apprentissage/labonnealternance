import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"

const supportHref = `mailto:${publicConfig.publicEmail}?subject=${encodeURIComponent("Désinscription RDV Apprentissage - Lien non valide")}`

export const LienNonAutorise = () => (
  <Box sx={{ my: fr.spacing("6v") }}>
    <Typography variant="h1">Ce lien ne vous donne pas accès à cette page</Typography>
    <Typography sx={{ mt: fr.spacing("4v") }}>
      Le lien que vous avez suivi a peut-être expiré ou ne correspond pas à cet établissement. Utilisez le lien du dernier e-mail reçu de La bonne alternance, ou écrivez-nous à
      l'adresse <DsfrLink href={supportHref}>{publicConfig.publicEmail}</DsfrLink>.
    </Typography>
  </Box>
)
