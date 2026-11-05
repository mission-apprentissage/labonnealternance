import { ObjectId } from "mongodb"
import anonymizedUsersWithAccountsModel from "shared/models/anonymized-users-with-accounts.model"
import type { ICacheInfosSiret, IRoleManagement, IUserWithAccount } from "shared/models/index"
import { JOB_STATUS_ENGLISH, RGPD_ERASURE_MODE } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IRgpdErasureMode } from "shared/models/rgpd-erasure.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { changeJobsPartnersStatus } from "@/services/job-partner-status.service"
import { removeJobPartnersFromSearchItems, SEARCH_JOBS_COLLECTIONS } from "@/services/search/search-items.service"

import { buildBrevoStep } from "./rgpd-erasure-brevo"
import type { IRgpdStep } from "./rgpd-erasure-steps"
import { buildCopyStep, RGPD_ANONYMIZED_VALUE, RGPD_GRANTED_BY } from "./rgpd-erasure-steps"

const RGPD_CANCEL_REASON = "compte effacé à la demande de l'utilisateur (RGPD)"
const OPEN_OFFER_STATUSES = [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION]

type IOrphanEstablishment = {
  _id: ObjectId
  siret: string
  /** Entreprise individuelle : la raison sociale et l'adresse sont celles de la personne. */
  isIndividual: boolean
  /** Clé de cache_geolocation posée à la création du compte (cf. getEntrepriseDataFromSiret). */
  geolocationKey: string | null
}

export type IRgpdAccountContext = {
  user: IUserWithAccount
  roles: IRoleManagement[]
  jobIds: ObjectId[]
  orphanEntreprises: IOrphanEstablishment[]
  orphanCfas: IOrphanEstablishment[]
}

const isIndividualCompany = (cache: ICacheInfosSiret | null) => {
  const person = cache?.data?.data?.unite_legale?.personne_physique_attributs
  return Boolean(person?.nom_naissance || person?.nom_usage || person?.prenom_usuel)
}

const getGeolocationKey = (addressDetail: unknown): string | null => {
  const acheminement = (addressDetail as { acheminement_postal?: { l4?: string | null; l6?: string | null } } | null | undefined)?.acheminement_postal
  if (!acheminement?.l4 || !acheminement?.l6) return null
  return `${acheminement.l4}, ${acheminement.l6}`.toUpperCase()
}

/** Établissement que plus aucun autre compte ne gère une fois `userId` effacé. */
const findOrphanEstablishment = async (collection: "entreprises" | "cfas", id: string, userId: ObjectId): Promise<IOrphanEstablishment | null> => {
  const establishment = await getDbCollection(collection).findOne({ _id: new ObjectId(id) })
  if (!establishment) return null
  const otherRoles = await getDbCollection("rolemanagements").countDocuments({ authorized_id: id, user_id: { $ne: userId } })
  if (otherRoles) return null
  if (collection === "entreprises") {
    const managedByCfa = await getDbCollection("entreprise_managed_by_cfa").countDocuments({ entreprise_id: establishment._id })
    if (managedByCfa) return null
  }
  const cache = await getDbCollection("cache_siret").findOne({ siret: establishment.siret })
  return {
    _id: establishment._id,
    siret: establishment.siret,
    isIndividual: isIndividualCompany(cache),
    geolocationKey: getGeolocationKey(establishment.address_detail),
  }
}

export const resolveRgpdAccountContext = async (user: IUserWithAccount): Promise<IRgpdAccountContext> => {
  const roles = await getDbCollection("rolemanagements").find({ user_id: user._id }).toArray()
  const jobs = await getDbCollection("jobs_partners")
    .find({ managed_by: user._id, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA }, { projection: { _id: 1 } })
    .toArray()

  const orphanEntreprises: IOrphanEstablishment[] = []
  const orphanCfas: IOrphanEstablishment[] = []
  for (const role of roles) {
    if (role.authorized_type === AccessEntityType.ENTREPRISE) {
      const orphan = await findOrphanEstablishment("entreprises", role.authorized_id, user._id)
      if (orphan) orphanEntreprises.push(orphan)
    }
    if (role.authorized_type === AccessEntityType.CFA) {
      const orphan = await findOrphanEstablishment("cfas", role.authorized_id, user._id)
      if (orphan) orphanCfas.push(orphan)
    }
  }

  return { user, roles, jobIds: jobs.map(({ _id }) => _id), orphanEntreprises, orphanCfas }
}

/** Refus métier, avant tout aperçu : l'effacement ne doit pas priver la plateforme de son dernier administrateur. */
export const isLastActiveAdmin = async ({ user, roles }: IRgpdAccountContext) => {
  if (!roles.some((role) => role.authorized_type === AccessEntityType.ADMIN)) return false
  const adminRoles = await getDbCollection("rolemanagements")
    .find({ authorized_type: AccessEntityType.ADMIN, user_id: { $ne: user._id } })
    .toArray()
  return !adminRoles.some((role) => role.status.at(-1)?.status === AccessStatus.GRANTED)
}

const countIn = (ids: ObjectId[]) => ({ _id: { $in: ids } })

/** Auteur de décisions : l'e-mail (offres, modération, formulaires) ou l'identifiant (statuts des comptes et des rôles). */
const buildGrantedByScrubSteps = (authorRefs: string[]): IRgpdStep[] => {
  const byAuthor = { $in: authorRefs }
  const arrayScrub = (collection: "jobs_partners" | "userswithaccounts" | "rolemanagements" | "entreprises" | "feedback_forms", arrayField: string): IRgpdStep => {
    const filter = { [`${arrayField}.granted_by`]: byAuthor }
    return {
      collection,
      action: `Auteur des décisions passées (${arrayField}.granted_by) remplacé par « ${RGPD_ANONYMIZED_VALUE} »`,
      count: () => getDbCollection(collection).countDocuments(filter),
      run: async () =>
        (
          await getDbCollection(collection).updateMany(
            filter,
            { $set: { [`${arrayField}.$[event].granted_by`]: RGPD_ANONYMIZED_VALUE } },
            { arrayFilters: [{ "event.granted_by": byAuthor }] }
          )
        ).modifiedCount,
    }
  }
  return [
    arrayScrub("jobs_partners", "offer_status_history"),
    arrayScrub("userswithaccounts", "status"),
    arrayScrub("rolemanagements", "status"),
    arrayScrub("entreprises", "status"),
    arrayScrub("feedback_forms", "status_history"),
    {
      collection: "feedback_forms",
      action: `Auteur des formulaires (created_by) remplacé par « ${RGPD_ANONYMIZED_VALUE} »`,
      count: () => getDbCollection("feedback_forms").countDocuments({ created_by: byAuthor }),
      run: async () => (await getDbCollection("feedback_forms").updateMany({ created_by: byAuthor }, { $set: { created_by: RGPD_ANONYMIZED_VALUE } })).modifiedCount,
    },
    {
      collection: "jobs_partners_moderations",
      action: `Auteur des décisions de modération (review.by) remplacé par « ${RGPD_ANONYMIZED_VALUE} »`,
      count: () => getDbCollection("jobs_partners_moderations").countDocuments({ "review.by": byAuthor }),
      run: async () => (await getDbCollection("jobs_partners_moderations").updateMany({ "review.by": byAuthor }, { $set: { "review.by": RGPD_ANONYMIZED_VALUE } })).modifiedCount,
    },
  ]
}

/** `managed_by` est retiré en dernier : une relance après échec retrouve les offres par ce champ (cf. resolveRgpdAccountContext). */
const buildOfferSteps = ({ jobIds, orphanEntreprises }: IRgpdAccountContext, mode: IRgpdErasureMode): IRgpdStep[] => {
  const individualSirets = orphanEntreprises.filter(({ isIndividual }) => isIndividual).map(({ siret }) => siret)
  const openOffers = { ...countIn(jobIds), offer_status: { $in: OPEN_OFFER_STATUSES } }
  const individualOffers = { ...countIn(jobIds), workplace_siret: { $in: individualSirets } }
  const moderationsFilter = { job_id: { $in: jobIds } }
  const moderationsToPurge = { ...moderationsFilter, masked_text: { $ne: null } }
  const applicationsFilter = { job_id: { $in: jobIds }, $or: [{ company_email: { $ne: "" } }, { company_phone: { $ne: null } }] }
  const individualApplications = {
    job_id: { $in: jobIds },
    company_siret: { $in: individualSirets },
    $or: [{ company_name: { $ne: RGPD_ANONYMIZED_VALUE } }, { company_address: { $ne: null } }],
  }

  return [
    {
      collection: "jobs_partners",
      action: "Offres ouvertes passées en annulée",
      count: () => getDbCollection("jobs_partners").countDocuments(openOffers),
      run: async () => (await changeJobsPartnersStatus(openOffers, { status: JOB_STATUS_ENGLISH.ANNULEE, reason: RGPD_CANCEL_REASON, grantedBy: RGPD_GRANTED_BY })).modifiedCount,
    },
    {
      collection: "jobs_partners",
      action: "Entreprise individuelle : nom retiré, adresse ramenée à la commune, position arrondie (~1 km)",
      count: () => getDbCollection("jobs_partners").countDocuments(individualOffers),
      run: async () =>
        (
          await getDbCollection("jobs_partners").updateMany(individualOffers, [
            {
              $set: {
                workplace_name: null,
                workplace_brand: null,
                workplace_legal_name: null,
                workplace_website: null,
                workplace_address_street_label: null,
                workplace_address_label: {
                  $trim: { input: { $concat: [{ $ifNull: ["$workplace_address_zipcode", ""] }, " ", { $ifNull: ["$workplace_address_city", ""] }] } },
                },
                workplace_geopoint: {
                  type: "Point",
                  coordinates: [
                    { $round: [{ $arrayElemAt: ["$workplace_geopoint.coordinates", 0] }, 2] },
                    { $round: [{ $arrayElemAt: ["$workplace_geopoint.coordinates", 1] }, 2] },
                  ],
                },
              },
            },
          ])
        ).matchedCount,
    },
    {
      collection: SEARCH_JOBS_COLLECTIONS.join(" / "),
      action: "Offres retirées de l'index de recherche",
      count: async () => {
        const counts = await Promise.all(SEARCH_JOBS_COLLECTIONS.map((name) => getDbCollection(name).countDocuments(countIn(jobIds))))
        return counts.reduce((total, count) => total + count, 0)
      },
      run: () => removeJobPartnersFromSearchItems(jobIds),
    },
    mode === RGPD_ERASURE_MODE.ANONYMIZE
      ? {
          collection: "jobs_partners_moderations",
          action: "Textes saisis par le recruteur purgés",
          count: () => getDbCollection("jobs_partners_moderations").countDocuments(moderationsToPurge),
          run: async () =>
            (await getDbCollection("jobs_partners_moderations").updateMany(moderationsToPurge, { $set: { original_text: null, masked_text: null, "findings.$[].verbatim": null } }))
              .modifiedCount,
        }
      : {
          collection: "jobs_partners_moderations",
          action: "Classifications des offres supprimées",
          count: () => getDbCollection("jobs_partners_moderations").countDocuments(moderationsFilter),
          run: async () => (await getDbCollection("jobs_partners_moderations").deleteMany(moderationsFilter)).deletedCount,
        },
    {
      collection: "applications",
      action: "Coordonnées du recruteur retirées des candidatures reçues (les candidatures restent aux candidats)",
      count: () => getDbCollection("applications").countDocuments(applicationsFilter),
      run: async () => (await getDbCollection("applications").updateMany(applicationsFilter, { $set: { company_email: "", company_phone: null } })).modifiedCount,
    },
    {
      // company_name est requis par le schéma : remplacé, pas vidé.
      collection: "applications",
      action: `Entreprise individuelle : nom (« ${RGPD_ANONYMIZED_VALUE} ») et adresse retirés des candidatures reçues`,
      count: () => getDbCollection("applications").countDocuments(individualApplications),
      run: async () =>
        (await getDbCollection("applications").updateMany(individualApplications, { $set: { company_name: RGPD_ANONYMIZED_VALUE, company_address: null } })).modifiedCount,
    },
    {
      collection: "jobs_partners",
      action: "Contacts retirés des offres (managed_by, apply_*, cfa_apply_*, delegations)",
      count: () => getDbCollection("jobs_partners").countDocuments(countIn(jobIds)),
      run: async () =>
        (
          await getDbCollection("jobs_partners").updateMany(countIn(jobIds), {
            $set: { managed_by: null, apply_email: null, apply_phone: null, cfa_apply_email: null, cfa_apply_phone: null, delegations: null },
          })
        ).matchedCount,
    },
  ]
}

const buildEstablishmentSteps = ({ orphanEntreprises, orphanCfas }: IRgpdAccountContext): IRgpdStep[] => {
  const orphanCfaIds = orphanCfas.map(({ _id }) => _id)
  const individualEntrepriseIds = orphanEntreprises.filter(({ isIndividual }) => isIndividual).map(({ _id }) => _id)
  const individualCfaIds = orphanCfas.filter(({ isIndividual }) => isIndividual).map(({ _id }) => _id)
  const orphanSirets = [...orphanEntreprises, ...orphanCfas].map(({ siret }) => siret)
  const geolocationKeys = [...orphanEntreprises, ...orphanCfas].flatMap(({ isIndividual, geolocationKey }) => (isIndividual && geolocationKey ? [geolocationKey] : []))

  // cache_siret en dernier : il porte la détection d'entreprise individuelle (cf. isIndividualCompany) que relit une relance.
  return [
    {
      collection: "cache_geolocation",
      action: "Adresse géocodée de l'entreprise individuelle",
      count: () => getDbCollection("cache_geolocation").countDocuments({ address: { $in: geolocationKeys } }),
      run: async () => (await getDbCollection("cache_geolocation").deleteMany({ address: { $in: geolocationKeys } })).deletedCount,
    },
    {
      collection: "entreprise_managed_by_cfa",
      action: "Entreprises suivies par un CFA qui n'a plus de compte",
      count: () => getDbCollection("entreprise_managed_by_cfa").countDocuments({ cfa_id: { $in: orphanCfaIds } }),
      run: async () => (await getDbCollection("entreprise_managed_by_cfa").deleteMany({ cfa_id: { $in: orphanCfaIds } })).deletedCount,
    },
    {
      collection: "entreprises",
      action: "Entreprise individuelle sans autre compte supprimée",
      count: () => getDbCollection("entreprises").countDocuments(countIn(individualEntrepriseIds)),
      run: async () => (await getDbCollection("entreprises").deleteMany(countIn(individualEntrepriseIds))).deletedCount,
    },
    {
      collection: "cfas",
      action: "CFA en entreprise individuelle sans autre compte supprimé",
      count: () => getDbCollection("cfas").countDocuments(countIn(individualCfaIds)),
      run: async () => (await getDbCollection("cfas").deleteMany(countIn(individualCfaIds))).deletedCount,
    },
    {
      collection: "cache_siret",
      action: "Cache SIRET des établissements sans autre compte (nom et adresse des entreprises individuelles)",
      count: () => getDbCollection("cache_siret").countDocuments({ siret: { $in: orphanSirets } }),
      run: async () => (await getDbCollection("cache_siret").deleteMany({ siret: { $in: orphanSirets } })).deletedCount,
    },
  ]
}

export const buildRgpdAccountSteps = (context: IRgpdAccountContext, mode: IRgpdErasureMode, emails: string[]): IRgpdStep[] => {
  const { user } = context
  const userFilter = { user_id: user._id }

  return [
    buildBrevoStep(user.email),
    ...buildOfferSteps(context, mode),
    mode === RGPD_ERASURE_MODE.ANONYMIZE
      ? {
          collection: "trafficsources",
          action: "Rattachement au compte retiré",
          count: () => getDbCollection("trafficsources").countDocuments(userFilter),
          run: async () => (await getDbCollection("trafficsources").updateMany(userFilter, { $set: { user_id: null } })).modifiedCount,
        }
      : {
          collection: "trafficsources",
          action: "Sources de trafic du compte supprimées",
          count: () => getDbCollection("trafficsources").countDocuments(userFilter),
          run: async () => (await getDbCollection("trafficsources").deleteMany(userFilter)).deletedCount,
        },
    ...buildGrantedByScrubSteps([...emails, user._id.toString()]),
    {
      // Régénérée 3 fois par jour, et relue par l'export Brevo de 22h30 : sans cette étape, le contact y revient.
      collection: "rolemanagement360",
      action: "Lignes du compte supprimées",
      count: () => getDbCollection("rolemanagement360").countDocuments({ role_user_id: user._id }),
      run: async () => (await getDbCollection("rolemanagement360").deleteMany({ role_user_id: user._id })).deletedCount,
    },
    ...buildEstablishmentSteps(context),
    {
      collection: "rolemanagements",
      action: "Rôles du compte supprimés",
      count: () => getDbCollection("rolemanagements").countDocuments(userFilter),
      run: async () => (await getDbCollection("rolemanagements").deleteMany(userFilter)).deletedCount,
    },
    {
      collection: "emailblacklists",
      action: "Adresse retirée de la liste de blocage",
      count: () => getDbCollection("emailblacklists").countDocuments({ email: { $in: emails } }),
      run: async () => (await getDbCollection("emailblacklists").deleteMany({ email: { $in: emails } })).deletedCount,
    },
    ...(mode === RGPD_ERASURE_MODE.ANONYMIZE
      ? [
          buildCopyStep({
            collection: anonymizedUsersWithAccountsModel.collectionName,
            action: "Copie non nominative (dates, origine, statuts)",
            count: () => getDbCollection("userswithaccounts").countDocuments({ _id: user._id }),
            copy: () =>
              getDbCollection("userswithaccounts")
                .aggregate([
                  { $match: { _id: user._id } },
                  { $project: { last_action_date: 1, origin: 1, status: 1 } },
                  { $merge: anonymizedUsersWithAccountsModel.collectionName },
                ])
                .toArray(),
          }),
        ]
      : []),
    {
      collection: "userswithaccounts",
      action: "Compte supprimé",
      count: () => getDbCollection("userswithaccounts").countDocuments({ _id: user._id }),
      run: async () => (await getDbCollection("userswithaccounts").deleteOne({ _id: user._id })).deletedCount,
    },
    {
      collection: "cache_classification / cache_diagoriente",
      action: "Non concernés : aucune donnée personnelle (clés = offre ou intitulé)",
      count: async () => null,
      run: async () => null,
    },
  ]
}
