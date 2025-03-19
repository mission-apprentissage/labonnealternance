import { Header as DsfrHeader, HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header"

import { DsfrHeaderProps } from "@/app/_components/Header"

import { PAGES } from "../../../utils/routes.utils"

export function DisconnectedHeader() {
  const { quickAccessItems, ...rest } = DsfrHeaderProps

  return (
    <DsfrHeader
      {...rest}
      quickAccessItems={[
        ...quickAccessItems,
        <HeaderQuickAccessItem
          key="connexion"
          quickAccessItem={{
            iconId: "fr-icon-lock-line",
            text: "Connexion",
            linkProps: {
              href: PAGES.static.authentification.getPath(),
            },
          }}
        />,
      ]}
    />
  )
}
