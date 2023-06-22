interface Academie {
  code: string
  nom: string
}

interface Geojson {
  geometry: IGeometry
  properties: IProperties
  type: string
}

interface IGeometry {
  coordinates: number[]
  type: string
}

interface IProperties {
  score: number
  source: string
}

interface IAdresseCFA {
  academie: Academie
  code_insee: string
  code_postal: string
  departement: Academie
  geojson: Geojson
  label: string
  localite: string
  region: Academie
}

interface IAdresseV2 {
  l1: string // raison_social | enseigne
  l2: null
  l3: string // lieu dit
  l4: string // numéro et rue
  l5: null
  l6: string // code postal et ville
  l7: string // pays
  numero_voie: string
  type_voie: string
  nom_voie: string
  complement_adresse: string
  code_postal: string
  localite: string
  code_insee_localite: string
  cedex: null
}

interface IAdresseV3 {
  status_diffusion: string
  complement_adresse: string
  numero_voie: string
  indice_repetition_voie: string
  type_voie: string
  libelle_voie: string
  code_postal: string
  libelle_commune: string
  libelle_commune_etranger: string
  distribution_speciale: string
  code_commune: string
  code_cedex: string
  libelle_cedex: string
  code_pays_etranger: string
  libelle_pays_etranger: string
  acheminement_postal: AcheminementPostal
}

interface AcheminementPostal {
  l1: string
  l2: string
  l3: string
  l4: string
  l5: string
  l6: string
  l7: string
}

export { IAdresseV2, IAdresseV3, IAdresseCFA }
