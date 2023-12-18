import Boom from "boom"
import { ObjectId } from "mongodb"
import type { FilterQuery, ModelUpdateOptions, UpdateQuery } from "mongoose"
import { IDelegation, IJob, IJobWritable, IRecruiter, IUserRecruteur, JOB_STATUS } from "shared"
import { ETAT_UTILISATEUR, RECRUITER_STATUS } from "shared/constants/recruteur"

import { db } from "@/common/mongodb"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { Recruiter, UnsubscribeOF } from "../common/model/index"
import { asyncForEach } from "../common/utils/asyncUtils"
import config from "../config"

import { createCfaUnsubscribeToken, createViewDelegationLink } from "./appLinks.service"
import { getCatalogueEtablissements, getCatalogueFormations } from "./catalogue.service"
import dayjs from "./dayjs.service"
import { getEtablissement, sendEmailConfirmationEntreprise } from "./etablissement.service"
import mailer from "./mailer.service"
import { getRomeDetailsFromDB } from "./rome.service"
import { getUser, getUserStatus } from "./userRecruteur.service"

interface IFormulaireExtended extends IRecruiter {
  entreprise_localite?: string
}

export interface IOffreExtended extends IJob {
  candidatures: number
  pourvue: string
  supprimer: string
}

/**
 * @description get formulaire by offer id
 */
export const getOffreAvecInfoMandataire = async (id: string | ObjectId): Promise<IFormulaireExtended | null> => {
  const result = await getOffre(id)

  if (!result) {
    return null
  }

  result.jobs = result.jobs.filter((x) => x._id.toString() === id.toString())

  if (result.is_delegated && result.address) {
    const [entreprise_localite] = result.address.match(/([0-9]{5})[ ,] ?([A-zÀ-ÿ]*)/) ?? [""]
    const { cfa_delegated_siret } = result
    if (cfa_delegated_siret) {
      const cfa = await getEtablissement({ establishment_siret: cfa_delegated_siret })

      if (cfa) {
        result.phone = cfa.phone
        result.email = cfa.email
        result.last_name = cfa.last_name
        result.first_name = cfa.first_name
        result.establishment_raison_sociale = cfa.establishment_raison_sociale
        result.address = cfa.address
        return { ...result, entreprise_localite }
      }
    }
  }
  return result
}

/**
 * @description Get formulaire list with mondodb paginate query
 * @param {Object} payload
 * @param {FilterQuery<IRecruiter>} payload.query
 * @param {object} payload.options
 * @param {number} payload.page
 * @param {number} payload.limit
 */
export const getFormulaires = async (query: FilterQuery<IRecruiter>, select: object, { page, limit }: { page?: number; limit?: number }) => {
  const response = await Recruiter.paginate({ query, ...select, page, limit, lean: true })

  return {
    pagination: {
      page: response?.page,
      result_per_page: limit,
      number_of_page: response?.totalPages,
      total: response?.totalDocs,
    },
    data: response?.docs,
  }
}

/**
 * @description Create job offer for formulaire
 */
export const createJob = async ({ job, id }: { job: IJobWritable; id: string }): Promise<IRecruiter> => {
  // get user data
  const user = await getUser({ establishment_id: id })
  const userStatus: ETAT_UTILISATEUR | null = (user ? getUserStatus(user.status) : null) ?? null
  const isUserAwaiting = userStatus !== ETAT_UTILISATEUR.VALIDE

  const jobPartial: Partial<IJob> = job
  jobPartial.job_status = user && isUserAwaiting ? JOB_STATUS.EN_ATTENTE : JOB_STATUS.ACTIVE
  // get user activation state if not managed by a CFA
  const codeRome = job.rome_code[0]
  const romeData = await getRomeDetailsFromDB(codeRome)
  if (!romeData) {
    throw Boom.internal(`could not find rome infos for rome=${codeRome}`)
  }
  const creationDate = new Date()
  const { job_start_date = creationDate } = job
  const updatedJob: Partial<IJob> = Object.assign(job, {
    job_start_date,
    rome_detail: romeData.fiche_metier,
    job_creation_date: creationDate,
    job_expiration_date: addExpirationPeriod(creationDate).toDate(),
    job_update_date: creationDate,
  })
  // insert job
  const updatedFormulaire = await createOffre(id, updatedJob)
  const { is_delegated, cfa_delegated_siret, jobs } = updatedFormulaire
  const createdJob = jobs.at(jobs.length - 1)
  if (!createdJob) {
    throw Boom.internal("unexpected: no job found after job creation")
  }
  // if first offer creation for an Entreprise, send specific mail
  if (jobs.length === 1 && is_delegated === false && user) {
    await sendEmailConfirmationEntreprise(user, updatedFormulaire)
    return updatedFormulaire
  }

  let contactCFA: IUserRecruteur | null = null
  if (is_delegated) {
    if (!cfa_delegated_siret) {
      throw Boom.internal(`unexpected: could not find user recruteur CFA that created the job`)
    }
    // get CFA informations if formulaire is handled by a CFA
    contactCFA = await getUser({ establishment_siret: cfa_delegated_siret })
    if (!contactCFA) {
      throw Boom.internal(`unexpected: could not find user recruteur CFA that created the job`)
    }
  }
  await sendMailNouvelleOffre(updatedFormulaire, createdJob, contactCFA ?? undefined)
  return updatedFormulaire
}

/**
 * Create job delegations
 */
export const createJobDelegations = async ({ jobId, etablissementCatalogueIds }: { jobId: IJob["_id"] | string; etablissementCatalogueIds: string[] }): Promise<IRecruiter> => {
  const offreDocument = await getOffre(jobId)
  if (!offreDocument) {
    throw Boom.internal("Offre not found", { jobId, etablissementCatalogueIds })
  }
  const userDocument = await getUser({ establishment_id: offreDocument.establishment_id })
  if (!userDocument) {
    throw Boom.internal("User not found", { jobId, etablissementCatalogueIds })
  }
  if (!userDocument.status) {
    throw Boom.internal("User is missing status object", { jobId, etablissementCatalogueIds })
  }
  const userState = userDocument.status.pop()

  const offre = offreDocument.jobs.find((job) => job._id.toString() === jobId.toString())

  if (!offre) {
    throw Boom.internal("Offre not found", { jobId, etablissementCatalogueIds })
  }

  const { etablissements } = await getCatalogueEtablissements({ _id: { $in: etablissementCatalogueIds } }, { _id: 1 })

  const delegations: IDelegation[] = []

  const promises = etablissements.map(async (etablissement) => {
    const formations = await getCatalogueFormations(
      {
        $or: [
          {
            etablissement_gestionnaire_id: etablissement._id,
          },
          {
            etablissement_formateur_id: etablissement._id,
          },
        ],
        etablissement_gestionnaire_courriel: { $nin: [null, ""] },
        catalogue_published: true,
      },
      { etablissement_gestionnaire_courriel: 1, etablissement_formateur_siret: 1 }
    )

    const { etablissement_formateur_siret: siret_code, etablissement_gestionnaire_courriel: email } = formations[0] ?? {}

    if (!email || !siret_code) {
      // This shouldn't happen considering the query filter
      throw Boom.internal("Unexpected etablissement_gestionnaire_courriel", { jobId, etablissementCatalogueIds })
    }

    delegations.push({ siret_code, email })

    if (userState?.status === ETAT_UTILISATEUR.VALIDE) {
      await sendDelegationMailToCFA(email, offre, offreDocument, siret_code)
    }
  })

  await Promise.all(promises)

  offre.delegations = offre.delegations?.concat(delegations) ?? delegations
  offre.job_delegation_count = offre.delegations.length

  return updateOffre(jobId, offre)
}

/**
 * @description Check if job offer exists
 * @param {IJob['_id']} id
 * @returns {Promise<IRecruiter>}
 */
export const checkOffreExists = async (id: IJob["_id"]): Promise<boolean> => {
  const offre = await getOffre(id.toString())
  return offre ? true : false
}

/**
 * @description Find formulaire by query
 * @param {FilterQuery<IRecruiter>} query
 * @returns {Promise<IRecruiter>}
 */
export const getFormulaire = async (query: FilterQuery<IRecruiter>): Promise<IRecruiter> => Recruiter.findOne(query).lean()

/**
 * @description Create new formulaire
 * @param {IRecruiter} payload
 * @returns {Promise<IRecruiter>}
 */
export const createFormulaire = async (payload: Partial<Omit<IRecruiter, "_id" | "establishment_id" | "createdAt" | "updatedAt">>): Promise<IRecruiter> => {
  const recruiter = await Recruiter.create(payload)
  return recruiter.toObject()
}

/**
 * Remove formulaire by id
 */
export const deleteFormulaire = async (id: IRecruiter["_id"]): Promise<IRecruiter | null> => await Recruiter.findByIdAndDelete(id)

/**
 * @description Remove all formulaires belonging to gestionnaire
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 * @returns {Promise<IRecruiter>}
 */
export const deleteFormulaireFromGestionnaire = async (siret: IUserRecruteur["establishment_siret"]): Promise<void> => {
  await Recruiter.deleteMany({ cfa_delegated_siret: siret })
}

/**
 * @description Update existing formulaire and return updated version
 */
export const updateFormulaire = async (establishment_id: IRecruiter["establishment_id"], payload: UpdateQuery<IRecruiter>): Promise<IRecruiter> => {
  const recruiter = await Recruiter.findOneAndUpdate({ establishment_id }, payload, { new: true }).lean()
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }
  return recruiter
}

/**
 * @description Archive existing formulaire and cancel all its job offers
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const archiveFormulaire = async (id: IRecruiter["establishment_id"]): Promise<boolean> => {
  const recruiter = await Recruiter.findOne({ establishment_id: id })
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  recruiter.status = RECRUITER_STATUS.ARCHIVE

  recruiter.jobs.map((job) => {
    job.job_status = JOB_STATUS.ANNULEE
  })

  await recruiter.save()

  return true
}

/**
 * @description Unarchive existing formulaire
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const reactivateRecruiter = async (id: IRecruiter["establishment_id"]): Promise<boolean> => {
  const recruiter = await Recruiter.findOne({ establishment_id: id })
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }
  recruiter.status = RECRUITER_STATUS.ACTIF
  await recruiter.save()
  return true
}

/**
 * @description Archive existing delegated formulaires and cancel all its job offers
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 * @returns {Promise<boolean>}
 */
export const archiveDelegatedFormulaire = async (siret: IUserRecruteur["establishment_siret"]): Promise<boolean> => {
  const formulaires = await Recruiter.find({ cfa_delegated_siret: siret }).lean()

  if (!formulaires.length) return false

  await asyncForEach(formulaires, async (form: IRecruiter) => {
    form.status = RECRUITER_STATUS.ARCHIVE

    form.jobs.forEach((job) => {
      job.job_status = JOB_STATUS.ANNULEE
    })

    await Recruiter.findByIdAndUpdate(form._id, form)
  })

  return true
}

/**
 * @description Get job offer by job id
 * @param {IJob["_id"]} id
 */
export async function getOffre(id: string | ObjectId) {
  return Recruiter.findOne({ "jobs._id": id }).lean()
}

/**
 * Create job offer on existing formulaire
 */
export async function createOffre(id: IRecruiter["establishment_id"], payload: UpdateQuery<IJob>): Promise<IRecruiter> {
  const recruiter = await Recruiter.findOneAndUpdate({ establishment_id: id }, { $push: { jobs: payload } }, { new: true }).lean()

  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Update existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export async function updateOffre(id: string | ObjectId, payload: UpdateQuery<IJob>): Promise<IRecruiter> {
  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$": payload,
      },
    },
    { new: true }
  ).lean()
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }
  return recruiter
}

/**
 * @description Increment field in existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export const incrementLbaJobViewCount = async (id: IJob["_id"] | string, payload: object) => {
  const incPayload = Object.fromEntries(Object.entries(payload).map(([key, value]) => [`jobs.$.${key}`, value]))

  await mongooseInstance.connection.collection("recruiters").findOneAndUpdate(
    { "jobs._id": new ObjectId(id.toString()) },
    {
      $inc: incPayload,
    }
  )
}

/**
 * @description Update specific field(s) in an existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export const patchOffre = async (id: IJob["_id"], payload: UpdateQuery<IJob>, options: ModelUpdateOptions = { new: true }): Promise<IRecruiter> => {
  const fields = {}
  for (const key in payload) {
    fields[`jobs.$.${key}`] = payload[key]
  }

  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: fields,
    },
    options
  ).lean()

  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Change job status to provided
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const provideOffre = async (id: IJob["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": JOB_STATUS.POURVUE,
        "jobs.$.job_update_date": Date.now(),
      },
    }
  )
  return true
}

/**
 * @description Cancel job from transaction email
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const cancelOffre = async (id: IJob["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": JOB_STATUS.ANNULEE,
        "jobs.$.job_update_date": Date.now(),
      },
    }
  )
  return true
}

/**
 * @description Cancel job from admin interface
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const cancelOffreFromAdminInterface = async (id: IJob["_id"], { job_status, job_status_comment }): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": job_status,
        "jobs.$.job_status_comment": job_status_comment,
        "jobs.$.job_update_date": Date.now(),
      },
    }
  )
  return true
}

/**
 * @description Extends job duration by 1 month.
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const extendOffre = async (id: IJob["_id"]): Promise<IJob> => {
  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_expiration_date": addExpirationPeriod(dayjs()).toDate(),
        "jobs.$.job_last_prolongation_date": Date.now(),
        "jobs.$.job_update_date": Date.now(),
      },
      $inc: { "jobs.$.job_prolongation_count": 1 },
    },
    { new: true }
  ).lean()
  if (!recruiter) {
    throw Boom.notFound(`job with id=${id} not found`)
  }
  const job = recruiter.jobs.find((job) => job._id.toString() === id.toString())
  if (!job) {
    throw Boom.internal(`unexpected: job with id=${id} not found`)
  }
  return job
}

const activateAndExtendOffre = async (id: IJob["_id"]): Promise<IJob> => {
  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_expiration_date": addExpirationPeriod(dayjs()).toDate(),
        "jobs.$.job_status": JOB_STATUS.ACTIVE,
      },
    },
    { new: true }
  ).lean()
  if (!recruiter) {
    throw Boom.notFound(`job with id=${id} not found`)
  }
  const job = recruiter.jobs.find((job) => job._id.toString() === id.toString())
  if (!job) {
    throw Boom.internal(`unexpected: job with id=${id} not found`)
  }
  return job
}

/**
 * to be called on the 1st activation of the account of a company
 * @param entrepriseRecruiter entreprise
 */
export const activateEntrepriseRecruiterForTheFirstTime = async (entrepriseRecruiter: IRecruiter) => {
  const firstJob = entrepriseRecruiter.jobs.at(0)
  if (firstJob) {
    const job = await activateAndExtendOffre(firstJob._id)
    // Send delegation if any
    if (job.delegations?.length) {
      await Promise.all(
        job.delegations.map(async (delegation) => {
          await sendDelegationMailToCFA(delegation.email, job, entrepriseRecruiter, delegation.siret_code)
        })
      )
    }
  }
}

/**
 * @description Get job offer by its id.
 */
export const getJob = async (id: string | ObjectId): Promise<IJob | null> => {
  const offre = await getOffre(id)
  if (!offre) return null
  return offre.jobs.find((job) => job._id.toString() === id.toString()) ?? null
}

/**
 * @description Sends the mail informing the CFA that a company wants the CFA to handle the offer.
 */
export async function sendDelegationMailToCFA(email: string, offre: IJob, recruiter: IRecruiter, siret_code: string) {
  const unsubscribeOF = await UnsubscribeOF.findOne({ establishment_siret: siret_code })
  if (unsubscribeOF) return
  const unsubscribeToken = createCfaUnsubscribeToken(email, siret_code)
  await mailer.sendEmail({
    to: email,
    subject: `Une entreprise recrute dans votre domaine`,
    template: getStaticFilePath("./templates/mail-cfa-delegation.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      enterpriseName: recruiter.establishment_raison_sociale,
      jobName: offre.rome_appellation_label,
      contractType: (offre.job_type ?? []).join(", "),
      trainingLevel: offre.job_level_label,
      startDate: dayjs(offre.job_start_date).format("DD/MM/YYYY"),
      duration: offre.job_duration,
      rhythm: offre.job_rythm,
      offerButton: createViewDelegationLink(email, recruiter.establishment_id, offre._id.toString(), siret_code),
      createAccountButton: `${config.publicUrl}/espace-pro/creation/cfa`,
      unsubscribeUrl: `${config.publicUrl}/espace-pro/proposition/formulaire/${recruiter.establishment_id}/offre/${offre._id}/siret/${siret_code}/unsubscribe?token=${unsubscribeToken}`,
    },
  })
}

export async function sendMailNouvelleOffre(recruiter: IRecruiter, job: IJob, contactCFA?: IUserRecruteur) {
  const isRecruteurAwaiting = recruiter.status === RECRUITER_STATUS.EN_ATTENTE_VALIDATION
  if (isRecruteurAwaiting) {
    return
  }
  const { is_delegated, email, last_name, first_name, establishment_raison_sociale, establishment_siret } = recruiter
  const establishmentTitle = establishment_raison_sociale ?? establishment_siret
  // Send mail with action links to manage offers
  await mailer.sendEmail({
    to: is_delegated && contactCFA ? contactCFA.email : email,
    subject: is_delegated ? `Votre offre d'alternance pour ${establishmentTitle} est publiée` : `Votre offre d'alternance est publiée`,
    template: getStaticFilePath("./templates/mail-nouvelle-offre.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      nom: is_delegated ? contactCFA?.last_name : last_name,
      prenom: is_delegated ? contactCFA?.first_name : first_name,
      raison_sociale: establishmentTitle,
      mandataire: recruiter.is_delegated,
      offre: {
        rome_appellation_label: job.rome_appellation_label,
        job_type: job.job_type,
        job_level_label: job.job_level_label,
        job_start_date: dayjs(job.job_start_date).format("DD/MM/YY"),
      },
      lba_url: `${config.publicUrl}/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${job._id}`,
    },
  })
}

export function addExpirationPeriod(fromDate: Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(fromDate).add(2, "months")
}
