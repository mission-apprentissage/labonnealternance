import { fr } from "@codegouvfr/react-dsfr"
import type { HeaderProps } from "@codegouvfr/react-dsfr/Header"
import { Box, Typography } from "@mui/material"
import NextImage from "next/image"
import { headerId } from "@/app/_components/zone-ids"

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
    <Box
      sx={{
        display: "flex",
        flex: 1,
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        gap: { xs: fr.spacing("2v"), md: fr.spacing("4v") },
        "& > img": { xs: { maxWidth: "89px", height: "auto" }, md: { maxWidth: "155px", height: "auto" } },
      }}
      key="header-1j1s-title"
    >
      <Typography sx={{ fontSize: { xs: "14px", md: "18px" }, fontWeight: 700, lineHeight: "16px" }}>1jeune1solution</Typography>
      <Typography sx={{ fontSize: { xs: "14px", md: "18px" }, fontWeight: 700, lineHeight: "16px" }}>avec</Typography>
      <NextImage width="155" height="40" src="/images/logo_LBA.svg" aria-label="La bonne alternance" alt="La bonne alternance" />
    </Box>,
  ],
  // Le Header DSFR monte sinon la modale « Paramètres d'affichage » avec les id fixes
  // fr-theme-modal, fr-theme-modal-hidden-control-button et fr-modal-title-fr-theme-modal :
  // autant de doublons dès que deux zones coexistent dans le document (cf. zone-ids.ts).
  // Aucun écran de LBA n'ouvre cette modale — le footer ne propose pas headerFooterDisplayItem
  // et le thème est fixé à "light" par dsfr-setup — donc on ne la rend pas du tout. À rétablir
  // en même temps que le bouton, si un jour le choix de thème est exposé.
  disableDisplay: true,
  id: headerId("1jeune1solution"),
}
