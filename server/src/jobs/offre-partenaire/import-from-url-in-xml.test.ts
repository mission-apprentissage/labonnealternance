import { PassThrough, pipeline, Readable } from "node:stream"
import { brotliCompressSync, gzipSync } from "node:zlib"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { gunzipIfNeeded, importFromUrlInXml } from "./import-from-url-in-xml"

const readAll = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString()
}

describe("gunzipIfNeeded", () => {
  const xml = "<root><job><job_id>1</job_id></job></root>"

  it("should decompress a gzip payload", async () => {
    const { stream, isGzip } = await gunzipIfNeeded(Readable.from([gzipSync(Buffer.from(xml))]))
    expect(isGzip).toBe(true)
    expect(await readAll(stream)).toBe(xml)
  })

  it("should leave a plain payload untouched", async () => {
    const { stream, isGzip } = await gunzipIfNeeded(Readable.from([Buffer.from(xml)]))
    expect(isGzip).toBe(false)
    expect(await readAll(stream)).toBe(xml)
  })

  // le magic gzip fait 2 octets : un flux découpé plus finement ne doit pas être pris pour du xml
  it("should detect gzip even when the first chunk is a single byte", async () => {
    const gz = gzipSync(Buffer.from(xml))
    const chunks = [gz.subarray(0, 1), gz.subarray(1, 2), gz.subarray(2)]
    const { stream, isGzip } = await gunzipIfNeeded(Readable.from(chunks))
    expect(isGzip).toBe(true)
    expect(await readAll(stream)).toBe(xml)
  })

  it("should handle an empty stream without decompressing", async () => {
    const { stream, isGzip } = await gunzipIfNeeded(Readable.from([]))
    expect(isGzip).toBe(false)
    expect(await readAll(stream)).toBe("")
  })

  // un flux d'un seul octet ne peut pas être du gzip et ne doit pas bloquer sur le peek
  it("should handle a stream shorter than the gzip magic", async () => {
    const { stream, isGzip } = await gunzipIfNeeded(Readable.from([Buffer.from("<")]))
    expect(isGzip).toBe(false)
    expect(await readAll(stream)).toBe("<")
  })

  it("should propagate an error raised by the source stream before the peek", async () => {
    const source = new Readable({
      read() {
        this.destroy(new Error("connexion interrompue"))
      },
    })
    await expect(gunzipIfNeeded(source)).rejects.toThrow("connexion interrompue")
  })

  it("should propagate an error raised by the source stream after the peek", async () => {
    const gz = gzipSync(Buffer.from(xml))
    let sent = false
    const source = new Readable({
      read() {
        if (sent) return this.destroy(new Error("connexion interrompue"))
        sent = true
        this.push(gz.subarray(0, 10))
      },
    })
    const { stream, isGzip } = await gunzipIfNeeded(source)
    expect(isGzip).toBe(true)
    await expect(readAll(stream)).rejects.toThrow("connexion interrompue")
  })

  it("should reject a truncated gzip payload instead of yielding partial xml", async () => {
    const gz = gzipSync(Buffer.from(xml))
    const { stream } = await gunzipIfNeeded(Readable.from([gz.subarray(0, gz.length - 5)]))
    await expect(readAll(stream)).rejects.toThrow()
  })

  it("should reject a payload whose decompressed size exceeds the limit", async () => {
    // 1 Mo de zéros compresse très bien : ratio suffisant pour dépasser une borne de 1 ko
    const bomb = gzipSync(Buffer.alloc(1024 * 1024, 0))
    const { stream, isGzip } = await gunzipIfNeeded(Readable.from([bomb]), 1024)
    expect(isGzip).toBe(true)
    await expect(readAll(stream)).rejects.toThrow()
  })

  it("should not reject a payload that stays under the limit", async () => {
    const { stream } = await gunzipIfNeeded(Readable.from([gzipSync(Buffer.from(xml))]), 1024)
    expect(await readAll(stream)).toBe(xml)
  })

  /**
   * importFromStreamInXml fait son propre pipeline() sur le flux rendu. Comme celui-ci n'est
   * pas la source http, la destruction doit remonter jusqu'à elle : sinon un parsing en échec
   * laisse la socket ouverte jusqu'au timeout réseau, sur tous les flux xml.
   */
  describe("when the downstream pipeline fails", () => {
    // une source qui ne se termine pas d'elle-même, comme une socket http encore ouverte
    const endlessSource = (prefix: Buffer) => {
      let first = true
      return new Readable({
        read() {
          if (first) {
            first = false
            return this.push(prefix)
          }
          this.push(Buffer.alloc(1024, 0x20))
        },
      })
    }

    const consumeAndFail = (stream: Readable) =>
      new Promise<void>((resolve) => {
        const failing = new PassThrough({
          transform(_chunk, _encoding, callback) {
            callback(new Error("parse xml en échec"))
          },
        })
        pipeline(stream, failing, () => resolve())
      })

    it.each([
      { name: "a plain xml flux", prefix: Buffer.from(xml) },
      { name: "a gzip flux", prefix: gzipSync(Buffer.from(xml)) },
    ])("should destroy the source of $name", async ({ prefix }) => {
      const source = endlessSource(prefix)
      const { stream } = await gunzipIfNeeded(source)
      await consumeAndFail(stream)
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(source.destroyed).toBe(true)
    })
  })
})

describe("importFromUrlInXml", () => {
  useMongo()

  const xml = '<?xml version="1.0" encoding="UTF-8"?><root><job><job_id><![CDATA[a]]></job_id></job><job><job_id><![CDATA[b]]></job_id></job></root>'

  const importFromTestUrl = () =>
    importFromUrlInXml({
      url: "https://flux.test/offres",
      destinationCollection: "raw_hellowork",
      offerXmlTag: "job",
      partnerLabel: "test",
      conflictingOpeningTagWithoutAttributes: true,
    })

  beforeEach(() => {
    nock.cleanAll()
    return async () => {
      nock.cleanAll()
      await getDbCollection("raw_hellowork").deleteMany({})
    }
  })

  /**
   * La décompression se décide sur les octets du flux, pas sur les headers : axios
   * décompresse un `content-encoding` connu puis supprime le header, et un partenaire
   * peut servir un `.gz` sous n'importe quel `content-type`. Chaque combinaison
   * ci-dessous doit aboutir au même xml parsé.
   */
  const cases: { name: string; body: () => Buffer | string; headers: Record<string, string> }[] = [
    {
      name: "un fichier .gz sans content-encoding (flux Hellowork sur download.holeest.com)",
      body: () => gzipSync(Buffer.from(xml)),
      headers: { "content-type": "application/gzip", "content-disposition": 'attachment; filename="bonnealternance.xml.gz"' },
    },
    {
      name: "un fichier .gz annoncé en plus par content-encoding: gzip",
      body: () => gzipSync(Buffer.from(xml)),
      headers: { "content-type": "application/gzip", "content-disposition": 'attachment; filename="bonnealternance.xml.gz"', "content-encoding": "gzip" },
    },
    {
      name: "un fichier .gz servi sous un content-type générique",
      body: () => gzipSync(Buffer.from(xml)),
      headers: { "content-type": "application/octet-stream" },
    },
    {
      name: "du xml brut (ancien flux Hellowork)",
      body: () => xml,
      headers: { "content-type": "application/octet-stream", "content-disposition": "attachment; filename=partnerbonnealternance_hellowork.xml" },
    },
    {
      name: "du xml brut compressé en transport par content-encoding: gzip",
      body: () => gzipSync(Buffer.from(xml)),
      headers: { "content-type": "application/xml", "content-encoding": "gzip" },
    },
    {
      name: "du xml brut compressé en transport par content-encoding: br",
      body: () => brotliCompressSync(Buffer.from(xml)),
      headers: { "content-type": "application/xml", "content-encoding": "br" },
    },
  ]

  it.each(cases)("should import $name", async ({ body, headers }) => {
    nock("https://flux.test").get("/offres").reply(200, body(), headers)

    await expect(importFromTestUrl()).resolves.toEqual({ offerInsertCount: 2, offerErrorCount: 0 })
    expect(await getDbCollection("raw_hellowork").countDocuments({})).toBe(2)
    expect(nock.isDone()).toBe(true)
  })
})
