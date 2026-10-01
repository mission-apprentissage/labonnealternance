import parseMax from "libphonenumber-js/max" // contains getType() function

const forbiddenPhoneNumberTypes = ["PREMIUM_RATE", "PAGER", "VOICEMAIL", "SHARED_COST"]

export const validatePhone = (phone: string) => {
  const frenchNumberRegex = /^0[123456789]/

  if (!phone) {
    return false
  }
  if (frenchNumberRegex.test(phone)) {
    phone = "+33" + phone.substring(1)
  }

  const phoneNumber = parseMax(phone)
  const phoneNumberType = phoneNumber?.getType()

  if (!phoneNumber || !phoneNumber.isPossible()) return false

  if (phoneNumberType) {
    if (forbiddenPhoneNumberTypes.includes(phoneNumberType)) return false
  }

  return true
}

// Métropole, DROM et collectivités du plan de numérotation français : numéros à 10 chiffres commençant par 0 depuis la métropole.
// Hors de ce plan, un numéro peut aussi s'écrire en 10 chiffres (mobile belge 0470…) sans être joignable sous cette forme.
const FRENCH_NUMBERING_PLAN_COUNTRIES = ["FR", "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF"]

/**
 * Numéro valide pour `validatePhone`, ramené au format national à 10 chiffres sans séparateur (0612345678) :
 * accepte espaces, points, tirets et préfixe +33 / +262… ; renvoie null pour un numéro invalide ou hors plan français.
 */
export const toFrenchNationalPhone = (phone: string): string | null => {
  const compactPhone = phone.replace(/[\s.\-()]/g, "")
  if (!validatePhone(compactPhone)) return null

  const phoneNumber = parseMax(/^0[1-9]/.test(compactPhone) ? "+33" + compactPhone.substring(1) : compactPhone)
  if (!phoneNumber?.country || !FRENCH_NUMBERING_PLAN_COUNTRIES.includes(phoneNumber.country)) return null

  const nationalPhone = phoneNumber.formatNational().replace(/\D/g, "")
  return /^0[1-9][0-9]{8}$/.test(nationalPhone) ? nationalPhone : null
}
