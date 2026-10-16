import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { JOB_STATUS } from "shared"
import { AUTHTYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrlPath } from "shared/metier/lbaitemutils"
import { buildSearchUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"
import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { DsfrIcon } from "@/components/DsfrIcon"
import { publicConfig } from "@/config.public"
import { useAuth } from "@/context/UserContext"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"

export const OffresTabsMenu = ({
  row,
  openSuppression,
  buildOfferEditionUrl,
  onOffreProlongationClick,
  hideCfaShareAction = false,
  isModerable = false,
}: {
  row: any
  openSuppression: (row: any) => any
  buildOfferEditionUrl: (offerId: string) => string
  onOffreProlongationClick: (offerId: string) => void
  hideCfaShareAction?: boolean
  /** L'offre est dans le périmètre de modération de l'utilisateur : sinon la page de modération renverrait 403. */
  isModerable?: boolean
}) => {
  const router = useRouter()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const [rawLat, rawLon] = (row.geo_coordinates ?? "").split(",")
  const lat = Number(rawLat)
  const lon = Number(rawLon)
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lon)

  const offerTitle = row?.offer_title_custom ?? row?.rome_appellation_label ?? row?.rome_label

  const cfaOptionParams =
    user.type === AUTHTYPE.ENTREPRISE
      ? {
          link: `${publicConfig.baseUrl}/espace-pro/entreprise/offre/${row._id}/mise-en-relation`,
          hint: `${offerTitle}`,
          type: "link",
        }
      : {
          link: `${publicConfig.baseUrl}${buildSearchUrl({ mode: "formations", q: offerTitle, radius: 20, page: 0, hitsPerPage: 20, ...(hasGeo ? { latitude: lat, longitude: lon } : {}) })}`,
          hint: `${offerTitle}`,
          type: "externalLink",
        }
  const directLink = `${publicConfig.baseUrl}${buildJobUrlPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, row._id, row.rome_appellation_label || undefined)}`
  const isDisabled = row.job_status === "Annulée" || row.job_status === "Pourvue"
  // Une offre en modération n'a pas de page publique, ses liens mèneraient à une 404 ; elle ne se prolonge ni ne se
  // partage avant sa publication, et un modérateur la refuse depuis la modération plutôt que de la supprimer (#5499).
  const isInReview = row.job_status === JOB_STATUS.EN_MODERATION
  const isModerator = user.type === AUTHTYPE.ADMIN || user.type === AUTHTYPE.OPCO

  const actions: PopoverMenuAction[] = [
    isModerator && isModerable
      ? {
          label: "Modérer l'offre",
          hint: `${offerTitle}`,
          link: MODERATION_PAGES.offre({ job_id: row._id, userType: user.type as "ADMIN" | "OPCO" }).getPath(),
          type: "link",
          icon: <DsfrIcon name="fr-icon-scales-3-line" size={16} />,
        }
      : null,
    {
      label: "Éditer l'offre",
      hint: `${offerTitle}`,
      onClick: () => {
        pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_EDIT_CLICKED })
        router.push(buildOfferEditionUrl(row._id))
      },
      type: "button",
      icon: <DsfrIcon name="fr-icon-edit-line" size={16} />,
    },
    isInReview
      ? null
      : {
          label: "Prolonger l'offre",
          hint: `${offerTitle}`,
          onClick: () => {
            pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_EXTEND_CLICKED })
            onOffreProlongationClick(row._id)
          },
          type: "button",
          icon: <DsfrIcon name="fr-icon-refresh-line" size={16} />,
        },
    isInReview
      ? null
      : {
          label: "Voir l'offre en ligne",
          hint: `${offerTitle}`,
          link: directLink,
          type: "externalLink",
          onClick: () => pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_VIEW_ONLINE_CLICKED }),
          icon: <DsfrIcon name="fr-icon-eye-line" size={16} />,
        },
    row.job_status !== JOB_STATUS.EN_ATTENTE && !isInReview
      ? {
          label: "Imprimer l'offre",
          hint: `${offerTitle}`,
          link: `${publicConfig.baseUrl}/espace-pro/offre/impression/${row._id}`,
          onClick: () => pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_PRINT_CLICKED }),
          icon: <DsfrIcon name="fr-icon-printer-line" size={16} />,
          type: "externalLink",
        }
      : null,
    isInReview
      ? null
      : {
          label: copied ? <Box color={fr.colors.decisions.text.default.success.default}>Lien copié</Box> : "Copier le lien de l'offre",
          onClick: (e) => {
            e.preventDefault()
            e.stopPropagation()
            navigator.clipboard.writeText(directLink).then(function () {
              pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_LINK_COPIED })
              setCopied(true)
            })
          },
          hint: `${offerTitle}`,
          type: "button",
          icon: (
            <Box color={copied ? fr.colors.decisions.text.default.success.default : undefined}>
              <DsfrIcon name="fr-icon-link" size={16} />
            </Box>
          ),
        },
    user.type !== AUTHTYPE.CFA && !hideCfaShareAction && !isInReview
      ? ({
          label: "Partager aux CFA à proximité",
          link: cfaOptionParams.link,
          type: cfaOptionParams.type,
          hint: cfaOptionParams.hint,
          onClick: () => pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_CFA_SHARE_CLICKED }),
          icon: <DsfrIcon name="fr-icon-presentation-line" size={16} />,
        } as PopoverMenuAction)
      : null,
    isInReview && isModerator
      ? null
      : {
          label: "Supprimer l'offre",
          hint: `${offerTitle}`,
          onClick: (e) => {
            e.preventDefault()
            e.stopPropagation()
            pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_DELETE_CLICKED })
            openSuppression(row)
          },
          type: "button",
          icon: <DsfrIcon name="fr-icon-delete-line" size={16} />,
        },
  ]

  return !isDisabled && <PopoverMenu actions={actions} title={`Actions sur l'offre ${offerTitle}`} resetFlagsOnClose={[setCopied]} />
}
