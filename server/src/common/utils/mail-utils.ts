import mailController from "company-email-validator"

const getEmailDomain = (email: string) => {
  const domain = email.split("@").at(1)
  return domain
}

export const isEmailFromPrivateCompany = (userEmail: string) => mailController.isCompanyEmail(userEmail)

/** Webmail grand public ou messagerie jetable : même liste que BAL pour son `is_company_email` (#5425). */
export const isFreeEmailProviderDomain = (domain: string) => !mailController.isCompanyDomain(domain)

export const isEmailSameDomain = (email1: string, email2: string) => {
  const domain1 = getEmailDomain(email1)
  return Boolean(domain1 && getEmailDomain(email2) === domain1)
}
