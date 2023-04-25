const reasons = {
  modalite: "Modalités d'inscription",
  contenu: "Contenu de la formation",
  porte: "Portes ouvertes",
  frais: "Frais d'inscription",
  place: "Places disponibles",
  horaire: "Horaires / rythme de la formation",
  plus: "En savoir plus sur l'alternance",
  accompagnement: "Accompagnement dans la recherche d'entreprise",
  lieu: "Lieu de la formation",
  suivi: "Suivi de ma candidature",
  autre: "Autres :",
}

/**
 * @description Build a reason from a key
 * @return {string} A more explicit reason
 */
export const getReasonText = (reason) => {
  return reasons[reason] || ""
}

/**
 * @description Build an object from checkboxesName, with all values as "false"
 * @return {object} For example {modalite: false, contenu: false}
 */
export const getDefaultReasonsAsFalse = () => {
  const obj = {}
  for (const key in reasons) {
    obj[key] = false
  }
  return obj
}

/**
 * @description Returns the reasons as a string
 * @return {array} Array of string (the name of the reasons) : ["modalite", "contenu", ...]
 */
export const getReasons = () => {
  const res = []
  for (const key in reasons) {
    res.push(key)
  }
  return res
}
