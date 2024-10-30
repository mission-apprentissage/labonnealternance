import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateAppointmentFixture } from "shared/fixtures/appointment.fixture"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { BlackListOrigins } from "./application.service"
import { BrevoEventStatus } from "./brevo.service"
import { IBrevoWebhookEvent, processHardBounceWebhookEvent } from "./emails.service"

/*
  expect.soft(result).toStrictEqual({
      active: true,
      siret: "58006820882692",
      enseigne: "fake_company_name",
      phone: "",
      email: "",
    })

    const modifiedRecruteurLba = await getDbCollection("recruteurslba").findOne({ siret: "58006820882692" })
    expect.soft(modifiedRecruteurLba).toEqual(
      expect.objectContaining({
        phone: "",
        email: "",
      })
    )

    let eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({ siret: "58006820882692", event: ERecruteurLbaUpdateEventType.DELETE_PHONE })
    expect.soft(eventCount).toEqual(1)

    eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({ siret: "58006820882692", event: ERecruteurLbaUpdateEventType.DELETE_EMAIL })
    expect.soft(eventCount).toEqual(1)


*/

async function cleanTest() {
  await getDbCollection("emailblacklists").deleteMany({})
  await getDbCollection("applications").deleteMany({})
  await getDbCollection("recruteurslba").deleteMany({})
  await getDbCollection("etablissements").deleteMany({})
  await getDbCollection("users").deleteMany({})
  await getDbCollection("userswithaccounts").deleteMany({})
  await getDbCollection("eligible_trainings_for_appointments").deleteMany({})
}

describe("email blaklist events", () => {
  useMongo()

  beforeEach(async () => {
    //await cleanTest()

    return async () => {
      await cleanTest()
    }
  })

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

  it("Non 'blocked' event shoud throw an error", async () => {
    baseWebHookPayload.event = BrevoEventStatus.DELIVRE
    await expect.soft(processHardBounceWebhookEvent(baseWebHookPayload)).rejects.toThrow("Non hardbounce event received on hardbounce webhook route")
  })

  it("Unidentified hardbounce should register campaign origin", async () => {
    baseWebHookPayload.event = BrevoEventStatus.HARD_BOUNCE
    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.CAMPAIGN} (${BrevoEventStatus.HARD_BOUNCE})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Applicant blocked should register candidature_spontanee_candidat (blocked)", async () => {
    await getDbCollection("applications").insertOne(generateApplicationFixture({ applicant_email: blacklistedEmail, to_applicant_message_id: fakeMessageId_1 }))
    baseWebHookPayload.event = BrevoEventStatus.BLOCKED
    baseWebHookPayload["message-id"] = fakeMessageId_1

    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.SPONT_CANDIDAT} (${BrevoEventStatus.BLOCKED})`,
        email: blacklistedEmail,
      })
    )
  })

  it("Recruteur LBA with SPAM (plainte) should register candidature_spontanee_recruteur (spam)", async () => {
    await getDbCollection("applications").insertOne(generateApplicationFixture({ company_email: blacklistedEmail, to_company_message_id: fakeMessageId_1 }))
    baseWebHookPayload.event = BrevoEventStatus.SPAM
    baseWebHookPayload["message-id"] = fakeMessageId_1

    await processHardBounceWebhookEvent(baseWebHookPayload)

    const blEvent = await getDbCollection("emailblacklists").findOne({ email: blacklistedEmail })
    expect.soft(blEvent).toEqual(
      expect.objectContaining({
        blacklisting_origin: `${BlackListOrigins.SPONT} (${BrevoEventStatus.SPAM})`,
        email: blacklistedEmail,
      })
    )
  })

  //UNSUB + prdv cfa

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

  /*

    ----
  --> event candidat (blocked)

        if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("applications").findOne({ applicant_email: email }))) {
        origin = BlackListOrigins.SPONT_CANDIDAT
      }
  
  --> event recruteur (spam) + recruteur sans adresse
  version saveBLack
  if (await getDbCollection("applications").findOne({ company_email: email })) {
        origin = BlackListOrigins.SPONT
      }
  ----

  ----
  
  --> event prdv cfa (unsub) + etfa id avec referrers =  [], lieu_formation_email =  ""
  if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("eligible_trainings_for_appointments").findOne({ lieu_formation_email: email }))) {
        origin = BlackListOrigins.PRDV_CFA
      }
  ----

  ----
  Hardbounce + prdv candidat 
  --> event prdv cand (harbbounce) + users avec email-blacklist-par-lba%

   if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("users").findOne({ email, role: EApplicantRole.CANDIDAT }))) {
        origin = BlackListOrigins.PRDV_CANDIDAT
      }
  -----

  ----
  Blocked +   const etablissement = await getDbCollection("etablissements").findOne({ to_CFA_invite_optout_last_message_id: messageId })
  --> event prdv_invi (blocked) 
  ------

  -----
  if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("userswithaccounts").findOne({ email }))) {
        origin = BlackListOrigins.USER_WITH_ACCOUNT
      }
  ADMIN_BLOCKED
  --> event user_with_account (blocked)
  -----

  -----
  SPAM = "contactFlaggedAsSpam", + rien
  ---> event inconnu (spam)

  -----

  les mêmes avec saveBlacklistEmails  +


    enum BrevoBlockedReasons {
  UNSUBSCRIBED_VIA_MA = "unsubscribedViaMA",
  UNSUBSCRIBED_VIA_EMAIL = "unsubscribedViaEmail",
  UNSUBSCRIBED_VIA_API = "unsubscribedViaApi",
  ADMIN_BLOCKED = "adminBlocked",
  HARD_BOUNCE = "hardBounce",

      

      


    tests webhook pas hardbounce avec vrai contenu

  */
})
