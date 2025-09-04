import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

import TagCandidatureSpontanee from "./TagCandidatureSpontanee"

const DidYouKnow = () => {
  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: "white",
        padding: "16px 24px",
        maxWidth: "970px",
        mx: { xs: 0, sm: "30px", md: "30px", lg: "auto" },
        mt: fr.spacing("3w"),
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
        Le saviez-vous ?
      </Typography>
      <Typography>
        Diversifiez vos démarches en envoyant aussi des candidatures spontanées aux entreprises qui n&apos;ont pas diffusé d&apos;offre! Repérez les tags suivants dans la liste de
        résultats <TagCandidatureSpontanee />
      </Typography>

      <Typography sx={{ pt: 2 }}>
        Un employeur vous a proposé un entretien ?
        <br />
        <DsfrLink href="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac" aria-label="Conseils de préparation à un entretien - nouvelle fenêtre">
          On vous donne des conseils pour vous aider à le préparer.
        </DsfrLink>
      </Typography>
    </Box>
  )
}

export default DidYouKnow
