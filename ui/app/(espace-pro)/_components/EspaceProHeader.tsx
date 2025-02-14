import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { IUserRecruteurPublic } from "shared"

import { DsfrHeaderProps } from "@/app/_components/Header"

import { PAGES } from "../../../utils/routes.utils"

export function EspaceProHeader({ session }: { session: IUserRecruteurPublic | null }) {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  return (
    <DsfrHeader
      {...rest}
      quickAccessItems={[
        ...quickAccessItems,
        <HeaderQuickAccessItem
          key="connexion"
          quickAccessItem={{
            iconId: session === null ? "fr-icon-lock-line" : "fr-icon-account-line",
            text: session === null ? "Connexion" : "Mon compte",
            linkProps: {
              href: PAGES.static.authentification.getPath(),
            },
          }}
        />,
      ]}
    />
  )
}
