"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useParams } from "next/navigation"
import { OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { getModerationJob } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { AccountStatusBadge, AccountTypeBadge } from "./ModerationBadges"
import { ModerationPanel } from "./ModerationPanel"
import type { IModerationJobDetailJson, IModerationUserType } from "./moderation.types"
import { getRecruiterAccountPath } from "./moderation-links"

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: fr.spacing("2v"), mb: fr.spacing("2v") }}>
    <Typography component="span" sx={{ fontSize: "0.875rem" }}>
      {label} :
    </Typography>
    <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 700, backgroundColor: fr.colors.decisions.background.alt.grey.default, px: fr.spacing("1v") }}>
      {value || "—"}
    </Typography>
  </Box>
)

const Card = ({ title, children }: { title?: React.ReactNode; children: React.ReactNode }) => (
  <Box sx={{ border: "1px solid", borderColor: fr.colors.decisions.border.default.grey.default, p: fr.spacing("4v") }}>
    {title && <Box sx={{ mb: fr.spacing("3v") }}>{title}</Box>}
    {children}
  </Box>
)

// Texte enregistré déjà nettoyé (sanitizeTextField) : rendu comme sur la fiche publique, cf. JobDescription.
const StoredText = ({ html }: { html: string }) => <Typography component="div" sx={{ whiteSpace: "pre-wrap", mb: fr.spacing("4v") }} dangerouslySetInnerHTML={{ __html: html }} />

const RecruiterCards = ({ detail }: { detail: IModerationJobDetailJson }) => {
  const { recruiter, partner_company } = detail
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
      <Card
        title={
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v") }}>
            <AccountTypeBadge type={recruiter.account_type} />
            <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
              Statut du compte :
            </Typography>
            <AccountStatusBadge status={recruiter.account_status} />
          </Box>
        }
      >
        <Field label="Nom" value={recruiter.last_name} />
        <Field label="Prénom" value={recruiter.first_name} />
        <Field label="E-mail" value={recruiter.email} />
        <Field label="SIRET" value={recruiter.siret} />
        <Field label="Raison sociale" value={recruiter.raison_sociale} />
      </Card>
      {partner_company && (
        <Card title={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>Entreprise partenaire :</Typography>}>
          <Field label="Raison sociale" value={partner_company.raison_sociale} />
          <Field label="SIRET" value={partner_company.siret} />
          <Field label="Nom" value={partner_company.last_name} />
          <Field label="Prénom" value={partner_company.first_name} />
          <Field label="E-mail" value={partner_company.email} />
        </Card>
      )}
    </Box>
  )
}

const OfferContent = ({ offer }: { offer: IModerationJobDetailJson["offer"] }) => {
  const isCustomDescription = offer.offer_description_mode === OFFER_DESCRIPTION_MODE.CUSTOM
  return (
    <Box sx={{ mt: fr.spacing("6v") }}>
      <Typography component="h1" variant="h2" sx={{ mb: fr.spacing("4v") }}>
        {offer.offer_title}
      </Typography>
      {offer.offer_rome_appellation && <Typography sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.mention.grey.default }}>{offer.offer_rome_appellation}</Typography>}
      <Typography component="h2" variant="h4" sx={{ mb: fr.spacing("3v") }}>
        La présentation de l’entreprise
      </Typography>
      {offer.workplace_description ? <StoredText html={offer.workplace_description} /> : <Typography sx={{ mb: fr.spacing("4v") }}>Non renseignée.</Typography>}
      <Typography component="h2" variant="h4" sx={{ mb: fr.spacing("3v") }}>
        La description de l’offre
      </Typography>
      {isCustomDescription ? (
        <StoredText html={offer.offer_description} />
      ) : (
        <Typography sx={{ mb: fr.spacing("4v") }}>Description issue de la fiche métier, non rédigée par le recruteur et non analysée.</Typography>
      )}
      <Card
        title={
          <Typography component="h2" sx={{ fontWeight: 700 }}>
            Le contrat
          </Typography>
        }
      >
        <Field label="Type" value={offer.contract_type.join(", ")} />
        <Field label="Niveau de formation visé en fin de contrat" value={offer.offer_target_diploma?.label} />
        <Field label="Durée du contrat" value={offer.contract_duration ? `${offer.contract_duration} mois` : null} />
        <Field label="Date de début de contrat" value={offer.contract_start ? dayjs(offer.contract_start).format("DD/MM/YYYY") : null} />
        <Field label="Nombre de poste(s) disponible(s)" value={offer.offer_opening_count} />
        <Field label="Rythme de l’alternance école/entreprise" value={offer.contract_rythm} />
        <Field label="Déposée le" value={dayjs(offer.created_at).format("DD/MM/YYYY")} />
        <Field label="Expire le" value={offer.offer_expiration ? dayjs(offer.offer_expiration).format("DD/MM/YYYY") : null} />
      </Card>
    </Box>
  )
}

export function ModerationJobDetail({ jobId, userType }: { jobId: string; userType: IModerationUserType }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["moderation-job", jobId],
    queryFn: () => getModerationJob(jobId),
    retry: false,
  })
  const queuePage = userType === "OPCO" ? MODERATION_PAGES.opcoQueue : MODERATION_PAGES.adminQueue

  if (isError) {
    const isNotFound = error instanceof ApiError && error.context.statusCode === 404
    return (
      <Box sx={{ maxWidth: 1200, marginX: "auto", my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
        <Alert
          severity="error"
          title={isNotFound ? "Offre introuvable" : "La page de modération n’a pas pu être chargée"}
          description={isNotFound ? "Cette offre n’existe plus, ou son lien est erroné." : "Réessayez dans un instant."}
        />
        <Button priority="secondary" iconId="fr-icon-arrow-left-line" linkProps={{ href: queuePage.getPath() }} style={{ marginTop: fr.spacing("4v") }}>
          Retour aux {queuePage.title.toLowerCase()}
        </Button>
      </Box>
    )
  }

  if (isLoading || !data) {
    return <LoadingEmptySpace />
  }

  const recruiterPath = getRecruiterAccountPath(data.recruiter, userType)

  return (
    <Box sx={{ maxWidth: 1200, marginX: "auto", mt: fr.spacing("4v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
      <Breadcrumb pages={[queuePage, MODERATION_PAGES.offre({ job_id: jobId, userType, offer_title: data.offer.offer_title })]} />
      {recruiterPath && (
        <Button priority="secondary" size="small" iconId="fr-icon-arrow-left-line" linkProps={{ href: recruiterPath }} style={{ marginBottom: fr.spacing("4v") }}>
          Voir le compte recruteur
        </Button>
      )}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v"), alignItems: "flex-start" }}>
        <Box sx={{ width: { xs: "100%", md: "33%" }, flexShrink: 0 }}>
          <RecruiterCards detail={data} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <ModerationPanel detail={data} onChange={() => refetch()} readOnly={userType === "OPCO"} />
          <OfferContent offer={data.offer} />
        </Box>
      </Box>
    </Box>
  )
}

/** Les pages admin et OPCO lisent l'identifiant de l'offre dans l'URL. */
export function ModerationJobDetailPage({ userType }: { userType: IModerationUserType }) {
  const { jobId } = useParams() as { jobId: string }
  return <ModerationJobDetail jobId={jobId} userType={userType} />
}
