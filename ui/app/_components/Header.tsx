import { type HeaderProps, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
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
  quickAccessItems: [
    <HeaderQuickAccessItem
      key="search-split"
      quickAccessItem={{
        iconId: "fr-icon-search-line",
        text: "Recherche avancée",
        linkProps: {
          href: "/search/split",
        },
      }}
    />,
  ],
}

export const DsfrHeaderNavigation = HeaderNavigation
