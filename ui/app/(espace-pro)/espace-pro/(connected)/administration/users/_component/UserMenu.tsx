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

  // raison sociale facultative : sans repli, le nom du menu devient « … entreprise null »
  const entrepriseLabel = row.establishment_raison_sociale || `SIRET ${row.establishment_siret}`
  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les informations",
      hint: entrepriseLabel,
      type: "link",
      link: `/espace-pro/administration/users/${row._id}?organizationId=${row.organizationId || "unused"}`,
    },
    canActivate
      ? {
          label: "Activer le compte",
          type: "button",
          hint: entrepriseLabel,
          onClick: () => {
            confirmationActivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
        }
      : null,
    canDeactivate
      ? {
          label: "Désactiver le compte",
          hint: entrepriseLabel,
          type: "button",
          onClick: () => {
            confirmationDesactivationUtilisateur.onOpen()
            setCurrentEntreprise(row)
          },
        }
      : null,
  ]

  return <PopoverMenu actions={actions.filter((action) => action !== null)} title={`Actions sur le compte de l'entreprise ${entrepriseLabel}`} />
}
