import { Box, Stack, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const FonctionnementPlateforme = () => {
  return (
    <Box bgcolor="#f6f6f6" p={6} mt={8} display="flex" justifyContent="space-between" alignItems="center">
      <Stack spacing={2}>
        <Typography variant="body1">Vous avez une question sur le fonctionnement de notre plateforme ?</Typography>
        <Box>
          <DsfrLink href="/faq">Consulter la FAQ</DsfrLink>
        </Box>
      </Stack>
      <Box mr={2}>
        <Image src="/images/pages_ressources/FAQ.svg" alt="" width={201} height={111} aria-hidden="true" />
      </Box>
    </Box>
  )
}

export default FonctionnementPlateforme
