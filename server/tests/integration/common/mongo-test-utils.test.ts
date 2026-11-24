import { dropUndeclaredCollections, useMongo } from "@tests/utils/mongo.test.utils"
import { describe, expect, it } from "vitest"

import { getDatabase } from "@/common/utils/mongodb-utils"

const collectionNames = async () => (await getDatabase().listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name)

describe("dropUndeclaredCollections", () => {
  useMongo()

  it("supprime une collection hors modèles et son validateur, comme job_processor.jobs après setupJobProcessor", async () => {
    await getDatabase().createCollection("job_processor.jobs", { validator: { $jsonSchema: { required: ["scheduled_for"] } } })

    await dropUndeclaredCollections()

    expect(await collectionNames()).not.toContain("job_processor.jobs")
    await expect(getDatabase().collection("job_processor.jobs").insertOne({ name: "sans scheduled_for" })).resolves.toBeDefined()
  })

  it("garde les collections déclarées, y compris quand une collection hors modèles porte un nom voisin", async () => {
    await getDatabase().createCollection("jobs_partners_reliquat")

    await dropUndeclaredCollections()

    const names = await collectionNames()
    expect(names).toContain("jobs_partners")
    expect(names).not.toContain("jobs_partners_reliquat")
  })
})
