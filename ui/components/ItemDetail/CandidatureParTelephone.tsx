import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export default function CandidatureParTelephone({ contactPhone }: { contactPhone: string }) {
  return (
    <>
      <Box sx={{ my: fr.spacing("4v") }}>
        <Typography
          component="span"
          sx={{
            backgroundColor: "#FEECC2", // fr introuvable.
            color: fr.colors.decisions.background.actionHigh.greenTilleulVerveine.default,
            fontStyle: "italic",
            px: "6px",
            py: "2px",
          }}
          className={fr.cx("fr-text--sm")}
        >
          🕵️{` Nous n’avons pas d’email pour cette entreprise, mais vous pouvez l’appeler au ${contactPhone} et demander s’ils recrutent des alternants !`}
        </Typography>
      </Box>
    </>
  )
}
