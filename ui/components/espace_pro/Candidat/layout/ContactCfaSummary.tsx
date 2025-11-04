import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { MapPin2Fill } from "@/theme/components/icons"

type Props = {
  entrepriseRaisonSociale: string
  intitule: string
  adresse: string
  codePostal: string
  ville: string
}

/**
 * Etablissement information.
 */
export const ContactCfaSummary = (props: Props) => {
  const { adresse, codePostal, entrepriseRaisonSociale, ville, intitule } = props

  return (
    <Box sx={{ py: { xs: 0, sm: fr.spacing("7v"), mt: fr.spacing("1w") } }}>
      <Typography sx={{ fontWeight: "700", color: "#2a2a2a" }}>{entrepriseRaisonSociale}</Typography>
      <Typography sx={{ fontWeight: "400", color: "#2a2a2a" }}>{intitule}</Typography>
      {adresse && codePostal && (
        <Box mt={1}>
          <MapPin2Fill sx={{ color: "#3a55d1", mb: fr.spacing("1v") }} />
          <Typography component="span" ml={fr.spacing("1w")}>
            {adresse},{" "}
            <Typography component="span">
              {codePostal} {ville}
            </Typography>
          </Typography>
        </Box>
      )}
      <Box mt={8} borderBottom="1px solid #D0C9C4" />
    </Box>
  )
}
