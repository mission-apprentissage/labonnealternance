import { getLastStatusEvent } from "shared"
import type { IUserRecruteurForAdminJSON, IUserStatusValidationJson } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PAGES } from "@/utils/routes.utils"

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
      link: PAGES.dynamic.backOpcoInformationEntreprise({ user_id: row._id as string }).getPath(),
      type: "link",
    },
    canActivate
      ? {
          label: "Activer le compte",
          onClick: () => {
            confirmationActivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
          type: "button",
        }
      : null,
    canDeactivate
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
