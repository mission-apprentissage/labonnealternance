import apiGeoAdresse from "./apiGeoAdresse.js"

class GeoData {
  constructor() {}

  async getUpdates({ numero_rue, type_voie, libelle_rue, code_postal }) {
    const responseApiAdresse = await apiGeoAdresse.search(`${numero_rue}+${type_voie}+${libelle_rue}`, code_postal)
    if (responseApiAdresse.features.length !== 1) {
      return false
    }
    const geojson = { ...responseApiAdresse }

    return {
      geo_coordonnees: `${geojson.features[0].geometry.coordinates[1]},${geojson.features[0].geometry.coordinates[0]}`, // format "lat,long"
    }
  }

  getAddress(numero_rue, type_voie, libelle_rue, code_postal, ville) {
    return `https://api-adresse.data.gouv.fr/search/?q=${numero_rue ? numero_rue + "+" : ""}${type_voie ? type_voie + "+" : ""}+${
      libelle_rue ? libelle_rue : ""
    }&postcode=${code_postal} - ${ville}`
  }

  // le code postal 75116 ne remonte rien, il doit être remplacé par 75016
  refinePostcode(postcode) {
    if (postcode === "75116") return "75016"
    else if (postcode === "97142") return "97139"
    //TODO: hardcoded à supprimer quand la BAN remontera correctement les adresse du cp 97142 pour "Les Abymes" en Guadeloupe
    else return postcode
  }

  async getFirstMatchUpdates({ numero_rue, type_voie, libelle_rue, code_postal, ville }) {
    // première tentative de recherche sur rue et code postal

    if (code_postal === "97133") {
      //TODO: hardcoded à supprimer quand la BAN remontera correctement les adresse du cp 97133 pour "Saint Barthélémy"
      // cas particulier concernant un unique college à saint barth'
      return {
        geoLocation: "17.896279,-62.849772", // format "lat,long"
        city: "Saint Barthélémy",
        postCode: "97133",
      }
    }

    if (!code_postal) {
      console.log(`No postcode for establishment.\t${this.getAddress(numero_rue, type_voie, libelle_rue, code_postal, ville)}`)
      return false
    }

    let responseApiAdresse = await apiGeoAdresse.search(
      `${numero_rue ? numero_rue + "+" : ""}${type_voie ? type_voie + "+" : ""}${libelle_rue ? libelle_rue : ""}`,
      this.refinePostcode(code_postal)
    )

    // si pas de réponse deuxième recherche sur ville et code postal
    if (!responseApiAdresse || responseApiAdresse.features.length === 0) {
      //console.log(`Second geoloc call with postcode \t ${code_postal}`);
      responseApiAdresse = await apiGeoAdresse.searchPostcodeOnly(
        `${ville ? ville : "a"}`, // hack si ville absente
        this.refinePostcode(code_postal)
      )
    }

    if (!responseApiAdresse) return false

    if (responseApiAdresse.features.length === 0) {
      console.log(`No geoloc result for establishment.\t${this.getAddress(numero_rue, type_voie, libelle_rue, code_postal, ville)}`)
      return false
    }

    // signalement des cas avec ambiguité
    /*if (responseApiAdresse.features.length > 1) {
      console.log(
        `Multiple geoloc results for establishment.\t${this.getAddress(
          numero_rue,
          type_voie,
          libelle_rue,
          code_postal,
          localite
        )}\t${responseApiAdresse.features[0].properties.label} ${responseApiAdresse.features[0].properties.postcode}`
      );
    }*/

    const geojson = { ...responseApiAdresse }

    if (geojson.features[0].geometry.coordinates[1]) {
      return {
        geoLocation: `${geojson.features[0].geometry.coordinates[1]},${geojson.features[0].geometry.coordinates[0]}`, // format "lat,long"
        city: geojson.features[0].properties.city,
        postcode: geojson.features[0].properties.postcode,
      }
    } else {
      return false
    }
  }
}

const geoData = new GeoData()

export default geoData
