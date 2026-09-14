import { gzipSync } from "node:zlib"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importFromUrlInXml } from "./import-from-url-in-xml"

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

  it("should import a plain xml flux", async () => {
    nock("https://flux.test").get("/offres").reply(200, xml, {
      "content-type": "application/octet-stream",
      "content-disposition": "attachment; filename=flux.xml",
    })

    await expect(importFromTestUrl()).resolves.toEqual({ offerInsertCount: 2, offerErrorCount: 0 })
    expect(await getDbCollection("raw_hellowork").countDocuments({})).toBe(2)
    expect(nock.isDone()).toBe(true)
  })

  // le flux Hellowork sur download.holeest.com : xml compressé en transport, axios décompresse
  it("should import a flux compressed with content-encoding gzip", async () => {
    nock("https://flux.test")
      .get("/offres")
      .reply(200, gzipSync(Buffer.from(xml)), {
        "content-type": "application/xml",
        "content-encoding": "gzip",
        "content-disposition": 'attachment; filename="bonnealternance.xml"',
      })

    await expect(importFromTestUrl()).resolves.toEqual({ offerInsertCount: 2, offerErrorCount: 0 })
    expect(await getDbCollection("raw_hellowork").countDocuments({})).toBe(2)
    expect(nock.isDone()).toBe(true)
  })

  // sans cet en-tête le flux Hellowork répond 406 « This feed is gzip-compressed »
  it("should announce gzip support in the request headers", async () => {
    nock("https://flux.test", { reqheaders: { "accept-encoding": /gzip/ } })
      .get("/offres")
      .reply(200, xml, { "content-type": "application/xml" })

    await expect(importFromTestUrl()).resolves.toEqual({ offerInsertCount: 2, offerErrorCount: 0 })
    expect(nock.isDone()).toBe(true)
  })
})
