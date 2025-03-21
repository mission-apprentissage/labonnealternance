import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { IUserRecruteurPublic } from "shared"

import { DsfrHeaderProps } from "@/app/_components/Header"

import { PAGES } from "../../../utils/routes.utils"

export function PublicHeader({ user, hideConnectionButton = false }: { user?: IUserRecruteurPublic; hideConnectionButton?: boolean }) {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  const items = [...quickAccessItems]
  if (user) {
    items.push(
      <HeaderQuickAccessItem
        key="mon_compte"
        quickAccessItem={{
          iconId: "fr-icon-account-line",
          text: `${user.first_name} ${user.last_name.toLocaleUpperCase()}`,
          linkProps: {
            href: PAGES.dynamic.backHome({ userType: user.type }).getPath(),
          },
        }}
      />
    )
  }
  if (!user && !hideConnectionButton) {
    items.push(
      <HeaderQuickAccessItem
        key="connexion"
        quickAccessItem={{
          iconId: "fr-icon-lock-line",
          text: "Connexion",
          linkProps: {
            href: PAGES.static.authentification.getPath(),
          },
        }}
      />
    )
  }

  return <DsfrHeader {...rest} quickAccessItems={items} />
}
