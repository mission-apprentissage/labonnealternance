import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateSearchItemFixture } from "shared/fixtures/searchItems.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { downloadMistralBatchOutput, getMistralBatchJob, sendMistralMessages, submitMistralBatch } from "@/services/mistralai/mistralai.service"

import {
  applyKeywordsBatchFile,
  applyPendingMistralBatches,
  buildKeywordsSourceText,
  computeSourceHash,
  generateSearchItemsKeywordsContinuous,
  submitSearchItemsKeywordsBatch,
  writeKeywordsToCache,
} from "./searchItemsKeywords.service"

vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn(),
  submitMistralBatch: vi.fn(),
  getMistralBatchJob: vi.fn(),
  downloadMistralBatchOutput: vi.fn(),
}))

vi.mock("@/common/utils/slackUtils", () => ({
  notifyToSlack: vi.fn(),
}))

const offreFixture = (data: Parameters<typeof generateSearchItemFixture>[0] = {}) =>
  generateSearchItemFixture({ type: "offre", sub_type: "offres_emploi_partenaires", keywords: null, ...data })

const recruteurFixture = (data: Parameters<typeof generateSearchItemFixture>[0] = {}) =>
  generateSearchItemFixture({ type: "offre", sub_type: "recruteurs_lba", description: "", keywords: null, ...data })

const hashOf = (doc: { title: string; description: string; rome_labels: string[] | null }) => computeSourceHash(buildKeywordsSourceText(doc))

describe("searchItemsKeywords.service — génération continue des keywords", () => {
  useMongo()

  beforeEach(async () => {
    vi.clearAllMocks()
    await getDbCollection("search_items").deleteMany({})
    await getDbCollection("search_items_keywords").deleteMany({})
    await getDbCollection("mistral_batch_jobs").deleteMany({})
  })

  describe("generateSearchItemsKeywordsContinuous", () => {
    it("cache miss (offre) : appel immédiat, search_items et cache remplis", async () => {
      const offre = offreFixture({ title: "Développeur web", description: "Stack JS moderne." })
      await getDbCollection("search_items").insertOne(offre)
      vi.mocked(sendMistralMessages).mockResolvedValue('{"keywords":["javascript","web"]}')

      const counters = await generateSearchItemsKeywordsContinuous()

      expect(counters.generated).toBe(1)
      const doc = await getDbCollection("search_items").findOne({ _id: offre._id })
      expect(doc?.keywords).toEqual(["javascript", "web"])
      const cached = await getDbCollection("search_items_keywords").findOne({ source_hash: hashOf(offre) })
      expect(cached).toMatchObject({ keywords: ["javascript", "web"], origin: "immediate" })
    })

    it("cache hit : aucun appel API, keywords propagés depuis le cache", async () => {
      const offre = offreFixture({ title: "Boulanger", description: "Fournil artisanal." })
      await getDbCollection("search_items").insertOne(offre)
      await writeKeywordsToCache({ sourceHash: hashOf(offre), keywords: ["boulangerie"], origin: "batch" })

      const counters = await generateSearchItemsKeywordsContinuous()

      expect(counters.cacheHits).toBe(1)
      expect(sendMistralMessages).not.toHaveBeenCalled()
      const doc = await getDbCollection("search_items").findOne({ _id: offre._id })
      expect(doc?.keywords).toEqual(["boulangerie"])
    })

    it("recruteur en cache miss : laissé au batch hebdo (aucun appel immédiat)", async () => {
      const recruteur = recruteurFixture({ rome_labels: ["Boucherie"] })
      await getDbCollection("search_items").insertOne(recruteur)

      await generateSearchItemsKeywordsContinuous()

      expect(sendMistralMessages).not.toHaveBeenCalled()
      const doc = await getDbCollection("search_items").findOne({ _id: recruteur._id })
      expect(doc?.keywords).toBeNull()
    })

    it("recruteur en cache hit : propagé (résultat du batch hebdo)", async () => {
      const recruteur = recruteurFixture({ rome_labels: ["Boucherie"] })
      await getDbCollection("search_items").insertOne(recruteur)
      await writeKeywordsToCache({ sourceHash: hashOf(recruteur), keywords: ["viande", "commerce"], origin: "batch" })

      const counters = await generateSearchItemsKeywordsContinuous()

      expect(counters.cacheHits).toBe(1)
      const doc = await getDbCollection("search_items").findOne({ _id: recruteur._id })
      expect(doc?.keywords).toEqual(["viande", "commerce"])
    })

    it("réponse invalide : [] posé (doc et cache), le doc sort de la file", async () => {
      const offre = offreFixture({ title: "Titre", description: "Texte." })
      await getDbCollection("search_items").insertOne(offre)
      vi.mocked(sendMistralMessages).mockResolvedValue("pas du json")

      const counters = await generateSearchItemsKeywordsContinuous()

      expect(counters.unusable).toBe(1)
      const doc = await getDbCollection("search_items").findOne({ _id: offre._id })
      expect(doc?.keywords).toEqual([])
      // Second run : plus rien à traiter (keywords [] ≠ null), aucun nouvel appel.
      vi.mocked(sendMistralMessages).mockClear()
      await generateSearchItemsKeywordsContinuous()
      expect(sendMistralMessages).not.toHaveBeenCalled()
    })

    it("doc sans texte source : [] posé directement, aucun appel API", async () => {
      const vide = offreFixture({ title: "", description: "", rome_labels: [] })
      await getDbCollection("search_items").insertOne(vide)

      await generateSearchItemsKeywordsContinuous()

      expect(sendMistralMessages).not.toHaveBeenCalled()
      const doc = await getDbCollection("search_items").findOne({ _id: vide._id })
      expect(doc?.keywords).toEqual([])
    })

    it("erreur API : le doc reste null (retenté au prochain tick)", async () => {
      const offre = offreFixture({ title: "Titre", description: "Texte." })
      await getDbCollection("search_items").insertOne(offre)
      vi.mocked(sendMistralMessages).mockResolvedValue(null)

      const counters = await generateSearchItemsKeywordsContinuous()

      expect(counters.failures).toBe(1)
      const doc = await getDbCollection("search_items").findOne({ _id: offre._id })
      expect(doc?.keywords).toBeNull()
    })
  })

  describe("submitSearchItemsKeywordsBatch", () => {
    it("déduplique par texte source, exclut le cache, enregistre le job", async () => {
      // 2 recruteurs aux mêmes rome_labels (même texte source) + 1 déjà couvert par le cache.
      const jumeau1 = recruteurFixture({ rome_labels: ["Boucherie", "Vente"] })
      const jumeau2 = recruteurFixture({ rome_labels: ["Boucherie", "Vente"] })
      const dejaEnCache = recruteurFixture({ rome_labels: ["Plomberie"] })
      await getDbCollection("search_items").insertMany([jumeau1, jumeau2, dejaEnCache])
      await writeKeywordsToCache({ sourceHash: hashOf(dejaEnCache), keywords: ["plomberie"], origin: "batch" })
      vi.mocked(submitMistralBatch).mockResolvedValue("mistral-job-1")

      const result = await submitSearchItemsKeywordsBatch()

      expect(result.uniqueTexts).toBe(1)
      expect(submitMistralBatch).toHaveBeenCalledTimes(1)
      const requests = vi.mocked(submitMistralBatch).mock.calls[0][0].requests
      expect(requests).toHaveLength(1)
      expect(requests[0].customId).toBe(hashOf(jumeau1))
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "mistral-job-1" })
      expect(tracked).toMatchObject({ kind: "search_items_keywords", status: "submitted", request_count: 1 })
    })
  })

  describe("applyPendingMistralBatches", () => {
    const trackedJob = (jobId: string) => ({
      _id: new ObjectId(),
      job_id: jobId,
      kind: "search_items_keywords" as const,
      status: "submitted" as const,
      request_count: 1,
      applied_count: null,
      error: null,
      submitted_at: new Date(),
      checked_at: null,
      applied_at: null,
    })

    it("job terminé : sortie téléchargée et appliquée au cache, statut applied", async () => {
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ok"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "SUCCESS", outputFile: "file-1" } as never)
      vi.mocked(downloadMistralBatchOutput).mockResolvedValue(new Map([["hash-abc", '{"keywords":["forêt"]}']]))

      const counters = await applyPendingMistralBatches()

      expect(counters.applied).toBe(1)
      const cached = await getDbCollection("search_items_keywords").findOne({ source_hash: "hash-abc" })
      expect(cached).toMatchObject({ keywords: ["forêt"], origin: "batch" })
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-ok" })
      expect(tracked).toMatchObject({ status: "applied", applied_count: 1 })
    })

    it("job en échec : statut failed + alerte Slack", async () => {
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ko"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "FAILED", outputFile: null } as never)

      const counters = await applyPendingMistralBatches()

      expect(counters.failed).toBe(1)
      expect(notifyToSlack).toHaveBeenCalledOnce()
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-ko" })
      expect(tracked).toMatchObject({ status: "failed", error: "FAILED" })
    })

    it("job encore en cours : checked_at bumpé, statut inchangé", async () => {
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-run"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "RUNNING", outputFile: null } as never)

      const counters = await applyPendingMistralBatches()

      expect(counters.stillRunning).toBe(1)
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-run" })
      expect(tracked?.status).toBe("submitted")
      expect(tracked?.checked_at).not.toBeNull()
    })
  })

  describe("applyKeywordsBatchFile (import manuel)", () => {
    it("supporte les deux formats de custom_id : ObjectId (historique) et hash (courant)", async () => {
      const offre = offreFixture({ title: "Cuisinier", description: "Restaurant gastronomique." })
      await getDbCollection("search_items").insertOne(offre)

      const lines = [
        JSON.stringify({ custom_id: offre._id.toString(), response: { body: { choices: [{ message: { content: '{"keywords":["cuisine"]}' } }] } } }),
        JSON.stringify({ custom_id: "hash-manuel-1", response: { body: { choices: [{ message: { content: '{"keywords":["manuel"]}' } }] } } }),
      ]
      const file = join(tmpdir(), `keywords-import-${Date.now()}.jsonl`)
      await writeFile(file, lines.join("\n"))

      await applyKeywordsBatchFile({ file })

      const doc = await getDbCollection("search_items").findOne({ _id: offre._id })
      expect(doc?.keywords).toEqual(["cuisine"])
      // Format historique : le cache est alimenté via le texte source du doc.
      const cachedFromDoc = await getDbCollection("search_items_keywords").findOne({ source_hash: hashOf(offre) })
      expect(cachedFromDoc).toMatchObject({ keywords: ["cuisine"], origin: "manual_import" })
      // Format hash : écrit directement au cache.
      const cachedFromHash = await getDbCollection("search_items_keywords").findOne({ source_hash: "hash-manuel-1" })
      expect(cachedFromHash).toMatchObject({ keywords: ["manuel"], origin: "manual_import" })
    })
  })
})
