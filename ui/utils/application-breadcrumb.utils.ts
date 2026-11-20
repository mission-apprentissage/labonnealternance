import type { ApplicationIntention } from "shared/constants/application"
import type { IPage } from "@/utils/routes.utils"
import { PAGES } from "@/utils/routes.utils"

// Pages réservées à l'espace pro, hors de routes.utils.ts que le first-load des pages publiques embarque (issue #5214).
const entrepriseOffrePath = (job_id: string) => `/espace-pro/entreprise/offre/${job_id}`
const cfaOffrePath = (establishment_id: string, job_id: string) => `/espace-pro/cfa/entreprise/${establishment_id}/offre/${job_id}`

const applicationPage = (path: string, title: string): IPage => ({ getPath: () => path, title })

/** Titres des pages de candidatures (<title>), tenus ici : METADATA n'indexe que les pages de PAGES (cf. routes.metadata.utils). */
export const APPLICATION_PAGE_METADATA_TITLES = {
  applications: "Candidatures de l'offre - La bonne alternance",
  detail: "Détail d'une candidature - La bonne alternance",
  reply: "Répondre au candidat - La bonne alternance",
} as const

const buildApplicationPages = (offrePath: string) => ({
  applications: applicationPage(`${offrePath}/candidatures`, "Candidatures"),
  detail: (application_id: string) => applicationPage(`${offrePath}/candidature/${application_id}`, "Détail d'une candidature"),
  reply: (application_id: string, intention: ApplicationIntention) => applicationPage(`${offrePath}/candidature/${application_id}/repondre/${intention}`, "Répondre au candidat"),
})

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
      ...buildApplicationPages(cfaOffrePath(cfaEstablishmentId, job_id)),
    }
  }
  return {
    parents: [{ ...PAGES.static.backHomeEntreprise, title: "Entreprise" }],
    ...buildApplicationPages(entrepriseOffrePath(job_id)),
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
