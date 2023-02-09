import chai from "chai"
const expect = chai.expect

import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)

import { validateSendApplication, validateFeedbackApplication, validatePermanentEmail, validateCompanyEmail } from "../../src/service/validateSendApplication.js"
import __filename from "../../src/common/filename.js"

import { decryptWithIV } from "../../src/common/utils/encryptString.js"

describe(__filename(import.meta.url), () => {
  it("validateSendApplication : Echoue si mauvais argument passé en param", async () => {
    expect(await validateSendApplication()).to.equal("données de candidature invalides")
  })
  it("validateSendApplication : Echoue si un des champs ne passe pas la validation", async () => {
    expect(await validateSendApplication({ lastName: "too long name, more than 15 characters, will fail" })).to.equal("données de candidature invalides")
  })
  it("validateSendApplication : Echoue si un l'email est d'une boîte temporaire", async () => {
    expect(await validatePermanentEmail({ email: "test@10minutemail.com" })).to.equal("email temporaire non autorisé")
  })
  it("validateSendApplication : Succès si l'email n'est pas d'une boîte temporaire", async () => {
    expect(await validatePermanentEmail({ email: "test@gmail.com" })).to.equal("ok")
  })
  it("validateSendApplication : Passe si tous les champs sont valides", async () => {
    expect(
      await validateSendApplication({
        firstName: "jane",
        fileContent: "0",
        lastName: "doe",
        fileName: "any.pdf",
        email: "jane.doe@example.com",
        phone: "0606060606",
      })
    ).to.equal("ok")
  })
  it("validateCompanyEmail : Passe si emails cryptés valides", async () => {
    let companyEmail = decryptWithIV("28b99996da3c4ae72df064bec394754a3791", "1ac16072b289a73dc1c940b06d728933")

    expect(
      await validateCompanyEmail({
        companyEmail,
        cryptedEmail: companyEmail,
      })
    ).to.equal("ok")
  })
  it("validateCompanyEmail : Passe si emails cryptés valides", async () => {
    let companyEmail = decryptWithIV("fake_crypted_email", "1ac16072b289a73dc1c940b06d728933")

    expect(
      await validateCompanyEmail({
        companyEmail,
        cryptedEmail: companyEmail,
      })
    ).to.equal("email société invalide")
  })
  it("validateFeedbackApplication : Echoue si mauvais argument passé en param", async () => {
    await expect(validateFeedbackApplication()).to.be.rejectedWith("error - validation of data failed")
  })
  it("validateFeedbackApplication : Echoue si un des champs ne passe pas la validation", async () => {
    await expect(validateFeedbackApplication({ id: "aaa", iv: "aaa", avis: "avis non conforme" })).to.be.rejectedWith("error - validation of data failed")
  })
  it("validateFeedbackApplication : Passe si tous les champs sont valides", async () => {
    expect(
      await validateFeedbackApplication({
        id: "aaaa",
        iv: "aaaa",
        avis: "utile",
      })
    ).to.equal("ok")
  })
})
