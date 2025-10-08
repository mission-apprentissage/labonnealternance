import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const FonctionnementPlateforme = () => {
  return (
    <Box
      sx={{ display: "flex", p: fr.spacing("5w"), flexDirection: { xs: "column", md: "row" }, backgroundColor: "#f6f6f6", alignItems: "center", justifyContent: "space-between" }}
    >
      <Stack spacing={2}>
        <Typography variant="body1">Vous avez une question sur le fonctionnement de notre plateforme ?</Typography>
        <Box>
          <DsfrLink href="/faq">Consulter la FAQ</DsfrLink>
        </Box>
      </Stack>
      <Box sx={{ mt: { xs: fr.spacing("2w"), md: 0 } }}>
        <Image src="/images/pages_ressources/FAQ.svg" alt="" width={201} height={111} aria-hidden="true" />
      </Box>
    </Box>
  )
}

export default FonctionnementPlateforme
