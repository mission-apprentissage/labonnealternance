import type { HeaderProps } from "@codegouvfr/react-dsfr/Header"
import { HeaderNavigation } from "./HeaderNavigation"

export const DsfrHeaderProps: Omit<HeaderProps, "navigation"> = {
  brandTop: (
    <>
      RÉPUBLIQUE
      <br />
      FRANÇAISE
    </>
  ),
  homeLinkProps: {
    href: "/",
    title: "Accueil - La bonne alternance",
    "aria-label": "Accueil - La bonne alternance",
  },
  operatorLogo: {
    alt: "La bonne alternance",
    imgUrl: "/images/logo_LBA.svg",
    orientation: "horizontal",
  },
  // Le Header DSFR monte sinon la modale « Paramètres d'affichage » avec les id fixes
  // fr-theme-modal, fr-theme-modal-hidden-control-button et fr-modal-title-fr-theme-modal :
  // autant de doublons dès que deux zones coexistent dans le document (cf. zone-ids.ts).
  // Aucun écran de LBA n'ouvre cette modale — le footer ne propose pas headerFooterDisplayItem
  // et le thème est fixé à "light" par dsfr-setup — donc on ne la rend pas du tout. À rétablir
  // en même temps que le bouton, si un jour le choix de thème est exposé.
  disableDisplay: true,
  quickAccessItems: [],
}

export const DsfrHeaderNavigation = HeaderNavigation
