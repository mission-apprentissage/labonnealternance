import { readFile } from "node:fs/promises"
import { ObjectId } from "mongodb"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveEntreprise, saveUserWithAccount, roleManagementEventFactory } from "@tests/utils/user.test.utils"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import mailer from "@/services/mailer.service"

import { opcoReminderJob } from "./opco-reminder-job"

vi.mock("@/services/mailer.service", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["opco@example.com"] }),
  },
}))

useMongo()

describe("opco-reminder-job", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await getDbCollection("rolemanagements").deleteMany({})
    await getDbCollection("entreprises").deleteMany({})
    await getDbCollection("userswithaccounts").deleteMany({})
    await getDbCollection("job_processor.jobs").deleteMany({})
  })

  it("ne compte que les entreprises ayant rejoint l'OPCO depuis le dernier envoi", async () => {
    const lastReminderDate = new Date("2025-01-10T00:00:00.000Z")
    const oldEntreprise = await saveEntreprise({ _id: new ObjectId(), opco: OPCOS_LABEL.AKTO })
    const recentEntreprise = await saveEntreprise({ _id: new ObjectId(), opco: OPCOS_LABEL.AKTO })
    const opcoUser = await saveUserWithAccount({ email: "opco@example.com" })

    await getDbCollection("job_processor.jobs").insertOne({
      _id: new ObjectId(),
      type: "cron_task",
      name: "Envoi du rappel de validation des utilisateurs en attente aux OPCOs",
      status: "finished",
      started_at: new Date("2025-01-09T00:00:00.000Z"),
      ended_at: lastReminderDate,
      updated_at: lastReminderDate,
    })

    await getDbCollection("rolemanagements").insertMany([
      {
        _id: new ObjectId(),
        user_id: opcoUser._id,
        authorized_type: AccessEntityType.OPCO,
        authorized_id: OPCOS_LABEL.AKTO,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: [roleManagementEventFactory({ status: AccessStatus.GRANTED })],
      },
      {
        _id: new ObjectId(),
        user_id: new ObjectId(),
        authorized_type: AccessEntityType.ENTREPRISE,
        authorized_id: oldEntreprise._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION, date: new Date("2025-01-01T00:00:00.000Z") })],
      },
      {
        _id: new ObjectId(),
        user_id: new ObjectId(),
        authorized_type: AccessEntityType.ENTREPRISE,
        authorized_id: recentEntreprise._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION, date: new Date("2025-01-12T00:00:00.000Z") })],
      },
    ])

    await getDbCollection("rolemanagements").insertOne({
      _id: new ObjectId(),
      user_id: new ObjectId(),
      authorized_type: AccessEntityType.OPCO,
      authorized_id: OPCOS_LABEL.AKTO,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: [roleManagementEventFactory({ status: AccessStatus.GRANTED })],
    })

    await opcoReminderJob()

    expect(vi.mocked(mailer.sendEmail)).toHaveBeenCalledTimes(1)
    const emailPayload = vi.mocked(mailer.sendEmail).mock.calls[0]?.[0] as { data?: { count?: number; countPhrase?: string } } | undefined
    expect(emailPayload?.data?.count).toBe(1)
    expect(emailPayload?.data?.countPhrase).toContain("depuis notre dernier message")
    expect(emailPayload?.data?.countPhrase).toContain("1 nouvelle entreprise")
  })

  it("utilise le libellé et le footer attendus dans le template OPCO", async () => {
    const templatePath = new URL("../../../static/templates/mail-relance-opco.mjml.ejs", import.meta.url)
    const template = await readFile(templatePath, "utf8")

    expect(template).toContain("depuis notre dernier message")
    expect(template).not.toContain("cette semaine")
    expect(template).toContain("votre structure est inscrite en tant qu'OPCO")
    expect(template).not.toContain("vous avez déclaré des formations")
  })
})
