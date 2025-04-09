import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

const ZAcademie = z
  .object({
    code: z.string(),
    nom: z.string(),
  })
  .strict()

export const Z2DCoord = z.tuple([extensions.longitude({ coerce: false }), extensions.latitude({ coerce: false })])

export const ZPointGeometry = z
  .object({
    coordinates: Z2DCoord,
    type: z.literal("Point"),
  })
  .strict()

const ZPolygonGeometry = z
  .object({
    coordinates: z.array(z.array(Z2DCoord)), // oui, il y a un niveau de tableau en trop mais ce sont les data qu'on récupère
    type: z.literal("Polygon"),
  })
  .strict()

export const ZGeometry = z.discriminatedUnion("type", [ZPointGeometry, ZPolygonGeometry])

export type IGeometry = z.input<typeof ZGeometry>

const ZProperties = z
  .object({
    score: z.number().nullish(),
    source: z.string(),
  })
  .strict()
const ZGeoJson = z
  .object({
    geometry: ZGeometry,
    properties: ZProperties,
    type: z.string(),
  })
  .strict()

const ZAcheminementPostal = z
  .object({
    l1: z.string().nullish(), // raison_social | enseigne
    l2: z.string().nullish(),
    l3: z.string().nullish(), // lieu dit
    l4: z.string().nullish(), // numéro et rue
    l5: z.string().nullish(),
    l6: z.string().nullish(), // code postal et ville
    l7: z.string(), // pays
  })
  .strict()

export const ZAdresseCFA = z
  .object({
    academie: ZAcademie,
    code_insee: z.string(),
    code_postal: z.string(),
    departement: ZAcademie,
    geojson: ZGeoJson,
    label: z.string(),
    localite: z.string(),
    region: ZAcademie,
    acheminement_postal: ZAcheminementPostal.optional(),
  })
  .strict()
  .openapi("AdresseCFA")

const ZAdresseV2 = z
  .object({
    numero_voie: z.string().nullish(),
    type_voie: z.string().nullish(),
    nom_voie: z.string().nullish(),
    complement_adresse: z.string().nullish(),
    code_postal: z.string().nullish(),
    localite: z.string().nullish(),
    code_insee_localite: z.string().nullish(),
    cedex: z.string().nullish(),
    acheminement_postal: ZAcheminementPostal.optional(),
  })
  .strict()
  .openapi("AdresseV2")

export const ZAdresseV3 = z
  .object({
    status_diffusion: z.string().nullish(),
    complement_adresse: z.string().nullish(),
    numero_voie: z.string().nullish(),
    indice_repetition_voie: z.string().nullish(),
    type_voie: z.string().nullish(),
    libelle_voie: z.string().nullish(),
    code_postal: z.string().nullish(),
    libelle_commune: z.string().nullish(),
    libelle_commune_etranger: z.string().nullish(),
    distribution_speciale: z.string().nullish(),
    code_commune: z.string().nullish(),
    code_cedex: z.string().nullish(),
    libelle_cedex: z.string().nullish(),
    code_pays_etranger: z.string().nullish(),
    libelle_pays_etranger: z.string().nullish(),
    acheminement_postal: ZAcheminementPostal.optional(),
  })
  .strict()
  .openapi("AdresseV3")

export const ZGlobalAddress = z.union([ZAdresseCFA, ZAdresseV2, ZAdresseV3])

const ZPointProperties = z
  .object({
    label: z.string(),
    score: z.number(),
    housenumber: z.string().nullish(),
    id: z.string(),
    banId: z.string().nullish(),
    type: z.string(),
    name: z.string(),
    postcode: z.string().nullish(),
    citycode: z.string().nullish(),
    x: z.number(),
    y: z.number(),
    city: z.string().nullish(),
    municipality: z.string().nullish(),
    population: z.number().nullish(),
    district: z.string().nullish(),
    locality: z.string().nullish(),
    context: z.string(),
    importance: z.number(),
    street: z.string().nullish(),
  })
  .passthrough()

// only type="Point" feature
export const ZPointFeature = z.object({
  type: z.literal("Feature"),
  geometry: ZPointGeometry,
  properties: ZPointProperties,
})

export const ZGeometryFeature = z.object({
  type: z.literal("Feature"),
  geometry: ZGeometry,
  properties: ZPointProperties,
})

export interface IAPIAdresse {
  type: string
  version: string
  features: IPointFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}

export type IPointFeature = z.output<typeof ZPointFeature>
export type IGeometryFeature = z.output<typeof ZGeometryFeature>
export type IPointProperties = z.output<typeof ZPointProperties>
export type IPointGeometry = z.output<typeof ZPointGeometry>

export type IAdresseV3 = z.input<typeof ZAdresseV3>
export type IAdresseCFA = z.input<typeof ZAdresseCFA>
export type IGlobalAddress = z.input<typeof ZGlobalAddress>
export type IGeoPoint = z.input<typeof ZPointGeometry>
