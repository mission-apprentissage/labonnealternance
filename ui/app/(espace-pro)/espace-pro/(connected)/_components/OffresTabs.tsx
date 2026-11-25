"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { IJobJson, IRecruiterJson, JOB_START_TYPE } from "shared"
import { JOB_STATUS } from "shared"
import { AUTHTYPE, RECRUITER_STATUS } from "shared/constants/index"
import { getApplicationsConsultation, type IOfferClosure } from "shared/utils/applications-consultation"
import Badge from "@/app/(espace-pro)/_components/Badge"
import Table from "@/app/(espace-pro)/_components/Table"
import { OffreProlongationModal } from "@/app/(espace-pro)/espace-pro/(connected)/_components/OffreProlongationModal"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/UserContext"
import { extendOffre, getModerationSummaries } from "@/utils/api"
import { getApplicationPages } from "@/utils/application-breadcrumb.utils"
import { sortReactTableDate } from "@/utils/date-utils"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"
import ConfirmationSuppressionOffre from "./ConfirmationSuppressionOffre"
import { ConformityWithAgentNote } from "./moderation/AgentNote"
import { awaitsModerationDecision } from "./moderation/moderation.types"
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
      <Badge variant="awaiting" whiteSpace="normal" textTransform="uppercase">
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

type LocalJob = Omit<IJobJson, "_id"> & {
  candidatures: number
  candidatures_en_attente: number
  job_closure?: IOfferClosure | null
  geo_coordinates: string
  _id: string
}

const getJobTitle = ({ offer_title_custom, rome_appellation_label, rome_label }: Pick<LocalJob, "offer_title_custom" | "rome_appellation_label" | "rome_label">) =>
  offer_title_custom ?? rome_appellation_label ?? rome_label

export const CandidaturesCell = ({ job, applicationsPath, userType }: { job: LocalJob; applicationsPath?: string; userType: string }) => {
  const total = Math.max(job.candidatures ?? 0, 0)
  if (total === 0) {
    return total
  }
  const consultation = getApplicationsConsultation({ expiration: job.job_expiration_date, closure: job.job_closure ?? null })
  const totalLabel =
    // Lien aussi passé le délai de consultation : la page explique pourquoi les candidatures ne sont plus disponibles.
    applicationsPath ? (
      <Link
        className="fr-link fr-link--sm"
        href={applicationsPath}
        onClick={() => pushMatomoEvent({ event: MATOMO_EVENTS.APPLICATIONS_ENTRY_CLICKED, applications_entry_point: "offers_table", user_type: userType })}
        aria-label={`${total} candidature${total > 1 ? "s" : ""}, voir les candidatures de l'offre ${getJobTitle(job)}`}
      >
        {total}
      </Link>
    ) : (
      total
    )
  // « En attente » tant que le recruteur peut encore répondre, offre close comprise.
  const pending = consultation.status === "unavailable" ? 0 : Math.max(job.candidatures_en_attente ?? 0, 0)
  const counts = (
    <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
      {totalLabel}
      {pending > 0 && (
        <Badge variant="awaiting" fontSize="12px">
          {pending}
          <span className="fr-sr-only"> en attente</span>
        </Badge>
      )}
    </Box>
  )
  if (consultation.status === "offer_open") {
    return counts
  }
  const [detail, color] =
    consultation.status === "unavailable"
      ? ["plus disponible", fr.colors.decisions.text.default.error.default]
      : [`consultables jusqu’au ${dayjs(consultation.until).format("DD/MM/YYYY")}`, fr.colors.decisions.text.mention.grey.default]

  return (
    <>
      {counts}
      <Box component="span" sx={{ display: "block", color }}>
        {detail}
      </Box>
    </>
  )
}

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
        return getJobTitle(data[id])
      },
      width: "340",
    },
    {
      Header: "Statut",
      id: "job_status",
      sortType: (a, b) => sortReactTableDate(a.original.job_status, b.original.job_status),
      accessor: ({ job_status }) => displayJobStatus(job_status, recruiter),
      width: "110",
    },
    {
      Header: "Postée le",
      id: "job_creation_date",
      width: "128",
      sortType: (a, b) => sortReactTableDate(a.original.job_creation_date, b.original.job_creation_date),
      accessor: ({ job_creation_date }) => dayjs(job_creation_date).format("DD/MM/YYYY"),
    },
    {
      Header: "Expire le",
      id: "job_expiration_date",
      width: "126",
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
          accessor: ({ _id }) => <ConformityWithAgentNote summary={summariesById.get(_id)} />,
        },
      ]
    : []
  // Les candidatures ne s'ouvrent qu'au recruteur et au CFA qui gère l'entreprise (cf. getJobApplicationsForRecruiter).
  const buildApplicationsPath = (job_id: string): string | undefined => {
    switch (user?.type) {
      case AUTHTYPE.ENTREPRISE:
        return getApplicationPages({ job_id }).applications.getPath()
      case AUTHTYPE.CFA:
        return getApplicationPages({ job_id, cfaEstablishmentId: recruiter.establishment_id }).applications.getPath()
      default:
        return undefined
    }
  }
  const statsColumns = showStats
    ? [
        {
          Header: "Recherches",
          id: "searches",
          width: "130",
          disableSortBy: true,
          accessor: ({ stats_search_view = 0 }) => stats_search_view,
        },
        {
          Header: "Vues",
          id: "views",
          width: "100",
          disableSortBy: true,
          accessor: ({ stats_detail_view = 0 }) => stats_detail_view,
        },
        {
          Header: (
            <>
              Candidatures
              <Box component="span" sx={{ display: "block", fontWeight: 400, color: fr.colors.decisions.text.mention.grey.default }}>
                dont en attente
              </Box>
            </>
          ),
          id: "candidat",
          width: "150",
          disableSortBy: true,
          accessor: ({ candidatures = 0 }) => Math.max(candidatures, 0),
          Cell: ({ row: { original } }: { row: { original: LocalJob } }) => (
            <CandidaturesCell job={original} applicationsPath={buildApplicationsPath(original._id)} userType={user?.type === AUTHTYPE.CFA ? "cfa" : "entreprise"} />
          ),
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
            applicationsPath={row.candidatures > 0 ? buildApplicationsPath(row._id) : undefined}
            openSuppression={openSuppression}
            buildOfferEditionUrl={buildOfferEditionUrl}
            row={row}
            hideCfaShareAction={hideCfaShareAction}
            isModerable={summariesById.has(row._id)}
            awaitsModerationDecision={awaitsModerationDecision(row.job_status, summariesById.get(row._id))}
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
