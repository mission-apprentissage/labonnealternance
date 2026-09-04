import { describe, expect, it } from "vitest"

import { maskPersonalData } from "./mask-personal-data"

describe("maskPersonalData", () => {
  describe("null/undefined/empty handling", () => {
    it("should return the input unchanged for null", () => {
      expect(maskPersonalData(null as unknown as string)).toBe(null)
    })
    it("should return the input unchanged for undefined", () => {
      expect(maskPersonalData(undefined as unknown as string)).toBe(undefined)
    })
    it("should return an empty string unchanged", () => {
      expect(maskPersonalData("")).toBe("")
    })
  })

  describe("phone numbers", () => {
    it("should mask a mobile number with spaces", () => {
      expect(maskPersonalData("Contactez-moi au 06 12 34 56 78 pour plus d'infos.")).toBe("Contactez-moi au 06xxxxxxxx pour plus d'infos.")
    })
    it("should mask a number with dots", () => {
      expect(maskPersonalData("Tel: 06.12.34.56.78")).toBe("Tel: 06xxxxxxxx")
    })
    it("should mask a number with no separators", () => {
      expect(maskPersonalData("Appelez le 0612345678 svp")).toBe("Appelez le 06xxxxxxxx svp")
    })
    it("should mask a landline number", () => {
      expect(maskPersonalData("Standard : 01 23 45 67 89")).toBe("Standard : 06xxxxxxxx")
    })
    it("should mask a number with the +33 prefix", () => {
      expect(maskPersonalData("+33 6 12 34 56 78 pour me joindre")).toBe("06xxxxxxxx pour me joindre")
    })
    it("should leave text without a phone number unchanged", () => {
      expect(maskPersonalData("Poste à pourvoir dès que possible.")).toBe("Poste à pourvoir dès que possible.")
    })
  })

  describe("emails", () => {
    it("should mask an email address", () => {
      expect(maskPersonalData("Envoyez votre CV à recrutement@entreprise.fr")).toBe("Envoyez votre CV à emxxx@xxx.fr")
    })
    it("should mask multiple emails", () => {
      expect(maskPersonalData("Contact : a@test.com ou b@test.fr")).toBe("Contact : emxxx@xxx.fr ou emxxx@xxx.fr")
    })
  })

  describe("urls", () => {
    it("should mask a plain url", () => {
      expect(maskPersonalData("Plus d'infos sur www.entreprise.fr")).toBe("Plus d'infos sur www.lien_non_disponible.com")
    })
    it("should mask a url with protocol", () => {
      expect(maskPersonalData("Voir https://entreprise.fr/carrieres pour postuler")).toBe("Voir www.lien_non_disponible.com pour postuler")
    })
  })

  describe("mixed content", () => {
    it("should mask phone, email and url together, keeping the rest of the text intact", () => {
      const input = "Rejoignez-nous ! Contact : rh@entreprise.fr, tel 06 12 34 56 78, site www.entreprise.fr. Mission passionnante."
      const expected = "Rejoignez-nous ! Contact : emxxx@xxx.fr, tel 06xxxxxxxx, site www.lien_non_disponible.com. Mission passionnante."
      expect(maskPersonalData(input)).toBe(expected)
    })

    it("should not alter text with no personal data", () => {
      const input = "Nous recherchons un(e) alternant(e) motivé(e) pour rejoindre notre équipe commerciale de 5 personnes."
      expect(maskPersonalData(input)).toBe(input)
    })
  })
})
