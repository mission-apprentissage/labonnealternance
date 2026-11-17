import type { ApplicationIntention } from "shared/constants/application"
import type { IPage } from "@/utils/routes.utils"
import { PAGES } from "@/utils/routes.utils"

type ApplicationPagesContext = {
  job_id: string
  /** Présent quand un CFA gère l'offre pour l'entreprise : les pages sont alors celles de l'espace CFA. */
  cfaEstablishmentId?: string | null
  establishmentName?: string
}

/** Pages de l'espace pro autour des candidatures d'une offre, pour l'entreprise ou pour le CFA qui la gère. */
export const getApplicationPages = ({ job_id, cfaEstablishmentId, establishmentName }: ApplicationPagesContext) => {
  if (cfaEstablishmentId) {
    return {
      parents: [PAGES.static.backCfaHome, PAGES.dynamic.backCfaPageEntreprise(cfaEstablishmentId, establishmentName)],
      applications: PAGES.dynamic.backCfaEntrepriseCandidaturesOffre({ establishment_id: cfaEstablishmentId, job_id }),
      detail: (application_id: string) => PAGES.dynamic.backCfaEntrepriseCandidatureDetail({ establishment_id: cfaEstablishmentId, job_id, application_id }),
      reply: (application_id: string, intention: ApplicationIntention) =>
        PAGES.dynamic.backCfaEntrepriseCandidatureReponse({ establishment_id: cfaEstablishmentId, job_id, application_id, intention }),
    }
  }
  return {
    parents: [{ ...PAGES.static.backHomeEntreprise, title: "Entreprise" }],
    applications: PAGES.dynamic.backEntrepriseCandidaturesOffre({ job_id }),
    detail: (application_id: string) => PAGES.dynamic.backEntrepriseCandidatureDetail({ job_id, application_id }),
    reply: (application_id: string, intention: ApplicationIntention) => PAGES.dynamic.backEntrepriseCandidatureReponse({ job_id, application_id, intention }),
  }
}

/** Fil d'Ariane des formulaires de réponse : Accueil > Entreprise > Candidatures > nom du candidat > Répondre au candidat. */
export const getApplicationReplyBreadcrumb = ({
  application_id,
  intention,
  applicantName,
  ...context
}: ApplicationPagesContext & { application_id: string; intention: ApplicationIntention; applicantName: string }): IPage[] => {
  const pages = getApplicationPages(context)
  return [...pages.parents, pages.applications, { ...pages.detail(application_id), title: applicantName }, pages.reply(application_id, intention)]
}
