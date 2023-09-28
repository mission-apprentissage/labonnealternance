import mailController from "company-email-validator"

export const getEmailDomain = (email: string) => {
  const domain = email.split("@").at(1)
  return domain
}

/**
 * @description Check if an email is included in the provided array
 */
export const isUserMailExistInReferentiel = (contactList: { email: string }[], userEmail: string): boolean =>
  contactList.map((x) => x.email.toLowerCase()).includes(userEmail.toLowerCase())

/**
 * @description get all domains from an array of emails
 * @returns {string[]}
 */
export const getAllDomainsFromEmailList = (contactList: string[]) => {
  return [
    ...new Set(
      contactList.flatMap((email) => {
        const domain = email && getEmailDomain(email)
        return domain ? [domain] : []
      })
    ),
  ]
}

export const isEmailFromPrivateCompany = (userEmail: string) => mailController.isCompanyEmail(userEmail)

export const isEmailSameDomain = (email1: string, email2: string) => {
  const domain1 = getEmailDomain(email1)
  return Boolean(domain1 && getEmailDomain(email2) === domain1)
}
