import { IRecruiterJson } from "shared"

import { PopoverMenu, PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
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
      link: PAGES.dynamic.backCfaPageEntreprise(row.establishment_id).getPath(),
      type: "link",
    },
    {
      label: "Supprimer l'entreprise",
      onClick: () => {
        confirmationSuppression.onOpen()
        setCurrentEntreprise(row)
      },
      type: "button",
    },
  ]
  return <PopoverMenu actions={actions} title={"Actions sur l'entreprise"} />
}
