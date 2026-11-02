import fs from "node:fs"
import { mkdtemp } from "node:fs/promises"
import { Readable } from "node:stream"
import { text } from "node:stream/consumers"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { cancelRemovedJobsPartners } from "./cancel-removed-jobs-partners"
import { httpFluxSource } from "./flux-sources"
import { type FluxDefinition, type FluxValidators, importFluxIfChanged, isFluxSkipped } from "./import-flux-if-changed"
import { importPassRaw, importPassToComputed, passFlux } from "./pass/import-pass"
import { processPass } from "./pass/process-pass"
import { commitRawImport } from "./raw-import-commit"

vi.mock("node:fs/promises", async (importOriginal) => {
  const mod = await importOriginal<typeof import("node:fs/promises")>()
  return { ...mod, mkdtemp: vi.fn(mod.mkdtemp) }
})

vi.mock("./raw-import-commit", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./raw-import-commit")>()
  return { ...mod, commitRawImport: vi.fn(mod.commitRawImport) }
})

vi.mock("./cancel-removed-jobs-partners", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./cancel-removed-jobs-partners")>()
  return { ...mod, cancelRemovedJobsPartners: vi.fn(mod.cancelRemovedJobsPartners) }
})

const PASS_ORIGIN = "https://www.pass.fonction-publique.gouv.fr"
const PASS_PATH = "/flux/offres"
const PASS = JOBPARTNERS_LABEL.PASS

const original = fs.readFileSync("server/src/jobs/offre-partenaire/pass/import-pass.test.input.rss", "utf8")
const sameSizeVariant = original.replace("financements H/F", "financements F/H")
const longerVariant = original.replace("financements H/F", "financements H/F (bis)")

const contentLength = (body: string) => String(Buffer.byteLength(body))
const serveHead = (headers: Record<string, string>) => nock(PASS_ORIGIN).head(PASS_PATH).reply(200, undefined, headers)
const serveGet = (body: string, headers: Record<string, string> = {}) =>
  nock(PASS_ORIGIN)
    .get(PASS_PATH)
    .reply(200, body, { "content-length": contentLength(body), ...headers })

const getSignal = () => getDbCollection("jobs_partners_flux_signals").findOne({ partner_label: PASS })

const snapshotPartnerState = async () => ({
  raw: await getDbCollection("raw_pass").find({}).sort({ _id: 1 }).toArray(),
  computed: await getDbCollection("computed_jobs_partners").find({ partner_label: PASS }).sort({ _id: 1 }).toArray(),
  jobsPartners: await getDbCollection("jobs_partners").find({ partner_label: PASS }).sort({ _id: 1 }).toArray(),
})

// rawToComputedJobsPartners distingue le lot en cours du précédent par created_at : deux runs ne partagent jamais la même date
const runPass = (options?: Parameters<typeof processPass>[0]) => {
  vi.setSystemTime(Date.now() + 60_000)
  return processPass(options)
}

const importNightly = async (body: string, headers: Record<string, string> = {}) => {
  serveGet(body, headers)
  const result = await runPass()
  expect(isFluxSkipped(result)).toBe(false)
  return result
}

describe("importFluxIfChanged", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2024-07-21T04:49:06.000+02:00"))
    nock.cleanAll()
    vi.mocked(cancelRemovedJobsPartners).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    nock.cleanAll()
  })

  describe("faux positifs : un validateur inchangé ne prouve pas un contenu inchangé", () => {
    it("traite un flux dont le contenu change sous un ETag constant (taille différente)", async () => {
      await importNightly(original, { etag: '"constant"' })

      serveHead({ etag: '"constant"', "content-length": contentLength(longerVariant) })
      serveGet(longerVariant, { etag: '"constant"' })
      const result = await runPass({ skipIfUnchanged: true })

      expect(isFluxSkipped(result)).toBe(false)
      expect(nock.isDone()).toBe(true)
      expect(JSON.stringify(await getDbCollection("raw_pass").find({}).toArray())).toContain("(bis)")
      expect((await getSignal())?.checks?.at(-1)).toMatchObject({ changed: true, skipped: false })
    })

    it("traite un flux dont le contenu change sous un ETag constant quand la source n'annonce pas de taille", async () => {
      await importNightly(original, { etag: '"constant"' })

      serveHead({ etag: '"constant"' })
      serveGet(sameSizeVariant, { etag: '"constant"' })
      const result = await runPass({ skipIfUnchanged: true })

      expect(isFluxSkipped(result)).toBe(false)
      expect(JSON.stringify(await getDbCollection("raw_pass").find({}).toArray())).toContain("F/H")
    })

    it("cesse de croire des validateurs constants dès qu'un changement de contenu est observé sous eux", async () => {
      const validators = { etag: '"constant"', "last-modified": "Sun, 21 Jul 2024 00:00:00 GMT" }
      await importNightly(original, validators)
      // le run de nuit télécharge toujours : il voit le contenu changé sous des validateurs identiques
      await importNightly(sameSizeVariant, validators)
      expect((await getSignal())?.validators_unreliable_at).toBeInstanceOf(Date)

      const head = serveHead({ ...validators, "content-length": contentLength(original) })
      const get = serveGet(original, validators)
      const result = await runPass({ skipIfUnchanged: true })

      expect(isFluxSkipped(result)).toBe(false)
      expect(head.isDone()).toBe(false)
      expect(get.isDone()).toBe(true)
    })
  })

  describe("flux inchangé", () => {
    it("ne modifie ni le raw, ni le computed, ni le statut des offres jobs_partners quand les validateurs sont identiques", async () => {
      const validators = { etag: '"v1"', "last-modified": "Sun, 21 Jul 2024 00:00:00 GMT" }
      await importNightly(original, validators)
      const computed = await getDbCollection("computed_jobs_partners").find({ partner_label: PASS }).toArray()
      for (const { partner_job_id } of computed) {
        await createJobPartner({ partner_label: PASS, partner_job_id, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      }
      await createJobPartner({ partner_label: PASS, partner_job_id: "absente-du-flux", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      const before = await snapshotPartnerState()
      vi.mocked(commitRawImport).mockClear()

      serveHead({ ...validators, "content-length": contentLength(original) })
      const result = await runPass({ skipIfUnchanged: true })

      expect(result).toEqual({ skipped: true, reason: "validateurs inchangés" })
      expect(commitRawImport).not.toHaveBeenCalled()
      expect(nock.isDone()).toBe(true)
      expect(await snapshotPartnerState()).toEqual(before)
      expect((await getSignal())?.checks?.at(-1)).toMatchObject({ changed: false, skipped: true })
    })

    it("télécharge mais ne retraite pas un flux sans validateurs dont le contenu est identique", async () => {
      await importNightly(original)
      expect(commitRawImport).toHaveBeenCalled()
      const before = await snapshotPartnerState()
      vi.mocked(commitRawImport).mockClear()

      serveHead({})
      serveGet(original)
      const result = await runPass({ skipIfUnchanged: true })

      expect(result).toEqual({ skipped: true, reason: "contenu identique" })
      expect(commitRawImport).not.toHaveBeenCalled()
      expect(nock.isDone()).toBe(true)
      expect(await snapshotPartnerState()).toEqual(before)
    })

    it("n'exécute pas cancelRemovedJobsPartners, même quand des computed validés ont été supprimés après import", async () => {
      await importNightly(original)
      const computed = await getDbCollection("computed_jobs_partners").find({ partner_label: PASS }).toArray()
      for (const { partner_job_id } of computed) {
        await createJobPartner({ partner_label: PASS, partner_job_id, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      }
      // ce que fait processJobPartnersWithFilter après import des computed validés
      await getDbCollection("computed_jobs_partners").deleteMany({ partner_label: PASS })

      serveHead({})
      serveGet(original)
      const result = await runPass({ skipIfUnchanged: true })

      expect(isFluxSkipped(result)).toBe(true)
      expect(cancelRemovedJobsPartners).not.toHaveBeenCalled()
      expect(await getDbCollection("jobs_partners").countDocuments({ partner_label: PASS, offer_status: JOB_STATUS_ENGLISH.ACTIVE })).toBe(computed.length)

      // le piège est réel : une annulation sans garde-fou (forceCancelRemovedJobsPartners) annulerait toutes ses offres
      await cancelRemovedJobsPartners({ partner_label: PASS }, { removalGuard: false })
      expect(await getDbCollection("jobs_partners").countDocuments({ partner_label: PASS, offer_status: JOB_STATUS_ENGLISH.ANNULEE })).toBe(computed.length)
    })

    it("retraite si la collection raw a été vidée depuis le dernier import", async () => {
      const validators = { etag: '"v1"', "last-modified": "Sun, 21 Jul 2024 00:00:00 GMT" }
      await importNightly(original, validators)
      await getDbCollection("raw_pass").deleteMany({})

      serveGet(original, validators)
      const result = await runPass({ skipIfUnchanged: true })

      expect(isFluxSkipped(result)).toBe(false)
      expect(await getDbCollection("raw_pass").countDocuments({})).toBe(7)
    })

    it("ne saute pas le premier run, faute de signal connu", async () => {
      serveGet(original, { etag: '"v1"' })
      const result = await runPass({ skipIfUnchanged: true })

      expect(isFluxSkipped(result)).toBe(false)
      expect(await getSignal()).toMatchObject({ etag: '"v1"', offer_count: 7, size: Buffer.byteLength(original) })
    })
  })

  it("télécharge et traite le flux quand le HEAD ne répond jamais", async () => {
    const validators = { etag: '"v1"', "last-modified": "Sun, 21 Jul 2024 00:00:00 GMT" }
    await importNightly(original, validators)

    nock(PASS_ORIGIN)
      .head(PASS_PATH)
      .delay(60_000)
      .reply(200, undefined, { ...validators, "content-length": contentLength(original) })
    serveGet(longerVariant, validators)
    vi.setSystemTime(Date.now() + 60_000)
    const result = await importFluxIfChanged({
      fluxes: [{ ...passFlux, source: httpFluxSource(`${PASS_ORIGIN}${PASS_PATH}`, { probeTimeoutMs: 200 }) }],
      skipIfUnchanged: true,
      process: async ([stream]) => ({ raw: await importPassRaw(stream), computed: await importPassToComputed() }),
    })

    expect(isFluxSkipped(result)).toBe(false)
    expect(JSON.stringify(await getDbCollection("raw_pass").find({}).toArray())).toContain("(bis)")
  }, 3_000)

  describe("run de nuit", () => {
    it("reconstruit raw et computed même si le signal est inchangé, sans interroger les validateurs", async () => {
      const validators = { etag: '"v1"', "last-modified": "Sun, 21 Jul 2024 00:00:00 GMT" }
      await importNightly(original, validators)
      const before = await snapshotPartnerState()

      await importNightly(original, validators)
      const after = await snapshotPartnerState()

      expect(nock.isDone()).toBe(true)
      expect(after.raw.map(({ _id }) => _id)).not.toEqual(before.raw.map(({ _id }) => _id))
      // rawToComputedJobsPartners remplace chaque computed en place : l'_id reste, la date d'import change
      expect(new Set(after.computed.map(({ updated_at }) => updated_at?.getTime())).size).toBe(1)
      expect(after.computed[0].updated_at?.getTime()).toBeGreaterThan(before.computed[0].updated_at?.getTime() ?? Number.POSITIVE_INFINITY)
      expect(after.computed).toHaveLength(7)
      expect((await getSignal())?.checks?.at(-1)).toMatchObject({ changed: false, skipped: false })
    })

    it("traite le flux au fil du téléchargement, sans fichier temporaire, et enregistre le même sha256 qu'un run de journée", async () => {
      vi.mocked(mkdtemp).mockClear()
      await importNightly(original, { etag: '"v1"' })

      expect(mkdtemp).not.toHaveBeenCalled()
      const nightlySignal = await getSignal()
      expect(nightlySignal).toMatchObject({ etag: '"v1"', size: Buffer.byteLength(original), offer_count: 7 })

      serveHead({})
      serveGet(original)
      await expect(runPass({ skipIfUnchanged: true })).resolves.toEqual({ skipped: true, reason: "contenu identique" })
      expect(mkdtemp).toHaveBeenCalledOnce()
      expect((await getSignal())?.sha256).toBe(nightlySignal?.sha256)
    })

    it("ne démarre le téléchargement d'un flux groupé qu'au moment où process le lit", async () => {
      const events: string[] = []
      const source = (label: string): FluxDefinition["source"] => ({
        download: async () => {
          events.push(`download ${label}`)
          return { stream: Readable.from([label]), validators: { etag: null, last_modified: null, content_length: null } }
        },
      })
      await importFluxIfChanged({
        fluxes: [
          { partnerLabel: JOBPARTNERS_LABEL.HELLOWORK, rawCollection: "raw_hellowork", source: source("a") },
          { partnerLabel: JOBPARTNERS_LABEL.HELLOWORK_BUDDI, rawCollection: "raw_hellowork_buddi", source: source("b") },
        ],
        skipIfUnchanged: false,
        process: async ([first, second]) => {
          events.push(`read ${await text(first)}`)
          events.push(`read ${await text(second)}`)
        },
      })

      expect(events).toEqual(["download a", "read a", "download b", "read b"])
    })
  })

  it("n'enregistre pas le signal quand le traitement échoue, pour retenter au run suivant", async () => {
    await importNightly(original)
    const before = await getSignal()

    serveGet("<rss><channel></channel></rss>")
    await expect(runPass({ skipIfUnchanged: true })).rejects.toThrow()

    expect(await getSignal()).toEqual(before)
  })
})

describe("importFluxIfChanged (flux traités ensemble)", () => {
  useMongo()

  const NO_VALIDATORS: FluxValidators = { etag: null, last_modified: null, content_length: null }
  const contents: Record<string, string> = {}
  const flux = (partnerLabel: JOBPARTNERS_LABEL, rawCollection: "raw_hellowork" | "raw_hellowork_buddi"): FluxDefinition => ({
    partnerLabel,
    rawCollection,
    source: { download: async () => ({ stream: Readable.from([contents[partnerLabel]]), validators: NO_VALIDATORS }) },
  })
  const fluxes = [flux(JOBPARTNERS_LABEL.HELLOWORK, "raw_hellowork"), flux(JOBPARTNERS_LABEL.HELLOWORK_BUDDI, "raw_hellowork_buddi")]

  const run = (skipIfUnchanged: boolean) =>
    importFluxIfChanged({
      fluxes,
      skipIfUnchanged,
      process: async (streams) => {
        const [hellowork, buddi] = await Promise.all(streams.map((stream) => text(stream)))
        await getDbCollection("raw_hellowork").deleteMany({})
        await getDbCollection("raw_hellowork").insertOne({ _id: new ObjectId(), createdAt: new Date(), content: hellowork })
        await getDbCollection("raw_hellowork_buddi").deleteMany({})
        await getDbCollection("raw_hellowork_buddi").insertOne({ _id: new ObjectId(), createdAt: new Date(), content: buddi })
        return { processed: [hellowork, buddi] }
      },
    })

  it("retraite tous les flux du groupe quand un seul a changé, et saute quand aucun n'a changé", async () => {
    contents[JOBPARTNERS_LABEL.HELLOWORK] = "hellowork-1"
    contents[JOBPARTNERS_LABEL.HELLOWORK_BUDDI] = "buddi-1"
    await run(false)

    await expect(run(true)).resolves.toEqual({ skipped: true, reason: "contenu identique" })

    contents[JOBPARTNERS_LABEL.HELLOWORK_BUDDI] = "buddi-2"
    await expect(run(true)).resolves.toEqual({ processed: ["hellowork-1", "buddi-2"] })

    const signals = await getDbCollection("jobs_partners_flux_signals").find({}).toArray()
    expect(signals.map(({ partner_label, checks }) => [partner_label, checks?.at(-1)?.changed])).toEqual(
      expect.arrayContaining([
        [JOBPARTNERS_LABEL.HELLOWORK, false],
        [JOBPARTNERS_LABEL.HELLOWORK_BUDDI, true],
      ])
    )
  })
})
