import { describe, expect, it } from "vitest"

import { validatePermanentEmail } from "@/services/application.service"

describe("validateSendApplication", () => {
  it("validateSendApplication : Echoue si un l'email est d'une boîte temporaire", async () => {
    expect(validatePermanentEmail("test@10minutemail.com")).to.equal("email temporaire non autorisé")
  })
  it("validateSendApplication : Succès si l'email n'est pas d'une boîte temporaire", async () => {
    expect(validatePermanentEmail("test@gmail.com")).to.equal("ok")
  })
})
