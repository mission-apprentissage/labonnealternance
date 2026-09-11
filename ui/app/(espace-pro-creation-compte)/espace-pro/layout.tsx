import { fr } from "@codegouvfr/react-dsfr"
import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { DsfrHeaderProps } from "@/app/_components/Header"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"
export default async function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("espace-pro-creation")}` },
          { label: "Contenu", anchor: `#${mainId("espace-pro-creation")}` },
          { label: "Pied de page", anchor: `#${footerId("espace-pro-creation")}` },
        ]}
      />
      <Header />
      <Box
        component="main"
        role="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          id={mainId("espace-pro-creation")}
          tabIndex={-1}
          sx={{
            maxWidth: 1200,
            paddingTop: fr.spacing("8v"),
            paddingBottom: fr.spacing("16v"),

            marginX: {
              xs: fr.spacing("4v"),
              md: fr.spacing("8v"),
            },
          }}
        >
          <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
        </Box>
      </Box>
      <Footer zone="espace-pro-creation" />
    </>
  )
}

export function Header() {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  return (
    <nav role="navigation" aria-label="Navigation principale">
      <DsfrHeader
        {...rest}
        id={headerId("espace-pro-creation")}
        quickAccessItems={[
          <HeaderQuickAccessItem
            key="connexion"
            quickAccessItem={{
              iconId: "fr-icon-close-line",
              text: "Fermer",
              linkProps: {
                href: PAGES.static.accesRecruteur.getPath(),
                "aria-label": "Fermer - retour à l'espace recruteur",
              },
            }}
          />,
        ]}
      />
    </nav>
  )
}
