import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { anonimizeUsersWithAccounts } from "./anonimize-users-with-accounts"

vi.mock("@/common/utils/slack-utils", () => {
  return {
    notifyToSlack: vi.fn().mockResolvedValue(undefined),
  }
})

useMongo()

/**
 * Le job porte deux effets distincts sur jobs_partners, et c'est cette séparation qui est testée :
 * le passage en Cancelled ne vise que les offres encore ouvertes, tandis que le détachement de
 * `managed_by` couvre tout le périmètre du recruteur (issue #5429).
 */
describe("anonimize-users-with-accounts", () => {
  const insertOffer = async (partner_job_id: string, managed_by: ObjectId, overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        partner_job_id,
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        managed_by,
        offer_status_history: [],
        ...overrides,
      })
    )
  }

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  const saveStaleUser = () => saveUserWithAccount({ last_action_date: dayjs().subtract(3, "years").toDate() })

  it("annule et trace les offres encore ouvertes", async () => {
    const user = await saveStaleUser()
    await insertOffer("active", user._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await insertOffer("en-attente", user._id, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })

    await anonimizeUsersWithAccounts()
    const byId = await readAll()

    for (const id of ["active", "en-attente"]) {
      expect.soft(byId.get(id)?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
      expect.soft(byId.get(id)?.offer_status_history).toEqual([
        expect.objectContaining({
          status: JOB_STATUS_ENGLISH.ANNULEE,
          reason: "compte recruteur anonymisé RGPD",
          granted_by: "anonimize-users-with-accounts",
        }),
      ])
    }
  })

  it("laisse intacte une offre pourvue", async () => {
    // Le filtre portait sur tout le périmètre : un recrutement réussi était réécrit en annulation.
    const user = await saveStaleUser()
    await insertOffer("pourvue", user._id, { offer_status: JOB_STATUS_ENGLISH.POURVUE })

    await anonimizeUsersWithAccounts()
    const byId = await readAll()

    expect.soft(byId.get("pourvue")?.offer_status).toEqual(JOB_STATUS_ENGLISH.POURVUE)
    expect.soft(byId.get("pourvue")?.offer_status_history).toEqual([])
  })

  it("ne réécrit ni updated_at ni l'historique d'une offre déjà annulée", async () => {
    // Ce bump refaisait entrer des annulations anciennes dans les tableaux de bord datés sur updated_at.
    const user = await saveStaleUser()
    const updated_at = new Date("2026-01-15T09:00:00.000Z")
    const expiration = { date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "offre expirée (date dépassée)", granted_by: "expire-jobs-partners" }
    await insertOffer("deja-annulee", user._id, { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at, offer_status_history: [expiration] })

    await anonimizeUsersWithAccounts()
    const byId = await readAll()

    expect.soft(byId.get("deja-annulee")?.updated_at).toEqual(updated_at)
    expect.soft(byId.get("deja-annulee")?.offer_status_history).toEqual([expiration])
  })

  it("détache managed_by sur tout le périmètre du recruteur, offres closes comprises", async () => {
    const user = await saveStaleUser()
    await insertOffer("active", user._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await insertOffer("pourvue", user._id, { offer_status: JOB_STATUS_ENGLISH.POURVUE })
    await insertOffer("deja-annulee", user._id, { offer_status: JOB_STATUS_ENGLISH.ANNULEE })

    await anonimizeUsersWithAccounts()
    const byId = await readAll()

    for (const id of ["active", "pourvue", "deja-annulee"]) {
      expect.soft(byId.get(id)?.managed_by).toBeNull()
    }
  })

  it("ne touche pas les offres d'un recruteur encore actif", async () => {
    const stale = await saveStaleUser()
    const recent = await saveUserWithAccount({ last_action_date: dayjs().subtract(1, "month").toDate() })
    await insertOffer("stale", stale._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await insertOffer("recente", recent._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    await anonimizeUsersWithAccounts()
    const byId = await readAll()

    expect.soft(byId.get("recente")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(byId.get("recente")?.managed_by).toEqual(recent._id)
    expect.soft(byId.get("recente")?.offer_status_history).toEqual([])
    expect.soft(byId.get("stale")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
  })

  it("ne touche pas les offres d'un autre partenaire", async () => {
    const user = await saveStaleUser()
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        partner_job_id: "autre-partenaire",
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        managed_by: user._id,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        offer_status_history: [],
      })
    )

    await anonimizeUsersWithAccounts()
    const byId = await readAll()

    expect.soft(byId.get("autre-partenaire")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(byId.get("autre-partenaire")?.managed_by).toEqual(user._id)
  })
})
