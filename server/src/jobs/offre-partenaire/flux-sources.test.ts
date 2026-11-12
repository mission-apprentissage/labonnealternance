import { Readable } from "node:stream"
import { text } from "node:stream/consumers"
import { gzipSync } from "node:zlib"
import nock from "nock"
import { beforeEach, describe, expect, it } from "vitest"

import { HTTP_PROBE_TIMEOUT_MS, httpFluxSource, sftpFluxSource } from "./flux-sources"

describe("httpFluxSource", () => {
  const xml = '<?xml version="1.0" encoding="UTF-8"?><root><job><job_id>a</job_id></job></root>'
  const source = httpFluxSource("https://flux.test/offres")

  beforeEach(() => {
    nock.cleanAll()
    return () => nock.cleanAll()
  })

  it("lit etag, last-modified et content-length d'une requête HEAD", async () => {
    nock("https://flux.test").head("/offres").reply(200, undefined, {
      etag: '"abc"',
      "last-modified": "Sun, 01 Nov 2026 10:00:00 GMT",
      "content-length": "1234",
    })

    await expect(source.probe?.()).resolves.toEqual({ etag: '"abc"', last_modified: new Date("2026-11-01T10:00:00.000Z"), content_length: 1234 })
  })

  it("abandonne un HEAD sans réponse au bout du délai", async () => {
    nock("https://flux.test").head("/offres").delay(60_000).reply(200)

    await expect(httpFluxSource("https://flux.test/offres", { probeTimeoutMs: 100 }).probe?.()).rejects.toThrow(/timeout/i)
  }, 2_000)

  it("borne le HEAD à 30 s par défaut", () => {
    expect(HTTP_PROBE_TIMEOUT_MS).toBe(30_000)
  })

  it("renvoie des validateurs nuls quand la source n'en annonce pas ou qu'ils sont illisibles", async () => {
    nock("https://flux.test").head("/offres").reply(200, undefined, { "last-modified": "pas une date" })

    await expect(source.probe?.()).resolves.toEqual({ etag: null, last_modified: null, content_length: null })
  })

  // le flux Hellowork : xml compressé en transport, axios décompresse
  it("télécharge un flux compressé avec content-encoding gzip", async () => {
    const compressed = gzipSync(Buffer.from(xml))
    nock("https://flux.test")
      .get("/offres")
      .reply(200, compressed, { "content-type": "application/xml", "content-encoding": "gzip", "content-length": String(compressed.length), etag: '"gz"' })

    const { stream, validators } = await source.download()

    await expect(text(stream)).resolves.toBe(xml)
    expect(validators).toEqual({ etag: '"gz"', last_modified: null, content_length: compressed.length })
  })

  // sans cet en-tête le flux Hellowork répond 406 « This feed is gzip-compressed »
  it("annonce le support de gzip, au GET comme au HEAD", async () => {
    const scope = nock("https://flux.test", { reqheaders: { "accept-encoding": /gzip/ } })
      .head("/offres")
      .reply(200)
      .get("/offres")
      .reply(200, xml)

    await source.probe?.()
    await text((await source.download()).stream)

    expect(scope.isDone()).toBe(true)
  })
})

describe("sftpFluxSource", () => {
  const stats = { mtime: new Date("2026-11-01T03:00:00.000Z"), size: 42 }

  it("renvoie des validateurs nuls quand le stat du téléchargement a échoué", async () => {
    const source = sftpFluxSource({ stat: async () => stats, download: async () => ({ stream: Readable.from(["<feed/>"]), stats: { mtime: null, size: null } }) })

    await expect(source.download()).resolves.toMatchObject({ validators: { etag: null, last_modified: null, content_length: null } })
  })

  it("utilise la date de modification et la taille du fichier distant comme validateurs", async () => {
    const source = sftpFluxSource({ stat: async () => stats, download: async () => ({ stream: Readable.from(["<feed/>"]), stats }) })
    const expected = { etag: null, last_modified: stats.mtime, content_length: 42 }

    await expect(source.probe?.()).resolves.toEqual(expected)
    const { stream, validators } = await source.download()
    expect(validators).toEqual(expected)
    await expect(text(stream)).resolves.toBe("<feed/>")
  })
})
