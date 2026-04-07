import type { HeaderProps } from "@codegouvfr/react-dsfr/Header"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

export const DsfrHeaderProps1J1S: Omit<HeaderProps, "navigation"> = {
  brandTop: (
    <>
      MINISTÈRE
      <br />
      DU TRAVAIL
      <br />
      ET DES SOLIDARITÉS
    </>
  ),
  homeLinkProps: {
    href: "/",
    title: "Accueil - La bonne alternance",
    "aria-label": "Accueil - La bonne alternance",
  },
  quickAccessItems: [
    <Box>1jeune1solution</Box>,
    <Box>Gros plus jaune</Box>,

    <Image width="155" height="40" src="/images/logo_LBA.svg" alt="La bonne alternance" />,
  ],
  id: "header-1j1s-links",
}
