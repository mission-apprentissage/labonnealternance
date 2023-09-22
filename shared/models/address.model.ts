import { z } from "zod"

const ZAcademie = z.object({
  code: z.string(),
  nom: z.string(),
})

const ZGeometry = z.object({
  coordinates: z.array(z.number()),
  type: z.string(),
})

const ZProperties = z.object({
  score: z.number(),
  source: z.string(),
})
const ZGeoJson = z.object({
  geometry: ZGeometry,
  properties: ZProperties,
  type: z.string(),
})

const ZAcheminementPostal = z.object({
  l1: z.string(), // raison_social | enseigne
  l2: z.string(),
  l3: z.string(), // lieu dit
  l4: z.string(), // numéro et rue
  l5: z.string(),
  l6: z.string(), // code postal et ville
  l7: z.string(), // pays
})

const ZAdresseCFA = z.object({
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

const ZAdresseV2 = ZAdresseCFA.extend({
  numero_voie: z.string(),
  type_voie: z.string(),
  nom_voie: z.string(),
  complement_adresse: z.string(),
  code_postal: z.string(),
  localite: z.string(),
  code_insee_localite: z.string(),
  cedex: z.null(),
  acheminement_postal: ZAcheminementPostal.optional(),
})

const ZAdresseV3 = z.object({
  status_diffusion: z.string(),
  complement_adresse: z.string(),
  numero_voie: z.string(),
  indice_repetition_voie: z.string(),
  type_voie: z.string(),
  libelle_voie: z.string(),
  code_postal: z.string(),
  libelle_commune: z.string(),
  libelle_commune_etranger: z.string(),
  distribution_speciale: z.string(),
  code_commune: z.string(),
  code_cedex: z.string(),
  libelle_cedex: z.string(),
  code_pays_etranger: z.string(),
  libelle_pays_etranger: z.string(),
  acheminement_postal: ZAcheminementPostal.optional(),
})

export const ZGlobalAddress = z.union([ZAdresseCFA, ZAdresseV2, ZAdresseV3])
