import axios from "axios"
import { logger } from "../../common/logger.js"
import { WidgetParameter } from "../../common/model/index.js"
import config from "../../config.js"
import { runScript } from "../scriptWrapper.js"

const getApiInstance = async () => {
  const API = axios.create({ baseURL: "https://catalogue.apprentissage.education.gouv.fr/api/v1" })

  try {
    const response = await axios.post("https://catalogue.apprentissage.education.gouv.fr/api/v1/auth/login", {
      username: config.catalogueMe.username,
      password: config.catalogueMe.password,
    })

    API.defaults.headers.common["Cookie"] = response.headers["set-cookie"][0]
  } catch (error) {
    console.log(error)
  }

  return API
}

const API = await getApiInstance()

const getFormations = async (options) => {
  let { page, allFormations, limit, query } = { page: 1, allFormations: [], limit: 1050, ...options }
  let params = { page, limit, query }

  try {
    const response = await API.get(`/entity/formations`, { params })

    const { formations, pagination } = response.data
    allFormations = allFormations.concat(formations)

    if (page < pagination.nombre_de_page) {
      return getFormations({ page: page + 1, allFormations, limit, query })
    } else {
      return allFormations
    }
  } catch (error) {
    logger.error(error)
  }
}

const getParcoursupId = async () => {
  let formations = await getFormations({ limit: 1000, query: { parcoursup_id: { $ne: null }, parcoursup_statut: "publié", published: true, catalogue_published: true } })

  const countBeforeUpdate = await WidgetParameter.countDocuments({ id_parcoursup: { $eq: null } })

  await Promise.all(
    formations.map(async (formation) => {
      await WidgetParameter.updateMany({ cle_ministere_educatif: formation.cle_ministere_educatif }, { $set: { id_parcoursup: formation.parcoursup_id } })
    })
  )

  const countAfterUpdate = await WidgetParameter.countDocuments({ id_parcoursup: { $eq: null } })

  console.log({ before: countBeforeUpdate, after: countAfterUpdate, updated: countBeforeUpdate - countAfterUpdate, totalME: formations.length })
}

runScript(async () => await getParcoursupId())
