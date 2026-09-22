import mailController from "company-email-validator"

export const getEmailDomain = (email: string) => {
  const domain = email.split("@").at(1)
  return domain
}

export const isUserMailExistInReferentiel = (contactList: { email: string }[], userEmail: string): boolean =>
  contactList.map((x) => x.email.toLowerCase()).includes(userEmail.toLowerCase())

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
