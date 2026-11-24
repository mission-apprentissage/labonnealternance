import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveEntrepriseUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import dayjs from "shared/helpers/dayjs"
import type { IEntreprise, IUserWithAccount } from "shared/models/index"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { expireJobsPartners } from "@/jobs/offre-partenaire/expire-jobs-partners"
import { up } from "@/migrations/20261116120000-publish-blocked-pending-offers-5762"

vi.mock("@/services/mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))

// cf. backfill-offer-status-history-lba-5429.test.ts pour l'emplacement de ce test hors du dossier migrations
describe("migration publish-blocked-pending-offers-5762", () => {
  useMongo()

  const saveOffer = async (user: IUserWithAccount, entreprise: IEntreprise, overrides: Partial<IJobsPartnersOfferPrivate>) => {
    const offer = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by: user._id,
      workplace_siret: entreprise.siret,
      ...overrides,
    })
    await getDbCollection("jobs_partners").insertOne(offer)
    return offer
  }

  const statusOf = async ({ _id }: IJobsPartnersOfferPrivate) => (await getDbCollection("jobs_partners").findOne({ _id }))?.offer_status

  it("publie les offres bloquées d'un compte validé, en attente ou annulées à leur expiration, une seule fois", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, {}, { siret: "11000001500013" })
    const pending = await saveOffer(user, entreprise, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
    // Seule offre de son compte : sans offre en attente à côté, elle n'est candidate que par son annulation à l'expiration.
    const other = await saveEntrepriseUserTest({ status: validatedUserStatus }, {}, { siret: "13002526500013" })
    const expiredWhilePending = await saveOffer(other.user, other.entreprise, {
      offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
      offer_expiration: dayjs().subtract(1, "day").toDate(),
    })
    await expireJobsPartners()
    expect(await statusOf(expiredWhilePending)).toBe(JOB_STATUS_ENGLISH.ANNULEE)

    await up()
    await up()

    expect(await statusOf(pending)).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect(await statusOf(expiredWhilePending)).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    const history = (await getDbCollection("jobs_partners").findOne({ _id: pending._id }))?.offer_status_history ?? []
    expect(history.map(({ granted_by }) => granted_by)).toEqual(["activate-and-extend-offre"])
  })

  it("laisse en attente les offres d'un compte dont l'e-mail n'est pas confirmé ou dont le rôle n'est pas accordé", async () => {
    const emailNotConfirmed = await saveEntrepriseUserTest({ status: [] }, {}, { siret: "11000001500013" })
    const roleNotGranted = await saveEntrepriseUserTest({ status: validatedUserStatus }, { status: [] }, { siret: "13002526500013" })
    const offers = [
      await saveOffer(emailNotConfirmed.user, emailNotConfirmed.entreprise, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE }),
      await saveOffer(roleNotGranted.user, roleNotGranted.entreprise, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE }),
    ]

    await up()

    expect(await Promise.all(offers.map(statusOf))).toEqual([JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_ATTENTE])
  })
})
