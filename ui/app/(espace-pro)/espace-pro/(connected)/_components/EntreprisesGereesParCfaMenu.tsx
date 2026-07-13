import type { IRecruiterJson } from "shared"
import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { DsfrIcon } from "@/components/DsfrIcon"
import { PAGES } from "@/utils/routes.utils"

export const EntreprisesGereesParCfaMenu = ({
  row,
  userId,
  setCurrentEntreprise,
  confirmationSuppression,
}: {
  row: IRecruiterJson
  userId: string
  setCurrentEntreprise: (entreprise: IRecruiterJson | null) => void
  confirmationSuppression: { onOpen: () => void }
}) => {
  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les informations",
      ariaLabel: `Voir les informations de l'entreprise ${row.establishment_raison_sociale}`,
      link: PAGES.dynamic.backAdminUserCfa({ user_id: userId }).getPath(),
      type: "link",
      icon: <DsfrIcon name="fr-icon-eye-line" size={16} />,
    },
    {
      label: "Supprimer l'entreprise",
      ariaLabel: `Supprimer l'entreprise ${row.establishment_raison_sociale}`,
      onClick: () => {
        confirmationSuppression.onOpen()
        setCurrentEntreprise(row)
      },
      type: "button",
      icon: <DsfrIcon name="fr-icon-delete-line" size={16} />,
    },
  ]
  return <PopoverMenu actions={actions} title={`Actions sur l'entreprise ${row.establishment_raison_sociale}`} />
}
