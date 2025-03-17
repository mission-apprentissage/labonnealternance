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
