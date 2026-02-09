import type { IUserRecruteurForAdminJSON, IUserStatusValidationJson } from "shared"
import { getLastStatusEvent } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"

export const UserMenu = ({
  row,
  setCurrentEntreprise,
  confirmationActivationUtilisateur,
  confirmationDesactivationUtilisateur,
}: {
  row: any
  setCurrentEntreprise: (entreprise: IUserRecruteurForAdminJSON | null) => void
  confirmationActivationUtilisateur: any
  confirmationDesactivationUtilisateur: any
}) => {
  const status = getLastStatusEvent(row.status as IUserStatusValidationJson[])?.status
  const canActivate = [ETAT_UTILISATEUR.DESACTIVE, ETAT_UTILISATEUR.ATTENTE].includes(status)
  const canDeactivate = [ETAT_UTILISATEUR.VALIDE, ETAT_UTILISATEUR.ATTENTE].includes(status)

  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les informations",
      ariaLabel: `Voir les informations de l'entreprise ${row.establishment_raison_sociale}`,
      type: "link",
      link: `/espace-pro/administration/users/${row._id}`,
    },
    canActivate
      ? {
          label: "Activer le compte",
          type: "button",
          ariaLabel: `Activer le compte de l'entreprise ${row.establishment_raison_sociale}`,
          onClick: () => {
            confirmationActivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
        }
      : null,
    canDeactivate
      ? {
          label: "Désactiver le compte",
          ariaLabel: `Désactiver le compte de l'entreprise ${row.establishment_raison_sociale}`,
          type: "button",
          onClick: () => {
            confirmationDesactivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
        }
      : null,
  ]

  return <PopoverMenu actions={actions.filter((action) => action !== null)} title={`Actions sur le compte de l'entreprise ${row.establishment_raison_sociale}`} />
}
