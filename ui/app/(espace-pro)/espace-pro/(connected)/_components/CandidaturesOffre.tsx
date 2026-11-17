"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Link from "next/link"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrlPath } from "shared/metier/lbaitemutils"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { APPLICATIONS_CONSULTATION_MONTHS_AFTER_CLOSURE, getApplicationsConsultation } from "shared/utils/applications-consultation"
import { getApplicationsExportFileName } from "shared/utils/applications-export"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import Badge from "@/app/(espace-pro)/_components/Badge"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import Table from "@/app/(espace-pro)/_components/Table"
import { getApplicationStatus } from "@/app/(espace-pro)/espace-pro/(connected)/_components/application-status"
import ConfirmationSuppressionOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/ConfirmationSuppressionOffre"
import { DownloadLink } from "@/app/(espace-pro)/espace-pro/(connected)/_components/DownloadLink"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { publicConfig } from "@/config.public"
import { downloadJobApplications, getFormulaire, getJobApplications, getJobApplicationsExportUrl } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const APPLICATIONS_PAGE_SIZE = 20

type JobApplication = Awaited<ReturnType<typeof getJobApplications>>["applications"][number]

const getApplicantFullName = ({ applicant_first_name, applicant_last_name }: JobApplication) => `${applicant_first_name} ${applicant_last_name.toUpperCase()}`

const getColumns = (buildApplicationPath: (applicationId: string) => string) => [
  {
    Header: "Prénom",
    id: "applicant_first_name",
    accessor: "applicant_first_name",
    width: "180",
    Cell: ({ value }) => <Box sx={{ fontWeight: 400 }}>{value}</Box>,
  },
  {
    Header: "Nom",
    id: "applicant_last_name",
    accessor: "applicant_last_name",
    width: "220",
    Cell: ({ value }) => <Box sx={{ fontWeight: 700, textTransform: "uppercase" }}>{value}</Box>,
  },
  {
    Header: "Statut",
    id: "status",
    width: "150",
    accessor: ({ company_recruitment_intention }: JobApplication) => getApplicationStatus(company_recruitment_intention).label,
    Cell: ({ row: { original } }: { row: { original: JobApplication } }) => {
      const { label, variant } = getApplicationStatus(original.company_recruitment_intention)
      return (
        <Badge variant={variant} textTransform="uppercase" whiteSpace="normal">
          {label}
        </Badge>
      )
    },
  },
  {
    Header: "Date de candidature",
    id: "created_at",
    width: "170",
    accessor: "created_at",
    sortType: (a, b) => dayjs(a.original.created_at).valueOf() - dayjs(b.original.created_at).valueOf(),
    Cell: ({ value }) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
  },
  {
    Header: "",
    id: "action",
    srOnly: "Actions sur la candidature",
    width: "230",
    disableSortBy: true,
    accessor: () => null,
    Cell: ({ row: { original } }: { row: { original: JobApplication } }) => (
      <Button
        priority="secondary"
        size="small"
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        linkProps={{ href: buildApplicationPath(original._id), "aria-label": `Voir la candidature de ${getApplicantFullName(original)}` }}
      >
        Voir la candidature
      </Button>
    ),
  },
]

/** Sans `cfaEstablishmentId`, page du recruteur ; avec, page du CFA pour l'entreprise qu'il gère. */
export const CandidaturesOffre = ({ job_id, cfaEstablishmentId }: { job_id: string; cfaEstablishmentId?: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["job-applications", job_id],
    queryFn: () => getJobApplications(job_id),
    retry: false,
  })
  // Même clé que la page entreprise du CFA : le nom de l'entreprise y est déjà en cache.
  const { data: recruiter } = useQuery({
    queryKey: ["recruiter", cfaEstablishmentId],
    queryFn: () => getFormulaire(cfaEstablishmentId),
    enabled: Boolean(cfaEstablishmentId),
  })

  const breadcrumbPages = cfaEstablishmentId
    ? [
        PAGES.static.backCfaHome,
        PAGES.dynamic.backCfaPageEntreprise(cfaEstablishmentId, recruiter?.establishment_raison_sociale ?? recruiter?.establishment_siret),
        PAGES.dynamic.backCfaEntrepriseCandidaturesOffre({ establishment_id: cfaEstablishmentId, job_id }),
      ]
    : [{ ...PAGES.static.backHomeEntreprise, title: "Entreprise" }, PAGES.dynamic.backEntrepriseCandidaturesOffre({ job_id })]
  const backPath = cfaEstablishmentId ? PAGES.dynamic.backCfaPageEntreprise(cfaEstablishmentId).getPath() : PAGES.static.backHomeEntreprise.getPath()

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  return (
    <>
      <Breadcrumb pages={breadcrumbPages} />
      <Box sx={{ width: "100%", maxWidth: "1280px", my: fr.spacing("3v"), px: fr.spacing("4v") }}>
        {error || !data ? (
          <>
            <Typography component="h1" sx={{ fontSize: "2rem", fontWeight: 700, mb: fr.spacing("4v") }}>
              Candidatures
            </Typography>
            <Alert severity="error" small description={error?.message ?? "Les candidatures de cette offre sont indisponibles."} />
          </>
        ) : (
          <CandidaturesOffreContent
            data={data}
            buildApplicationPath={(application_id) =>
              (cfaEstablishmentId
                ? PAGES.dynamic.backCfaEntrepriseCandidatureDetail({ establishment_id: cfaEstablishmentId, job_id, application_id })
                : PAGES.dynamic.backEntrepriseCandidatureDetail({ job_id, application_id })
              ).getPath()
            }
          />
        )}
        <Box sx={{ mt: fr.spacing("2v") }}>
          <Link className="fr-link fr-link--sm fr-link--icon-left fr-icon-arrow-left-line" href={backPath}>
            Retour à mes offres
          </Link>
        </Box>
      </Box>
    </>
  )
}

const CandidaturesOffreContent = ({
  data,
  buildApplicationPath,
}: {
  data: Awaited<ReturnType<typeof getJobApplications>>
  buildApplicationPath: (applicationId: string) => string
}) => {
  const { job, applications } = data
  const closureModal = useDisclosure()
  const isClosed = job.offer_status === JOB_STATUS_ENGLISH.POURVUE || job.offer_status === JOB_STATUS_ENGLISH.ANNULEE
  const offerUrl = `${publicConfig.baseUrl}${buildJobUrlPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id, job.offer_rome_appellation || undefined)}`

  return (
    <>
      <ConfirmationSuppressionOffre {...closureModal} offre={{ _id: job._id }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: fr.spacing("4v"), alignItems: "center", flexWrap: "wrap" }}>
        <Typography component="h1" sx={{ fontSize: "2rem", fontWeight: 700 }}>
          Candidatures
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: fr.spacing("4v"), flexWrap: "wrap" }}>
          <Button
            priority="secondary"
            iconId="fr-icon-external-link-line"
            iconPosition="right"
            linkProps={{ href: offerUrl, target: "_blank", rel: "noopener noreferrer", title: "Voir l'offre en ligne - nouvelle fenêtre" }}
          >
            Voir l'offre en ligne
          </Button>
          <Button disabled={isClosed} onClick={closureModal.onOpen}>
            Clôturer le recrutement
          </Button>
        </Box>
      </Box>
      <Box sx={{ mt: fr.spacing("4v"), mb: fr.spacing("4v"), display: "flex", justifyContent: "space-between", alignItems: "center", gap: fr.spacing("4v"), flexWrap: "wrap" }}>
        {/* "&&" passe devant la taille des h2 imposée par DepotSimplifieStyling. */}
        <Typography component="h2" sx={{ "&&": { fontSize: "1rem", lineHeight: "1.5rem" }, fontWeight: 400, m: 0 }}>
          Offre : <strong>{job.offer_title}</strong>
        </Typography>
        <DownloadApplicationsLink jobId={job._id} offerTitle={job.offer_title} />
      </Box>
      <ConsultationDeadlineAlert expiration={job.offer_expiration} closure={job.closure} />
      {/* La marge basse du .fr-table DSFR éloignerait le lien de retour posé juste sous le tableau. */}
      <Box sx={{ "& .fr-table": { mb: 0 } }}>
        <Table
          caption="Liste des candidatures"
          captionSrOnly
          columns={getColumns(buildApplicationPath)}
          data={applications}
          pageSize={APPLICATIONS_PAGE_SIZE}
          rowHeaderColumnIds={["applicant_first_name", "applicant_last_name"]}
          initialSortBy={[{ id: "created_at", desc: true }]}
        />
      </Box>
    </>
  )
}

const OFFER_END_LABELS = {
  filled: "est pourvue depuis le",
  cancelled: "est annulée depuis le",
  expired: "a expiré ou a été fermée le",
} as const

/** Offre clôturée ou expirée : prévient de la date à laquelle ses candidatures ne seront plus consultables. */
type JobApplicationsData = Awaited<ReturnType<typeof getJobApplications>>

const ConsultationDeadlineAlert = ({ expiration, closure }: { expiration: string | null; closure: JobApplicationsData["job"]["closure"] }) => {
  const consultation = getApplicationsConsultation({ expiration, closure: closure?.reason && closure.date ? { reason: closure.reason, date: closure.date } : null })
  if (consultation.status !== "consultable") {
    return null
  }
  const formatDate = (date: Date) => dayjs(date).format("DD/MM/YYYY")
  return (
    <Box sx={{ mb: fr.spacing("4v") }}>
      <Alert
        severity="info"
        small
        description={`Cette offre ${OFFER_END_LABELS[consultation.end.reason]} ${formatDate(consultation.end.date)}. Ses candidatures restent consultables pendant ${APPLICATIONS_CONSULTATION_MONTHS_AFTER_CLOSURE} mois après la clôture de l'offre, soit jusqu'au ${formatDate(consultation.until)}.`}
      />
    </Box>
  )
}

const DOWNLOAD_MESSAGES = {
  loading: "Préparation du récapitulatif des candidatures en cours.",
  done: "Récapitulatif des candidatures téléchargé.",
  error: "Le téléchargement du récapitulatif a échoué. Veuillez réessayer.",
} as const

const DownloadApplicationsLink = ({ jobId, offerTitle }: { jobId: string; offerTitle: string }) => (
  <DownloadLink
    href={getJobApplicationsExportUrl(jobId)}
    fileName={getApplicationsExportFileName(offerTitle)}
    download={() => downloadJobApplications(jobId)}
    messages={DOWNLOAD_MESSAGES}
    align="flex-end"
  >
    Télécharger le récapitulatif des candidatures<span className="fr-sr-only"> au format CSV</span>
  </DownloadLink>
)
