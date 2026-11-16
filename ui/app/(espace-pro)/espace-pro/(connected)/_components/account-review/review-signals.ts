import dayjs from "dayjs"
import type { IUserStatusValidationJson } from "shared"
import { AUTO_VALIDATION_INDETERMINATE_PREFIX, AUTO_VALIDATION_REFUSED_REASON } from "shared/constants/auto-validation"
import { ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models/job.model"
import { MODERATION_REVIEW_STATUS } from "shared/models/jobs-partners-moderation.model"
import type { ISameSiretAccountJson, SameSiretAccountMatch } from "shared/routes/user.routes"

export type SignalTone = "warning" | "error" | "success" | "info" | "neutral"

export type ReviewSignal = {
  tone: SignalTone
  title: string
  description: string
  link?: { label: string; href: string }
  retry?: boolean
}

export const OTHER_ACCOUNTS_ANCHOR = "autres-comptes"
export const OFFERS_ANCHOR = "offres"

const formatDate = (date: string | null | undefined) => (date ? dayjs(date).format("DD/MM/YYYY") : null)
const plural = (count: number, singular: string, pluralForm = `${singular}s`) => `${count} ${count > 1 ? pluralForm : singular}`
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const MATCH_LABELS: Record<SameSiretAccountMatch, string> = { phone: "téléphone", name: "nom" }

const describeMatches = (matches: SameSiretAccountMatch[]) => `Même ${matches.map((match) => MATCH_LABELS[match]).join(" et même ")}`

const describeAccountStatus = (account: ISameSiretAccountJson) => {
  switch (account.status) {
    case ETAT_UTILISATEUR.DESACTIVE: {
      const date = formatDate(account.status_date)
      return `désactivé${date ? ` le ${date}` : ""}${account.status_reason ? ` pour « ${account.status_reason} »` : ""}`
    }
    case ETAT_UTILISATEUR.VALIDE:
      return "actif"
    case ETAT_UTILISATEUR.ATTENTE:
      return "en attente de vérification"
    default:
      return "en erreur"
  }
}

const otherAccountsLink = { label: "Voir les comptes", href: `#${OTHER_ACCOUNTS_ANCHOR}` }

export const buildOtherAccountsSignal = ({ isLoading, isError, accounts }: { isLoading: boolean; isError: boolean; accounts?: ISameSiretAccountJson[] }): ReviewSignal => {
  if (isError) {
    return { tone: "neutral", title: "Autres comptes indisponibles", description: "Le chargement a échoué.", retry: true }
  }
  if (isLoading || !accounts) {
    return { tone: "neutral", title: "Recherche des autres comptes…", description: "Le signal s'affiche une fois la recherche terminée." }
  }
  if (accounts.length === 0) {
    return { tone: "success", title: "Aucun autre compte", description: "Aucun autre compte n'est rattaché à ce SIRET." }
  }
  const matching = accounts.filter(({ matches }) => matches.length > 0)
  if (matching.length === 1) {
    const [account] = matching
    return {
      tone: "warning",
      title: "Doublon probable",
      description: `${describeMatches(account.matches)} que ${account.first_name} ${account.last_name}, ${describeAccountStatus(account)}.`,
      link: otherAccountsLink,
    }
  }
  if (matching.length > 1) {
    return {
      tone: "warning",
      title: "Doublons probables",
      description: `${matching.length} comptes partagent le téléphone ou le nom de ce compte.`,
      link: otherAccountsLink,
    }
  }
  return {
    tone: "info",
    title: plural(accounts.length, "autre compte", "autres comptes"),
    description: "Aucun point commun avec ce compte.",
    link: otherAccountsLink,
  }
}

export const buildValidationSignal = (lastEvent: IUserStatusValidationJson | undefined): ReviewSignal => {
  if (!lastEvent?.status) {
    return { tone: "neutral", title: "Historique indisponible", description: "Aucun changement d'état n'est enregistré pour ce compte." }
  }
  const date = formatDate(lastEvent.date)
  const reason = lastEvent.reason?.trim() || null
  switch (lastEvent.status) {
    case ETAT_UTILISATEUR.DESACTIVE:
      return {
        tone: "error",
        title: date ? `Désactivé le ${date}` : "Compte désactivé",
        description: reason ? `Motif : ${reason}.` : "Aucun motif enregistré.",
      }
    case ETAT_UTILISATEUR.VALIDE:
      if (lastEvent.validation_type === VALIDATION_UTILISATEUR.AUTO) {
        return { tone: "success", title: "Validé automatiquement", description: [date && `Le ${date}`, reason].filter(Boolean).join(" : ") || "Validation automatique." }
      }
      return {
        tone: "success",
        title: "Validé manuellement",
        description: [date && `Le ${date}`, lastEvent.user && `par ${lastEvent.user}`].filter(Boolean).join(" ") || "Validation manuelle.",
      }
    case ETAT_UTILISATEUR.ATTENTE:
      if (reason?.startsWith(AUTO_VALIDATION_INDETERMINATE_PREFIX)) {
        const cause = capitalize(reason.slice(AUTO_VALIDATION_INDETERMINATE_PREFIX.length))
        return { tone: "warning", title: "Validation automatique non concluante", description: `${cause}${date ? ` le ${date}` : ""}.` }
      }
      if (reason === AUTO_VALIDATION_REFUSED_REASON) {
        return { tone: "warning", title: "Pas de validation automatique possible", description: "Aucune source automatique ne confirme l'entreprise." }
      }
      return { tone: "warning", title: "Validation manuelle attendue", description: reason ? `Motif : ${reason}.` : "Aucun motif enregistré." }
    default:
      return { tone: "error", title: "Entreprise en erreur", description: reason ? `Motif : ${reason}.` : "Aucun motif enregistré." }
  }
}

type JobForSignal = { _id: string; job_status: JOB_STATUS | string }
type ModerationSummaryForSignal = { _id?: string; offer_moderation_review?: string | null }

const offersLink = { label: "Voir les offres", href: `#${OFFERS_ANCHOR}` }

export const buildOffersSignal = ({ jobs, moderationSummaries }: { jobs: JobForSignal[]; moderationSummaries?: ModerationSummaryForSignal[] }): ReviewSignal => {
  if (jobs.length === 0) {
    return { tone: "neutral", title: "Aucune offre déposée", description: "Le compte n'a encore déposé aucune offre." }
  }
  const jobIds = new Set(jobs.map(({ _id }) => _id))
  const refused = (moderationSummaries ?? []).filter(
    ({ _id, offer_moderation_review }) => _id !== undefined && jobIds.has(_id) && offer_moderation_review === MODERATION_REVIEW_STATUS.REFUSEE
  ).length
  const countBy = (status: JOB_STATUS) => jobs.filter(({ job_status }) => job_status === status).length
  const inModeration = countBy(JOB_STATUS.EN_MODERATION)
  const awaiting = countBy(JOB_STATUS.EN_ATTENTE)
  const online = countBy(JOB_STATUS.ACTIVE)

  if (refused > 0) {
    return { tone: "error", title: plural(refused, "offre non conforme", "offres non conformes"), description: "Refusée en modération.", link: offersLink }
  }
  if (inModeration > 0) {
    return { tone: "warning", title: plural(inModeration, "offre à modérer", "offres à modérer"), description: "En attente d'une décision de modération.", link: offersLink }
  }
  if (awaiting > 0) {
    return { tone: "info", title: plural(awaiting, "offre en attente", "offres en attente"), description: "Publiée à la validation du compte.", link: offersLink }
  }
  if (online > 0) {
    return { tone: "info", title: plural(online, "offre en ligne", "offres en ligne"), description: "Visible par les candidats.", link: offersLink }
  }
  return { tone: "neutral", title: plural(jobs.length, "offre clôturée", "offres clôturées"), description: "Aucune offre en ligne ni en attente.", link: offersLink }
}

export const buildPartnersSignal = ({ isLoading, count }: { isLoading: boolean; count?: number }): ReviewSignal => {
  if (isLoading || count === undefined) {
    return { tone: "neutral", title: "Recherche des entreprises partenaires…", description: "Le signal s'affiche une fois la recherche terminée." }
  }
  if (count === 0) {
    return { tone: "neutral", title: "Aucune entreprise partenaire", description: "Le CFA ne gère encore aucune entreprise." }
  }
  return { tone: "info", title: plural(count, "entreprise partenaire", "entreprises partenaires"), description: "Gérées par ce CFA.", link: offersLink }
}
