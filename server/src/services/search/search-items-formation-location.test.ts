import { ObjectId } from "bson"
import { describe, expect, it } from "vitest"
import type { IFormationForSearchItem, SearchItemBuildContext } from "./search-items.service"
import { buildFormationSearchItem } from "./search-items.service"
import type { AdminCodeIndex } from "./search-items-admin-codes"
import { addCommune, emptyAdminCodeIndex, snapGeopointToCommune } from "./search-items-admin-codes"

const point = (lon: number, lat: number) => ({ type: "Point" as const, coordinates: [lon, lat] as [number, number] })

/**
 * Bbox et centres relevés sur geo.api.gouv.fr le 2026-09-11.
 * Maripasoula : 18 000 km², 1,55° × 1,88°. La Roche-sur-Yon et Paris : communes ordinaires.
 */
const buildIndex = (): AdminCodeIndex => {
  const index = emptyAdminCodeIndex()
  addCommune(index, {
    insee: "97353",
    departement_code: "973",
    region_code: "03",
    zipcodes: ["97370"],
    centre: [-53.8276, 3.049],
    bbox: [-54.602416, 2.111073, -53.052708, 3.986871],
  })
  addCommune(index, { insee: "85191", departement_code: "85", region_code: "52", zipcodes: ["85000"], centre: [-1.4266, 46.6705], bbox: [-1.5, 46.6, -1.35, 46.74] })
  addCommune(index, { insee: "75056", departement_code: "75", region_code: "11", zipcodes: ["75001", "75015"], centre: [2.3522, 48.8566], bbox: [2.224, 48.815, 2.47, 48.902] })
  addCommune(index, { insee: "44109", departement_code: "44", region_code: "52", zipcodes: ["44000"], centre: [-1.5603, 47.2382], bbox: null })
  return index
}

const buildCtx = (adminCodes: AdminCodeIndex): SearchItemBuildContext => ({
  romeLabelByCode: new Map(),
  organizationCaseMap: new Map(),
  sectorCaseMap: new Map(),
  adminCodes,
  corrections: { formations_recentrees: 0, formations_sans_geopoint: 0 },
})

const formation = (overrides: Partial<IFormationForSearchItem>): IFormationForSearchItem => ({
  _id: new ObjectId(),
  intitule_rco: "CAP Boulanger",
  contenu: "",
  niveau: "3 (CAP...)",
  lieu_formation_geopoint: point(-1.4266, 46.6705),
  lieu_formation_adresse: "5 Boulevard Branly",
  code_postal: "85000",
  code_commune_insee: "85191",
  localite: "La Roche-sur-Yon",
  etablissement_formateur_entreprise_raison_sociale: "CFA",
  entierement_a_distance: false,
  cle_ministere_educatif: "cle-1",
  rome_codes: [],
  ...overrides,
})

describe("snapGeopointToCommune", () => {
  const index = buildIndex()

  // Le faux positif d'abord : une distance seule aurait recentré ce point à tort.
  it("laisse en place un point à 100 km du centre d'une très grande commune, tant qu'il est dans son emprise", () => {
    const farButInside = point(-54.5, 2.2) // sud-ouest de Maripasoula, ~120 km du centre
    expect(snapGeopointToCommune({ insee: "97353", geopoint: farButInside }, index)).toEqual({ location: farButInside, snapped: false })
  })

  it("tolère un point juste de l'autre côté de la limite communale (~2 km)", () => {
    const justOutside = point(-1.515, 46.65) // 0,015° à l'ouest de la bbox de La Roche-sur-Yon
    expect(snapGeopointToCommune({ insee: "85191", geopoint: justOutside }, index).snapped).toBe(false)
  })

  it("ne touche à rien sans INSEE résolu, sans bbox, ou sans géopoint", () => {
    const p = point(-1.952, 47.3593)
    expect(snapGeopointToCommune({ insee: "00000", geopoint: p }, index)).toEqual({ location: p, snapped: false })
    expect(snapGeopointToCommune({ insee: null, geopoint: p }, index)).toEqual({ location: p, snapped: false })
    expect(snapGeopointToCommune({ insee: "44109", geopoint: p }, index)).toEqual({ location: p, snapped: false }) // commune sans bbox
    expect(snapGeopointToCommune({ insee: "85191", geopoint: null }, index)).toEqual({ location: null, snapped: false })
  })

  it("recentre sur la commune un point hors de son emprise (cas prod : La Roche-sur-Yon affichée près de Nantes)", () => {
    const result = snapGeopointToCommune({ insee: "85191", geopoint: point(-1.952, 47.3593) }, index)
    expect(result).toEqual({ location: point(-1.4266, 46.6705), snapped: true })
  })

  it("utilise l'emprise de la commune pour un arrondissement municipal", () => {
    const inParis = point(2.29, 48.84) // 15e arrondissement
    expect(snapGeopointToCommune({ insee: "75115", geopoint: inParis }, index).snapped).toBe(false)
    expect(snapGeopointToCommune({ insee: "75115", geopoint: point(-1.5, 47.2) }, index).snapped).toBe(true)
  })
})

describe("buildFormationSearchItem : géopoint et compteur de corrections", () => {
  it("garde le géopoint source quand il est dans l'emprise de la commune, compteur à zéro", () => {
    const ctx = buildCtx(buildIndex())
    const item = buildFormationSearchItem(formation({}), ctx)
    expect(item.location?.coordinates).toEqual([-1.4266, 46.6705])
    expect(item.departement_code).toBe("85")
    expect(ctx.corrections.formations_recentrees).toBe(0)
  })

  it("recentre et compte quand le géopoint est hors de la commune, sans changer les codes administratifs", () => {
    const ctx = buildCtx(buildIndex())
    const item = buildFormationSearchItem(formation({ lieu_formation_geopoint: point(-1.952, 47.3593) }), ctx)
    expect(item.location?.coordinates).toEqual([-1.4266, 46.6705])
    expect(item.departement_code).toBe("85")
    expect(item.region_code).toBe("52")
    expect(ctx.corrections.formations_recentrees).toBe(1)
  })

  it("le compteur s'accumule sur le contexte partagé d'un run", () => {
    const ctx = buildCtx(buildIndex())
    buildFormationSearchItem(formation({ lieu_formation_geopoint: point(-1.952, 47.3593) }), ctx)
    buildFormationSearchItem(formation({ lieu_formation_geopoint: point(-1.509, 47.279) }), ctx)
    buildFormationSearchItem(formation({}), ctx)
    expect(ctx.corrections.formations_recentrees).toBe(2)
  })
})
