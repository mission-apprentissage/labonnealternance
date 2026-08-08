import { internal } from "@hapi/boom"
import { groupBy } from "lodash-es"
import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { CFA, ENTREPRISE } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { sanitizeTextField } from "@/common/utils/string-utils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/access-token.service"
import { createAuthMagicLink, createCloturerOffreMagicLink, createProlongerOffreLink, createProvidedJobLink } from "@/services/app-links.service"
import { buildEstablishmentId } from "@/services/etablissement.service"
import mailer from "@/services/mailer.service"

const getReminderCompanyName = ({
  workplace_name,
  workplace_brand,
  workplace_legal_name,
}: Pick<IJobsPartnersOfferPrivate, "workplace_name" | "workplace_brand" | "workplace_legal_name">) => {
  return workplace_name ?? workplace_brand ?? workplace_legal_name ?? ""
}

export const recruiterOfferExpirationReminderJob = async (numberOfDaysToExpirationDate: number /* number of days to expiration for the reminder email to be sent */) => {
  const dateRelanceFieldName = numberOfDaysToExpirationDate === 1 ? "relance_mail_expiration_J1" : numberOfDaysToExpirationDate === 7 ? "relance_mail_expiration_J7" : null
  const additionalFilter: Filter<IJobsPartnersOfferPrivate> = {}
  if (dateRelanceFieldName) {
    additionalFilter[dateRelanceFieldName] = null
  }
  const now = new Date()
  let jobs = await getDbCollection("jobs_partners")
    .find({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_expiration: { $gt: now },
      ...additionalFilter,
    })
    .toArray()

  jobs = jobs.filter((job) => {
    const { offer_status, offer_expiration } = job
    const remainingDays = dayjs(offer_expiration).diff(dayjs(), "days")
    return offer_status === JOB_STATUS_ENGLISH.ACTIVE && remainingDays === numberOfDaysToExpirationDate && (!dateRelanceFieldName || !job[dateRelanceFieldName])
  })

  const nbOffres = jobs.length
  if (nbOffres <= 0) {
    logger.info("Aucune offre à relancer aujourd'hui.")
    await notifyToSlack({ subject: `RELANCE J+${numberOfDaysToExpirationDate}`, message: `Aucune relance à effectuer.` })
    return
  }

  const groupByUserOffres = groupBy(jobs, (job) => job.managed_by)

  logger.info(`${nbOffres} offres relancé aujourd'hui.`)
  await notifyToSlack({
    subject: `RELANCE J+${numberOfDaysToExpirationDate}`,
    message: `*${nbOffres} offres* (${Object.keys(groupByUserOffres).length} users) ont été relancés.`,
  })

  await asyncForEach(Object.values(groupByUserOffres), async (jobsGroup) => {
    const firstJob = jobsGroup.at(0)
    try {
      if (!firstJob) {
        throw new Error("inattendu: groupe vide")
      }
      const { managed_by } = firstJob
      if (!managed_by) {
        throw new Error(`managed_by vide pour l'offre avec id=${firstJob._id}`)
      }
      const { is_delegated } = firstJob
      const contactUser = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
      if (!contactUser) {
        throw internal(`inattendu : impossible de trouver l'utilisateur gérant l'offre avec id=${firstJob._id}`)
      }

      const subject = `Votre offre expire ${numberOfDaysToExpirationDate === 1 ? "demain" : `dans ${numberOfDaysToExpirationDate} jours`}`

      await mailer.sendEmail({
        to: contactUser.email,
        subject,
        template: getStaticFilePath("./templates/mail-expiration-offres.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
          },
          last_name: sanitizeTextField(contactUser.last_name),
          first_name: sanitizeTextField(contactUser.first_name),
          establishment_raison_sociale: getReminderCompanyName(firstJob),
          is_delegated,
          offres: jobsGroup.map((job) => ({
            workplace_siret: job.workplace_siret,
            job_title: job.offer_title,
            rome_appellation_label: job.offer_rome_appellation,
            job_type: job.contract_type.join(", "),
            job_level_label: job.offer_target_diploma?.label ?? "Indifférent",
            job_start_date: dayjs(job.contract_start).format("DD/MM/YYYY"),
            supprimer: job.workplace_siret
              ? createCloturerOffreMagicLink(userWithAccountToUserForToken(contactUser), {
                  jobId: job._id.toString(),
                  establishment_id: buildEstablishmentId(contactUser._id, job.workplace_siret),
                  userType: is_delegated ? CFA : ENTREPRISE,
                })
              : createAuthMagicLink(userWithAccountToUserForToken(contactUser)),
            pourvue: createProvidedJobLink(userWithAccountToUserForToken(contactUser), job._id.toString(), LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
            prolonger: job.workplace_siret
              ? createProlongerOffreLink(userWithAccountToUserForToken(contactUser), {
                  jobId: job._id.toString(),
                  establishment_id: buildEstablishmentId(contactUser._id, job.workplace_siret),
                  userType: is_delegated ? CFA : ENTREPRISE,
                })
              : createAuthMagicLink(userWithAccountToUserForToken(contactUser)),
          })),
          threshold: numberOfDaysToExpirationDate,
          connectionUrl: createAuthMagicLink(userWithAccountToUserForToken(contactUser)),
          publicEmail: config.publicEmail,
        },
      })
      if (dateRelanceFieldName) {
        await getDbCollection("jobs_partners").updateMany(
          {
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            _id: { $in: jobsGroup.map((job) => job._id) },
          },
          {
            $set: {
              [dateRelanceFieldName]: now,
            },
          }
        )
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      logger.error(err)
      logger.error(`Script de relance formulaire: offre id=${firstJob?._id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
    }
  })
}
