import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { IUserRecruteurPublic } from "shared"

import { AuthWatcher } from "@/app/(espace-pro)/_components/AuthWatcher"
import { DsfrHeaderProps } from "@/app/_components/Header"
import { PAGES } from "@/utils/routes.utils"

export function ConnectedHeader({ user }: { user: IUserRecruteurPublic }) {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  const onLogout = async () => {
    "use server"
    const cookieStore = await cookies()
    cookieStore.delete("lba_session")
    redirect(PAGES.static.authentification.getPath())
  }

  return (
    <>
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
      <AuthWatcher user={user} />
    </>
  )
}
