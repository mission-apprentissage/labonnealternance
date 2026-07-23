export const PERSON_NAME_VALIDATION_MESSAGE = "Saisissez au moins 2 lettres"

const personNameAllowedCharactersRegex = /^[\p{L}\p{M}\p{Zs}'’-]+$/u
const personNameLetterRegex = /\p{L}/u

export const validatePersonName = (value: string): boolean => {
  const normalizedValue = value.trim()

  if (!normalizedValue || !personNameAllowedCharactersRegex.test(normalizedValue)) {
    return false
  }

  let letterCount = 0

  for (const character of normalizedValue) {
    if (personNameLetterRegex.test(character)) {
      letterCount += 1
      if (letterCount >= 2) {
        return true
      }
    }
  }

  return false
}
