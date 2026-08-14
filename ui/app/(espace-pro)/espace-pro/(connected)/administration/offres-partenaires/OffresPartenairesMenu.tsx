import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferForAdminJSON } from "shared/models/jobs-partners.model"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import type { useDisclosure } from "@/app/hooks/use-disclosure"
import { useJobsPartnersAdminActions } from "@/app/hooks/use-jobs-partners-admin-actions"

type DisclosureReturn = ReturnType<typeof useDisclosure>

export const OffresPartenairesMenu = ({
  row,
  setCurrentOffer,
  confirmationDesactivationOffre,
  confirmationClassificationOffre,
}: {
  row: IJobsPartnersOfferForAdminJSON
  setCurrentOffer: (offer: IJobsPartnersOfferForAdminJSON | null) => void
  confirmationDesactivationOffre: DisclosureReturn
  confirmationClassificationOffre: DisclosureReturn
}) => {
  const { activate } = useJobsPartnersAdminActions()
  const isCfaFlagged = row.classification?.human_verification === "unpublish"

  const actions: PopoverMenuAction[] = [
    row.lba_url
      ? {
          label: "Voir l'offre",
          type: "externalLink",
          ariaLabel: `Voir l'offre ${row.offer_title} dans un nouvel onglet`,
          link: row.lba_url,
        }
      : null,
    row.offer_status !== JOB_STATUS_ENGLISH.ACTIVE
      ? {
          label: "Activer l'offre",
          type: "button",
          ariaLabel: `Activer l'offre ${row.offer_title}`,
          onClick: () => activate(row._id),
        }
      : null,
    row.offer_status === JOB_STATUS_ENGLISH.ACTIVE
      ? {
          label: "Désactiver l'offre",
          type: "button",
          ariaLabel: `Désactiver l'offre ${row.offer_title}`,
          onClick: () => {
            setCurrentOffer(row)
            confirmationDesactivationOffre.onOpen()
          },
        }
      : null,
    {
      label: isCfaFlagged ? "Retirer le signalement CFA" : "Signaler comme offre de CFA",
      type: "button",
      ariaLabel: `${isCfaFlagged ? "Retirer le signalement CFA de" : "Signaler comme offre de CFA"} l'offre ${row.offer_title}`,
      onClick: () => {
        setCurrentOffer(row)
        confirmationClassificationOffre.onOpen()
      },
    },
  ]

  return <PopoverMenu actions={actions.filter((action) => action !== null)} title={`Actions sur l'offre ${row.offer_title}`} />
}
