import apiGeoAdresse from "./apiGeoAdresse.js"

class GeoData {
  constructor() {}

  async getUpdates({ numero_rue, type_voie, street_name, zip_code }) {
    const responseApiAdresse = await apiGeoAdresse.search(`${numero_rue}+${type_voie}+${street_name}`, zip_code)
    if (responseApiAdresse.features.length !== 1) {
      return false
    }
    const geojson = { ...responseApiAdresse }

    return {
      geo_coordinates: `${geojson.features[0].geometry.coordinates[1]},${geojson.features[0].geometry.coordinates[0]}`, // format "lat,long"
    }
  }

  getAddress(street_number, type_voie, street_name, zip_code, city) {
    return `https://api-adresse.data.gouv.fr/search/?q=${street_number ? street_number + "+" : ""}${type_voie ? type_voie + "+" : ""}+${
      street_name ? street_name : ""
    }&postcode=${zip_code} - ${city}`
  }

  // le code postal 75116 ne remonte rien, il doit être remplacé par 75016
  refineZipCode(zipCode) {
    if (zipCode === "75116") return "75016"
    else if (zipCode === "97142") return "97139"
    //TODO: hardcoded à supprimer quand la BAN remontera correctement les adresse du cp 97142 pour "Les Abymes" en Guadeloupe
    else return zipCode
  }

  async getFirstMatchUpdates({ street_number, type_voie, street_name, zip_code, city }) {
    // première tentative de recherche sur rue et code postal

    if (zip_code === "97133") {
      //TODO: hardcoded à supprimer quand la BAN remontera correctement les adresse du cp 97133 pour "Saint Barthélémy"
      // cas particulier concernant un unique college à saint barth'
      return {
        geo_coordinates: "17.896279,-62.849772", // format "lat,long"
        city: "Saint Barthélémy",
        zip_code: "97133",
      }
    }

    if (!zip_code) {
      console.log(`No zipcode for establishment.\t${this.getAddress(street_number, type_voie, street_name, zip_code, city)}`)
      return false
    }

    let responseApiAdresse = await apiGeoAdresse.search(
      `${street_number ? street_number + "+" : ""}${type_voie ? type_voie + "+" : ""}${street_name ? street_name : ""}`,
      this.refineZipCode(zip_code)
    )

    // si pas de réponse deuxième recherche sur ville et code postal
    if (!responseApiAdresse || responseApiAdresse.features.length === 0) {
      //console.log(`Second geoloc call with postcode \t ${code_postal}`);
      responseApiAdresse = await apiGeoAdresse.searchPostcodeOnly(
        `${city ? city : "a"}`, // hack si ville absente
        this.refineZipCode(zip_code)
      )
    }

    if (!responseApiAdresse) return false

    if (responseApiAdresse.features.length === 0) {
      console.log(`No geoloc result for establishment.\t${this.getAddress(street_number, type_voie, street_name, zip_code, city)}`)
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
        geo_coordinates: `${geojson.features[0].geometry.coordinates[1]},${geojson.features[0].geometry.coordinates[0]}`, // format "lat,long"
        city: geojson.features[0].properties.city,
        zip_code: geojson.features[0].properties.postcode,
      }
    } else {
      return false
    }
  }
}

const geoData = new GeoData()

export default geoData
