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
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", my: 4 }}>
        <Image src="/images/paperplane2.svg" aria-hidden={true} alt="" width={48} height={48} />
        <Box sx={{ ml: 2 }}>
          <Typography data-testid="application-success" variant="h2" sx={{ fontSize: "20px", fontWeight: 700 }}>
            Votre candidature a bien été envoyée à{" "}
            <Typography component="span" sx={{ fontSize: "22px" }}>
              {company}
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: "18px" }}>
        Un e-mail de confirmation vous a été envoyé sur votre boite e-mail{" "}
        <Typography component="span" sx={{ fontWeight: 700, color: "#f07f87" }}>
          {email}
        </Typography>
      </Typography>
      <Typography sx={{ fontSize: "18px", mt: 4, mb: 4 }}>
        Si vous n&apos;avez pas reçu d&apos;email de confirmation d&apos;ici 24 heures, soumettez à nouveau votre candidature
      </Typography>
    </Box>
  )
}

export default CandidatureLbaWorked
