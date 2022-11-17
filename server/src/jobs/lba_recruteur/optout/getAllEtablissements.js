import axios from "axios"
import { differenceBy } from "lodash-es"
import { Optout } from "../../../common/model/index.js"
import { runScript } from "../../scriptWrapper.js"

/**
 * @description get all establishments from the referentiel API
 * @param {object} options
 * @returns {array} list of establishments
 */
const getEtablissements = async (options) => {
  let { page, allEtablissements } = { page: 1, allEtablissements: [], ...options }

  const response = await axios.get(
    `https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes?etat_administratif=actif&qualiopi=true&natures=responsable,responsable_formateur&items_par_page=1000&ordre=desc&page=${page}`
  )

  const { organismes, pagination } = response.data
  allEtablissements = allEtablissements.concat(organismes) // Should be properly exploded, function should be pure

  if (page < pagination.nombre_de_page) {
    return getEtablissements({ page: page + 1, allEtablissements })
  }

  return allEtablissements
}

runScript(async ({ etablissement }) => {
  const referentiel = await getEtablissements()
  const data = await Optout.find({}).lean()

  const newEtablissement = differenceBy(referentiel, data, "siret")
  const organismes = newEtablissement.filter((etablissement) => etablissement.contacts.length > 0 && etablissement.adresse)

  if (!organismes.length) {
    return "database is up to date"
  }

  const siretListByEmail = organismes.reduce((acc, etablissement) => {
    etablissement.contacts.forEach((contact) => {
      if (!acc[contact.email]) {
        acc[contact.email] = [etablissement]
      } else {
        acc[contact.email].push(etablissement)
      }
    })

    return acc
  }, {})

  const organismesFiltered = []

  // ajout de l'établissement pour lequels le contact est dans un seul établissement
  for (let obj in siretListByEmail) {
    if (siretListByEmail[obj].length === 1) {
      let found = organismesFiltered.find((x) => x.siret === siretListByEmail[obj][0].siret)
      if (!found) {
        organismesFiltered.push(...siretListByEmail[obj])
      }
    }
  }

  await Promise.all(
    organismesFiltered.map(async (x) => {
      const formated = etablissement.formatReferentielData(x)
      await Optout.create(formated)
    })
  )

  let count = await Optout.countDocuments()

  return {
    total: referentiel.length,
    exist: referentiel.length - newEtablissement.length,
    new: organismesFiltered.length,
    database: count,
  }
})
