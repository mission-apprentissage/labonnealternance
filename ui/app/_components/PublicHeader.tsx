import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { useMemo } from "react"
import type { IUserRecruteurPublic } from "shared"

import { AuthWatcher } from "./AuthWatcher"
import { DsfrHeaderProps, DsfrHeaderNavigation } from "./Header"
import { PAGES } from "@/utils/routes.utils"

export function PublicHeader({ user, hideConnectionButton = false }: { user?: IUserRecruteurPublic; hideConnectionButton?: boolean }) {
  const props = useMemo(() => {
    const extraItems = []

    if (user) {
      extraItems.push(
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
      extraItems.push(
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

    return {
      ...DsfrHeaderProps,
      quickAccessItems: [...(DsfrHeaderProps.quickAccessItems ?? []), ...extraItems],
    }
  }, [user, hideConnectionButton])

  return (
    <>
      <AuthWatcher user={user} />
      <DsfrHeader {...props} navigation={<DsfrHeaderNavigation />} />
    </>
  )
}

export const PublicHeaderStatic = () => {
  return <DsfrHeader {...DsfrHeaderProps} navigation={<DsfrHeaderNavigation />} />
}
