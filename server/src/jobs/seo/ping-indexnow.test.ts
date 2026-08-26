import fs from "fs"
import path from "path"
import { INDEXNOW_KEY } from "shared/constants/indexnow"
import { describe, expect, it } from "vitest"
import { __dirname } from "@/common/utils/dirname"
import { buildIndexNowPayloads } from "./ping-indexnow"

describe("clé IndexNow", () => {
  it("est servie par un fichier public dont le nom et le contenu correspondent à la constante", () => {
    // Le protocole exige que la clé soit servie en clair à https://<host>/<clé>.txt : une rotation
    // qui oublie l'un des deux côtés casserait silencieusement toutes les soumissions (403 Invalid key).
    const keyFilePath = path.join(__dirname(import.meta.url), "../../../../ui/public", `${INDEXNOW_KEY}.txt`)
    expect(fs.existsSync(keyFilePath), `fichier attendu : ui/public/${INDEXNOW_KEY}.txt`).toBe(true)
    expect(fs.readFileSync(keyFilePath, "utf8").trim()).toBe(INDEXNOW_KEY)
  })
})

describe("buildIndexNowPayloads", () => {
  const publicUrl = "https://labonnealternance.apprentissage.beta.gouv.fr"

  it("construit un payload conforme au protocole IndexNow", () => {
    const urls = ["https://labonnealternance.apprentissage.beta.gouv.fr/emploi/offres_emploi_lba/abc/dev-web"]
    const payloads = buildIndexNowPayloads(urls, publicUrl)

    expect(payloads).toEqual([
      {
        host: "labonnealternance.apprentissage.beta.gouv.fr",
        key: INDEXNOW_KEY,
        keyLocation: `${publicUrl}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      },
    ])
  })

  it("ne produit aucun payload sans URL", () => {
    expect(buildIndexNowPayloads([], publicUrl)).toEqual([])
  })

  it("découpe en lots de 10 000 URLs maximum", () => {
    const urls = Array.from({ length: 10_001 }, (_, i) => `${publicUrl}/emploi/offres_emploi_lba/${i}/offre`)
    const payloads = buildIndexNowPayloads(urls, publicUrl)

    expect(payloads).toHaveLength(2)
    expect(payloads[0].urlList).toHaveLength(10_000)
    expect(payloads[1].urlList).toEqual([urls[10_000]])
  })
})
