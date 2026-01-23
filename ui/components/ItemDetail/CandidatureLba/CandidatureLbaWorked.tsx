import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

interface Props {
  email: string
  company: string
}

const CandidatureLbaWorked = ({ email, company }: Props) => {
  return (
    <Box sx={{ px: fr.spacing("4w") }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", my: fr.spacing("8v") }}>
        <Image src="/images/paperplane2.svg" aria-hidden={true} alt="" width={48} height={48} />
        <Box sx={{ ml: fr.spacing("4v") }}>
          <Typography data-testid="application-success" variant="h2" sx={{ fontSize: "20px", fontWeight: 700 }}>
            Votre candidature a bien été envoyée à{" "}
            <Typography component="span" variant="h2">
              {company}
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: "18px" }}>
        Un e-mail de confirmation vous a été envoyé sur votre boite e-mail{" "}
        <Typography component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          {email}
        </Typography>
      </Typography>
      <Typography sx={{ fontSize: "18px", mt: fr.spacing("8v"), mb: fr.spacing("8v") }}>
        Si vous n&apos;avez pas reçu d&apos;email de confirmation d&apos;ici 24 heures, soumettez à nouveau votre candidature
      </Typography>
    </Box>
  )
}

export default CandidatureLbaWorked
