import type { IRecruiterJson } from "shared"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PAGES } from "@/utils/routes.utils"

export const CfaHomeEntrepriseMenu = ({
  row,
  setCurrentEntreprise,
  confirmationSuppression,
}: {
  row: any
  setCurrentEntreprise: (entreprise: IRecruiterJson | null) => void
  confirmationSuppression: any
}) => {
  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les offres",
      ariaLabel: `Voir les offres de l'entreprise ${row.establishment_raison_sociale}`,
      link: PAGES.dynamic.backCfaPageEntreprise(row.establishment_id).getPath(),
      type: "link",
    },
    {
      label: "Supprimer l'entreprise",
      ariaLabel: `Supprimer l'entreprise ${row.establishment_raison_sociale}`,
      onClick: () => {
        confirmationSuppression.onOpen()
        setCurrentEntreprise(row)
      },
      type: "button",
    },
  ]
  return <PopoverMenu actions={actions} title={`Actions sur l'entreprise ${row.establishment_raison_sociale}`} />
}
