import mailController from "company-email-validator"

export const getEmailDomain = (email: string) => {
  const domain = email.split("@").at(1)
  if (!domain) {
    throw new Error(`unexpected: no domain on email ${email}`)
  }
  return domain
}

/**
 * @description Check if an email is included in the provided array
 * @param {object[]} contactList
 * @param {string} userEmail
 * @returns {boolean}
 */
export const checkIfUserMailExistInReferentiel = (contactList, userEmail): boolean => contactList.map((x) => x.email.toLowerCase()).includes(userEmail.toLowerCase())

/**
 * @description get all domains from an array of emails
 * @param {object[]} contactList
 * @returns {string[]}
 */
export const getAllDomainsFromEmailList = (contactList) => {
  return [...new Set(contactList.flatMap((email) => (email ? [getEmailDomain(email)] : [])))]
}

export const isEmailFromPrivateCompany = (userEmail: string) => mailController.isCompanyEmail(userEmail)

export const isEmailSameDomain = (email1: string, email2: string) => {
  return getEmailDomain(email2) === getEmailDomain(email1)
}
