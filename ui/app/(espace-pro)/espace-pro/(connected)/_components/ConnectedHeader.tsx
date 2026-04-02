"use client"

import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { useRouter } from "next/navigation"
import type { IUserRecruteurPublic } from "shared"
import { AUTHTYPE } from "shared/constants/recruteur"
import { BandeauFusionPDA } from "@/app/_components/BandeauFusionPDA"
import { DsfrHeaderProps } from "@/app/_components/Header"
import { ConnectedHeaderNavigation } from "@/app/(espace-pro)/espace-pro/(connected)/_components/ConnectedHeaderNavigation"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const WithNav = ({ user, children }: { user: IUserRecruteurPublic; children: React.ReactNode }) => {
  if (user.type === AUTHTYPE.CFA) {
    return <>{children}</>
  }

  return (
    <nav role="navigation" aria-label="Navigation principale">
      {children}
    </nav>
  )
}

export const ConnectedHeader = ({ user }: { user: IUserRecruteurPublic }) => {
  const router = useRouter()

  const { quickAccessItems, ...rest } = DsfrHeaderProps

  const onLogout = async () => {
    await apiGet("/auth/logout", {})
    router.push(PAGES.static.authentification.getPath())
  }

  return (
    <>
      <BandeauFusionPDA />
      <WithNav user={user}>
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
          navigation={user && user.type === AUTHTYPE.CFA && <ConnectedHeaderNavigation />}
        />
      </WithNav>
    </>
  )
}
