import { IUserRecruteurForAdminJSON } from "shared"

import { PopoverMenu, PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PAGES } from "@/utils/routes.utils"

export const UserMenu = ({
  row,
  tabIndex,
  setCurrentEntreprise,
  confirmationActivationUtilisateur,
  confirmationDesactivationUtilisateur,
}: {
  row: any
  tabIndex: string
  setCurrentEntreprise: (entreprise: IUserRecruteurForAdminJSON | null) => void
  confirmationActivationUtilisateur: any
  confirmationDesactivationUtilisateur: any
}) => {
  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les informations",
      link: PAGES.dynamic.backOpcoInformationEntreprise({ user_id: row._id as string }).getPath(),
      type: "link",
    },
    tabIndex !== "1"
      ? {
          label: "Activer le compte",
          onClick: () => {
            confirmationActivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
          type: "button",
        }
      : null,
    tabIndex !== "2"
      ? {
          label: "Désactiver le compte",
          onClick: () => {
            confirmationDesactivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
          type: "button",
        }
      : null,
  ]

  return <PopoverMenu actions={actions.filter((action) => action !== null)} title={"Actions sur les comptes de l'entreprise"} />
}
