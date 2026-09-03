import { Readable } from "node:stream"
import { gzipSync } from "node:zlib"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importFromStreamInXml, xmlToJson } from "./import-from-stream-in-xml"

describe("xmlToJson", () => {
  it("should parse a simple XML string into JSON", async () => {
    const xml = `<item>
  <title>Stagiaire pour des missions d'administration publique à la sous-préfecture de Saint-Pierre</title>
  <link>https://rec-bo-pass.bercy.actimage.net/offre/stagiaire-pour-des-missions-dadministration-publique-la-sous-prefecture-de-saint-pierre</link>
  <description><![CDATA[<p>Missions dans les domaines de la sécurité publique, la sécurité civile, le logement, l'aménagement du territoire :</p><p>Rédaction de notes, courriers, participation aux réunions et visite de terrain...</p>]]></description>
  <author>Secrétariat Général Commun Départemental de la Réunion</author>
          <guid isPermaLink="false">a748d065-f509-4ed3-a082-dcee89d66883</guid>
          <pubDate>ven 22/08/2025 - 07:05
</pubDate>
          <source url="https://rec-bo-pass.bercy.actimage.net/flux/offres_stages">Flux rss sortant</source>
          <dc:publisher>Préfecture de La Réunion</dc:publisher>
          <dc:contributor>Ministère de l'Intérieur</dc:contributor>
          <dc:date>2025-11-26T12:54:11+01:00</dc:date>
          <dc:identifier>S-2025-184643</dc:identifier>
          <dc:coverage>SAINT PIERRE</dc:coverage>
          </item>
<item>`
    const result = await xmlToJson(xml, 0)
    expect.soft(result).toMatchSnapshot()
  })
})

const buildXml = (ids: string[]) => `<?xml version="1.0" encoding="UTF-8"?><root>${ids.map((id) => `<job><job_id><![CDATA[${id}]]></job_id></job>`).join("")}</root>`

const importXml = (xml: string | Buffer) =>
  importFromStreamInXml({
    stream: Readable.from([Buffer.from(xml)]),
    destinationCollection: "raw_hellowork",
    offerXmlTag: "job",
    importName: "test",
    conflictingOpeningTagWithoutAttributes: true,
  })

const readJobIds = async () => (await getDbCollection("raw_hellowork").find({}).toArray()).map((doc: any) => doc.job.job_id).sort()

describe("importFromStreamInXml", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      await getDbCollection("raw_hellowork").deleteMany({})
    }
  })

  it("should replace the previous data when the import succeeds", async () => {
    await getDbCollection("raw_hellowork").insertOne({ _id: new ObjectId(), createdAt: new Date("2020-01-01"), job: { job_id: "ancienne-offre" } } as any)

    await expect(importXml(buildXml(["a", "b"]))).resolves.toEqual({ offerInsertCount: 2, offerErrorCount: 0 })

    expect(await readJobIds()).toEqual(["a", "b"])
  })

  // le cas du 01/09/2026 : Hellowork sert un .gz que le parser ne sait pas lire, la collection ne doit pas être vidée pour autant
  it("should keep the previous data when the stream holds no readable offer", async () => {
    await getDbCollection("raw_hellowork").insertOne({ _id: new ObjectId(), createdAt: new Date("2020-01-01"), job: { job_id: "ancienne-offre" } } as any)

    await expect(importXml(gzipSync(Buffer.from(buildXml(["a", "b"]))))).rejects.toThrow("aucune offre importée")

    expect(await readJobIds()).toEqual(["ancienne-offre"])
  })

  it("should keep the previous data when the source stream fails mid-import", async () => {
    await getDbCollection("raw_hellowork").insertOne({ _id: new ObjectId(), createdAt: new Date("2020-01-01"), job: { job_id: "ancienne-offre" } } as any)

    const failing = new Readable({
      read() {
        this.push(Buffer.from(buildXml(["a"])))
        this.destroy(new Error("connexion interrompue"))
      },
    })
    await expect(
      importFromStreamInXml({ stream: failing, destinationCollection: "raw_hellowork", offerXmlTag: "job", importName: "test", conflictingOpeningTagWithoutAttributes: true })
    ).rejects.toThrow("connexion interrompue")

    expect(await readJobIds()).toEqual(["ancienne-offre"])
  })

  it("should fail on an empty collection too rather than reporting a successful import", async () => {
    await expect(importXml("<root></root>")).rejects.toThrow("aucune offre importée")
    expect(await readJobIds()).toEqual([])
  })
})
