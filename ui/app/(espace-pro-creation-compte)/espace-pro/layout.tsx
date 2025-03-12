import { fr } from "@codegouvfr/react-dsfr"
import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { Footer } from "@/app/_components/Footer"
import { DsfrHeaderProps } from "@/app/_components/Header"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Header />
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box
          maxWidth={1200}
          paddingTop={fr.spacing("4w")}
          paddingBottom={fr.spacing("8w")}
          marginX={{
            xs: fr.spacing("2w"),
            md: fr.spacing("4w"),
          }}
        >
          <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
        </Box>
      </Box>
      <Footer />
    </>
  )
}

export function Header() {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  return (
    <DsfrHeader
      {...rest}
      quickAccessItems={[
        <HeaderQuickAccessItem
          key="connexion"
          quickAccessItem={{
            iconId: "fr-icon-close-line",
            text: "Fermer",
            linkProps: {
              href: PAGES.static.accesRecruteur.getPath(),
            },
          }}
        />,
      ]}
    />
  )
}
