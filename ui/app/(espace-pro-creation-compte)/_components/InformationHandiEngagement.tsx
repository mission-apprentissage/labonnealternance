import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"

export const InformationHandiEngagement = () => {
  return (
    <Box sx={{ backgroundColor: "#F5F5FE", p: fr.spacing("6v"), mt: fr.spacing("6v") }}>
      <Typography sx={{ fontWeight: "700", fontSize: "20px" }}>Engagez-vous en faveur de l’emploi des personnes en situation de handicap</Typography>
      <Typography sx={{ mt: fr.spacing("4v") }}>
        La bonne alternance mène des actions visant à aider les candidats en situation de handicap. Nous menons un partenariat avec France Travail et Cap emploi afin de valoriser
        les employeurs engagés en faveur de l’emploi des personnes en situation de handicap.
      </Typography>
      <Typography sx={{ mt: fr.spacing("4v") }}>
        Tous les recruteurs ayant obtenu la qualification handi-engagé par France Travail et Cap emploi sont facilement identifiables pour les candidats sur La bonne alternance
        grâce à une étiquette “Handi-engagé”.
      </Typography>
    </Box>
  )
}
