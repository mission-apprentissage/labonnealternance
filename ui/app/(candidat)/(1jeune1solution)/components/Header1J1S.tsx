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
    <Box display="flex" flexDirection="row" alignItems="center" gap={0.5} key="header-1j1s-title">
      <Image width="207" height="25" src="/images/1j1s/logo-1j1s.svg" alt="Logo un jeune une solution" />
      <Image width="83" height="83" src="/images/1j1s/plus-jaune.svg" aria-hidden="true" alt="" />
      <Image width="155" height="40" src="/images/logo_LBA.svg" aria-label="La bonne alternance" alt="La bonne alternance" />
    </Box>,
  ],
  id: "header-1j1s-links",
}
