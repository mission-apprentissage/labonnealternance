export const PERSON_NAME_VALIDATION_MESSAGE = "Saisissez au moins 2 lettres"

const personNameAllowedCharactersRegex = /^[\p{L}\p{M}\s'’-]+$/u
const personNameLettersRegex = /\p{L}/gu

export const validatePersonName = (value: string): boolean => {
  if (!value) {
    return false
  }

  const normalizedValue = value.trim()

  if (!normalizedValue || !personNameAllowedCharactersRegex.test(normalizedValue)) {
    return false
  }

  return (normalizedValue.match(personNameLettersRegex)?.length ?? 0) >= 2
}
