import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { JOB_STATUS } from "shared"
import { AUTHTYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrl } from "shared/metier/lbaitemutils"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { useToast } from "@/app/hooks/useToast"
import { publicConfig } from "@/config.public"
import { useAuth } from "@/context/UserContext"
import { extendOffre } from "@/utils/api"

export const OffresTabsMenu = ({
  row,
  openSuppression,
  buildOfferEditionUrl,
}: {
  row: any
  openSuppression: (row: any) => any
  buildOfferEditionUrl: (offerId: string) => string
}) => {
  const router = useRouter()
  const toast = useToast()
  const client = useQueryClient()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const [lat, lon] = (row.geo_coordinates ?? "").split(",")

  const offerTitle = row?.offer_title_custom ?? row?.rome_appellation_label ?? row?.rome_label

  const cfaOptionParams =
    user.type === AUTHTYPE.ENTREPRISE
      ? {
          link: `${publicConfig.baseUrl}/espace-pro/entreprise/offre/${row._id}/mise-en-relation`,
          ariaLabel: `Lien vers les mises en relation avec des centres de formation pour l'offre ${offerTitle}`,
          type: "link",
        }
      : {
          link: `${publicConfig.baseUrl}/recherche-formation?romes=${row.rome_code}&lon=${lon}&lat=${lat}`,
          ariaLabel: `Lien vers les formations pour l'offre ${offerTitle} - nouvelle fenêtre`,
          type: "externalLink",
        }
  const directLink = `${publicConfig.baseUrl}${buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, row._id, row.rome_appellation_label || undefined)}`
  const isDisabled = row.job_status === "Annulée" || row.job_status === "Pourvue"

  const actions: PopoverMenuAction[] = [
    {
      label: "Editer l'offre",
      ariaLabel: `Éditer l'offre ${offerTitle}`,
      onClick: () => router.push(buildOfferEditionUrl(row._id)),
      type: "button",
    },
    {
      label: "Prolonger l'offre",
      ariaLabel: `Prolonger l'offre ${offerTitle}`,
      onClick: () => {
        extendOffre(row._id)
          .then((job) =>
            toast({
              title: `Date d'expiration : ${dayjs(job.job_expiration_date).format("DD/MM/YYYY")}`,
            })
          )
          .finally(async () =>
            client.invalidateQueries({
              queryKey: ["offre-liste"],
            })
          )
      },
      type: "button",
    },
    {
      label: "Voir l'offre en ligne",
      ariaLabel: `Voir l'offre ${offerTitle} en ligne - nouvelle fenêtre`,
      link: directLink,
      type: "link",
    },
    row.job_status !== JOB_STATUS.EN_ATTENTE
      ? {
          label: "Imprimer l'offre",
          ariaLabel: "Lien vers la page d'impression de l'offre - nouvelle fenêtre",
          link: `${publicConfig.baseUrl}/espace-pro/offre/impression/${row._id}`,
          type: "externalLink",
        }
      : null,
    {
      label: copied ? (
        <Box sx={{ display: "flex" }}>
          <Image width="17" height="24" src="/images/icons/share_copied_icon.svg" aria-hidden={true} alt="" />
          <Typography
            component="span"
            sx={{
              ml: fr.spacing("1w"),
              fontSize: "14px",
              mb: 0,
              color: "#18753C",
            }}
          >
            Lien copié !
          </Typography>
        </Box>
      ) : (
        "Partager l'offre"
      ),
      onClick: (e) => {
        e.preventDefault()
        e.stopPropagation()
        navigator.clipboard.writeText(directLink).then(function () {
          setCopied(true)
        })
      },
      ariaLabel: copied ? "Lien de partage de l'offre copié dans le presse-papiers" : `Partager le lien de l'offre ${offerTitle}`,
      type: "button",
    },
    user.type !== AUTHTYPE.CFA
      ? ({
          label: "Voir les centres de formation",
          link: cfaOptionParams.link,
          type: cfaOptionParams.type,
          ariaLabel: cfaOptionParams.ariaLabel,
        } as PopoverMenuAction)
      : null,
    {
      label: "Supprimer l'offre",
      ariaLabel: `Supprimer l'offre ${offerTitle}`,
      onClick: (e) => {
        e.preventDefault()
        e.stopPropagation()
        openSuppression(row)
      },
      type: "button",
    },
  ]

  return !isDisabled && <PopoverMenu actions={actions} title={`Actions sur l'offre ${offerTitle}`} resetFlagsOnClose={[setCopied]} />
}
