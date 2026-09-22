import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import anonymizedApplicationsModel from "shared/models/anonymized-applications.model"
import { modelDescriptors } from "shared/models/models"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import { modelToKeep } from "@/jobs/database/obfuscate-collections"

import { anonymizeApplications } from "./anonymize-applications"

vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

const OLD_APPLICATION = generateApplicationFixture({ created_at: new Date("2020-01-15T10:00:00.000Z") })
const RECENT_APPLICATION = generateApplicationFixture({ created_at: new Date() })

const listUndeclaredCollections = async () => {
  const declared = new Set<string>([...modelDescriptors.map(({ collectionName }) => collectionName), ...modelToKeep])
  const existing = await getDatabase().listCollections().toArray()
  return existing.map(({ name }) => name).filter((name) => !declared.has(name))
}

describe("anonymizeApplications", () => {
  useMongo()

  beforeEach(async () => {
    // `clearAllCollections` vide les collections mais ne les supprime pas : une collection hors
    // modèles laissée par un run précédent rendrait le garde-fou ci-dessous toujours rouge.
    for (const name of await listUndeclaredCollections()) {
      await getDatabase().dropCollection(name)
    }
    await getDbCollection("applications").insertMany([OLD_APPLICATION, RECENT_APPLICATION])
  })

  it("écrit les candidatures de plus de deux ans dans la collection déclarée par le modèle", async () => {
    await anonymizeApplications()

    const anonymized = await getDbCollection(anonymizedApplicationsModel.collectionName).find({}).toArray()
    expect(anonymized).toHaveLength(1)
    expect(anonymized[0]._id).toEqual(OLD_APPLICATION._id)
    expect(anonymized[0].company_siret).toBe(OLD_APPLICATION.company_siret)
    // La projection ne doit laisser passer aucune donnée identifiante.
    expect(anonymized[0].company_email).toBeUndefined()
    expect(anonymized[0].applicant_message_to_company).toBeUndefined()

    const remaining = await getDbCollection("applications").find({}).toArray()
    expect(remaining.map(({ _id }) => _id)).toEqual([RECENT_APPLICATION._id])
  })

  // Garde-fou sur le nom de collection ciblé par le `$merge` : il a divergé du modèle
  // (« anonymizedapplications » sans underscore) et le cron a alimenté pendant des mois une
  // collection absente des modèles, donc absente d'`obfuscateCollections`.
  it("ne crée aucune collection en dehors des modèles déclarés", async () => {
    await anonymizeApplications()

    expect(await listUndeclaredCollections()).toEqual([])
  })
})
