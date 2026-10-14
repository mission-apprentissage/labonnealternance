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
  // cf. administration/users/_component/UserMenu
  const entrepriseLabel = row.establishment_raison_sociale || `SIRET ${row.establishment_siret}`
  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les informations",
      hint: entrepriseLabel,
      link: PAGES.dynamic.backOpcoInformationEntreprise({ user_id: row._id as string }).getPath(),
      type: "link",
    },
    tabIndex === "disabled" || tabIndex === "awaiting"
      ? {
          label: "Activer le compte",
          hint: entrepriseLabel,
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
          hint: entrepriseLabel,
          onClick: () => {
            confirmationDesactivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
          type: "button",
        }
      : null,
  ]

  return <PopoverMenu actions={actions.filter((action) => action !== null)} title={`Actions sur les comptes de l'entreprise ${entrepriseLabel}`} />
}
