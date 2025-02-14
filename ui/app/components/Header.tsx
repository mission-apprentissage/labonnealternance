import { Header as DsfrHeader, HeaderQuickAccessItem, type HeaderProps } from "@codegouvfr/react-dsfr/Header"

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
        iconId: "fr-icon-add-circle-line",
        text: "Candidat",
        linkProps: {
          href: "#",
        },
      }}
    />,
    <HeaderQuickAccessItem
      key="recruteur"
      quickAccessItem={{
        iconId: "fr-icon-lock-line",
        text: "Recruteur",
        linkProps: {
          href: PAGES.static.accesRecruteur.getPath(),
        },
      }}
    />,
    <HeaderQuickAccessItem
      key="organisme"
      quickAccessItem={{
        iconId: "fr-icon-account-line",
        text: "Organisme de formation",
        linkProps: {
          href: "#",
        },
      }}
    />,
  ],
}

export function Header() {
  return <DsfrHeader {...DsfrHeaderProps} />
}
