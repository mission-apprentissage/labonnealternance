import { Transform } from "stream"
import { pipeline } from "stream/promises"

import { internal } from "@hapi/boom"
import type { Filter } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { getDirectJobPath } from "shared/metier/lbaitemutils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

export const buildUrlLba = (type: string, id: string, siret: string | null, title?: string) => {
  switch (type) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return `${config.publicUrl}${getDirectJobPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, id, title)}`
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return `${config.publicUrl}${getDirectJobPath(LBA_ITEM_TYPE.RECRUTEURS_LBA, siret!, title)}`
    default:
      return `${config.publicUrl}${getDirectJobPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, id, title)}`
  }
}

export const importFromComputedToJobsPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>, shouldNotifySlack = true) => {
  logger.info(`import dans jobs_partners commencé`)
  const filters: Filter<IComputedJobsPartners>[] = [{ validated: true, business_error: null }]
  if (addedMatchFilter) {
    filters.push(addedMatchFilter)
  }

  const stream = await getDbCollection("computed_jobs_partners").find({ $and: filters }).stream()

  const counters = { total: 0, success: 0, error: 0 }
  const importDate = new Date()
  const transform = new Transform({
    objectMode: true,
    async transform(computedJobPartner: Omit<IJobsPartnersOfferPrivate, "created_at">, _, callback: (error?: Error | null, data?: any) => void) {
      try {
        counters.total++
        const partnerJobToUpsert: Partial<IJobsPartnersOfferPrivate> = {
          updated_at: importDate,
          partner_label: computedJobPartner.partner_label,
          partner_job_id: computedJobPartner.partner_job_id,
          contract_start: computedJobPartner.contract_start ?? null,
          contract_duration: computedJobPartner.contract_duration ?? null,
          contract_type: computedJobPartner.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
          contract_remote: computedJobPartner.contract_remote ?? null,
          contract_is_disabled_elligible: computedJobPartner.contract_is_disabled_elligible ?? false,
          offer_title: computedJobPartner.offer_title,
          offer_rome_codes: computedJobPartner.offer_rome_codes,
          offer_description: computedJobPartner.offer_description,
          offer_target_diploma: computedJobPartner.offer_target_diploma ?? null,
          offer_desired_skills: computedJobPartner.offer_desired_skills ?? [],
          offer_to_be_acquired_skills: computedJobPartner.offer_to_be_acquired_skills ?? [],
          offer_access_conditions: computedJobPartner.offer_access_conditions ?? [],
          offer_creation: computedJobPartner.offer_creation ?? null,
          offer_expiration: computedJobPartner.offer_expiration ?? null,
          offer_opening_count: computedJobPartner.offer_opening_count ?? 1,
          offer_status: computedJobPartner.offer_status ?? JOB_STATUS_ENGLISH.ACTIVE,
          workplace_siret: computedJobPartner.workplace_siret ?? null,
          workplace_brand: computedJobPartner.workplace_brand ?? null,
          workplace_legal_name: computedJobPartner.workplace_legal_name ?? null,
          workplace_website: computedJobPartner.workplace_website ?? null,
          workplace_name: computedJobPartner.workplace_name ?? null,
          workplace_description: computedJobPartner.workplace_description ?? null,
          workplace_size: computedJobPartner.workplace_size ?? null,
          workplace_address_label: computedJobPartner.workplace_address_label,
          workplace_address_street_label: computedJobPartner.workplace_address_street_label,
          workplace_address_zipcode: computedJobPartner.workplace_address_zipcode,
          workplace_address_city: computedJobPartner.workplace_address_city,
          workplace_geopoint: computedJobPartner.workplace_geopoint,
          workplace_idcc: computedJobPartner.workplace_idcc ?? null,
          workplace_opco: computedJobPartner.workplace_opco ?? null,
          workplace_naf_code: computedJobPartner.workplace_naf_code ?? null,
          workplace_naf_label: computedJobPartner.workplace_naf_label ?? null,
          apply_url: computedJobPartner.apply_url,
          apply_phone: computedJobPartner.apply_phone ?? null,
          apply_email: computedJobPartner.apply_email ?? null,
          offer_multicast: computedJobPartner.offer_multicast ?? true,
          offer_origin: computedJobPartner.offer_origin ?? null,
          rank: computedJobPartner.rank ?? null,
          duplicates: computedJobPartner.duplicates ?? null,
          cfa_siret: null,
          cfa_apply_email: null,
          cfa_address_label: null,
          cfa_legal_name: null,
          cfa_apply_phone: null,
          lba_url: computedJobPartner.lba_url ?? "",
        }

        await getDbCollection("jobs_partners").updateOne(
          { partner_job_id: partnerJobToUpsert.partner_job_id, partner_label: partnerJobToUpsert.partner_label },
          {
            $set: { ...partnerJobToUpsert },
            $setOnInsert: {
              created_at: importDate,
              offer_status_history: [],
              _id: computedJobPartner._id,
              stats_detail_view: 0,
              stats_postuler: 0,
              stats_search_view: 0,
            },
          },
          { upsert: true }
        )
        if (computedJobPartner?.offer_status_history?.length) {
          await getDbCollection("jobs_partners").updateOne(
            { partner_job_id: partnerJobToUpsert.partner_job_id, partner_label: partnerJobToUpsert.partner_label },
            {
              $push: { offer_status_history: { $each: computedJobPartner.offer_status_history } },
            }
          )
        }
        counters.success++
        callback(null)
      } catch (err: unknown) {
        counters.error++

        const newError = internal(
          `error converting computed_job_partner to job_partner, partner_label=${computedJobPartner.partner_label} partner_job_id=${computedJobPartner.partner_job_id}`
        )
        logger.error(err, newError.message)
        newError.cause = err
        sentryCaptureException(newError)
        callback(null)
      }
    },
  })

  await pipeline(stream, transform)

  const message = `import dans jobs_partners terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  if (shouldNotifySlack) {
    await notifyToSlack({
      subject: `jobsPartners: import de données`,
      message,
    })
  }

  logger.info(`import dans jobs_partners terminé`, counters)
}
