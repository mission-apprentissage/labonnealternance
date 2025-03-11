import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { IUserRecruteurPublic } from "shared"

import { DsfrHeaderProps } from "@/app/_components/Header"

import { PAGES } from "../../../utils/routes.utils"

export function EspaceProHeader({ user }: { user: IUserRecruteurPublic | null }) {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  return (
    <DsfrHeader
      {...rest}
      quickAccessItems={[
        ...quickAccessItems,
        <HeaderQuickAccessItem
          key="connexion"
          quickAccessItem={{
            iconId: user === null ? "fr-icon-lock-line" : "fr-icon-account-line",
            text: user === null ? "Connexion" : "Mon compte",
            linkProps: {
              href: PAGES.static.authentification.getPath(),
            },
          }}
        />,
      ]}
    />
  )
}
