import type { IUserRecruteurForAdminJSON } from "shared"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
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
      ariaLabel: `Voir les informations de l'entreprise ${row.establishment_raison_sociale}`,
      link: PAGES.dynamic.backOpcoInformationEntreprise({ user_id: row._id as string }).getPath(),
      type: "link",
    },
    tabIndex === "disabled" || tabIndex === "awaiting"
      ? {
          label: "Activer le compte",
          ariaLabel: `Activer le compte de l'entreprise ${row.establishment_raison_sociale}`,
          onClick: () => {
            confirmationActivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
          type: "button",
        }
      : null,
    tabIndex === "active" || tabIndex === "awaiting"
      ? {
          label: "Désactiver le compte",
          ariaLabel: `Désactiver le compte de l'entreprise ${row.establishment_raison_sociale}`,
          onClick: () => {
            confirmationDesactivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
          type: "button",
        }
      : null,
  ]

  return <PopoverMenu actions={actions.filter((action) => action !== null)} title={`Actions sur les comptes de l'entreprise ${row.establishment_raison_sociale}`} />
}
