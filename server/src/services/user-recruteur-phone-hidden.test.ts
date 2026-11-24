import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import { updateUserWithAccountFields } from "./user-recruteur.service"

useMongo()

const PHONE = "0102030405"

describe("updateUserWithAccountFields : masquage du téléphone sur les offres (#5886)", () => {
  const user = generateUserWithAccountFixture({ email: "recruteur@mail.fr", phone: PHONE })
  const otherUser = generateUserWithAccountFixture({ email: "autre@mail.fr", phone: "0607080910" })

  const ownOffer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: user._id,
    is_delegated: false,
    apply_phone: PHONE,
    cfa_apply_phone: null,
  })
  const ownDelegatedOffer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: user._id,
    is_delegated: true,
    apply_phone: PHONE,
    cfa_apply_phone: PHONE,
  })
  const partnerOfferSameManager = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    managed_by: user._id,
    apply_phone: PHONE,
  })
  const otherUserOffer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: otherUser._id,
    apply_phone: otherUser.phone,
  })

  const getOffer = async (offer: { _id: unknown }) => getDbCollection("jobs_partners").findOne({ _id: offer._id as any })

  beforeEach(async () => {
    await getDbCollection("userswithaccounts").insertMany([{ ...user }, { ...otherUser }])
    await getDbCollection("jobs_partners").insertMany([ownOffer, ownDelegatedOffer, partnerOfferSameManager, otherUserOffer].map((offer) => ({ ...offer })))

    return async () => {
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("retire le téléphone des offres LBA du compte, déléguées comprises", async () => {
    await updateUserWithAccountFields(user._id, { phone_hidden: true })

    expect((await getDbCollection("userswithaccounts").findOne({ _id: user._id }))?.phone_hidden).toBe(true)
    expect(await getOffer(ownOffer)).toMatchObject({ apply_phone: null, cfa_apply_phone: null })
    expect(await getOffer(ownDelegatedOffer)).toMatchObject({ apply_phone: null, cfa_apply_phone: null })
  })

  it("ne touche ni une offre partenaire du même gestionnaire, ni les offres d'un autre compte", async () => {
    await updateUserWithAccountFields(user._id, { phone_hidden: true })

    expect((await getOffer(partnerOfferSameManager))?.apply_phone).toBe(PHONE)
    expect((await getOffer(otherUserOffer))?.apply_phone).toBe(otherUser.phone)
  })

  it("garde le numéro masqué quand il change sans que phone_hidden soit renvoyé", async () => {
    await updateUserWithAccountFields(user._id, { phone_hidden: true })
    // Route admin PUT /admin/users/:userId : son body ne porte pas phone_hidden
    await updateUserWithAccountFields(user._id, { phone: "0999999999" })

    expect(await getOffer(ownOffer)).toMatchObject({ apply_phone: null, cfa_apply_phone: null })
    expect(await getOffer(ownDelegatedOffer)).toMatchObject({ apply_phone: null, cfa_apply_phone: null })
  })

  it("rétablit le numéro du compte quand le masquage est retiré", async () => {
    await updateUserWithAccountFields(user._id, { phone_hidden: true })
    await updateUserWithAccountFields(user._id, { phone_hidden: false, phone: "0999999999" })

    expect(await getOffer(ownOffer)).toMatchObject({ apply_phone: "0999999999", cfa_apply_phone: null })
    expect(await getOffer(ownDelegatedOffer)).toMatchObject({ apply_phone: "0999999999", cfa_apply_phone: "0999999999" })
  })

  it("propage un changement de numéro sur un compte non masqué", async () => {
    await updateUserWithAccountFields(user._id, { phone: "0999999999" })

    expect(await getOffer(ownOffer)).toMatchObject({ apply_phone: "0999999999", cfa_apply_phone: null })
    expect(await getOffer(ownDelegatedOffer)).toMatchObject({ apply_phone: "0999999999", cfa_apply_phone: "0999999999" })
  })
})
