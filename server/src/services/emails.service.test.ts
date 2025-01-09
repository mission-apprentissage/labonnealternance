import { EApplicantRole } from "shared/constants/rdva"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateAppointmentFixture, generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { generateUserFixture } from "shared/fixtures/user.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { BrevoBlockedReasons, saveBlacklistEmails } from "@/jobs/updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { BlackListOrigins } from "@/services/application.service"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { BrevoEventStatus } from "./brevo.service"
import { IBrevoWebhookEvent, processHardBounceWebhookEvent } from "./emails.service"

async function cleanTest() {
  await getDbCollection("emailblacklists").deleteMany({})
  await getDbCollection("applications").deleteMany({})
  await getDbCollection("applicants").deleteMany({})
  await getDbCollection("recruteurslba").deleteMany({})
  await getDbCollection("etablissements").deleteMany({})
  await getDbCollection("users").deleteMany({})
  await getDbCollection("userswithaccounts").deleteMany({})
  await getDbCollection("eligible_trainings_for_appointments").deleteMany({})
}

describe("email blaklist events", () => {
  useMongo()
  const blacklistedEmail = "blacklisted@email.com"
  const fakeMessageId_1 = "<fake_id@domain.net>"

  const baseWebHookPayload: IBrevoWebhookEvent = {
    event: BrevoEventStatus.HARD_BOUNCE,
    email: blacklistedEmail,
    id: 1,
    date: "2024-10-15 11:00:00",
    "message-id": "<xxx@msgid.domain>",
    reason: "",
    tag: "",
    subject: "",
    sending_ip: "x.x.x.x",
    ts_epoch: 1,
    template_id: 1,
  }

  const baseBlockedAddress = [
    {
      email: blacklistedEmail,
      reason: {
        code: BrevoBlockedReasons.ADMIN_BLOCKED,
      },
    },
  ]

  beforeEach(async () => {
    return async () => {
      await cleanTest()
    }
  })

  it("Non 'blocked' event shoud throw an error", async () => {
    baseWebHookPayload.event = BrevoEventStatus.DELIVRE
    await expect.soft(processHardBounceWebhookEvent(baseWebHookPayload)).rejects.toThrow("Non hardbounce event received on hardbounce webhook route")
  })

  it("Unidentified hardbounce should register campaign origin", async () => {
    baseWebHookPayload.event = BrevoEventStatus.HARD_BOUNCE
    const applicant = generateApplicantFixture({ email: blacklistedEmail })
    await getDbCollection("applicants").insertOne(applicant)
    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.CAMPAIGN} (${BrevoEventStatus.HARD_BOUNCE})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Unidentified blocked should register unknown origin", async () => {
    await saveBlacklistEmails(baseBlockedAddress)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.UNKNOWN} (${BrevoEventStatus.BLOCKED})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Applicant blocked should register candidature_spontanee_candidat (blocked)", async () => {
    const applicant = generateApplicantFixture({ email: blacklistedEmail })
    await getDbCollection("applicants").insertOne(applicant)
    await getDbCollection("applications").insertOne(generateApplicationFixture({ applicant_id: applicant._id, to_applicant_message_id: fakeMessageId_1 }))
    baseWebHookPayload.event = BrevoEventStatus.BLOCKED
    baseWebHookPayload["message-id"] = fakeMessageId_1

    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.CANDIDATURE_SPONTANEE_CANDIDAT} (${BrevoEventStatus.BLOCKED})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Unsubscribed variation events should register correct origin with (unsubscribed) reason", async () => {
    baseBlockedAddress[0].reason.code = BrevoBlockedReasons.UNSUBSCRIBED_VIA_API
    const applicant = generateApplicantFixture({ email: blacklistedEmail })
    await getDbCollection("applicants").insertOne(applicant)
    await getDbCollection("applications").insertOne(generateApplicationFixture({ applicant_id: applicant._id }))

    await saveBlacklistEmails(baseBlockedAddress)

    let blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.CANDIDATURE_SPONTANEE_CANDIDAT} (${BrevoEventStatus.UNSUBSCRIBED})`,
        email: blacklistedEmail,
      })
    )

    await getDbCollection("emailblacklists").deleteMany({})
    await getDbCollection("applications").insertOne(generateApplicationFixture({ company_email: blacklistedEmail }))
    baseBlockedAddress[0].reason.code = BrevoBlockedReasons.UNSUBSCRIBED_VIA_EMAIL

    await saveBlacklistEmails(baseBlockedAddress)

    blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.CANDIDATURE_SPONTANEE_RECRUTEUR} (${BrevoEventStatus.UNSUBSCRIBED})`,
        email: blacklistedEmail,
      })
    )

    await getDbCollection("emailblacklists").deleteMany({})
    await getDbCollection("applications").deleteMany({})
    await getDbCollection("applicants").deleteMany({})
    await getDbCollection("users").insertOne(generateUserFixture({ email: blacklistedEmail, role: EApplicantRole.CANDIDAT }))
    baseBlockedAddress[0].reason.code = BrevoBlockedReasons.UNSUBSCRIBED_VIA_MA

    await saveBlacklistEmails(baseBlockedAddress)

    blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.PRDV_CANDIDAT} (${BrevoEventStatus.UNSUBSCRIBED})`,
        email: blacklistedEmail,
      })
    )

    await getDbCollection("emailblacklists").deleteMany({})
    await getDbCollection("users").deleteMany({})
    await getDbCollection("userswithaccounts").insertOne(generateUserWithAccountFixture({ email: blacklistedEmail }))
    baseBlockedAddress[0].reason.code = BrevoBlockedReasons.HARD_BOUNCE

    await saveBlacklistEmails(baseBlockedAddress)

    blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.USER_WITH_ACCOUNT} (${BrevoEventStatus.HARD_BOUNCE})`,
        email: blacklistedEmail,
      })
    )

    await getDbCollection("emailblacklists").deleteMany({})
    await getDbCollection("eligible_trainings_for_appointments").insertOne(generateEligibleTrainingFixture({ lieu_formation_email: blacklistedEmail }))
    baseBlockedAddress[0].reason.code = BrevoBlockedReasons.SPAM

    await saveBlacklistEmails(baseBlockedAddress)

    blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.PRDV_CFA} (${BrevoEventStatus.SPAM})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Recruteur LBA with SPAM (plainte) should register candidature_spontanee_recruteur (spam)", async () => {
    const applicant = generateApplicantFixture({ email: blacklistedEmail })
    await getDbCollection("applicants").insertOne(applicant)
    await getDbCollection("applications").insertOne(generateApplicationFixture({ company_email: blacklistedEmail, to_company_message_id: fakeMessageId_1 }))
    baseWebHookPayload.event = BrevoEventStatus.SPAM
    baseWebHookPayload["message-id"] = fakeMessageId_1

    const mockedFn = vi.fn().mockReturnValue(null)

    await processHardBounceWebhookEvent(baseWebHookPayload, mockedFn)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.CANDIDATURE_SPONTANEE_RECRUTEUR} (${BrevoEventStatus.SPAM})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Adresse CFA PRDV with Unsubscribe should register prise_de_rdv_CFA (unsubscribed)", async () => {
    await getDbCollection("appointments").insertOne(
      generateAppointmentFixture({
        to_cfa_mails: [
          {
            campaign: "CANDIDAT_APPOINTMENT",
            status: null,
            message_id: fakeMessageId_1,
            email_sent_at: new Date(),
          },
        ],
      })
    )
    baseWebHookPayload.event = BrevoEventStatus.UNSUBSCRIBED
    baseWebHookPayload["message-id"] = fakeMessageId_1

    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.PRDV_CFA} (${BrevoEventStatus.UNSUBSCRIBED})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Adresse Candidat PRDV with hardbounce should register prise_de_rdv_candidat (hardbounce)", async () => {
    await getDbCollection("appointments").insertOne(
      generateAppointmentFixture({
        to_applicant_mails: [
          {
            campaign: "CANDIDAT_APPOINTMENT",
            status: null,
            message_id: fakeMessageId_1,
            email_sent_at: new Date(),
          },
        ],
      })
    )
    baseWebHookPayload.event = BrevoEventStatus.HARD_BOUNCE
    baseWebHookPayload["message-id"] = fakeMessageId_1

    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.PRDV_CANDIDAT} (${BrevoEventStatus.HARD_BOUNCE})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Adresse campagne PRDV with SPAM should register prise_de_rdv_invitation (SPAM)", async () => {
    await getDbCollection("etablissements").insertOne(
      generateEligibleTrainingEstablishmentFixture({
        to_CFA_invite_optout_last_message_id: fakeMessageId_1,
      })
    )
    baseWebHookPayload.event = BrevoEventStatus.HARD_BOUNCE
    baseWebHookPayload["message-id"] = fakeMessageId_1

    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.PRDV_INVITATION} (${BrevoEventStatus.HARD_BOUNCE})`,
        email: blacklistedEmail,
      })
    )
  })
})
