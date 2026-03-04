import { badRequest, internal, notFound } from "@hapi/boom"
import equal from "fast-deep-equal"
import { ObjectId } from "mongodb"
import type { Filter } from "mongodb"
import type {
  IDelegation,
  IJob,
  IJobCreate,
  IJobWithRomeDetail,
  IRecruiter,
  IRecruiterWithRomeDetailAndApplicationCount,
  IReferentielRome,
  IRoleManagement,
  ITrackingCookies,
  IUserRecruteur,
  zRoutes,
} from "shared"
import { assertUnreachable, JOB_STATUS, JOB_STATUS_ENGLISH, removeAccents } from "shared"
import { LBA_ITEM_TYPE, UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import { CFA, NIVEAUX_POUR_LBA, RECRUITER_STATUS, RECRUITER_USER_ORIGIN, TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"
import type { IEntreprise } from "shared/models/entreprise.model"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import type { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { EntrepriseErrorCodes } from "shared/constants/errorCodes"
import dayjs from "shared/helpers/dayjs"
import type { ICFA } from "shared/models/cfa.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type z from "zod"
import { getUserManagingOffer } from "./application.service"
import { createViewDelegationLink } from "./appLinks.service"
import { getCatalogueFormations } from "./catalogue.service"
import { buildEstablishmentId, establishmentIdToUserIdAndSiret, getEntrepriseDataFromSiret } from "./etablissement.service"
import { buildLbaUrl } from "./jobs/jobOpportunity/jobOpportunity.service"
import mailer from "./mailer.service"
import { anonymizeLbaJobsPartners } from "./partnerJob.service"
import { getEntrepriseEngagementFranceTravail } from "./referentielEngagementEntreprise.service"
import { getComputedUserAccess, getGrantedRoles, getMainRoleManagement } from "./roleManagement.service"
import { getRomeDetailsFromDB } from "./rome.service"
import { saveJobTrafficSourceIfAny } from "./trafficSource.service"
import { isUserEmailChecked, validateUserWithAccountEmail } from "./userWithAccount.service"
import config from "@/config"
import { sanitizeTextField } from "@/common/utils/stringUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { isEmailFromPrivateCompany, isEmailSameDomain } from "@/common/utils/mailUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { asyncForEach } from "@/common/utils/asyncUtils"

type ISentDelegation = {
  raison_sociale: string
  siret_code: string
  adresse_etablissement: string
}

export interface IOffreExtended extends IJob {
  candidatures: number
  pourvue: string
  supprimer: string
}

const isAuthorizedToPublishJob = async ({ userId, entrepriseId }: { userId: ObjectId; entrepriseId: ObjectId }) => {
  const access = getComputedUserAccess(userId.toString(), await getGrantedRoles(userId.toString()))
  return access.admin || access.entreprises.includes(entrepriseId.toString())
}

/**
 * @description Create job offer for formulaire
 */
export const createJob = async ({
  job,
  siret,
  user,
  source,
}: {
  job: IJobCreate
  siret: string
  user: IUserWithAccount
  source?: ITrackingCookies
}): Promise<IJobsPartnersOfferPrivate> => {
  await validateFieldsFromReferentielRome(job)

  const entreprise = await getDbCollection("entreprises").findOne({ siret })
  if (!entreprise) {
    throw new Error(`entreprise non trouvée pour siret=${siret}`)
  }
  const mainRole = await getMainRoleManagement(user._id, true)
  if (!mainRole) {
    throw new Error(`mainRole non trouvé pour user id=${user._id}`)
  }
  if (mainRole.authorized_type === AccessEntityType.CFA) {
    const cfaId = new ObjectId(mainRole.authorized_id)
    const entrepriseManagedByCfa = await getDbCollection("entreprise_managed_by_cfa").findOne({ cfa_id: cfaId, entreprise_id: entreprise._id })
    if (!entrepriseManagedByCfa) {
      throw new Error(`entreprise siret=${siret} gérée par un cfa id=${cfaId} non trouvée`)
    }
  }

  const userId = user._id

  const is_delegated = mainRole.authorized_type === AccessEntityType.CFA

  let isOrganizationValid = false
  let entrepriseStatus: EntrepriseStatus | null = null
  if (is_delegated) {
    isOrganizationValid = true
  } else if ("status" in entreprise) {
    entrepriseStatus = getLastStatusEvent(entreprise.status)?.status ?? null
    isOrganizationValid = entrepriseStatus === EntrepriseStatus.VALIDE && (await isAuthorizedToPublishJob({ userId, entrepriseId: entreprise._id }))
  }
  const isUserEmailConfirmed = isUserEmailChecked(user)
  const isJobActive = isOrganizationValid && isUserEmailConfirmed

  const newJobStatus = isJobActive ? JOB_STATUS_ENGLISH.ACTIVE : JOB_STATUS_ENGLISH.EN_ATTENTE
  // get user activation state if not managed by a CFA
  const codeRome = job.rome_code.at(0)
  if (!codeRome) {
    throw internal(`inattendu : pas de code rome pour une création d'offre pour siret=${siret}, role._id=${mainRole._id}`)
  }

  let cfa: ICFA | null = null
  if (is_delegated) {
    cfa = await getDbCollection("cfas").findOne({ _id: new ObjectId(mainRole.authorized_id) })
    if (!cfa) {
      throw internal(`inattendu: cfa non trouvé pour role id=${mainRole._id}`)
    }
  }

  const newJobPartner: IJobsPartnersOfferPrivate = await jobCreateToJobsPartner({
    job,
    cfa: cfa ?? undefined,
    entreprise,
    user,
    status: newJobStatus,
    origin: "lba",
  })

  await getDbCollection("jobs_partners").insertOne(newJobPartner)

  const userJobCount = await getDbCollection("jobs_partners").countDocuments({ managed_by: user._id, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, workplace_siret: siret })

  // if first offer creation for an Entreprise, send specific mail
  if (!(userJobCount === 1 && is_delegated === false)) {
    await sendMailNouvelleOffre(user, newJobPartner)
  }
  if (source) {
    await saveJobTrafficSourceIfAny({ job_id: newJobPartner._id, source })
  }
  return newJobPartner
}

/**
 * Create job delegations
 */
export const createJobDelegations = async ({ jobId, etablissementCatalogueIds }: { jobId: ObjectId; etablissementCatalogueIds: string[] }): Promise<void> => {
  const offer = await getDbCollection("jobs_partners").findOne({ _id: jobId })
  if (!offer) {
    throw internal("Offre not found", { jobId, etablissementCatalogueIds })
  }
  const managingUser = await getUserManagingOffer(offer)
  const entreprise = await getDbCollection("entreprises").findOne({ siret: offer.workplace_siret ?? undefined })
  let shouldSentMailToCfa = false
  if (entreprise) {
    const role = await getDbCollection("rolemanagements").findOne({
      user_id: managingUser._id,
      authorized_id: entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
    })
    if (role && getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED) {
      shouldSentMailToCfa = true
    }
  }
  const delegations: IDelegation[] = []
  const sentDelegations: ISentDelegation[] = []

  const formations = await getCatalogueFormations(
    {
      $or: [{ etablissement_gestionnaire_id: { $in: etablissementCatalogueIds } }, { etablissement_formateur_id: { $in: etablissementCatalogueIds } }],
      etablissement_gestionnaire_courriel: { $nin: [null, ""] },
      catalogue_published: true,
    },
    { etablissement_gestionnaire_courriel: 1, etablissement_formateur_siret: 1, etablissement_gestionnaire_id: 1, etablissement_formateur_id: 1 }
  )

  await Promise.all(
    etablissementCatalogueIds.map(async (etablissementId) => {
      //TODO: il y a des cas particuliers où des formations ont un siret différent tout en ayant le même etablissement_id
      // les délégations sont enregistrées sur le siret de la première formation trouvée
      // le problème est visible lorsque deux formations avec des sirets différents sont proposées sur la ui. Seule une d'entre elle sera
      // affichées comme délégation envoyée ce qui peut perturber l'utilisateur et le faire tenter de renvoyer la délégation
      const formation = formations.find((formation) => formation.etablissement_gestionnaire_id === etablissementId || formation.etablissement_formateur_id === etablissementId)
      const {
        etablissement_formateur_siret: siret_code,
        etablissement_gestionnaire_courriel: email,
        etablissement_formateur_entreprise_raison_sociale,
        etablissement_formateur_code_postal,
        etablissement_formateur_adresse,
        etablissement_formateur_localite,
      } = formation ?? {}
      if (!email || !siret_code) {
        // This shouldn't happen considering the query filter
        throw internal("Unexpected etablissement_gestionnaire_courriel", { jobId, etablissementCatalogueIds })
      }

      delegations.push({ siret_code, email })

      if (shouldSentMailToCfa) {
        await sendDelegationMailToCFA(email, offer, siret_code)
        sentDelegations.push({
          raison_sociale: etablissement_formateur_entreprise_raison_sociale || "",
          siret_code,
          adresse_etablissement: `${etablissement_formateur_adresse}, ${etablissement_formateur_code_postal} ${etablissement_formateur_localite}`,
        })
      }
    })
  )
  if (sentDelegations.length) {
    const jobTitle = offer.offer_title
    const jobUrl = new URL(`${config.publicUrl}/emploi/${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}/${offer._id}/${encodeURIComponent(jobTitle!)}`)
    await mailer.sendEmail({
      to: managingUser.email,
      subject: `Votre offre a été partagée à ${sentDelegations.length} école(s)`,
      template: getStaticFilePath("./templates/mail-mer-confirmation.mjml.ejs"),
      data: {
        first_name: managingUser.first_name,
        last_name: managingUser.last_name,
        email: managingUser.email,
        phone: managingUser.phone,
        job_title: jobTitle,
        job_url: jobUrl,
        delegations: sentDelegations,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
        },
        publicEmail: config.publicEmail,
      },
    })
  }

  const newDelegations = offer.delegations?.concat(delegations) ?? delegations
  await getDbCollection("jobs_partners").updateOne(
    {
      _id: offer._id,
    },
    {
      $set: {
        delegations: newDelegations,
        job_delegation_count: newDelegations.length,
      },
    }
  )
}

/**
 * @description Check if job offer exists
 * @param {IJob['_id']} id
 * @returns {Promise<IRecruiter>}
 */
export const checkOffreExists = async (id: ObjectId): Promise<boolean> => {
  const count = await getDbCollection("jobs_partners").countDocuments({ _id: id })
  return count === 1
}

const romeDetailJoin = [
  {
    $lookup: {
      from: "referentielromes",
      let: { rome_code: { $arrayElemAt: ["$offer_rome_codes", 0] } },
      pipeline: [{ $match: { $expr: { $eq: ["$rome.code_rome", "$$rome_code"] } } }],
      as: "rome_detail",
    },
  },
  { $unwind: { path: "$rome_detail", preserveNullAndEmptyArrays: true } },
]

const applicationCountJoin = [
  {
    $lookup: {
      from: "applications",
      localField: "_id",
      foreignField: "job_id",
      as: "applications",
    },
  },
  {
    $addFields: {
      application_count: {
        $size: "$applications",
      },
    },
  },
  {
    $unset: ["applications"],
  },
]

/**
 * @description Get job offer by its id.
 */
export const getJobWithRomeDetail = async (id: string): Promise<IJobWithRomeDetail | null> => {
  const jobPartner = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(id) })
  if (!jobPartner) {
    return null
  }
  const { managed_by, workplace_siret } = jobPartner
  if (!managed_by) {
    throw internal(`inattendu: managed_by vide pour offre id=${id}`)
  }
  if (!workplace_siret) {
    throw internal(`inattendu: workplace_siret vide pour offre id=${id}`)
  }
  const recruiter = await getRecruiterFromJobsPartnerFilter({
    userId: managed_by,
    siret: workplace_siret,
    addApplicationCounts: false,
    filter: {
      _id: new ObjectId(id),
    },
  })
  const jobOpt = recruiter?.jobs.at(0) ?? null
  if (jobOpt?.rome_detail) {
    // @ts-expect-error
    delete jobOpt.rome_detail.couple_appellation_rome
    // @ts-expect-error
    delete jobOpt.rome_detail._id
  }
  return jobOpt
}

export const getFormulaireWithRomeDetail = async ({ establishment_id }: { establishment_id: string }): Promise<IRecruiter | null> => {
  const { userId, siret } = await establishmentIdToUserIdAndSiret(establishment_id)
  return getRecruiterFromJobsPartnerFilter({ userId, siret, addApplicationCounts: false })
}

export const getFormulaireWithRomeDetailAndApplicationCount = async ({
  establishment_id,
}: {
  establishment_id: string
}): Promise<IRecruiterWithRomeDetailAndApplicationCount | null> => {
  const { userId, siret } = await establishmentIdToUserIdAndSiret(establishment_id)
  return getRecruiterFromJobsPartnerFilter({ userId, siret, addApplicationCounts: true })
}

export const getFormulairesForCfaManagedEnterprises = async (userId: ObjectId, sirets: string[]): Promise<IRecruiter[]> => {
  if (sirets.length === 0) return []

  const [allJobsWithRomeDetail, entreprises, mainRole, user] = await Promise.all([
    getDbCollection("jobs_partners")
      .aggregate([
        {
          $match: {
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            workplace_siret: { $in: sirets },
            managed_by: userId,
          },
        },
        ...romeDetailJoin,
      ])
      .toArray() as Promise<(IJobsPartnersOfferPrivate & { rome_detail?: IReferentielRome })[]>,
    getDbCollection("entreprises")
      .find({ siret: { $in: sirets } })
      .toArray(),
    getMainRoleManagement(userId, true),
    getDbCollection("userswithaccounts").findOne({ _id: userId }),
  ])

  if (!mainRole) {
    throw internal(`inattendu: mainRole vide pour userId=${userId}`)
  }
  if (!user) {
    throw internal(`inattendu: user vide pour userId=${userId}`)
  }

  let cfa: ICFA | null = null
  if (mainRole.authorized_type === AccessEntityType.CFA) {
    cfa = await getDbCollection("cfas").findOne({ _id: new ObjectId(mainRole.authorized_id) })
    if (!cfa) {
      throw internal(`inattendu: cfa non trouvé pour role id=${mainRole._id}`)
    }
  }

  const entreprisesBySiret = new Map(entreprises.map((e) => [e.siret, e]))
  const jobsBySiret = new Map<string, (IJobsPartnersOfferPrivate & { rome_detail?: IReferentielRome })[]>()
  for (const job of allJobsWithRomeDetail) {
    if (job.workplace_siret) {
      const jobList = jobsBySiret.get(job.workplace_siret) ?? []
      jobList.push(job)
      jobsBySiret.set(job.workplace_siret, jobList)
    }
  }

  const recruiters: IRecruiter[] = []
  for (const siret of sirets) {
    const entreprise = entreprisesBySiret.get(siret)
    if (!entreprise) {
      throw internal(`inattendu: entreprise non trouvée pour siret=${siret}`)
    }
    const jobs = jobsBySiret.get(siret) ?? []
    const recruiter = jobPartnersToRecruiter(jobs, mainRole, user, entreprise, cfa ?? undefined)
    recruiter.jobs.forEach((job) => {
      // @ts-expect-error
      delete job.candidatures
    })
    recruiters.push(recruiter)
  }
  return recruiters
}

const getRecruiterFromJobsPartnerFilter = async ({
  userId,
  siret,
  filter,
  addApplicationCounts = false,
}: {
  userId: ObjectId
  siret: string
  filter?: Filter<IJobsPartnersOfferPrivate>
  addApplicationCounts?: boolean
}): Promise<IRecruiterWithRomeDetailAndApplicationCount | null> => {
  const jobsWithRomeDetail = (await getDbCollection("jobs_partners")
    .aggregate([
      {
        $match: {
          $and: [
            filter ?? {},
            {
              partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
              workplace_siret: siret,
              managed_by: userId,
            },
          ],
        },
      },
      ...romeDetailJoin,
      ...(addApplicationCounts ? applicationCountJoin : []),
    ])
    .toArray()) as (IJobsPartnersOfferPrivate & { rome_detail?: IReferentielRome; application_count?: number })[]

  const [mainRole, entreprise, user] = await Promise.all([
    getMainRoleManagement(userId, true),
    getDbCollection("entreprises").findOne({ siret }),
    getDbCollection("userswithaccounts").findOne({ _id: userId }),
  ])
  if (!mainRole) {
    throw internal(`inattendu: mainRole vide pour userId=${userId}, siret=${siret}`)
  }
  if (!entreprise) {
    throw internal(`inattendu: entreprise vide pour userId=${userId}, siret=${siret}`)
  }
  if (!user) {
    throw internal(`inattendu: user vide pour userId=${userId}, siret=${siret}`)
  }
  let cfa: ICFA | null = null
  if (mainRole.authorized_type === AccessEntityType.CFA) {
    cfa = await getDbCollection("cfas").findOne({ _id: new ObjectId(mainRole.authorized_id) })
    if (!cfa) {
      throw internal(`inattendu: cfa non trouvé pour role id=${mainRole._id}`)
    }
  }

  const recruiter = jobPartnersToRecruiter(jobsWithRomeDetail, mainRole, user, entreprise, cfa ?? undefined)
  if (!addApplicationCounts) {
    recruiter.jobs.forEach((job) => {
      // @ts-expect-error
      delete job.candidatures
    })
  }
  return recruiter
}

/**
 * @description Archive existing formulaire and cancel all its job offers
 */
export const archiveFormulaireByEstablishmentId = async (id: string) => {
  const { userId, siret } = await establishmentIdToUserIdAndSiret(id)
  await archiveFormulaire(userId, siret)
}

export const archiveFormulaire = async (userId: ObjectId, siret: string) => {
  const now = new Date()
  await getDbCollection("jobs_partners").updateMany(
    { managed_by: userId, workplace_siret: siret, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: JOB_STATUS_ENGLISH.ACTIVE },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now, offer_expiration: now } }
  )
  await getDbCollection("jobs_partners").updateMany(
    { managed_by: userId, workplace_siret: siret, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: { $ne: JOB_STATUS_ENGLISH.ACTIVE } },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now } }
  )
}

/**
 * @description Archive existing delegated formulaires and cancel all its job offers
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 */
export const archiveDelegatedFormulaire = async (userId: ObjectId, cfaId: ObjectId) => {
  const delegatedEntreprises = await getDbCollection("entreprise_managed_by_cfa").find({ cfa_id: cfaId }).toArray()
  await asyncForEach(delegatedEntreprises, async (managedEntreprise) => {
    const entreprise = await getDbCollection("entreprises").findOne({ _id: managedEntreprise._id })
    if (entreprise) {
      await archiveFormulaire(userId, entreprise.siret)
    }
  })
}

type PatchOffreBody = z.output<(typeof zRoutes.put)["/formulaire/offre/:jobId"]["body"]>
/**
 * @description Update specific field(s) in an existing job offer
 */
export const patchOffre = async (id: ObjectId, payload: PatchOffreBody): Promise<void> => {
  await validateFieldsFromReferentielRome(payload)

  const job = payload
  const now = new Date()

  const romeDetails = await getRomeDetailsFromDB(job.rome_code[0])

  const jobPartnerUpdate: Partial<IJobsPartnersOfferPrivate> = {
    offer_opening_count: job.job_count ?? 1,
    offer_expiration: job.job_expiration_date,
    contract_start: job.job_start_date ?? null,
    offer_status: getOfferStatus(job.job_status, RECRUITER_STATUS.ACTIF),
    contract_type: job.job_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    updated_at: now,
    offer_rome_codes: job.rome_code ?? null,
    offer_desired_skills:
      job.competences_rome?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ??
      romeDetails?.competences?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ??
      [],
    offer_to_be_acquired_skills: getSkillsFromRome(job.competences_rome?.savoir_faire, romeDetails?.competences?.savoir_faire),
    offer_to_be_acquired_knowledge: getSkillsFromRome(job.competences_rome?.savoirs, romeDetails?.competences?.savoirs),
    delegations: job?.delegations,
    job_delegation_count: job?.delegations?.length ?? 0,
    contract_duration: job.job_duration ?? null,
    offer_target_diploma: getDiplomaLevel(job.job_level_label) ?? null,
  }

  const found = await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: jobPartnerUpdate })

  if (!found) {
    throw internal("Job not found")
  }
}

export const updateJobDelegation = async (jobId: ObjectId, delegation: IDelegation) => {
  const now = new Date()
  await getDbCollection("jobs_partners").bulkWrite(
    [
      { updateOne: { filter: { _id: jobId }, update: { $set: { updated_at: now } } } },
      { updateOne: { filter: { _id: jobId }, update: { $pull: { delegations: { siret_code: delegation.siret_code } } } } },
      { updateOne: { filter: { _id: jobId }, update: { $push: { delegations: delegation } } } },
    ],
    { ordered: true }
  )
}

/**
 * @description Change job status to provided
 */
export const provideOffre = async (id: ObjectId): Promise<void> => {
  const now = new Date()
  const found = await getDbCollection("jobs_partners").findOneAndUpdate(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, _id: id },
    { $set: { offer_status: JOB_STATUS_ENGLISH.POURVUE, updated_at: now } }
  )
  if (!found) {
    throw new Error(`could not find lba offer with id=${id}`)
  }
}

/**
 * @description Cancel job from transaction email
 */
export const cancelOffre = async (id: ObjectId): Promise<void> => {
  const now = new Date()
  const found = await getDbCollection("jobs_partners").findOneAndUpdate(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, _id: id },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now, offer_expiration: now } }
  )
  if (!found) {
    throw new Error(`could not find lba offer with id=${id}`)
  }
}

export const cancelOffreFromAdminInterface = async ({
  id,
  offer_status,
  job_status_comment,
}: {
  id: ObjectId
  offer_status: JOB_STATUS_ENGLISH
  job_status_comment: string
}): Promise<void> => {
  const now = new Date()
  const found = await getDbCollection("jobs_partners").findOneAndUpdate(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, _id: id },
    { $set: { offer_status, updated_at: now, offer_expiration: now, job_status_comment } },
    {
      returnDocument: "after",
    }
  )
  if (!found) {
    throw new Error(`could not find lba offer with id=${id}`)
  }
}

/**
 * @description Extends job duration by 1 month.
 */
export const extendOffre = async (id: ObjectId): Promise<Date> => {
  const now = new Date()
  const found = await getDbCollection("jobs_partners").findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: {
        offer_expiration: addExpirationPeriod(dayjs()).toDate(),
        // TODO job_last_prolongation_date
        updated_at: now,
        // TODO relance_mail_expiration_J7
        // TODO relance_mail_expiration_J1
      },
      // $inc: { "jobs.$.job_prolongation_count": 1 },
    },
    {
      returnDocument: "after",
    }
  )
  if (!found) {
    throw notFound(`could not find lba offer with id=${id}`)
  }
  const { offer_expiration } = found
  if (!offer_expiration) {
    throw new Error("inattendu: offer_expiration vide")
  }
  return offer_expiration
}

const activateAndExtendOffre = async (id: ObjectId) => {
  const found = await getDbCollection("jobs_partners").findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: {
        offer_expiration: addExpirationPeriod(dayjs()).toDate(),
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  )
  if (!found) {
    throw new Error(`could not find lba offer with id=${id}`)
  }
  return found
}

/**
 * activate offers if they are awaiting validation and the user is ready to publish its offers
 */
export const checkForJobActivations = async (userId: ObjectId, entrepriseId: ObjectId) => {
  const entreprise = await getDbCollection("entreprises").findOne({ _id: entrepriseId })
  if (!entreprise) {
    return
  }
  const awaitingJobs = await getDbCollection("jobs_partners")
    .find({
      managed_by: userId,
      offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
      workplace_siret: entreprise.siret,
    })
    .toArray()
  if (!awaitingJobs.length) return
  const managedByObjectId = userId
  const [userOpt, roles] = await Promise.all([getDbCollection("userswithaccounts").findOne({ _id: managedByObjectId }), getGrantedRoles(userId.toString())])
  if (!userOpt || !isUserEmailChecked(userOpt) || !entreprise) return
  const recruiterRole = roles.find((role) => role.authorized_id === entreprise._id.toString())
  if (!recruiterRole) return
  await asyncForEach(awaitingJobs, async (job) => {
    const extendedOffer = await activateAndExtendOffre(job._id)
    const delegations = extendedOffer.delegations ?? []
    await Promise.all(delegations.map(async (delegation) => sendDelegationMailToCFA(delegation.email, extendedOffer, delegation.siret_code)))
  })
}

const getJobOrigin = async (userId: ObjectId) => {
  const userWithAccount = await getDbCollection("userswithaccounts").findOne({ _id: userId })
  return (userWithAccount && userWithAccount.origin && RECRUITER_USER_ORIGIN[userWithAccount.origin]) ?? "La bonne alternance"
}

/**
 * @description Sends the mail informing the CFA that a company wants the CFA to handle the offer.
 */
export async function sendDelegationMailToCFA(email: string, offre: IJobsPartnersOfferPrivate, siret: string) {
  const unsubscribeOF = await getDbCollection("unsubscribedofs").findOne({ establishment_siret: siret })
  if (unsubscribeOF) return

  const { managed_by, establishment_id } = offre
  if (!managed_by) {
    throw new Error(`inattendu: managed_by vide pour l'offre avec id=${offre._id}`)
  }
  if (!establishment_id) {
    throw new Error(`inattendu: establishment_id vide pour l'offre avec id=${offre._id}`)
  }

  const jobOrigin = await getJobOrigin(managed_by)

  await mailer.sendEmail({
    to: email,
    subject: `Une entreprise recrute dans votre domaine`,
    template: getStaticFilePath("./templates/mail-cfa-delegation.mjml.ejs"),
    data: {
      images: { logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`, logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true` },
      enterpriseName: offre.workplace_name,
      jobName: offre.offer_title,
      contractType: (offre.contract_type ?? []).join(", "),
      trainingLevel: offre.offer_target_diploma,
      startDate: dayjs(offre.contract_start).format("DD/MM/YYYY"),
      duration: offre.contract_duration,
      jobOrigin,
      offerButton:
        createViewDelegationLink(email, establishment_id, offre._id.toString(), siret) +
        "&utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_consulter-coord-entreprise",
      createAccountButton: `${config.publicUrl}/organisme-de-formation?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_creer-compte`,
      policyUrl: `${config.publicUrl}/politique-de-confidentialite?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_politique-confidentialite`,
      publicEmail: config.publicEmail,
    },
  })
}

export async function sendMailNouvelleOffre(user: IUserWithAccount, job: IJobsPartnersOfferPrivate) {
  const isRecruteurAwaiting = job.offer_status === JOB_STATUS_ENGLISH.EN_ATTENTE
  if (isRecruteurAwaiting) {
    return
  }
  const { email, last_name, first_name } = user
  const { is_delegated, workplace_name, workplace_siret: siret } = job
  const establishmentTitle = workplace_name ?? siret
  // Send mail with action links to manage offers
  await mailer.sendEmail({
    to: email,
    subject: is_delegated ? `Votre offre d'alternance pour ${establishmentTitle} est publiée` : `Votre offre d'alternance est publiée`,
    template: getStaticFilePath("./templates/mail-nouvelle-offre.mjml.ejs"),
    data: {
      images: { logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`, logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true` },
      nom: sanitizeTextField(last_name),
      prenom: sanitizeTextField(first_name),
      raison_sociale: establishmentTitle,
      mandataire: is_delegated,
      offre: {
        rome_appellation_label: job.offer_rome_appellation,
        job_type: job.contract_type.join(", "),
        job_level_label: job.offer_target_diploma?.label,
        job_start_date: dayjs(job.contract_start).format("DD/MM/YY"),
        job_title: job.offer_title,
      },
      lba_url: buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id, siret, job.offer_title),
      publicEmail: config.publicEmail,
    },
  })
}

export function addExpirationPeriod(fromDate: Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(fromDate).add(2, "months").startOf("day")
}

export const getJobFromRecruiter = (recruiter: IRecruiter, jobId: string): IJob => {
  const job = recruiter.jobs.find((job) => job._id.toString() === jobId)
  if (!job) {
    throw new Error(`could not find job with id=${jobId} in recruiter with id=${recruiter._id}`)
  }
  return job
}

const generateKey = (item) => `${item.libelle}-${item.code_ogr}-${item.coeur_metier}`

const filterRomeDetails = (romeDetails, competencesRome) => {
  const filteredRome: any = {}

  Object.keys(competencesRome).forEach((key) => {
    if (romeDetails[key]) {
      if (key === "savoir_etre_professionnel") {
        // Create a map of competencesRome for quick lookup
        const competencesMap = new Map(competencesRome[key].map((item) => [generateKey(item), item]))

        // Filter romeDetails based on the map created above
        filteredRome[key] = romeDetails[key].filter((item) => competencesMap.has(generateKey(item)))
      } else {
        // For savoir_faire and savoirs
        filteredRome[key] = romeDetails[key]
          .map((category) => {
            const competencesCategory = competencesRome[key].find((c) => c.libelle === category.libelle)
            if (competencesCategory) {
              // Create a map of items for quick lookup
              const competencesMap = new Map(competencesCategory.items.map((item) => [generateKey(item), item]))

              // Filter items in the category based on the map created above
              const filteredItems = category.items.filter((item) => competencesMap.has(generateKey(item)))
              return { libelle: category.libelle, items: filteredItems }
            }
          })
          // filter undefined if competencesCategory not found
          .filter((x) => x)
      }
    }
  })

  return filteredRome
}

const validateFieldsFromReferentielRome = async (job: IJobCreate | Partial<IJob>) => {
  const { competences_rome, rome_code, rome_appellation_label, rome_label } = job
  const firstRomeCode = rome_code?.at(0)
  const romeDetails = firstRomeCode ? await getRomeDetailsFromDB(firstRomeCode) : null

  if (!romeDetails) {
    throw internal("unexpected: rome details not found")
  }

  if (!rome_appellation_label) {
    throw new Error("rome_appellation_label est vide")
  }
  if (!rome_label) {
    throw new Error("rome_label est vide")
  }
  if (!competences_rome) {
    throw new Error("competences_rome est vide")
  }

  const {
    competences,
    rome: { intitule },
    appellations,
  } = romeDetails

  const formatedIntituleFromRome = removeAccents(intitule.toLowerCase())
  const formatedRomeLabelFromJob = removeAccents(rome_label.toLowerCase())

  if (formatedIntituleFromRome !== formatedRomeLabelFromJob) {
    throw badRequest(`L'intitulé du code ROME ne correspond pas au référentiel : ${formatedIntituleFromRome}, reçu ${formatedRomeLabelFromJob}`)
  }

  const matchingAppellation = appellations.some((appellation) => removeAccents(appellation.libelle.toLowerCase()) === removeAccents(rome_appellation_label.toLowerCase()))

  if (!matchingAppellation) {
    throw badRequest(`L'appellation du code ROME ne correspond pas au référentiel : reçu ${removeAccents(rome_appellation_label.toLowerCase())}`)
  }

  const filteredRome = filterRomeDetails(competences, competences_rome)
  const isValid = equal(filteredRome, competences_rome)

  if (!isValid) {
    throw badRequest("compétences invalides")
  }
}

export const validateUserEmailFromJobId = async (jobId: ObjectId) => {
  const job = await getDbCollection("jobs_partners").findOne({ _id: jobId })
  const { managed_by } = job ?? {}
  if (managed_by) {
    await validateUserWithAccountEmail(managed_by)
  }
}

export const validateDelegatedCompanyPhoneAndEmail = (user: IUserWithAccount | IUserRecruteur, phone?: string, email?: string) => {
  if (user.phone === phone) {
    throw badRequest(EntrepriseErrorCodes.PHONE_SAME_AS_CFA)
  }
  if (!email || user.email?.toLocaleLowerCase() === email?.toLocaleLowerCase() || (isEmailFromPrivateCompany(email) && isEmailSameDomain(user.email, email))) {
    throw badRequest(EntrepriseErrorCodes.EMAIL_SAME_AS_CFA)
  }
}

type UpdateCfaManagedBody = z.output<(typeof zRoutes.post)["/formulaire/:establishment_id/informations"]["body"]>
export const updateCfaManagedRecruiter = async (user: IUserWithAccount, establishment_id: string, payload: UpdateCfaManagedBody) => {
  const mainRole = await getMainRoleManagement(user._id)
  if (mainRole?.authorized_type !== AccessEntityType.CFA) {
    throw new Error(`inattendu: mainRole doit être de type CFA pour le user id=${user._id}`)
  }
  const cfaId = new ObjectId(mainRole.authorized_id)
  const { siret } = await establishmentIdToUserIdAndSiret(establishment_id)
  const entreprise = await getDbCollection("entreprises").findOne({ siret })
  if (!entreprise) {
    throw new Error(`inattendu: entreprise non trouvée pour l'establishment_id=${establishment_id}`)
  }
  await getDbCollection("entreprise_managed_by_cfa").updateOne(
    { entreprise_id: entreprise._id, cfa_id: cfaId },
    {
      $set: {
        ...payload,
        updatedAt: new Date(),
      },
    }
  )
}

function getDiplomaLevel(label: string | null | undefined): IComputedJobsPartners["offer_target_diploma"] {
  if (!label) {
    return null
  }

  switch (label) {
    case NIVEAUX_POUR_LBA["3 (CAP...)"]:
      return { european: "3", label }
    case NIVEAUX_POUR_LBA["4 (BAC...)"]:
      return { european: "4", label }
    case NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"]:
      return { european: "5", label }
    case NIVEAUX_POUR_LBA["6 (Licence, BUT...)"]:
      return { european: "6", label }
    case NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"]:
      return { european: "7", label }
    default:
      return null
  }
}

function getOfferStatus(job_status: JOB_STATUS, recruiter_status: RECRUITER_STATUS): JOB_STATUS_ENGLISH {
  if (recruiter_status !== RECRUITER_STATUS.ACTIF) {
    return JOB_STATUS_ENGLISH.ANNULEE
  }
  switch (job_status) {
    case JOB_STATUS.ACTIVE:
      return JOB_STATUS_ENGLISH.ACTIVE
    case JOB_STATUS.POURVUE:
      return JOB_STATUS_ENGLISH.POURVUE
    case JOB_STATUS.ANNULEE:
      return JOB_STATUS_ENGLISH.ANNULEE
    case JOB_STATUS.EN_ATTENTE:
      return JOB_STATUS_ENGLISH.EN_ATTENTE
    default:
      assertUnreachable(`Unexpected job status ${job_status} in getOfferStatus` as never)
  }
}

function getSkillsFromRome(skills, romeDetailsSkills): string[] {
  const usedSkills = skills ?? romeDetailsSkills

  if (!usedSkills) return []
  return usedSkills.flatMap((skill) => skill.items.map((subSkill) => `${skill.libelle}\t${subSkill.libelle}`))
}

function getStringBefore(text: string, separator: string): readonly [string, string] | null {
  const index = text.indexOf(separator)
  if (index === -1) {
    return null
  }
  return [text.substring(0, index), text.substring(index + separator.length)] as const
}

export function getCompetencesRomeFromPartnerJob(jobPartner: IJobsPartnersOfferPrivate & { rome_detail?: IReferentielRome | null }): IJob["competences_rome"] {
  const competences = jobPartner.rome_detail?.competences
  if (!competences) {
    return null
  }

  const desiredSkills = new Set(jobPartner.offer_desired_skills)

  const selectedSavoirFaireByCategory = new Map<string, Set<string>>()
  for (const value of jobPartner.offer_to_be_acquired_skills) {
    const splitResult = getStringBefore(value, "\t")
    if (!splitResult) {
      continue
    }
    const [categoryLabel, itemLabel] = splitResult
    const itemsByCategory = selectedSavoirFaireByCategory.get(categoryLabel) ?? new Set<string>()
    itemsByCategory.add(itemLabel)
    selectedSavoirFaireByCategory.set(categoryLabel, itemsByCategory)
  }

  const selectedSavoirsByCategory = new Map<string, Set<string>>()
  for (const value of jobPartner.offer_to_be_acquired_knowledge ?? []) {
    const splitResult = getStringBefore(value, "\t")
    if (!splitResult) {
      continue
    }
    const [categoryLabel, itemLabel] = splitResult
    const itemsByCategory = selectedSavoirsByCategory.get(categoryLabel) ?? new Set<string>()
    itemsByCategory.add(itemLabel)
    selectedSavoirsByCategory.set(categoryLabel, itemsByCategory)
  }

  const savoirEtreProfessionnel = (competences.savoir_etre_professionnel ?? []).filter((item) => desiredSkills.has(item.libelle))

  const savoirFaire = (competences.savoir_faire ?? [])
    .map((category) => {
      const selectedItems = selectedSavoirFaireByCategory.get(category.libelle)
      if (!selectedItems) {
        return null
      }

      const items = category.items.filter((item) => selectedItems.has(item.libelle))
      if (!items.length) {
        return null
      }

      return { ...category, items }
    })
    .filter((value): value is NonNullable<IReferentielRome["competences"]["savoir_faire"]>[number] => Boolean(value))

  const savoirs = (competences.savoirs ?? [])
    .map((category) => {
      const selectedItems = selectedSavoirsByCategory.get(category.libelle)
      if (!selectedItems) {
        return null
      }

      const items = category.items.filter((item) => selectedItems.has(item.libelle))
      if (!items.length) {
        return null
      }

      return { ...category, items }
    })
    .filter((value): value is NonNullable<IReferentielRome["competences"]["savoirs"]>[number] => Boolean(value))

  return {
    savoir_etre_professionnel: savoirEtreProfessionnel,
    savoir_faire: savoirFaire,
    savoirs,
  }
}

// const upsertJobPartnersFromRecruiter = async (recruiter: IRecruiter, job: IJob) => {
//   const now = new Date()

//   const [romeDetails, lbaJobContactInfo, disabledEngagement] = await Promise.all([
//     getRomeDetailsFromDB(job.rome_code[0]),
//     recruiter.is_delegated ? getLbaJobContactInfo(recruiter) : null,
//     getEntrepriseEngagementFranceTravail(recruiter.establishment_siret),
//   ])

//   const { definition, acces_metier } = romeDetails ?? {}

//   const delegatedFields = recruiter.is_delegated
//     ? {
//         cfa_siret: lbaJobContactInfo?.establishment_siret || null,
//         cfa_legal_name: lbaJobContactInfo?.establishment_raison_sociale || null,
//         cfa_apply_phone: lbaJobContactInfo?.phone || null,
//         cfa_apply_email: lbaJobContactInfo?.email || null,
//         cfa_address_label: lbaJobContactInfo?.address || null,
//       }
//     : {
//         cfa_siret: null,
//         cfa_legal_name: null,
//         cfa_apply_phone: null,
//         cfa_apply_email: null,
//         cfa_address_label: null,
//       }

//   const offer_title = job.offer_title_custom ?? job.rome_appellation_label ?? job.rome_label ?? "Offre"
//   const partnerJobToUpsert: Partial<IJobsPartnersOfferPrivate> = {
//     _id: job._id,
//     updated_at: job.job_update_date ?? now,
//     created_at: job.job_creation_date ?? now,
//     partner_label: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
//     partner_job_id: job._id.toString(),
//     is_delegated: recruiter.is_delegated,
//     job_status_comment: job?.job_status_comment || null,
//     job_delegation_count: job?.job_delegation_count || null,
//     delegations: job?.delegations,

//     contract_start: job.job_start_date ?? null,
//     contract_duration: job.job_duration ?? null,
//     contract_type: job.job_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],

//     contract_is_disabled_elligible: disabledEngagement,

//     contract_rythm: job.job_rythm ?? null,

//     workplace_legal_name: recruiter.establishment_raison_sociale || recruiter.establishment_enseigne || UNKNOWN_COMPANY,
//     workplace_brand: recruiter.establishment_enseigne,
//     workplace_siret: recruiter.establishment_siret,
//     workplace_geopoint: recruiter.geopoint ?? undefined,
//     workplace_address_label: recruiter.address!,
//     workplace_address_zipcode: recruiter.address_detail?.code_postal ?? null,
//     workplace_address_city: getCity(recruiter) ?? null,

//     apply_phone: (lbaJobContactInfo ? lbaJobContactInfo?.phone : recruiter.phone) ?? null,
//     apply_email: recruiter.is_delegated ? lbaJobContactInfo?.email : recruiter.email,

//     workplace_opco: recruiter.opco ?? null,
//     workplace_idcc: recruiter.idcc ?? null,
//     workplace_naf_code: recruiter.naf_code ?? null,
//     workplace_naf_label: recruiter.naf_label ?? null,
//     workplace_size: recruiter.establishment_size ?? null,
//     offer_origin: recruiter.origin ?? null,
//     offer_target_diploma: getDiplomaLevel(job.job_level_label),
//     offer_desired_skills:
//       job.competences_rome?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ??
//       romeDetails?.competences?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ??
//       [],
//     offer_to_be_acquired_skills: getSkillsFromRome(job.competences_rome?.savoir_faire, romeDetails?.competences?.savoir_faire),
//     offer_to_be_acquired_knowledge: getSkillsFromRome(job.competences_rome?.savoirs, romeDetails?.competences?.savoirs),
//     offer_access_conditions: acces_metier ? [acces_metier] : [],
//     offer_title,
//     offer_rome_codes: job.rome_code ?? null,
//     offer_description: job.job_description ?? definition ?? "",
//     offer_creation: job.job_creation_date,
//     offer_expiration: job.job_expiration_date,
//     offer_status: getOfferStatus(job.job_status, recruiter.status),
//     offer_opening_count: job.job_count ?? 1,
//     offer_multicast: true,

//     contract_remote: null,
//     offer_status_history: [],
//     workplace_address_street_label: null,
//     workplace_description: null,
//     workplace_name: null,
//     workplace_website: null,

//     lba_url: buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id, recruiter.establishment_siret, offer_title),

//     ...delegatedFields,
//   }

//   await getDbCollection("jobs_partners").findOneAndUpdate(
//     { _id: job._id },
//     {
//       $set: partnerJobToUpsert,
//       $setOnInsert: {
//         stats_detail_view: 0,
//         stats_search_view: 0,
//         stats_postuler: 0,
//       },
//     },
//     { upsert: true }
//   )
// }

export const updateJobsPartnersFromRecruiterDelete = async (id: ObjectId) => {
  const recruiter = await getDbCollection("anonymized_recruiters").findOne({ _id: id })
  const jobIds = recruiter?.jobs?.map((job) => job._id) ?? []
  if (jobIds.length) {
    await anonymizeLbaJobsPartners({ partner_job_ids: jobIds })
  }
}

async function jobCreateToJobsPartner({
  job,
  cfa,
  entreprise,
  user,
  origin,
  status,
}: {
  job: IJobCreate
  cfa?: ICFA
  entreprise: IEntreprise
  user: IUserWithAccount
  origin?: string
  status: JOB_STATUS_ENGLISH
}) {
  const now = new Date()
  const { siret, geo_coordinates, address_detail } = entreprise

  const addressV3 = address_detail && "libelle_commune" in address_detail ? address_detail : null

  const [romeDetails, disabledEngagement, entrepriseDataRaw] = await Promise.all([
    getRomeDetailsFromDB(job.rome_code[0]),
    getEntrepriseEngagementFranceTravail(siret),
    getEntrepriseDataFromSiret({ siret, type: CFA }),
  ])
  const entrepriseDataOpt = "error" in entrepriseDataRaw ? null : entrepriseDataRaw

  const { definition, acces_metier } = romeDetails ?? {}

  const offer_title = job.offer_title_custom ?? job.rome_appellation_label ?? job.rome_label ?? "Offre"
  const newId = new ObjectId()
  const lbaUrl = buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, newId, siret, offer_title)

  const jobPartner: IJobsPartnersOfferPrivate = {
    _id: newId,
    updated_at: now,
    created_at: now,
    partner_label: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
    partner_job_id: newId.toString(),
    is_delegated: Boolean(cfa),
    job_status_comment: null,
    job_delegation_count: job?.delegations?.length ?? 0,
    apply_url: lbaUrl,
    delegations: job?.delegations,

    contract_start: job.job_start_date ?? null,
    contract_duration: job.job_duration ?? null,
    contract_type: job.job_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],

    contract_is_disabled_elligible: disabledEngagement,

    contract_rythm: job.job_rythm ?? null,

    workplace_legal_name: entreprise.raison_sociale || entreprise.enseigne || UNKNOWN_COMPANY,
    workplace_brand: entreprise.enseigne ?? null,
    workplace_siret: siret,
    workplace_geopoint: geo_coordinates
      ? { type: "Point", coordinates: geo_coordinates.split(",").reverse().map(parseFloat) as [number, number] }
      : ({ type: "Point", coordinates: [0, 0] } as const),
    workplace_address_label: entreprise.address ?? "",
    workplace_address_zipcode: entreprise.address_detail?.code_postal ?? null,
    workplace_address_city: addressV3?.libelle_commune ?? null,

    apply_phone: user.phone ?? null,
    apply_email: user.email,

    workplace_opco: entreprise.opco ?? null,
    workplace_idcc: entreprise.idcc ?? null,
    workplace_naf_code: entreprise.naf_code ?? null,
    workplace_naf_label: entreprise.naf_label ?? null,
    workplace_size: entrepriseDataOpt?.establishment_size ?? null,
    offer_origin: origin ?? null,
    offer_target_diploma: getDiplomaLevel(job.job_level_label) ?? null,
    offer_desired_skills:
      job.competences_rome?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ??
      romeDetails?.competences?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ??
      [],
    offer_to_be_acquired_skills: getSkillsFromRome(job.competences_rome?.savoir_faire, romeDetails?.competences?.savoir_faire),
    offer_to_be_acquired_knowledge: getSkillsFromRome(job.competences_rome?.savoirs, romeDetails?.competences?.savoirs),
    offer_access_conditions: acces_metier ? [acces_metier] : [],
    offer_title,
    offer_rome_codes: job.rome_code ?? null,
    offer_description: job.job_description ?? definition ?? "",
    offer_creation: now,
    offer_expiration: addExpirationPeriod(now).toDate(),
    offer_status: status,
    offer_opening_count: job.job_count ?? 1,
    offer_multicast: true,

    contract_remote: null,
    offer_status_history: [],
    workplace_address_street_label: null,
    workplace_description: null,
    workplace_name: null,
    workplace_website: null,

    lba_url: lbaUrl,

    cfa_siret: cfa?.siret,
    cfa_legal_name: cfa?.raison_sociale,
    cfa_apply_phone: user.phone,
    cfa_apply_email: user.email,
    cfa_address_label: cfa?.address,

    stats_detail_view: 0,
    stats_postuler: 0,
    stats_search_view: 0,

    managed_by: user._id,
    offer_rome_appellation: job.rome_appellation_label,
    applicationCount: 0,
    duplicates: [],
    apply_recipient_id: newId.toString(),
  }
  return jobPartner
}

const isNiveauPourLbaLabel = (value: string | null | undefined): value is (typeof NIVEAUX_POUR_LBA)[keyof typeof NIVEAUX_POUR_LBA] => {
  return Boolean(value && Object.values(NIVEAUX_POUR_LBA).includes(value as (typeof NIVEAUX_POUR_LBA)[keyof typeof NIVEAUX_POUR_LBA]))
}

const isTrainingRythmLabel = (value: string | null | undefined): value is (typeof TRAINING_RYTHM)[keyof typeof TRAINING_RYTHM] => {
  return Boolean(value && Object.values(TRAINING_RYTHM).includes(value as (typeof TRAINING_RYTHM)[keyof typeof TRAINING_RYTHM]))
}

const roleToRecruiterStatus = (role: IRoleManagement): RECRUITER_STATUS => {
  const lastStatus = getLastStatusEvent(role.status)?.status
  if (!lastStatus) {
    throw new Error(`inattendu: status vide pour role id=${role._id}`)
  }
  const mapping: Record<AccessStatus, RECRUITER_STATUS> = {
    [AccessStatus.AWAITING_VALIDATION]: RECRUITER_STATUS.EN_ATTENTE_VALIDATION,
    [AccessStatus.GRANTED]: RECRUITER_STATUS.ACTIF,
    [AccessStatus.DENIED]: RECRUITER_STATUS.ARCHIVE,
  }
  return mapping[lastStatus]
}

const jobPartnerStatusToIJobStatus: Record<JOB_STATUS_ENGLISH, JOB_STATUS> = {
  [JOB_STATUS_ENGLISH.ACTIVE]: JOB_STATUS.ACTIVE,
  [JOB_STATUS_ENGLISH.POURVUE]: JOB_STATUS.POURVUE,
  [JOB_STATUS_ENGLISH.ANNULEE]: JOB_STATUS.ANNULEE,
  [JOB_STATUS_ENGLISH.EN_ATTENTE]: JOB_STATUS.EN_ATTENTE,
}

function jobPartnersToRecruiter(
  jobPartners: (IJobsPartnersOfferPrivate & { rome_detail?: IReferentielRome | null; application_count?: number })[],
  role: IRoleManagement,
  user: IUserWithAccount,
  entreprise: IEntreprise,
  cfa?: ICFA
): IRecruiterWithRomeDetailAndApplicationCount {
  const recruiterJobs: IRecruiterWithRomeDetailAndApplicationCount["jobs"] = jobPartners.map((jobPartner) => {
    const jobLevelLabel = jobPartner.offer_target_diploma?.label
    const resolvedJobLevelLabel: IJob["job_level_label"] = isNiveauPourLbaLabel(jobLevelLabel) ? jobLevelLabel : null
    const resolvedJobRythm: IJob["job_rythm"] = isTrainingRythmLabel(jobPartner.contract_rythm) ? jobPartner.contract_rythm : null
    const customTitle = jobPartner.offer_rome_appellation && jobPartner.offer_title !== jobPartner.offer_rome_appellation ? jobPartner.offer_title : null

    const ijob: IRecruiterWithRomeDetailAndApplicationCount["jobs"][number] = {
      _id: jobPartner._id,
      rome_label: jobPartner.rome_detail?.rome.intitule ?? null,
      rome_appellation_label: jobPartner.offer_rome_appellation ?? null,
      job_level_label: resolvedJobLevelLabel,
      job_start_date: jobPartner.contract_start ?? jobPartner.offer_creation ?? jobPartner.created_at,
      job_description: jobPartner.offer_description,
      job_employer_description: jobPartner.workplace_description,
      rome_code: jobPartner.offer_rome_codes ?? [],
      rome_detail: jobPartner.rome_detail,
      job_creation_date: jobPartner.offer_creation ?? jobPartner.created_at,
      job_expiration_date: jobPartner.offer_expiration,
      job_update_date: jobPartner.updated_at,
      job_last_prolongation_date: null,
      job_prolongation_count: null,
      relance_mail_expiration_J7: jobPartner.relance_mail_expiration_J7,
      relance_mail_expiration_J1: jobPartner.relance_mail_expiration_J1,
      job_status: jobPartnerStatusToIJobStatus[jobPartner.offer_status],
      job_status_comment: jobPartner.job_status_comment,
      job_type: jobPartner.contract_type,
      job_delegation_count: jobPartner.job_delegation_count,
      delegations: jobPartner.delegations,
      is_disabled_elligible: jobPartner.contract_is_disabled_elligible,
      job_count: jobPartner.offer_opening_count,
      job_duration: jobPartner.contract_duration,
      job_rythm: resolvedJobRythm,
      custom_address: null,
      custom_geo_coordinates: null,
      custom_job_title: null,
      stats_detail_view: jobPartner.stats_detail_view,
      stats_search_view: jobPartner.stats_search_view,
      competences_rome: getCompetencesRomeFromPartnerJob(jobPartner),
      mer_sent: jobPartner.mer_sent,
      offer_title_custom: customTitle,
      candidatures: jobPartner.application_count ?? 0,
    }
    return ijob
  })

  const recruiter: IRecruiterWithRomeDetailAndApplicationCount = {
    _id: role._id,
    establishment_id: buildEstablishmentId(role.user_id, entreprise.siret),
    establishment_raison_sociale: entreprise.raison_sociale,
    establishment_enseigne: entreprise.enseigne,
    establishment_siret: entreprise.siret,
    address: entreprise.address,
    geo_coordinates: entreprise.geo_coordinates,
    is_delegated: Boolean(cfa),
    cfa_delegated_siret: cfa?.siret,

    last_name: user.last_name,
    first_name: user.first_name,
    phone: user.phone,
    email: user.email,
    jobs: recruiterJobs,
    origin: role.origin,
    opco: entreprise.opco,
    idcc: entreprise.idcc,
    status: roleToRecruiterStatus(role),
    naf_code: entreprise.naf_code,
    naf_label: entreprise.naf_label,
    establishment_size: jobPartners.at(0)?.workplace_size,
    establishment_creation_date: null,
    managed_by: user._id.toString(),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }

  return recruiter
}
