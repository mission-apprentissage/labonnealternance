"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Tooltip from "@codegouvfr/react-dsfr/Tooltip"
import { Box, Typography } from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useEffect, useState } from "react"
import type { IJobJson, IRecruiterJson, JOB_START_TYPE } from "shared"
import { JOB_STATUS } from "shared"
import { AUTHTYPE, RECRUITER_STATUS } from "shared/constants/index"
import Badge from "@/app/(espace-pro)/_components/Badge"
import Table from "@/app/(espace-pro)/_components/Table"
import { OffreProlongationModal } from "@/app/(espace-pro)/espace-pro/(connected)/_components/OffreProlongationModal"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/UserContext"
import { extendOffre, getModerationSummaries } from "@/utils/api"
import { sortReactTableDate } from "@/utils/date-utils"
import ConfirmationSuppressionOffre from "./ConfirmationSuppressionOffre"
import { getAgentNoteLines } from "./moderation/AgentNote"
import { ConformityBadge } from "./moderation/ModerationBadges"
import { OffresTabsMenu } from "./OffresTabsMenu"

const displayJobStatus = (status: JOB_STATUS, recruiter: IRecruiterJson) => {
  if (status === JOB_STATUS.POURVUE) {
    return (
      <Badge variant="active" textTransform="uppercase">
        {JOB_STATUS.POURVUE}
      </Badge>
    )
  }
  if (status === JOB_STATUS.ANNULEE) {
    return (
      <Badge variant="inactive" textTransform="uppercase">
        EXPIREE
      </Badge>
    )
  }
  if (recruiter.status === RECRUITER_STATUS.EN_ATTENTE_VALIDATION) {
    return (
      <Badge variant="awaiting" textTransform="uppercase">
        {RECRUITER_STATUS.EN_ATTENTE_VALIDATION}
      </Badge>
    )
  }
  if (recruiter.status === RECRUITER_STATUS.ARCHIVE) {
    return (
      <Badge variant="inactive" textTransform="uppercase">
        EXPIREE
      </Badge>
    )
  }
  switch (status) {
    case JOB_STATUS.ACTIVE:
      return (
        <Badge variant="neutral" textTransform="uppercase">
          {JOB_STATUS.ACTIVE}
        </Badge>
      )
    // En modération, l'offre attend une décision sur son contenu : même libellé que l'attente de validation du compte.
    case JOB_STATUS.EN_ATTENTE:
    case JOB_STATUS.EN_MODERATION:
      return (
        <Badge variant="awaiting" whiteSpace="normal" textTransform="uppercase">
          {RECRUITER_STATUS.EN_ATTENTE_VALIDATION}
        </Badge>
      )
    default:
      return null
  }
}

type LocalJob = Omit<IJobJson, "_id"> & { candidatures: number; geo_coordinates: string; _id: string }

export const OffresTabs = ({
  caption,
  recruiter,
  showStats = false,
  buildOfferEditionUrl,
  hideCfaShareAction = false,
}: {
  caption: string
  recruiter: IRecruiterJson
  showStats?: boolean
  buildOfferEditionUrl: (offerId: string) => string
  hideCfaShareAction?: boolean
}) => {
  /* @ts-ignore TODO */
  const jobs: LocalJob[] = recruiter?.jobs ?? []
  const searchParams = new URLSearchParams(window.location.search)
  const jobId = searchParams.get("jobId")
  const [currentOfferId, setCurrentOfferId] = useState<string | null>(jobId ?? null)

  // <Activity> garde ce tableau de bord monté au retour arrière (ex : créer une offre →
  // redirection ici avec ?jobId=A → retour → créer une autre offre → redirection ici avec
  // ?jobId=B, même URL de dashboard) — sans resync, l'onglet reste sur A alors que l'URL
  // pointe déjà vers B.
  useEffect(() => {
    setCurrentOfferId(jobId ?? null)
  }, [jobId])

  const currentOffre = jobs.find((job) => job._id === currentOfferId)

  const confirmationSuppression = useDisclosure(Boolean(searchParams.get("action") === "cloturer" && currentOffre))
  const offreProlongationModalControls = useDisclosure(Boolean(searchParams.get("action") === "prolonger" && currentOffre))
  const toast = useToast()
  const client = useQueryClient()
  const { user } = useAuth()
  const isModerator = user?.type === AUTHTYPE.ADMIN || user?.type === AUTHTYPE.OPCO
  // La route n'accepte que 200 identifiants : au-delà, les offres les plus anciennes restent sans conformité affichée.
  const moderationJobIds = jobs.map(({ _id }) => _id).slice(0, 200)
  const { data: moderationSummaries } = useQuery({
    queryKey: ["moderation-summaries", moderationJobIds],
    queryFn: () => getModerationSummaries(moderationJobIds),
    enabled: isModerator && moderationJobIds.length > 0,
  })

  if (jobs.length === 0) {
    return (
      <Box sx={{ py: fr.spacing("6v"), backgroundColor: "#F5F5FE" }}>
        <Box sx={{ display: "flex", width: "fit-content", m: "auto", alignItems: "center" }}>
          <Image src="/images/espace_pro/no-job.svg" alt="" aria-hidden={true} width="118" height="70" />
          <Typography
            component="span"
            sx={{
              ml: fr.spacing("2v"),
              fontWeight: 700,
              color: "#161616",
            }}
          >
            Aucune offre déposée
          </Typography>
        </Box>
      </Box>
    )
  }

  const jobsWithGeoCoords = jobs.map((job) => ({ ...job, geo_coordinates: recruiter.geo_coordinates }))

  const openSuppression = (row: LocalJob) => {
    setCurrentOfferId(row._id)
    confirmationSuppression.onOpen()
  }

  const onOffreProlongationSubmit = ({
    job_start_date,
    job_start_date_flexible,
    job_start_type,
  }: {
    job_start_type: JOB_START_TYPE
    job_start_date_flexible: boolean
    job_start_date: string
  }) => {
    if (!currentOffre) {
      return
    }
    const id = currentOffre._id
    extendOffre(id, { job_start_date, job_start_date_flexible, job_start_type })
      .then((job) => {
        setCurrentOfferId(null)
        offreProlongationModalControls.onClose()
        toast({
          title: `Offre mise à jour avec succès. Nouvelle date d’expiration : ${dayjs(job.job_expiration_date).format("DD/MM/YYYY")}`,
        })
      })
      .finally(async () => {
        client.invalidateQueries({
          queryKey: ["offre-liste"],
        })
      })
  }

  const commonColumns = [
    {
      Header: "Métier",
      id: "job_title",
      accessor: "rome_label",
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { rome_label, rome_appellation_label, offer_title_custom } = data[id]
        return offer_title_custom ?? rome_appellation_label ?? rome_label
      },
      width: "300",
      maxWidth: "300",
    },
    {
      Header: "Statut",
      id: "job_status",
      sortType: (a, b) => sortReactTableDate(a.original.job_status, b.original.job_status),
      accessor: ({ job_status }) => displayJobStatus(job_status, recruiter),
      width: "150",
      maxWidth: "150",
    },
    {
      Header: "Postée le",
      id: "job_creation_date",
      sortType: (a, b) => sortReactTableDate(a.original.job_creation_date, b.original.job_creation_date),
      accessor: ({ job_creation_date }) => dayjs(job_creation_date).format("DD/MM/YYYY"),
    },
    {
      Header: "Expire le",
      id: "job_expiration_date",
      width: "175",
      sortType: (a, b) => sortReactTableDate(a.original.job_expiration_date, b.original.job_expiration_date),
      accessor: ({ job_expiration_date }) => dayjs(job_expiration_date).format("DD/MM/YYYY"),
    },
  ]
  const summariesById = new Map((moderationSummaries?.jobs ?? []).map((summary) => [summary._id, summary]))
  const conformityColumns = isModerator
    ? [
        {
          Header: "Conformité",
          id: "conformity",
          width: "190",
          disableSortBy: true,
          accessor: ({ _id }) => <ConformityCell summary={summariesById.get(_id)} />,
        },
      ]
    : []
  const statsColumns = showStats
    ? [
        {
          Header: "Recherches",
          id: "searches",
          width: "170",
          accessor: ({ stats_search_view = 0 }) => {
            return <NumberCell>{stats_search_view}</NumberCell>
          },
        },
        {
          Header: "Vues",
          id: "views",
          width: "120",
          accessor: ({ stats_detail_view = 0 }) => {
            return <NumberCell>{stats_detail_view}</NumberCell>
          },
        },
        {
          Header: "Candidats",
          id: "candidat",
          width: "170",
          accessor: ({ candidatures = 0 }) => <NumberCell>{Math.max(candidatures, 0)}</NumberCell>,
        },
      ]
    : []

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "48",
      margin: "auto",
      srOnly: "Actions sur les offres",
      disableFilters: true,
      disableSortBy: true,
      accessor: (row) => {
        return (
          <OffresTabsMenu
            openSuppression={openSuppression}
            buildOfferEditionUrl={buildOfferEditionUrl}
            row={row}
            hideCfaShareAction={hideCfaShareAction}
            isModerable={summariesById.has(row._id)}
            onOffreProlongationClick={() => {
              setCurrentOfferId(row._id)
              offreProlongationModalControls.onOpen()
            }}
          />
        )
      },
    },
    ...commonColumns.slice(0, 2),
    ...conformityColumns,
    ...commonColumns.slice(2),
    ...statsColumns,
  ]

  return (
    <>
      <OffreProlongationModal modalControls={offreProlongationModalControls} onOffreProlongationSubmit={onOffreProlongationSubmit} />
      {currentOffre && <ConfirmationSuppressionOffre {...confirmationSuppression} offre={currentOffre} />}
      <Table caption={caption} columns={columns} data={jobsWithGeoCoords} />
    </>
  )
}

type IModerationSummaryJson = NonNullable<Awaited<ReturnType<typeof getModerationSummaries>>>["jobs"][number]

/**
 * Conformité de l'offre et la note de l'agent derrière un bouton d'information (#5499) : une infobulle au survol
 * se poserait sur un élément non focalisable, inaccessible au clavier.
 */
const ConformityCell = ({ summary }: { summary: IModerationSummaryJson | undefined }) => {
  const badge = <ConformityBadge verdict={summary?.offer_moderation_verdict} status={summary?.offer_moderation_status} />
  if (!summary?.offer_moderation_verdict || summary.offer_moderation_status !== "ok") return badge
  const title = (
    <>
      <strong>Note de l’agent :</strong>
      {getAgentNoteLines(summary.findings).map((line) => (
        <span key={line} style={{ display: "block" }}>
          {line}
        </span>
      ))}
    </>
  )
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: fr.spacing("1v") }}>
      {badge}
      <Tooltip kind="click" title={title} />
    </Box>
  )
}

const NumberCell = ({ children }) => {
  return (
    <Typography component="span" sx={{ textAlign: "right", width: "100%", pr: fr.spacing("4v") }}>
      <Badge variant="stat_number">{children}</Badge>
    </Typography>
  )
}
