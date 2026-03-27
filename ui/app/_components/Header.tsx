import type { HeaderProps } from "@codegouvfr/react-dsfr/Header"
import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { PAGES } from "@/utils/routes.utils"
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
  },
  operatorLogo: {
    alt: "La bonne alternance",
    imgUrl: "/images/logo_LBA.svg",
    orientation: "horizontal",
  },
  id: "header-links",
  quickAccessItems: [
    <HeaderQuickAccessItem
      key="publier-offre"
      quickAccessItem={{
        iconId: "fr-icon-global-line",
        text: "Publier une offre d'emploi",
        linkProps: {
          href: PAGES.static.espaceProCreationEntreprise.getPath(),
        },
      }}
    />,
  ],
}

export const DsfrHeaderNavigation = HeaderNavigation
