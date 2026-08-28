import type { Transform } from "node:stream"
import { describe, expect, it } from "vitest"
import { ndjsonToObjectStream } from "./stream-utils"

const collect = (transform: Transform): Promise<unknown[]> =>
  new Promise((resolve, reject) => {
    const results: unknown[] = []
    transform.on("data", (data) => results.push(data))
    transform.on("end", () => resolve(results))
    transform.on("error", reject)
  })

describe("ndjsonToObjectStream", () => {
  it("parse une ligne JSON par ligne (LF)", async () => {
    const errors: Array<{ err: unknown; line: string }> = []
    const stream = ndjsonToObjectStream((err, line) => errors.push({ err, line }))
    const resultsPromise = collect(stream)

    stream.end(Buffer.from('{"a":1}\n{"a":2}\n', "utf8"))

    expect(await resultsPromise).toEqual([{ a: 1 }, { a: 2 }])
    expect(errors).toHaveLength(0)
  })

  it("tolère les fins de ligne CRLF", async () => {
    const errors: Array<{ err: unknown; line: string }> = []
    const stream = ndjsonToObjectStream((err, line) => errors.push({ err, line }))
    const resultsPromise = collect(stream)

    stream.end(Buffer.from('{"a":1}\r\n{"a":2}\r\n', "utf8"))

    expect(await resultsPromise).toEqual([{ a: 1 }, { a: 2 }])
    expect(errors).toHaveLength(0)
  })

  it("traite la dernière ligne même sans \\n final (flush)", async () => {
    const errors: Array<{ err: unknown; line: string }> = []
    const stream = ndjsonToObjectStream((err, line) => errors.push({ err, line }))
    const resultsPromise = collect(stream)

    // Pas de \n après le second objet : ne doit pas être perdu, doit être émis au flush.
    stream.end(Buffer.from('{"a":1}\n{"a":2}', "utf8"))

    expect(await resultsPromise).toEqual([{ a: 1 }, { a: 2 }])
    expect(errors).toHaveLength(0)
  })

  it("ignore les lignes vides sans déclencher onParseError", async () => {
    const errors: Array<{ err: unknown; line: string }> = []
    const stream = ndjsonToObjectStream((err, line) => errors.push({ err, line }))
    const resultsPromise = collect(stream)

    stream.end(Buffer.from('{"a":1}\n\n\n{"a":2}\n', "utf8"))

    expect(await resultsPromise).toEqual([{ a: 1 }, { a: 2 }])
    expect(errors).toHaveLength(0)
  })

  it("appelle onParseError sur une ligne non-JSON sans interrompre le flux", async () => {
    const errors: Array<{ err: unknown; line: string }> = []
    const stream = ndjsonToObjectStream((err, line) => errors.push({ err, line }))
    const resultsPromise = collect(stream)

    stream.end(Buffer.from('{"a":1}\nceci n\'est pas du json\n{"a":2}\n', "utf8"))

    expect(await resultsPromise).toEqual([{ a: 1 }, { a: 2 }])
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe("ceci n'est pas du json")
    expect(errors[0].err).toBeInstanceOf(Error)
  })

  it("recolle un caractère UTF-8 multi-octets coupé entre deux chunks", async () => {
    const line = '{"nom":"Boulangerie Éclair"}\n'
    const fullBuffer = Buffer.from(line, "utf8")
    // "É" (U+00C9) est encodé sur 2 octets en UTF-8 : on coupe le buffer juste après le 1er de ces 2 octets,
    // pour reproduire une frontière de chunk réseau tombant au milieu du caractère.
    const eByteOffset = Buffer.byteLength(line.slice(0, line.indexOf("É")), "utf8")
    const chunk1 = fullBuffer.subarray(0, eByteOffset + 1)
    const chunk2 = fullBuffer.subarray(eByteOffset + 1)
    expect(chunk1.length + chunk2.length).toBe(fullBuffer.length)

    const errors: Array<{ err: unknown; line: string }> = []
    const stream = ndjsonToObjectStream((err, l) => errors.push({ err, line: l }))
    const resultsPromise = collect(stream)

    stream.write(chunk1)
    stream.write(chunk2)
    stream.end()

    expect(await resultsPromise).toEqual([{ nom: "Boulangerie Éclair" }])
    expect(errors).toHaveLength(0)
  })
})
