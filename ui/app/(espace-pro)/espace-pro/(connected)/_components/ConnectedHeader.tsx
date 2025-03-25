"use client"

import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { useRouter } from "next/navigation"
import { IUserRecruteurPublic } from "shared"

import { DsfrHeaderProps } from "@/app/_components/Header"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export const ConnectedHeader = ({ user }: { user: IUserRecruteurPublic }) => {
  const router = useRouter()

  const { quickAccessItems, ...rest } = DsfrHeaderProps

  const onLogout = async () => {
    await apiGet("/auth/logout", {})
    router.push(PAGES.static.authentification.getPath())
  }

  return (
    <DsfrHeader
      {...rest}
      quickAccessItems={[
        <HeaderQuickAccessItem
          key="mon_compte"
          quickAccessItem={{
            iconId: "fr-icon-account-line",
            text: `${user.first_name} ${user.last_name.toLocaleUpperCase()}`,
            linkProps: {
              href: PAGES.dynamic.compte({ userType: user.type }).getPath(),
            },
          }}
        />,
        <HeaderQuickAccessItem
          key="deconnexion"
          quickAccessItem={{
            iconId: "fr-icon-logout-box-r-line",
            text: "Déconnexion",
            buttonProps: {
              onClick: onLogout,
            },
          }}
        />,
      ]}
    />
  )
}
