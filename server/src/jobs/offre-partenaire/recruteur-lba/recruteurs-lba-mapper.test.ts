import { ObjectId } from "bson"
import type { IRecruteursLbaRaw } from "shared/models/raw-recruteurs-lba.model"
import { describe, expect, it } from "vitest"

import { getWorkplaceGeolocation, recruteursLbaToJobPartners } from "./recruteurs-lba-mapper"

/**
 * SIRENE livre les coordonnées dans la projection légale du territoire : Lambert 93 en
 * métropole, UTM 40 sud (RGR92) à La Réunion, etc. Le mapper choisit la projection d'après le
 * préfixe du code postal. Sans code postal, il retombait sur Lambert 93 quel que soit le
 * territoire : 7 établissements réunionnais sont ainsi apparus en mer du Nord au large de
 * Dundee (prod, 2026-09-11). Le code INSEE de la commune, toujours livré, porte le même
 * préfixe territorial : il sert de repli.
 */

// Saint-Denis de La Réunion en RGR92 / UTM 40S, obtenu par proj4 depuis [55.4504, -20.8823].
const SAINT_DENIS_REUNION_UTM40S = { x: 338811, y: 7690101 }
// Coordonnées Lambert 93 de la fixture process-recruteurs-lba.test.1.json (métropole).
const METROPOLE_LAMBERT93 = { x: 563785.301401543, y: 6980103.034818875 }
// Ce que donne la lecture correcte de ces coordonnées, en Lambert 93 : la référence métropole.
const METROPOLE_WGS84 = getWorkplaceGeolocation(METROPOLE_LAMBERT93.x, METROPOLE_LAMBERT93.y, "54460")!.coordinates

const raw = (overrides: Partial<IRecruteursLbaRaw>): IRecruteursLbaRaw => ({
  _id: new ObjectId(),
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  siret: "80841382700011",
  enseigne: "DRYSOFT",
  naf_code: "5510Z",
  naf_label: "Hôtels et hébergement similaire",
  activitePrincipaleEtablissement: "5510Z",
  labelActivitePrincipaleEtablissement: "Hôtels et hébergement similaire",
  raison_sociale: "ETABLISSEMENTS FRERES",
  street_number: null,
  street_name: null,
  insee_city_code: "54318",
  zip_code: "54460",
  email: null,
  phone: null,
  company_size: "1-2",
  libelleCommuneEtablissement: "LIVERDUN",
  coordonneeLambertAbscisseEtablissement: METROPOLE_LAMBERT93.x,
  coordonneeLambertOrdonneeEtablissement: METROPOLE_LAMBERT93.y,
  rome_codes: [{ rome_code: "G1703", normalized_score: 1 }],
  ...overrides,
})

const coords = (job: ReturnType<typeof recruteursLbaToJobPartners>) => job.workplace_geopoint?.coordinates

describe("getWorkplaceGeolocation", () => {
  it("sans code postal ni INSEE, la métropole reste le défaut", () => {
    const point = getWorkplaceGeolocation(METROPOLE_LAMBERT93.x, METROPOLE_LAMBERT93.y, null)
    expect(point?.coordinates).toEqual(METROPOLE_WGS84)
    // Garde-fou sur la référence elle-même : un point en France métropolitaine.
    expect(METROPOLE_WGS84[0]).toBeGreaterThan(-5.5)
    expect(METROPOLE_WGS84[0]).toBeLessThan(9.6)
    expect(METROPOLE_WGS84[1]).toBeGreaterThan(41)
    expect(METROPOLE_WGS84[1]).toBeLessThan(51.2)
  })

  it("coordonnées absentes ou nulles : pas de point plutôt qu'un point à l'origine", () => {
    expect(getWorkplaceGeolocation(null, 7690101, "97400")).toBeNull()
    expect(getWorkplaceGeolocation(0, 0, "97400")).toBeNull()
  })
})

describe("recruteursLbaToJobPartners : projection choisie sans code postal", () => {
  it("un établissement réunionnais sans code postal reste à La Réunion grâce au code INSEE", () => {
    const job = recruteursLbaToJobPartners(
      raw({
        siret: "12345678900011",
        zip_code: null,
        insee_city_code: "97411",
        libelleCommuneEtablissement: "SAINT-DENIS",
        coordonneeLambertAbscisseEtablissement: SAINT_DENIS_REUNION_UTM40S.x,
        coordonneeLambertOrdonneeEtablissement: SAINT_DENIS_REUNION_UTM40S.y,
      })
    )
    const [lon, lat] = coords(job)!
    // Lambert 93 appliqué à tort donnerait [-2.73, 56.14], en mer du Nord.
    expect(lon).toBeCloseTo(55.45, 1)
    expect(lat).toBeCloseTo(-20.88, 1)
  })

  it("le code postal garde la priorité sur l'INSEE quand les deux sont là", () => {
    const job = recruteursLbaToJobPartners(raw({ zip_code: "54460", insee_city_code: "97411" }))
    expect(coords(job)).toEqual(METROPOLE_WGS84)
  })

  it("métropole sans code postal : inchangé, Lambert 93", () => {
    const job = recruteursLbaToJobPartners(raw({ zip_code: null, insee_city_code: "54318" }))
    expect(coords(job)).toEqual(METROPOLE_WGS84)
  })
})
