import { HeaderQuickAccessItem, type HeaderProps } from "@codegouvfr/react-dsfr/Header"

import { PAGES } from "../../utils/routes.utils"

export const DsfrHeaderProps: HeaderProps = {
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
  id: "fr-header-with-horizontal-operator-logo",
  operatorLogo: {
    alt: "La bonne alternance",
    imgUrl: "/images/logo_LBA.svg",
    orientation: "horizontal",
  },
  quickAccessItems: [
    <HeaderQuickAccessItem
      key="candidat"
      quickAccessItem={{
        iconId: null,
        text: "Candidat",
        linkProps: {
          href: PAGES.static.home.getPath(),
        },
      }}
    />,
    <HeaderQuickAccessItem
      key="recruteur"
      quickAccessItem={{
        iconId: null,
        text: "Recruteur",
        linkProps: {
          href: PAGES.static.accesRecruteur.getPath(),
        },
      }}
    />,
    <HeaderQuickAccessItem
      key="organisme"
      quickAccessItem={{
        iconId: null,
        text: "Organisme de formation",
        linkProps: {
          href: PAGES.static.organismeDeFormation.getPath(),
        },
      }}
    />,
  ],
}
