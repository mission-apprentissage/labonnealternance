"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Box } from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { parseEnum } from "shared"
import { ApplicationIntention } from "shared/constants/application"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { markReplyJustSent } from "@/app/(espace-pro)/espace-pro/(connected)/_components/sent-reply-focus"
import { useApplicationRouteParams } from "@/app/(espace-pro)/espace-pro/(connected)/_components/use-application-route-params"
import { IntentionPage } from "@/components/IntentionPage/IntentionPage"
import { getFormulaire, getJobApplicationDetail, getJobApplicationReplyToken } from "@/utils/api"
import { getApplicationPages, getApplicationReplyBreadcrumb } from "@/utils/application-breadcrumb.utils"

/**
 * Formulaires de réponse du mail au recruteur (IntentionPage), ouverts depuis le détail d'une candidature :
 * la session donne accès au jeton que le mail porte dans son lien. Route avec `establishment_id` : page du CFA.
 */
export const CandidatureReponse = () => {
  const { job_id, application_id, intention: rawIntention, cfaEstablishmentId } = useApplicationRouteParams()
  const intention = parseEnum(ApplicationIntention, rawIntention)
  if (!intention) {
    notFound()
  }

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["job-application", job_id, application_id],
    queryFn: () => getJobApplicationDetail(job_id, application_id),
    retry: false,
  })
  const { data: recruiter } = useQuery({
    queryKey: ["recruiter", cfaEstablishmentId],
    queryFn: () => getFormulaire(cfaEstablishmentId),
    enabled: Boolean(cfaEstablishmentId),
  })
  const {
    data: reply,
    isLoading: isTokenLoading,
    error,
  } = useQuery({
    queryKey: ["job-application-reply-token", job_id, application_id, intention],
    queryFn: () => getJobApplicationReplyToken(job_id, application_id, intention),
    retry: false,
    // Un jeton par ouverture du formulaire, jamais relu pendant son affichage : un nouveau jeton changerait la clé
    // du formulaire (cf. useIntentionData), qui relirait ses données et reprogrammerait une réponse annulée.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const client = useQueryClient()
  const router = useRouter()

  if (isDetailLoading || isTokenLoading) {
    return <LoadingEmptySpace />
  }

  const context = { job_id, cfaEstablishmentId, establishmentName: recruiter?.establishment_raison_sociale ?? recruiter?.establishment_siret }
  const detailPage = getApplicationPages(context).detail(application_id)
  // Retour direct au détail, qui affiche le bandeau « réponse envoyée » une fois la candidature relue. `replace` : le
  // retour arrière ne rouvre pas un formulaire déjà envoyé.
  const returnToDetail = async () => {
    markReplyJustSent(application_id)
    await Promise.all([
      client.invalidateQueries({ queryKey: ["job-application", job_id, application_id] }),
      client.invalidateQueries({ queryKey: ["job-applications", job_id] }),
      client.invalidateQueries({ queryKey: ["offre-liste"] }),
    ])
    router.replace(detailPage.getPath())
  }
  const applicantName = detail ? `${detail.application.applicant_first_name} ${detail.application.applicant_last_name.toUpperCase()}` : detailPage.title

  return (
    <>
      <Breadcrumb pages={getApplicationReplyBreadcrumb({ ...context, application_id, intention, applicantName })} />
      <Box sx={{ width: "100%", maxWidth: "1280px", my: fr.spacing("3v"), px: fr.spacing("4v") }}>
        {error || !reply ? (
          <Alert severity="error" small description={error?.message ?? "Le formulaire de réponse est indisponible."} />
        ) : (
          <IntentionPage id={application_id} company_recruitment_intention={intention} token={reply.token} onSentNow={returnToDetail} />
        )}
        <Box sx={{ mt: fr.spacing("6v") }}>
          <Link className="fr-link fr-link--sm fr-link--icon-left fr-icon-arrow-left-line" href={detailPage.getPath()}>
            Retour à la candidature
          </Link>
        </Box>
      </Box>
    </>
  )
}
