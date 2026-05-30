import { describe, expect, it } from "vitest"

import { xmlToJson } from "./importFromStreamInXml"

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
