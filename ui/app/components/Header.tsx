import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"

export function Header() {
  return (
    <DsfrHeader
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      homeLinkProps={{
        href: "/",
        title: "Accueil - La bonne alternance",
      }}
      id="fr-header-with-horizontal-operator-logo"
      //   onSearchButtonClick={function noRefCheck() {}}
      operatorLogo={{
        alt: "La bonne alternance",
        imgUrl: "/images/logo_LBA.svg",
        orientation: "horizontal",
      }}
      quickAccessItems={[
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
              href: "#",
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
        <HeaderQuickAccessItem
          key="connexion"
          quickAccessItem={{
            iconId: "fr-icon-account-line",
            text: "Connexion",
            linkProps: {
              href: "#",
            },
          }}
        />,
      ]}
    />
  )
}
