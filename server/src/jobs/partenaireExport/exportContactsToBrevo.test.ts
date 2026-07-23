import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateJobsPartnersFull } from "shared/fixtures/jobPartners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/userWithAccount.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { sendContactsToBrevo } from "./exportContactsToBrevo"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slackUtils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

const makeRoleManagement360 = (over: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  role_last_status: AccessStatus.GRANTED,
  user_last_status: UserEventType.ACTIF,
  role_authorized_type: AccessEntityType.ENTREPRISE,
  user__id: new ObjectId(),
  user_origin: "lba",
  user_first_name: "Jeanne",
  user_last_name: "Martin",
  user_email: `jeanne-${new ObjectId().toHexString()}@entreprise.fr`,
  role_createdAt: new Date("2025-05-01"),
  user_last_action_date: new Date("2025-06-15"),
  entreprise_enseigne: "Enseigne",
  entreprise_raison_sociale: "Raison Sociale",
  entreprise_siret: "34268752200066",
  cfa_enseigne: null,
  cfa_raison_sociale: null,
  cfa_siret: null,
  ...over,
})

describe("sendContactsToBrevo", () => {
  useMongo()

  beforeEach(async () => {
    vi.mocked(uploadContactListToBrevo).mockClear()
    return async () => {
      await getDbCollection("rolemanagement360").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("pousse LAST_ACTION_DATE et DATE_DERNIERE_OFFRE (max des offer_creation) pour les entreprises", async () => {
    const contact = makeRoleManagement360()
    await getDbCollection("rolemanagement360").insertOne(contact)
    await getDbCollection("jobs_partners").insertMany([
      generateJobsPartnersFull({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: contact.user__id, offer_creation: new Date("2025-03-10") }),
      generateJobsPartnersFull({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: contact.user__id, offer_creation: new Date("2025-06-01") }),
    ])

    await sendContactsToBrevo()

    // 2 appels (TRANSACTIONAL + MARKETING) pour le batch ENTREPRISE
    const entrepriseCalls = vi
      .mocked(uploadContactListToBrevo)
      .mock.calls.filter(([, rows]) => (rows as Record<string, unknown>[]).some((r) => r.role_authorized_type === AccessEntityType.ENTREPRISE))
    expect(entrepriseCalls.length).toBe(2)

    const [, rows] = entrepriseCalls[0]
    const row = (rows as Record<string, unknown>[]).find((r) => r.user_email === contact.user_email)
    expect(row).toBeDefined()
    expect(row?.user_last_action_date).toEqual(new Date("2025-06-15"))
    expect(row?.last_offer_date).toEqual(new Date("2025-06-01"))
    expect(row?.job_count).toBe(2)
  })

  it("pousse LAST_ACTION_DATE pour les CFA (sans DATE_DERNIERE_OFFRE)", async () => {
    const cfaContact = makeRoleManagement360({
      role_authorized_type: AccessEntityType.CFA,
      cfa_enseigne: "CFA Enseigne",
      cfa_raison_sociale: "CFA RS",
      cfa_siret: "34268752200066",
      entreprise_enseigne: null,
      entreprise_raison_sociale: null,
      entreprise_siret: null,
    })
    await getDbCollection("rolemanagement360").insertOne(cfaContact)

    await sendContactsToBrevo()

    const cfaCalls = vi
      .mocked(uploadContactListToBrevo)
      .mock.calls.filter(([, rows]) => (rows as Record<string, unknown>[]).some((r) => r.role_authorized_type === AccessEntityType.CFA))
    expect(cfaCalls.length).toBe(2)
    const [, rows] = cfaCalls[0]
    const row = (rows as Record<string, unknown>[]).find((r) => r.user_email === cfaContact.user_email)
    expect(row?.user_last_action_date).toEqual(new Date("2025-06-15"))
    expect(row?.last_offer_date).toBeUndefined()
  })

  it("exclut les contacts non actifs ou non autorisés", async () => {
    await getDbCollection("rolemanagement360").insertMany([
      makeRoleManagement360({ user_last_status: UserEventType.DESACTIVE }),
      makeRoleManagement360({ role_last_status: AccessStatus.AWAITING_VALIDATION }),
    ])

    await sendContactsToBrevo()

    // le pipeline peut émettre des lots vides : on vérifie qu'aucun contact n'est poussé
    const pushedRows = vi.mocked(uploadContactListToBrevo).mock.calls.flatMap(([, rows]) => rows as Record<string, unknown>[])
    expect(pushedRows).toHaveLength(0)
  })
})
