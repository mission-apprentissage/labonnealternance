import { readFile } from "node:fs/promises"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory, saveEntreprise, saveUserWithAccount } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import type { IRoleManagementEvent } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import mailer from "@/services/mailer.service"

import { OPCO_REMINDER_JOB_NAME, opcoReminderJob } from "./opco-reminder-job"

vi.mock("@/services/mailer.service", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["opco@example.com"] }),
  },
}))

useMongo()

const insertLastReminderRun = async (startedAt: Date) =>
  getDatabase()
    .collection("job_processor.jobs")
    .insertOne({
      _id: new ObjectId(),
      type: "cron_task",
      name: OPCO_REMINDER_JOB_NAME,
      status: "finished",
      started_at: startedAt,
      ended_at: new Date(startedAt.getTime() + 60_000),
      updated_at: new Date(startedAt.getTime() + 60_000),
    })

const insertOpcoUser = async (email: string) => {
  const opcoUser = await saveUserWithAccount({ email })
  await getDbCollection("rolemanagements").insertOne({
    _id: new ObjectId(),
    user_id: opcoUser._id,
    authorized_type: AccessEntityType.OPCO,
    authorized_id: OPCOS_LABEL.AKTO,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: [roleManagementEventFactory({ status: AccessStatus.GRANTED })],
  })
  return opcoUser
}

const insertEntrepriseAwaitingValidation = async (date: Date, laterEvents: IRoleManagementEvent[] = []) => {
  const entreprise = await saveEntreprise({ _id: new ObjectId(), opco: OPCOS_LABEL.AKTO })
  await getDbCollection("rolemanagements").insertOne({
    _id: new ObjectId(),
    user_id: new ObjectId(),
    authorized_type: AccessEntityType.ENTREPRISE,
    authorized_id: entreprise._id.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION, date }), ...laterEvents],
  })
  return entreprise
}

const sentCountPhrase = () => {
  const payload = vi.mocked(mailer.sendEmail).mock.calls[0]?.[0] as { data?: { countPhrase?: string } } | undefined
  return payload?.data?.countPhrase
}

describe("opco-reminder-job", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await getDbCollection("rolemanagements").deleteMany({})
    await getDbCollection("entreprises").deleteMany({})
    await getDbCollection("userswithaccounts").deleteMany({})
    await getDatabase().collection("job_processor.jobs").deleteMany({})
  })

  it("ne compte que les entreprises ayant rejoint l'OPCO depuis le dernier envoi", async () => {
    await insertOpcoUser("opco@example.com")
    await insertLastReminderRun(new Date("2025-01-10T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-01T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-12T00:00:00.000Z"))

    await opcoReminderJob()

    expect(vi.mocked(mailer.sendEmail)).toHaveBeenCalledTimes(1)
    expect.soft(sentCountPhrase()).toContain("1 nouvelle entreprise")
    expect.soft(sentCountPhrase()).toContain("depuis notre dernier message")
  })

  it("ne recompte pas un compte déjà en attente dont le motif change après le dernier envoi", async () => {
    const awaiting = (date: string, reason: string) => roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION, date: new Date(date), reason })
    await insertOpcoUser("opco@example.com")
    await insertLastReminderRun(new Date("2025-01-10T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-01T00:00:00.000Z"), [awaiting("2025-01-12T00:00:00.000Z", "pas de validation automatique possible")])
    await insertEntrepriseAwaitingValidation(new Date("2025-01-12T00:00:00.000Z"), [awaiting("2025-01-12T00:00:01.000Z", "pas de validation automatique possible")])

    await opcoReminderJob()

    expect(sentCountPhrase()).toContain("1 nouvelle entreprise")
  })

  it("compte un compte revenu en attente après le dernier envoi", async () => {
    const event = (status: AccessStatus, date: string) => roleManagementEventFactory({ status, date: new Date(date) })
    await insertOpcoUser("opco@example.com")
    await insertLastReminderRun(new Date("2025-01-10T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-01T00:00:00.000Z"), [
      event(AccessStatus.GRANTED, "2025-01-02T00:00:00.000Z"),
      event(AccessStatus.AWAITING_VALIDATION, "2025-01-12T00:00:00.000Z"),
    ])
    await insertEntrepriseAwaitingValidation(new Date("2025-01-12T00:00:00.000Z"), [event(AccessStatus.GRANTED, "2025-01-13T00:00:00.000Z")])

    await opcoReminderJob()

    expect(sentCountPhrase()).toContain("1 nouvelle entreprise")
  })

  it("borne sur started_at : un compte arrivé pendant l'exécution précédente reste compté", async () => {
    // L'exécution précédente a interrogé la base à son started_at ; un compte arrivé entre ce
    // moment et son ended_at n'a été vu par personne, il doit l'être par celle-ci.
    await insertOpcoUser("opco@example.com")
    await insertLastReminderRun(new Date("2025-01-10T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-10T00:00:30.000Z"))

    await opcoReminderJob()

    expect(vi.mocked(mailer.sendEmail)).toHaveBeenCalledTimes(1)
    expect(sentCountPhrase()).toContain("1 nouvelle entreprise")
  })

  it("sans exécution précédente, compte le stock complet", async () => {
    // Premier run, ou trace disparue (TTL de 90 jours, renommage du cron) : le comptage repart de
    // zéro et porte sur tout le stock en attente.
    await insertOpcoUser("opco@example.com")
    await insertEntrepriseAwaitingValidation(new Date("2024-06-01T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-12T00:00:00.000Z"))

    await opcoReminderJob()

    expect(vi.mocked(mailer.sendEmail)).toHaveBeenCalledTimes(1)
    expect(sentCountPhrase()).toContain("2 nouvelles entreprises")
  })

  it("utilise le libellé attendu dans le message d’email et le footer attendu dans le template OPCO", async () => {
    await insertOpcoUser("opco@example.com")
    await insertLastReminderRun(new Date("2025-01-10T00:00:00.000Z"))
    await insertEntrepriseAwaitingValidation(new Date("2025-01-12T00:00:00.000Z"))

    await opcoReminderJob()

    expect.soft(sentCountPhrase()).toContain("depuis notre dernier message")
    expect.soft(sentCountPhrase()).not.toContain("cette semaine")

    const templatePath = new URL("../../../static/templates/mail-relance-opco.mjml.ejs", import.meta.url)
    const template = await readFile(templatePath, "utf8")
    expect.soft(template).toContain("Nous vous contactons car votre structure est inscrite en tant qu'OPCO")
    expect.soft(template).not.toContain("vous avez déclaré des formations")
  })

  it("enregistre le nom du cron tel qu'il est déclaré dans jobs.ts", async () => {
    // Le comptage repose sur une égalité stricte avec la clef du cron : un renommage d'un seul
    // côté ferait silencieusement repartir le job sur le stock complet.
    const jobsSource = await readFile(new URL("../jobs.ts", import.meta.url), "utf8")
    expect(jobsSource).toContain("[OPCO_REMINDER_JOB_NAME]:")
  })
})
