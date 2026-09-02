import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { cancelRemovedJobsPartners } from "./cancel-removed-jobs-partners"
import { jobPartnersByFlux } from "./process-job-partners"

useMongo()

describe("Canceling jobs_partners that have been removed from computed_jobs_partners", () => {
  beforeEach(async () => {
    // créations de plusieurs éléments existants dans jobs partners
    // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
    // certains éléments validated de computed sont déjà présents dans jobs partners
    // certains éléments dans jobs partners ne sont pas dans computed
    await createJobPartner({ partner_job_id: "existing_1", partner_label: "bidon", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_2", partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_3", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_4", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_5", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_6", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_7", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_8", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    await createComputedJobPartner({ partner_job_id: "computed_1", partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE, validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_2", partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE, validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_3", partner_label: JOBPARTNERS_LABEL.HELLOWORK, validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_4", partner_label: JOBPARTNERS_LABEL.HELLOWORK, validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_5", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_6", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, validated: false })
    await createComputedJobPartner({
      partner_job_id: "existing_7",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      business_error: JOB_PARTNER_BUSINESS_ERROR.EXPIRED,
      validated: false,
    })
    await createComputedJobPartner({
      partner_job_id: "existing_8",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      business_error: JOB_PARTNER_BUSINESS_ERROR.EXPIRED,
      validated: false,
    })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("L'annulation dans jobs_partners fonctionne comme attendue : \n- les éléments de jobs_partners qui ne sont plus dans computed doivent être taggés Annulé\n- les éléments de jobs_partners qui sont également dans computed sont toujours présents\n-  aucun éléments de jobs_partners n'a été retiré de la collection", async () => {
    const filter = { partner_label: { $in: jobPartnersByFlux } }
    await cancelRemovedJobsPartners(filter)

    // les éléments de jobs_partners qui ne sont plus dans computed doivent être taggés Annulé
    const countCanceledJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
    })
    expect.soft(countCanceledJobsPartners).toEqual(5)

    // les éléments de jobs_partners qui ne sont pas des collections à vérifier sont intouchés
    const countNotCanceledJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_1"] },
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    })
    expect.soft(countNotCanceledJobsPartners).toEqual(1)

    // les éléments de jobs_partners qui sont également dans computed sont toujours présents
    const countRemainingActiveJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_1", "existing_3", "existing_4"] },
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    })
    expect.soft(countRemainingActiveJobsPartners).toEqual(3)

    // aucun éléments de jobs_partners n'a été retiré de la collection
    const countJobsPartners = await getDbCollection("jobs_partners").countDocuments({})
    expect.soft(countJobsPartners).toEqual(8)
  })
})

describe("Une offre dont le computed est en attente de classification n'est pas annulée", () => {
  beforeEach(() => {
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("CLASSIFICATION_PENDING est un état transitoire de traitement, pas un verdict métier", async () => {
    // Mesuré en prod le 01/09/2026 : tout le catalogue non whitelisté (Hellowork 5 178, France Travail
    // 5 531, Meteojob 1 729 offres cette nuit-là) était annulé à 00h35 parce que le batch Mistral
    // n'avait pas encore répondu, puis réactivé à son retour. Un autre business_error (CFA) reste un
    // motif d'annulation légitime.
    await createJobPartner({ partner_job_id: "pending_1", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({
      partner_job_id: "pending_1",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING,
      validated: false,
    })
    await createJobPartner({ partner_job_id: "cfa_1", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "cfa_1", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, validated: false })

    await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } })

    const pending = await getDbCollection("jobs_partners").findOne({ partner_job_id: "pending_1" })
    expect.soft(pending?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(pending?.offer_status_history).toHaveLength(0)
    const cfa = await getDbCollection("jobs_partners").findOne({ partner_job_id: "cfa_1" })
    expect.soft(cfa?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
  })
})
