import { useMongo } from "@tests/utils/mongo.test.utils"
import fs from "fs"
import path from "path"
import { INDEXNOW_KEY } from "shared/constants/indexnow"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { describe, expect, it } from "vitest"
import { __dirname } from "@/common/utils/dirname"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { buildIndexNowPayloads, buildPublicStateChangeFilter } from "./ping-indexnow"

describe("clé IndexNow", () => {
  it("est servie par un fichier public dont le nom et le contenu correspondent à la constante", () => {
    // Le protocole exige que la clé soit servie en clair à https://<host>/<clé>.txt : une rotation
    // qui oublie l'un des deux côtés casserait silencieusement toutes les soumissions (403 Invalid key).
    const keyFilePath = path.join(__dirname(import.meta.url), "../../../../ui/public", `${INDEXNOW_KEY}.txt`)
    expect(fs.existsSync(keyFilePath), `fichier attendu : ui/public/${INDEXNOW_KEY}.txt`).toBe(true)
    expect(fs.readFileSync(keyFilePath, "utf8").trim()).toBe(INDEXNOW_KEY)
  })
})

describe("buildIndexNowPayloads", () => {
  const publicUrl = "https://labonnealternance.apprentissage.beta.gouv.fr"

  it("construit un payload conforme au protocole IndexNow", () => {
    const urls = ["https://labonnealternance.apprentissage.beta.gouv.fr/emploi/offres_emploi_lba/abc/dev-web"]
    const payloads = buildIndexNowPayloads(urls, publicUrl)

    expect(payloads).toEqual([
      {
        host: "labonnealternance.apprentissage.beta.gouv.fr",
        key: INDEXNOW_KEY,
        keyLocation: `${publicUrl}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      },
    ])
  })

  it("ne produit aucun payload sans URL", () => {
    expect(buildIndexNowPayloads([], publicUrl)).toEqual([])
  })

  it("découpe en lots de 10 000 URLs maximum", () => {
    const urls = Array.from({ length: 10_001 }, (_, i) => `${publicUrl}/emploi/offres_emploi_lba/${i}/offre`)
    const payloads = buildIndexNowPayloads(urls, publicUrl)

    expect(payloads).toHaveLength(2)
    expect(payloads[0].urlList).toHaveLength(10_000)
    expect(payloads[1].urlList).toEqual([urls[10_000]])
  })
})

describe("buildPublicStateChangeFilter", () => {
  useMongo()

  it("retient une offre publiée après sa création, pas une offre en ligne seulement rafraîchie par un import", async () => {
    const now = new Date()
    const since = dayjs(now).subtract(1, "hour").toDate()
    const createdAt = dayjs(now).subtract(3, "day").toDate()
    const historyEvent = (status: JOB_STATUS_ENGLISH, date: Date) => ({ status, date, reason: "test", granted_by: "test" })
    const published = generateJobsPartnersOfferPrivate({
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      created_at: createdAt,
      updated_at: now,
      offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.EN_MODERATION, createdAt), historyEvent(JOB_STATUS_ENGLISH.ACTIVE, now)],
    })
    const refreshed = generateJobsPartnersOfferPrivate({
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      created_at: createdAt,
      updated_at: now,
      offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.ACTIVE, createdAt)],
    })
    await getDbCollection("jobs_partners").insertMany([published, refreshed])

    const changed = await getDbCollection("jobs_partners").find(buildPublicStateChangeFilter(since)).toArray()

    expect(changed.map(({ _id }) => _id.toString())).toEqual([published._id.toString()])
  })
})
