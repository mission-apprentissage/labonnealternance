import parseMax from "libphonenumber-js/max" // contains getType() function

export const paysUE = [
  { code: "DE", nom: "Allemagne" },
  { code: "AT", nom: "Autriche" },
  { code: "BE", nom: "Belgique" },
  { code: "BG", nom: "Bulgarie" },
  { code: "CY", nom: "Chypre" },
  { code: "HR", nom: "Croatie" },
  { code: "DK", nom: "Danemark" },
  { code: "ES", nom: "Espagne" },
  { code: "EE", nom: "Estonie" },
  { code: "FI", nom: "Finlande" },
  { code: "FR", nom: "France" },
  { code: "GR", nom: "Grèce" },
  { code: "HU", nom: "Hongrie" },
  { code: "IE", nom: "Irlande" },
  { code: "IT", nom: "Italie" },
  { code: "LV", nom: "Lettonie" },
  { code: "LT", nom: "Lituanie" },
  { code: "LU", nom: "Luxembourg" },
  { code: "MT", nom: "Malte" },
  { code: "NL", nom: "Pays-Bas" },
  { code: "PL", nom: "Pologne" },
  { code: "PT", nom: "Portugal" },
  { code: "CZ", nom: "République tchèque" },
  { code: "RO", nom: "Roumanie" },
  { code: "SK", nom: "Slovaquie" },
  { code: "SI", nom: "Slovénie" },
  { code: "SE", nom: "Suède" },
]

const forbiddenPhoneNumberTypes = ["PREMIUM_RATE", "PAGER", "VOICEMAIL", "SHARED_COST"]

const getCountryByCode = (country: string | undefined) => paysUE.some((euCountry) => euCountry.code === country)

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

  if (!getCountryByCode(phoneNumber.country)) return false

  return true
}
