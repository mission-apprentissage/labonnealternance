import type { IRecruiterJson } from "shared"
import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { DsfrIcon } from "@/components/DsfrIcon"
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
  // cf. administration/users/_component/UserMenu
  const entrepriseLabel = row.establishment_raison_sociale || `SIRET ${row.establishment_siret}`
  const actions: PopoverMenuAction[] = [
    {
      label: "Voir les offres",
      hint: entrepriseLabel,
      link: PAGES.dynamic.backCfaPageEntreprise(row.establishment_id).getPath(),
      type: "link",
      icon: <DsfrIcon name="fr-icon-briefcase-line" size={16} />,
    },
    {
      label: "Supprimer l'entreprise",
      hint: entrepriseLabel,
      onClick: () => {
        confirmationSuppression.onOpen()
        setCurrentEntreprise(row)
      },
      type: "button",
      icon: <DsfrIcon name="fr-icon-delete-line" size={16} />,
    },
  ]
  return <PopoverMenu actions={actions} title={`Actions sur l'entreprise ${entrepriseLabel}`} />
}
