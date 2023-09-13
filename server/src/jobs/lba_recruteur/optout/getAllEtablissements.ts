// @ts-ignore
// @ts-nocheck
import axios from "axios"
import { differenceBy } from "lodash-es"
import { Optout } from "../../../common/model/index.js"
import { runScript } from "../../scriptWrapper.js"

type Etablissement = { contacts: { email: string }[]; adresse: string }

/**
 * @description get all establishments from the referentiel API
 * @param {object} options
 * @returns {array} list of establishments
 */
const getEtablissements = async (options?: { page: number }): Promise<Etablissement[]> => {
  const { page } = { page: 1, ...options }

  const response = await axios.get(
    `https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes?etat_administratif=actif&qualiopi=true&natures=responsable,responsable_formateur&items_par_page=1000&ordre=desc&page=${page}`
  )

  const { pagination } = response.data
  const organismes: Etablissement[] = response.data.organismes

  if (page < pagination.nombre_de_page) {
    return getEtablissements({ page: page + 1 }).then((addedEtablissements) => [...organismes, ...addedEtablissements])
  } else {
    return organismes
  }
}

runScript(async () => {
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
  for (const obj in siretListByEmail) {
    if (siretListByEmail[obj].length === 1) {
      const found = organismesFiltered.find((x) => x.siret === siretListByEmail[obj][0].siret)
      if (!found) {
        organismesFiltered.push(...siretListByEmail[obj])
      }
    }
  }

  await Promise.all(
    organismesFiltered.map(async (x) => {
      // TODO wtf is this ?
      const formated = etablissement.formatReferentielData(x)
      await Optout.create(formated)
    })
  )

  const count = await Optout.countDocuments()

  return {
    total: referentiel.length,
    exist: referentiel.length - newEtablissement.length,
    new: organismesFiltered.length,
    database: count,
  }
})
