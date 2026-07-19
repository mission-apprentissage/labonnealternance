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
  id: "header-links",
  // L'accès au nouveau moteur passe par l'opt-in de la page d'accueil (encart « Tester → »)
  // et le menu « Je recherche une alternance » qui suit le flag — plus de quick access dédiée.
  quickAccessItems: [],
}

export const DsfrHeaderNavigation = HeaderNavigation
