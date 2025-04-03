import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"
import { cookies } from "next/headers"

import { AuthWatcher } from "@/app/(espace-pro)/_components/AuthWatcher"
import { DsfrHeaderProps } from "@/app/_components/Header"
import { getSession } from "@/utils/getSession"

import { PAGES } from "../../../utils/routes.utils"

export async function ProtectedHeader() {
  const { user } = await getSession()

  const extraItems = []

  const onLogout = async () => {
    "use server"
    const cookieStore = await cookies()
    cookieStore.delete("lba_session")
    // TODO: Enable back this redirect after tests
    // redirect(PAGES.static.authentification.getPath())
  }

  if (user) {
    extraItems.push(
      <HeaderQuickAccessItem
        key="mon_compte"
        quickAccessItem={{
          iconId: null,
          text: `${user.first_name} ${user.last_name.toLocaleUpperCase()}`,
          linkProps: {
            href: PAGES.dynamic.backHome({ userType: user.type }).getPath(),
          },
        }}
      />
    )

    // TODO: Remove after tests
    extraItems.push(
      <HeaderQuickAccessItem
        key="deconnexion"
        quickAccessItem={{
          iconId: "fr-icon-logout-box-r-line",
          text: "Déconnexion",
          buttonProps: {
            onClick: onLogout,
          },
        }}
      />
    )
  } else {
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

  const props = {
    ...DsfrHeaderProps,
    quickAccessItems: [...DsfrHeaderProps.quickAccessItems, ...extraItems],
  }

  return (
    <>
      <DsfrHeader {...props} />
      <AuthWatcher user={user} />
    </>
  )
}
