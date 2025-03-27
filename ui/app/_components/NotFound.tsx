import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const NotFound = () => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        md: "1fr 1fr",
      },
      gap: fr.spacing("4w"),
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Box>
      <Typography variant="h1">404</Typography>
      <Typography className={fr.cx("fr-text--lg", "fr-text--bold")}>Vous êtes perdu ?</Typography>
      <Typography className={fr.cx("fr-text--sm")}>
        Il semble que la page que vous essayez de rejoindre n&apos;existe pas. En cas de problème pour retrouver la page, essayez de repartir de la page d&apos;accueil en cliquant
        sur le lien ci-dessous.
      </Typography>
      <Box
        sx={{
          mt: fr.spacing("2w"),
        }}
      >
        <DsfrLink href="/" size="lg" arrow="right">
          Page d&apos;accueil
        </DsfrLink>
      </Box>
    </Box>
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Image
        src="/images/lostCat.svg"
        alt=""
        width={771}
        height={290}
        style={{
          width: "75%",
        }}
      />
    </Box>
  </Box>
)

export default NotFound
