"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Link from "next/link"
import { APPLICATION_TREATED_ELSEWHERE } from "shared/constants/application"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import Badge from "@/app/(espace-pro)/_components/Badge"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { getApplicationStatus } from "@/app/(espace-pro)/espace-pro/(connected)/_components/application-status"
import { DownloadLink } from "@/app/(espace-pro)/espace-pro/(connected)/_components/DownloadLink"
import { downloadJobApplicationAttachment, getFormulaire, getJobApplicationAttachmentUrl, getJobApplicationDetail } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

type ApplicationDetail = Awaited<ReturnType<typeof getJobApplicationDetail>>

/** Sans `cfaEstablishmentId`, page du recruteur ; avec, page du CFA pour l'entreprise qu'il gère (cf. CandidaturesOffre). */
export const CandidatureDetail = ({ job_id, application_id, cfaEstablishmentId }: { job_id: string; application_id: string; cfaEstablishmentId?: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["job-application", job_id, application_id],
    queryFn: () => getJobApplicationDetail(job_id, application_id),
    retry: false,
  })
  const { data: recruiter } = useQuery({
    queryKey: ["recruiter", cfaEstablishmentId],
    queryFn: () => getFormulaire(cfaEstablishmentId),
    enabled: Boolean(cfaEstablishmentId),
  })

  const applicationsPage = cfaEstablishmentId
    ? PAGES.dynamic.backCfaEntrepriseCandidaturesOffre({ establishment_id: cfaEstablishmentId, job_id })
    : PAGES.dynamic.backEntrepriseCandidaturesOffre({ job_id })
  const detailPage = cfaEstablishmentId
    ? PAGES.dynamic.backCfaEntrepriseCandidatureDetail({ establishment_id: cfaEstablishmentId, job_id, application_id })
    : PAGES.dynamic.backEntrepriseCandidatureDetail({ job_id, application_id })
  const breadcrumbPages = cfaEstablishmentId
    ? [
        PAGES.static.backCfaHome,
        PAGES.dynamic.backCfaPageEntreprise(cfaEstablishmentId, recruiter?.establishment_raison_sociale ?? recruiter?.establishment_siret),
        applicationsPage,
        detailPage,
      ]
    : [{ ...PAGES.static.backHomeEntreprise, title: "Entreprise" }, applicationsPage, detailPage]

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
              Détail d'une candidature
            </Typography>
            <Alert severity="error" small description={error?.message ?? "Cette candidature est indisponible."} />
          </>
        ) : (
          <CandidatureDetailContent data={data} />
        )}
        <Box sx={{ mt: fr.spacing("6v") }}>
          <Link className="fr-link fr-link--sm fr-link--icon-left fr-icon-arrow-left-line" href={applicationsPage.getPath()}>
            Retour aux candidatures
          </Link>
        </Box>
      </Box>
    </>
  )
}

type Application = ApplicationDetail["application"]

const formatDateTime = (date: string | null) => (date ? dayjs(date).format("DD/MM/YYYY [à] HH:mm") : "")
// Le schéma tel: n'admet que les chiffres et le + initial : les espaces ou points saisis par le candidat sont retirés.
const toTelUri = (phone: string) => phone.replace(/[^\d+]/g, "")
const formatPhone = (phone: string) => phone.replace(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5")
const greyText = fr.colors.decisions.text.mention.grey.default
// Le DSFR met un retrait de 16 px sur dl et dd : les listes de la page s'alignent sur le titre de leur carte.
const resetDefinitionListSx = { m: 0, pl: 0, "& dd": { pl: 0 } }

const EmptyText = ({ children }: { children: React.ReactNode }) => <Typography sx={{ fontStyle: "italic", color: greyText }}>{children}</Typography>

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box component="section" sx={{ border: "1px solid var(--border-default-grey)", p: fr.spacing("6v") }}>
    <Typography component="h3" sx={{ fontSize: "1.25rem", fontWeight: 700, mb: fr.spacing("4v") }}>
      {title}
    </Typography>
    {children}
  </Box>
)

/** Paires libellé / valeur sur une ligne, en liste de définitions. */
const InlineFields = ({ fields }: { fields: { label: string; value: React.ReactNode }[] }) => (
  <Box component="dl" sx={{ ...resetDefinitionListSx, display: "flex", flexDirection: "column", gap: fr.spacing("2v") }}>
    {fields.map(({ label, value }) => (
      <Box key={label}>
        <Box component="dt" sx={{ display: "inline", color: greyText }}>
          {label} :{" "}
        </Box>
        <Box component="dd" sx={{ display: "inline", m: 0, overflowWrap: "anywhere" }}>
          {value}
        </Box>
      </Box>
    ))}
  </Box>
)

/** Paires libellé / valeur sur deux lignes, pour les valeurs longues. */
const StackedFields = ({ fields }: { fields: { label: string; value: React.ReactNode }[] }) => (
  <Box component="dl" sx={{ ...resetDefinitionListSx, display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
    {fields.map(({ label, value }) => (
      <Box key={label}>
        <Box component="dt" sx={{ color: greyText }}>
          {label} :
        </Box>
        <Box component="dd" sx={{ m: 0, whiteSpace: "pre-line" }}>
          {value}
        </Box>
      </Box>
    ))}
  </Box>
)

// DepotSimplifieStyling donne aux li de l'espace pro des marges de liste de contenu (mx 20v, mb 10v), avec un
// sélecteur plus spécifique : !important pour que les tags s'alignent sur le texte qui les précède.
const Tags = ({ items }: { items: string[] }) => (
  <Box component="ul" className="fr-tags-group" sx={{ "& > li": { mx: "0 !important", mb: "0 !important" } }}>
    {items.map((item) => (
      <li key={item}>
        <p className="fr-tag fr-tag--sm">{item}</p>
      </li>
    ))}
  </Box>
)

const Banner = ({ success = true, title, children }: { success?: boolean; title: string; children?: React.ReactNode }) => (
  <Box sx={{ mt: fr.spacing("6v"), p: fr.spacing("6v"), backgroundColor: fr.colors.decisions.background.alt.grey.default }}>
    <Typography
      sx={{
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: fr.spacing("2v"),
        color: success ? fr.colors.decisions.text.default.success.default : fr.colors.decisions.text.default.error.default,
      }}
    >
      <span className={success ? "fr-icon-checkbox-circle-fill" : "fr-icon-error-fill"} aria-hidden="true" />
      {title}
    </Typography>
    {children}
  </Box>
)

/** Bandeau d'une réponse envoyée par LBA (entretien ou refus), à la place des boutons de réponse. */
const ResponseBanner = ({ application }: { application: Application }) => {
  const { company_feedback_send_status: sendStatus, company_feedback, feedback_email_subject, company_feedback_reasons } = application
  // Sans statut d'envoi, la réponse date d'avant la programmation des envois : elle est partie à la saisie.
  const isSent = sendStatus === "SENT" || sendStatus === null
  const title = isSent
    ? `Votre réponse a bien été envoyée au candidat le ${formatDateTime(application.company_feedback_date ?? application.company_recruitment_intention_date)}`
    : sendStatus === "SCHEDULED"
      ? "Votre réponse va être envoyée au candidat."
      : sendStatus === "CANCELED"
        ? "L'envoi de votre réponse a été annulé."
        : "Votre réponse n'a pas pu être envoyée au candidat."

  return (
    <Banner success={isSent || sendStatus === "SCHEDULED"} title={title}>
      {company_feedback && (
        <>
          <Typography sx={{ mt: fr.spacing("2v"), fontSize: "0.875rem", color: greyText }}>
            {isSent ? "Le candidat a reçu le message suivant par e-mail." : "Message de votre réponse :"}
          </Typography>
          <Box
            sx={{ mt: fr.spacing("3v"), p: fr.spacing("4v"), backgroundColor: fr.colors.decisions.background.default.grey.default, border: "1px solid var(--border-default-grey)" }}
          >
            {feedback_email_subject && <Typography sx={{ fontSize: "0.875rem", color: greyText, mb: fr.spacing("3v") }}>Objet : {feedback_email_subject}</Typography>}
            <Typography sx={{ whiteSpace: "pre-line" }}>{company_feedback}</Typography>
          </Box>
        </>
      )}
      {company_feedback_reasons.length > 0 && (
        <Box sx={{ mt: fr.spacing("4v") }}>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, mb: fr.spacing("2v") }}>Raison(s) du refus :</Typography>
          <Tags items={company_feedback_reasons} />
        </Box>
      )}
    </Banner>
  )
}

const ApplicationActions = ({ application }: { application: Application }) => {
  if (!application.company_recruitment_intention) {
    // Les réponses depuis cette page arrivent avec la suite de #5769 : boutons posés, inactifs.
    return (
      <Box sx={{ mt: fr.spacing("6v"), display: "flex", gap: fr.spacing("4v"), flexWrap: "wrap" }}>
        <Button iconId="fr-icon-mail-send-line" iconPosition="left" disabled>
          Contacter le candidat
        </Button>
        <Button priority="secondary" disabled>
          Refuser la candidature
        </Button>
        <Button priority="secondary" disabled>
          J'ai contacté le candidat par un autre canal
        </Button>
      </Box>
    )
  }
  if (application.company_recruitment_intention === APPLICATION_TREATED_ELSEWHERE) {
    return (
      <Banner title={`Statut mis à jour le ${formatDateTime(application.company_recruitment_intention_date)}`}>
        <Typography sx={{ mt: fr.spacing("2v") }}>Vous nous avez indiqué avoir répondu au candidat par un autre canal (mail ou téléphone).</Typography>
      </Banner>
    )
  }
  return <ResponseBanner application={application} />
}

const ATTACHMENT_DOWNLOAD_MESSAGES = {
  loading: "Téléchargement de la pièce jointe en cours.",
  done: "Pièce jointe téléchargée.",
  error: "Le téléchargement de la pièce jointe a échoué. Veuillez réessayer.",
} as const

// Unités du DSFR pour les liens de téléchargement (« PDF – 61,88 Ko »).
const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} Ko`
  return `${(size / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`
}

const AttachmentCard = ({ jobId, application }: { jobId: string; application: Application }) => {
  const { _id: applicationId, applicant_attachment_name: name, applicant_attachment_deleted_at: deletedAt, applicant_attachment_size: size } = application
  const extension = name.split(".").pop()?.toUpperCase()
  return (
    <Card title="Pièce jointe">
      {deletedAt ? (
        <>
          <Typography sx={{ overflowWrap: "anywhere" }}>{name}</Typography>
          <Typography sx={{ mt: fr.spacing("1v"), fontSize: "0.75rem", color: greyText }}>
            {[extension, `Supprimée le ${dayjs(deletedAt).format("DD/MM/YYYY")}`].filter(Boolean).join(" – ")}
          </Typography>
        </>
      ) : (
        <DownloadLink
          href={getJobApplicationAttachmentUrl(jobId, applicationId)}
          fileName={name}
          download={() => downloadJobApplicationAttachment(jobId, applicationId)}
          messages={ATTACHMENT_DOWNLOAD_MESSAGES}
          className="fr-link fr-link--icon-right fr-icon-download-line"
          detail={[extension, size === null ? null : formatFileSize(size)].filter(Boolean).join(" – ") || undefined}
        >
          <span className="fr-sr-only">Télécharger la pièce jointe </span>
          {name}
        </DownloadLink>
      )}
    </Card>
  )
}

const ProjectCard = ({ application }: { application: Application }) => {
  const {
    applicant_inscription_formation: inscription,
    applicant_contract_duration: duration,
    applicant_contract_start: starts,
    applicant_formation_description: formation,
    applicant_rythm_description: rythm,
  } = application
  const fields = [
    duration ? { label: "Durée du contrat souhaitée", value: duration } : null,
    starts.length ? { label: "Début de contrat souhaité", value: <Tags items={starts} /> } : null,
    formation ? { label: "Informations sur l'école et la formation", value: formation } : null,
    rythm ? { label: "Rythme de l'alternance (école/entreprise)", value: rythm } : null,
  ].filter((field) => field !== null)

  return (
    <Card title="Son projet">
      {inscription === null && fields.length === 0 ? (
        <EmptyText>Le candidat n'a pas renseigné son projet.</EmptyText>
      ) : (
        <>
          {inscription !== null && (
            <Typography sx={{ mb: fr.spacing("3v") }}>{inscription ? "Je suis déjà inscrit(e) en formation." : "Je ne suis pas encore inscrit(e) en formation."}</Typography>
          )}
          <StackedFields fields={fields} />
        </>
      )}
    </Card>
  )
}

const QuestionsCard = ({ questions, application }: { questions: string[]; application: Application }) => {
  const answers = new Map(application.applicant_answers_to_recruiter_questions.map(({ question, answer }) => [question, answer]))
  // Les questions de l'offre, puis celles auxquelles le candidat a répondu avant une modification de l'offre.
  const allQuestions = [...new Set([...questions, ...answers.keys()])]
  if (!allQuestions.length) {
    return null
  }
  const partner = application.partner_name

  return (
    <Card title="Ses réponses à vos questions">
      {answers.size === 0 && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <EmptyText>
            {partner
              ? `Le candidat a postulé via la plateforme partenaire ${partner} et n'a pas eu l'opportunité de répondre à vos questions.`
              : "Le candidat n'a pas eu l'opportunité de répondre à vos questions."}
          </EmptyText>
        </Box>
      )}
      <Box component="dl" sx={{ ...resetDefinitionListSx, display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
        {allQuestions.map((question) => (
          <Box key={question}>
            <Box component="dt" sx={{ fontWeight: 700, mb: fr.spacing("1v") }}>
              {question}
            </Box>
            <Box component="dd" sx={{ m: 0, whiteSpace: "pre-line" }}>
              {answers.get(question) || <EmptyText>Le candidat n'a pas pu répondre à votre question.</EmptyText>}
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  )
}

const CandidatureDetailContent = ({ data }: { data: ApplicationDetail }) => {
  const { job, application } = data
  const status = getApplicationStatus(application.company_recruitment_intention)

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v"), flexWrap: "wrap" }}>
        <Typography component="h1" sx={{ fontSize: "2rem", fontWeight: 700 }}>
          {application.applicant_first_name} {application.applicant_last_name.toUpperCase()}
        </Typography>
        <Badge variant={status.variant} textTransform="uppercase" whiteSpace="normal">
          {status.label}
        </Badge>
      </Box>
      <Box sx={{ mt: fr.spacing("2v") }}>
        <Typography sx={{ mb: fr.spacing("1v") }}>
          Candidature reçue le : <strong>{application.created_at ? dayjs(application.created_at).format("DD/MM/YYYY") : "date inconnue"}</strong>
        </Typography>
        <Typography>
          Pour le poste : <strong>{job.offer_title}</strong>
        </Typography>
      </Box>
      <ApplicationActions application={application} />
      <Typography component="h2" sx={{ mt: fr.spacing("8v"), mb: fr.spacing("4v"), fontWeight: 700 }}>
        Sa candidature
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: fr.spacing("6v"), alignItems: "start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
          <Card title="Coordonnées du candidat">
            <InlineFields
              fields={[
                { label: "Prénom", value: application.applicant_first_name },
                { label: "Nom", value: application.applicant_last_name.toUpperCase() },
                { label: "E-mail", value: <a href={`mailto:${application.applicant_email}`}>{application.applicant_email}</a> },
                {
                  label: "Téléphone",
                  value: application.applicant_phone && <a href={`tel:${toTelUri(application.applicant_phone)}`}>{formatPhone(application.applicant_phone)}</a>,
                },
              ]}
            />
          </Card>
          <AttachmentCard jobId={job._id} application={application} />
          <ProjectCard application={application} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
          <Card title="Message du candidat">
            {application.applicant_message_to_company ? (
              <Typography sx={{ whiteSpace: "pre-line" }}>{application.applicant_message_to_company}</Typography>
            ) : (
              <EmptyText>Le candidat n'a pas joint de message à sa candidature.</EmptyText>
            )}
          </Card>
          <QuestionsCard questions={job.to_applicant_questions} application={application} />
        </Box>
      </Box>
    </>
  )
}
