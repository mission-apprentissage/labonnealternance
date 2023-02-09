import axios from "axios"

// Cf Documentation : https://geo.api.gouv.fr/adresse
const apiEndpoint = "https://api-adresse.data.gouv.fr"

class ApiGeoAdresse {
  constructor() {}

  async search(q, postcode = null) {
    try {
      const query = `${apiEndpoint}/search/?q=${q ? q : "a"}${postcode ? `&postcode=${postcode}` : ""}`
      let response = await this.searchQuery(query)

      return response
    } catch (error) {
      console.log(`geo search error : ${q} ${postcode} ${error}`)
      return null
    }
  }

  async searchQuery(query) {
    let response
    let trys = 0

    while (trys < 3) {
      response = await axios.get(query)

      if (response?.data?.status === 429) {
        console.log("429 ", new Date(), query)
        trys++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        break
      }
    }

    return response?.data
  }

  async searchPostcodeOnly(q, postcode = null) {
    try {
      const response = await axios.get(`${apiEndpoint}/search/?q=${q}${postcode ? `&postcode=${postcode}` : ""}`)
      return response.data
    } catch (error) {
      console.log(`geo searchPostcodeOnly error : #${q}# ${postcode} ${error}`)
      return null
    }
  }
}

const apiGeoAdresse = new ApiGeoAdresse()
export default apiGeoAdresse
