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

import { PopoverMenu, PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
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
  const { toast, ToastComponent } = useToast()
  const client = useQueryClient()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const [lat, lon] = (row.geo_coordinates ?? "").split(",")
  const cfaOptionParams =
    user.type === AUTHTYPE.ENTREPRISE
      ? {
          link: `${publicConfig.baseUrl}/espace-pro/entreprise/offre/${row._id}/mise-en-relation`,
          ariaLabel: "Lien vers les mise en relations avec des centres de formations",
          type: "link",
        }
      : {
          link: `${publicConfig.baseUrl}/recherche-formation?romes=${row.rome_code}&lon=${lon}&lat=${lat}`,
          ariaLabel: "Lien vers les formations - nouvelle fenêtre",
          type: "externalLink",
        }
  const directLink = `${publicConfig.baseUrl}${buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, row._id, row.rome_appellation_label || undefined)}`
  const isDisabled = row.job_status === "Annulée" || row.job_status === "Pourvue" || row.job_status === "En attente"

  const actions: PopoverMenuAction[] = [
    {
      label: "Editer l'offre",
      onClick: () => router.push(buildOfferEditionUrl(row._id)),
      type: "button",
    },
    {
      label: "Prolonger l'offre",
      onClick: () => {
        extendOffre(row._id)
          .then((job) =>
            toast({
              title: `Date d'expiration : ${dayjs(job.job_expiration_date).format("DD/MM/YYYY")}`,
              status: "success",
            })
          )
          .finally(() =>
            client.invalidateQueries({
              queryKey: ["offre-liste"],
            })
          )
      },
      type: "button",
    },
    {
      label: "Voir l'offre en ligne",
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
          <Typography component="span" ml={fr.spacing("1w")} fontSize="14px" mb={0} color="#18753C">
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
      ariaLabel: "Copier le lien de partage de l'offre dans le presse papier",
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
      onClick: (e) => {
        e.preventDefault()
        e.stopPropagation()
        openSuppression(row)
      },
      type: "button",
    },
  ]

  return (
    !isDisabled && (
      <>
        {ToastComponent}
        <PopoverMenu actions={actions} title="Actions sur l'offre" resetFlagsOnClose={[setCopied]} />
      </>
    )
  )
}
