import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { ZReferentielRome, zFormationCatalogueSchema } from "shared/models/index"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { z } from "zod"

import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"

import { BoundedTtlCache, normalizeRncpCode, resetPartnerSearchLinkCaches, resolvePartnerSearchLink } from "./partner-search-link.service"

useMongo()

const saveFormation = (data: Partial<z.input<typeof zFormationCatalogueSchema>>) =>
  saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), data)

const saveRome = (code_rome: string, intitule: string) =>
  saveDbEntity(ZReferentielRome, (item) => getDbCollection("referentielromes").insertOne(item), {
    rome: { code_rome, intitule, code_ogr: code_rome },
  })

const [parisLongitude, parisLatitude] = parisFixture.centre.coordinates

beforeEach(() => resetPartnerSearchLinkCaches())
afterEach(() => vi.restoreAllMocks())

describe("normalizeRncpCode", () => {
  it.each([
    ["RNCP37873", "RNCP37873"],
    ["rncp37873", "RNCP37873"],
    ["37873", "RNCP37873"],
    [" RNCP37873 ", "RNCP37873"],
  ])("normalise %j en %s", (input, expected) => {
    expect(normalizeRncpCode(input)).toBe(expected)
  })

  it.each(["", "RNCP", "RNCP 37873", "RNCP-37873", "abc", "RNCP1", "RNCP123456", "RNCP37873;drop", "RNCP37873/../x", "RS5678"])("rejette %j", (input) => {
    expect(normalizeRncpCode(input)).toBeNull()
  })
})

describe("BoundedTtlCache", () => {
  it("évince l'entrée la moins récemment lue au-delà de la borne", () => {
    const cache = new BoundedTtlCache<number>(2, 60_000)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.get("a")
    cache.set("c", 3)

    expect(cache.size).toBe(2)
    expect(cache.get("b")).toBeUndefined()
    expect(cache.get("a")).toBe(1)
    expect(cache.get("c")).toBe(3)
  })

  it("n'est plus servie après expiration", () => {
    vi.useFakeTimers()
    try {
      const cache = new BoundedTtlCache<number>(10, 1000)
      cache.set("a", 1)
      vi.advanceTimersByTime(1001)
      expect(cache.get("a")).toBeUndefined()
      expect(cache.size).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("resolvePartnerSearchLink", () => {
  it("renvoie le libellé ROME le plus fréquent parmi les formations du RNCP", async () => {
    await saveRome("M1805", "Études et développement informatique")
    await saveRome("M1802", "Expertise et support en systèmes d'information")
    await saveFormation({ cle_ministere_educatif: "CLE1", rncp_code: "RNCP37873", intitule_long: "Master informatique", rome_codes: ["M1802", "M1805"] })
    await saveFormation({ cle_ministere_educatif: "CLE2", rncp_code: "RNCP37873", intitule_long: "Master informatique", rome_codes: ["M1805"] })

    expect(await resolvePartnerSearchLink({ partner: "monmaster", code: "rncp37873" })).toEqual({ q: "Études et développement informatique", lieu_label: null })
  })

  it("à fréquence égale, garde l'ordre du catalogue (1er ROME de la 1re formation)", async () => {
    await saveRome("M1805", "Études et développement informatique")
    await saveRome("M1802", "Expertise et support en systèmes d'information")
    await saveFormation({ cle_ministere_educatif: "CLE_B", rncp_code: "RNCP37873", rome_codes: ["M1805"] })
    await saveFormation({ cle_ministere_educatif: "CLE_A", rncp_code: "RNCP37873", rome_codes: ["M1802"] })

    expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873" })).q).toBe("Expertise et support en systèmes d'information")
  })

  it("ignore un code ROME sans libellé et prend le suivant", async () => {
    await saveRome("M1805", "Études et développement informatique")
    await saveFormation({ cle_ministere_educatif: "CLE1", rncp_code: "RNCP37873", rome_codes: ["Z9999", "Z9999", "M1805"] })

    expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873" })).q).toBe("Études et développement informatique")
  })

  it("se replie sur l'intitulé de formation quand aucun ROME n'a de libellé", async () => {
    await saveFormation({ cle_ministere_educatif: "CLE1", rncp_code: "RNCP37873", intitule_long: "Master droit des affaires", rome_codes: ["Z9999"] })

    expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873" })).q).toBe("Master droit des affaires")
  })

  it("écarte un intitulé plus long que la borne de q de /v1/search", async () => {
    await saveFormation({ cle_ministere_educatif: "CLE1", rncp_code: "RNCP37873", intitule_long: "x".repeat(201), rome_codes: [] })
    await saveFormation({ cle_ministere_educatif: "CLE2", rncp_code: "RNCP37873", intitule_long: "Master droit", rome_codes: [] })

    expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873" })).q).toBe("Master droit")
  })

  it("renvoie q null pour un RNCP absent du catalogue", async () => {
    await saveFormation({ cle_ministere_educatif: "CLE1", rncp_code: "RNCP11111", intitule_long: "Autre", rome_codes: [] })

    expect(await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873" })).toEqual({ q: null, lieu_label: null })
  })

  it("n'interroge pas le catalogue pour un code invalide", async () => {
    const spy = vi.spyOn(mongodbUtils, "getDbCollection")

    expect(await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873;drop" })).toEqual({ q: null, lieu_label: null })
    expect(spy).not.toHaveBeenCalled()
  })

  it("sert un second appel depuis le cache, résultat négatif compris", async () => {
    await saveRome("M1805", "Études et développement informatique")
    await saveFormation({ cle_ministere_educatif: "CLE1", rncp_code: "RNCP37873", rome_codes: ["M1805"] })
    await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873" })
    await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP99999" })

    const spy = vi.spyOn(mongodbUtils, "getDbCollection")
    expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "37873" })).q).toBe("Études et développement informatique")
    expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP99999" })).q).toBeNull()
    expect(spy).not.toHaveBeenCalledWith("formationcatalogues")
  })

  describe("lieu_label", () => {
    beforeEach(async () => {
      await getDbCollection("referentiel.communes").insertOne({ _id: new ObjectId(), ...parisFixture })
    })

    it("nomme la commune la plus proche du point", async () => {
      const { lieu_label } = await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873", latitude: parisLatitude + 0.01, longitude: parisLongitude })
      expect(lieu_label).toBe(parisFixture.nom)
    })

    it("est résolu même quand le code est invalide", async () => {
      const { lieu_label } = await resolvePartnerSearchLink({ partner: "monmaster", code: "abc", latitude: parisLatitude, longitude: parisLongitude })
      expect(lieu_label).toBe(parisFixture.nom)
    })

    it("n'est pas posé avec une latitude sans longitude", async () => {
      expect((await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873", latitude: parisLatitude })).lieu_label).toBeNull()
    })

    it("ne nomme pas une commune à plus de 20 km du point", async () => {
      // ~1° de latitude ≈ 111 km au nord de Paris.
      const { lieu_label } = await resolvePartnerSearchLink({ partner: "monmaster", code: "RNCP37873", latitude: parisLatitude + 1, longitude: parisLongitude })
      expect(lieu_label).toBeNull()
    })
  })
})
