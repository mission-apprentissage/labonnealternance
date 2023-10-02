import { describe, expect, it } from "vitest"

import { decryptWithIV } from "../../src/common/utils/encryptString"
import { validateCompanyEmail, validatePermanentEmail } from "../../src/services/application.service"

describe("validateSendApplication", () => {
  it("validateSendApplication : Echoue si un l'email est d'une boîte temporaire", async () => {
    expect(await validatePermanentEmail({ applicant_email: "test@10minutemail.com" })).to.equal("email temporaire non autorisé")
  })
  it("validateSendApplication : Succès si l'email n'est pas d'une boîte temporaire", async () => {
    expect(await validatePermanentEmail({ applicant_email: "test@gmail.com" })).to.equal("ok")
  })
  it("validateCompanyEmail : Passe si emails cryptés valides", async () => {
    const companyEmail = decryptWithIV("28b99996da3c4ae72df064bec394754a3791", "1ac16072b289a73dc1c940b06d728933")

    console.log(companyEmail)
    expect(
      await validateCompanyEmail({
        company_email: companyEmail,
        crypted_email: companyEmail,
      })
    ).to.equal("ok")
  })
  it("validateCompanyEmail : Passe si emails cryptés valides", async () => {
    const companyEmail = decryptWithIV("fake_crypted_email", "1ac16072b289a73dc1c940b06d728933")

    expect(
      await validateCompanyEmail({
        company_email: companyEmail,
        crypted_email: companyEmail,
      })
    ).to.equal("email société invalide")
  })
})
