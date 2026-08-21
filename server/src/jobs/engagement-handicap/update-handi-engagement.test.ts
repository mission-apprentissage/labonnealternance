import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiEntrepriseEtablissementFixture } from "@/common/apis/api-entreprise/api-entreprise.client.fixture"
import { s3ReadAsStream } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { stringToStream } from "@/common/utils/stream-utils"
import { updateHandiEngagement } from "./update-handi-engagement"

// Mock S3 pour fournir le flux ndjson sans appel AWS réel
vi.mock("@/common/utils/aws-utils", () => ({
  s3ReadAsStream: vi.fn(),
}))

const SIRET_1 = apiEntrepriseEtablissementFixture.dinum.data.siret
const SIRET_2 = "42476141900045"

const mockNdjson = (docs: object[]) => {
  vi.mocked(s3ReadAsStream).mockResolvedValue(stringToStream(docs.map((doc) => JSON.stringify(doc)).join("\n")))
}

useMongo()

describe("updateHandiEngagement", () => {
  beforeEach(async () => {
    vi.mocked(s3ReadAsStream).mockReset()
    return async () => {
      await getDbCollection("referentiel_engagement_entreprise").deleteMany({})
    }
  })

  it("Cas 1 - crée une nouvelle entrée avec source FRANCE_TRAVAIL quand le SIRET est absent du référentiel", async () => {
    // given
    mockNdjson([{ siret: SIRET_1 }])
    // when
    await updateHandiEngagement()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_1 })
    expect(doc).not.toBeNull()
    expect(doc?.engagement).toBe("handicap")
    expect(doc?.sources).toEqual([EntrepriseEngagementSources.FRANCE_TRAVAIL])
  })

  it("Cas 2 - ne duplique pas la source quand le SIRET est déjà présent avec la source FRANCE_TRAVAIL", async () => {
    // given
    const before = new Date("2020-01-01")
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: SIRET_1,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
      created_at: before,
      updated_at: before,
    })
    mockNdjson([{ siret: SIRET_1 }])
    // when
    await updateHandiEngagement()
    // then
    // Le traitement applique désormais un upsert unique ($addToSet) quel que soit l'état préalable du
    // document : updated_at est donc rafraîchi même quand la source était déjà présente.
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_1 })
    expect(doc?.sources).toEqual([EntrepriseEngagementSources.FRANCE_TRAVAIL])
    expect(doc?.updated_at.getTime()).toBeGreaterThan(before.getTime())
  })

  it("Cas 3 - complète les sources avec FRANCE_TRAVAIL quand le SIRET n'a que la source LBA, sans écraser l'existant", async () => {
    // given
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: SIRET_1,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.LBA],
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockNdjson([{ siret: SIRET_1 }])
    // when
    await updateHandiEngagement()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_1 })
    expect(doc?.sources).toContain(EntrepriseEngagementSources.LBA)
    expect(doc?.sources).toContain(EntrepriseEngagementSources.FRANCE_TRAVAIL)
    expect(doc?.sources).toHaveLength(2)
  })

  it("traite plusieurs sirets du fichier ndjson", async () => {
    // given
    mockNdjson([{ siret: SIRET_1 }, { siret: SIRET_2 }])
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(2)
    expect(docs.map((d) => d.siret)).toContain(SIRET_1)
    expect(docs.map((d) => d.siret)).toContain(SIRET_2)
  })

  it("ignore les lignes avec un SIRET invalide sans interrompre le traitement des autres lignes", async () => {
    // given
    mockNdjson([{ siret: "invalid-siret" }, { siret: SIRET_2 }])
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(1)
    expect(docs[0].siret).toBe(SIRET_2)
  })

  it("ignore les lignes ndjson non parsables sans interrompre le traitement des autres lignes", async () => {
    // given
    vi.mocked(s3ReadAsStream).mockResolvedValue(stringToStream(["not-json", JSON.stringify({ siret: SIRET_2 })].join("\n")))
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(1)
    expect(docs[0].siret).toBe(SIRET_2)
  })

  it("ne fait rien si le fichier S3 est vide", async () => {
    // given
    mockNdjson([])
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(0)
  })

  it("ne fait rien si la lecture S3 échoue (fichier introuvable / erreur S3)", async () => {
    // given
    vi.mocked(s3ReadAsStream).mockRejectedValue(new Error("S3 error"))
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(0)
  })

  describe("quand un SIRET n'est plus présent dans le fichier téléchargé", () => {
    it("supprime l'entrée si la source FRANCE_TRAVAIL était sa seule source", async () => {
      // given
      await getDbCollection("referentiel_engagement_entreprise").insertOne({
        _id: new ObjectId(),
        siret: SIRET_2,
        engagement: "handicap",
        sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
        created_at: new Date(),
        updated_at: new Date(),
      })
      mockNdjson([{ siret: SIRET_1 }])
      // when
      await updateHandiEngagement()
      // then
      const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_2 })
      expect(doc).toBeNull()
    })

    it("laisse l'entrée inchangée si elle n'a que la source LBA", async () => {
      // given
      const before = new Date("2020-01-01")
      await getDbCollection("referentiel_engagement_entreprise").insertOne({
        _id: new ObjectId(),
        siret: SIRET_2,
        engagement: "handicap",
        sources: [EntrepriseEngagementSources.LBA],
        created_at: before,
        updated_at: before,
      })
      mockNdjson([{ siret: SIRET_1 }])
      // when
      await updateHandiEngagement()
      // then
      const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_2 })
      expect(doc?.sources).toEqual([EntrepriseEngagementSources.LBA])
      expect(doc?.updated_at.getTime()).toBe(before.getTime())
    })

    it("retire uniquement la source FRANCE_TRAVAIL si l'entrée a aussi la source LBA", async () => {
      // given
      await getDbCollection("referentiel_engagement_entreprise").insertOne({
        _id: new ObjectId(),
        siret: SIRET_2,
        engagement: "handicap",
        sources: [EntrepriseEngagementSources.LBA, EntrepriseEngagementSources.FRANCE_TRAVAIL],
        created_at: new Date(),
        updated_at: new Date(),
      })
      mockNdjson([{ siret: SIRET_1 }])
      // when
      await updateHandiEngagement()
      // then
      const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_2 })
      expect(doc).not.toBeNull()
      expect(doc?.sources).toEqual([EntrepriseEngagementSources.LBA])
    })
  })
})
