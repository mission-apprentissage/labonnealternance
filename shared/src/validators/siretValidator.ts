// cf https://fr.wikipedia.org/wiki/Formule_de_Luhn
import luhn from "luhn"

export const validateSIRET = (siret: string): boolean => {
  if (!siret) {
    return false
  }
  if (siret.length !== 14) {
    return false
  }
  const isLuhnValid = luhn.validate(siret)
  // cas La poste
  if (!isLuhnValid && siret.startsWith("356000000")) {
    return validationLaPoste(siret)
  }
  return isLuhnValid
}

const getDigits = (input: string) => {
  if (!input) {
    return []
  }
  return input.split("").flatMap((char) => (new RegExp("[0-9]").test(char) ? [parseInt(char)] : []))
}

const validationLaPoste = (input: string) => {
  const digits = getDigits(input)
  return digits.reduce((acc, digit) => acc + digit, 0) % 5 === 0
}
