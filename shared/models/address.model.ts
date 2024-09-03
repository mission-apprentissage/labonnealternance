import { z } from "../helpers/zodWithOpenApi"

const ZAcademie = z
  .object({
    code: z.string(),
    nom: z.string(),
  })
  .strict()

const Z2DCoord = z.tuple([z.number(), z.number()])

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

export const ZGeometry = z.union([ZPointGeometry, ZPolygonGeometry])

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

export type IAdresseV3 = z.input<typeof ZAdresseV3>
export type IAdresseCFA = z.input<typeof ZAdresseCFA>
export type IGlobalAddress = z.input<typeof ZGlobalAddress>
export type IGeoPoint = z.input<typeof ZPointGeometry>
