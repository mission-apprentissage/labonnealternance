// cf https://fr.wikipedia.org/wiki/Formule_de_Luhn

/**
 * Retourne true si le siret est valide
 * @param {string} siret siret sous forme de string sans espaces ni autres caractères
 * @returns {boolean}
 */

export const validateSIRET = (siret) => {
  if (!siret) {
    return false
  }
  if (siret.length !== 14) {
    return false
  }
  const isLuhnValid = validateLuhn(siret)
  // cas La poste
  if (!isLuhnValid && siret.startsWith("356000000")) {
    return validationLaPoste(siret)
  }
  return isLuhnValid
}

/**
 * retourne un tableau de chiffres contenus dans la string
 * @param {string} input
 * @returns {number[]}
 */
const getDigits = (input) => {
  if (!input) {
    return []
  }
  return input.split("").flatMap((char) => (new RegExp("[0-9]").test(char) ? [parseInt(char)] : []))
}

/**
 * retourne true si la chaine vérifie le critère La poste
 * @param {string} input
 * @returns {boolean}
 */
const validationLaPoste = (input) => {
  const digits = getDigits(input)
  return digits.reduce((acc, digit) => acc + digit, 0) % 5 === 0
}

/**
 * retourne true si la chaine vérifie l'algorithme de Luhn
 * @param {string} input
 * @returns {boolean}
 */
const validateLuhn = (input) => {
  const digits = getDigits(input)
  const rests = digits.reverse().map((digit, index) => {
    if (index % 2 === 0) {
      return digit
    }
    const double = 2 * digit
    return double > 9 ? double - 9 : double
  })
  const sum = rests.reduce((acc, digit) => acc + digit, 0)
  return sum % 10 === 0
}
