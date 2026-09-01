import { Readable } from "node:stream"
import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import { gunzipIfNeeded, isGzipPayload } from "./import-from-url-in-xml"

const readAll = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString()
}

describe("isGzipPayload", () => {
  it.each([
    // headers réellement renvoyés par le nouveau flux Hellowork
    { "content-type": "application/gzip", "content-disposition": 'attachment; filename="bonnealternance.xml.gz"' },
    { "content-type": "application/x-gzip" },
    { "content-type": "application/octet-stream", "content-disposition": "attachment; filename=flux.xml.gz" },
  ])("should detect a gzip payload from %j", (headers) => {
    expect(isGzipPayload(headers)).toBe(true)
  })

  it.each([
    // headers réellement renvoyés par l'ancien flux Hellowork
    { "content-type": "application/octet-stream", "content-disposition": "attachment; filename=partnerbonnealternance_hellowork.xml" },
    { "content-type": "text/xml; charset=utf-8" },
    // content-encoding est déjà pris en charge par axios : y toucher décompresserait deux fois
    { "content-type": "text/xml", "content-encoding": "gzip" },
    // un nom de fichier qui contient .gz sans être une extension ne doit pas déclencher la décompression
    { "content-type": "application/octet-stream", "content-disposition": "attachment; filename=flux.gzip-archive.xml" },
    {},
  ])("should not detect a gzip payload from %j", (headers) => {
    expect(isGzipPayload(headers)).toBe(false)
  })
})

describe("gunzipIfNeeded", () => {
  const xml = "<root><job><job_id>1</job_id></job></root>"

  it("should decompress a gzip payload", async () => {
    const stream = Readable.from([gzipSync(Buffer.from(xml))])
    expect(await readAll(gunzipIfNeeded(stream, { "content-type": "application/gzip" }))).toBe(xml)
  })

  it("should leave a plain payload untouched", async () => {
    const stream = Readable.from([Buffer.from(xml)])
    expect(await readAll(gunzipIfNeeded(stream, { "content-type": "application/octet-stream" }))).toBe(xml)
  })

  it("should propagate an error raised by the source stream", async () => {
    const source = new Readable({
      read() {
        this.destroy(new Error("connexion interrompue"))
      },
    })
    await expect(readAll(gunzipIfNeeded(source, { "content-type": "application/gzip" }))).rejects.toThrow("connexion interrompue")
  })
})
