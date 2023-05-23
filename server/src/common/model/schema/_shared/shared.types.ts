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

interface IAdresse {
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

export { IAdresse, IAdresseCFA }
