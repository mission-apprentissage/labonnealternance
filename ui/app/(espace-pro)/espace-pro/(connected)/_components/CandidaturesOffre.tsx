"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Link from "next/link"
import type { MouseEvent } from "react"
import { useState } from "react"
import { ApplicationIntention } from "shared/constants/application"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrlPath } from "shared/metier/lbaitemutils"
import { getApplicationsExportFileName } from "shared/utils/applications-export"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import Badge from "@/app/(espace-pro)/_components/Badge"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import Table from "@/app/(espace-pro)/_components/Table"
import { publicConfig } from "@/config.public"
import { downloadJobApplications, getFormulaire, getJobApplications, getJobApplicationsExportUrl } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const APPLICATIONS_PAGE_SIZE = 20

type JobApplication = Awaited<ReturnType<typeof getJobApplications>>["applications"][number]

// Toute intention autre que le refus vaut prise de contact du candidat.
const getApplicationStatus = (intention: string | null) => {
  if (!intention) return { label: "EN ATTENTE", variant: "awaiting" }
  if (intention === ApplicationIntention.REFUS) return { label: "REFUSÉ", variant: "inactive" }
  return { label: "CONTACTÉ", variant: "active" }
}

const getApplicantFullName = ({ applicant_first_name, applicant_last_name }: JobApplication) => `${applicant_first_name} ${applicant_last_name.toUpperCase()}`

const columns = [
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
        <Badge variant={variant} textTransform="uppercase">
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
    // Le détail d'une candidature n'existe pas encore : le bouton est posé, inactif (#5769).
    Cell: ({ row: { original } }: { row: { original: JobApplication } }) => (
      <Button
        priority="secondary"
        size="small"
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        disabled
        nativeButtonProps={{ "aria-label": `Voir la candidature de ${getApplicantFullName(original)}` }}
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
          <CandidaturesOffreContent data={data} />
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

const CandidaturesOffreContent = ({ data }: { data: Awaited<ReturnType<typeof getJobApplications>> }) => {
  const { job, applications } = data
  const offerUrl = `${publicConfig.baseUrl}${buildJobUrlPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id, job.offer_rome_appellation || undefined)}`

  return (
    <>
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
          {/* La clôture depuis cette page arrive avec la suite de #5769. */}
          <Button disabled>Clôturer le recrutement</Button>
        </Box>
      </Box>
      <Box sx={{ mt: fr.spacing("4v"), mb: fr.spacing("4v"), display: "flex", justifyContent: "space-between", alignItems: "center", gap: fr.spacing("4v"), flexWrap: "wrap" }}>
        {/* "&&" passe devant la taille des h2 imposée par DepotSimplifieStyling. */}
        <Typography component="h2" sx={{ "&&": { fontSize: "1rem", lineHeight: "1.5rem" }, fontWeight: 400, m: 0 }}>
          Offre : <strong>{job.offer_title}</strong>
        </Typography>
        <DownloadApplicationsLink jobId={job._id} offerTitle={job.offer_title} />
      </Box>
      {/* La marge basse du .fr-table DSFR éloignerait le lien de retour posé juste sous le tableau. */}
      <Box sx={{ "& .fr-table": { mb: 0 } }}>
        <Table
          caption="Liste des candidatures"
          captionSrOnly
          columns={columns}
          data={applications}
          pageSize={APPLICATIONS_PAGE_SIZE}
          rowHeaderColumnIds={["applicant_first_name", "applicant_last_name"]}
          initialSortBy={[{ id: "created_at", desc: true }]}
        />
      </Box>
    </>
  )
}

const DOWNLOAD_MESSAGES = {
  idle: "",
  loading: "Préparation du récapitulatif des candidatures en cours.",
  done: "Récapitulatif des candidatures téléchargé.",
  error: "Le téléchargement du récapitulatif a échoué. Veuillez réessayer.",
} as const

/**
 * Le lien pointe sur l'export : sans JavaScript, le navigateur télécharge le fichier lui-même. Avec, le
 * téléchargement passe par fetch pour afficher l'attente et l'éventuelle erreur, annoncées par la zone role="status".
 */
const DownloadApplicationsLink = ({ jobId, offerTitle }: { jobId: string; offerTitle: string }) => {
  const [status, setStatus] = useState<keyof typeof DOWNLOAD_MESSAGES>("idle")
  const fileName = getApplicationsExportFileName(offerTitle)
  const isLoading = status === "loading"

  const onClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (isLoading) return
    setStatus("loading")
    try {
      const url = URL.createObjectURL(await downloadJobApplications(jobId))
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      // Révoquée tout de suite, l'URL peut annuler le téléchargement que le navigateur n'a pas encore lancé (Firefox).
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v") }}>
        {isLoading && <CircularProgress size={16} aria-hidden="true" sx={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }} />}
        <a
          className="fr-link fr-link--icon-left fr-icon-download-line"
          href={getJobApplicationsExportUrl(jobId)}
          download={fileName}
          onClick={onClick}
          aria-disabled={isLoading || undefined}
        >
          Télécharger le récapitulatif des candidatures<span className="fr-sr-only"> au format CSV</span>
        </a>
      </Box>
      <Box
        role="status"
        className={status === "error" ? undefined : "fr-sr-only"}
        sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.default.error.default, mt: status === "error" ? fr.spacing("1v") : 0 }}
      >
        {DOWNLOAD_MESSAGES[status]}
      </Box>
    </Box>
  )
}
