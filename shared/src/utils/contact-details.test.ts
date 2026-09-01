import { describe, expect, it } from "vitest"

import { removeContactDetailsFromText } from "./contact-details.js"

describe("removeContactDetailsFromText", () => {
  it.each([
    ["Envoyez votre CV à recrutement@acme.fr avant le 15", "Envoyez votre CV à avant le 15"],
    ["contact: prenom.nom+alternance@acme-group.co.uk", "contact:"],
    ["Écrivez à RECRUTEMENT@ACME.FR", "Écrivez à"],
  ])("retire les emails : %s", (input, expected) => {
    expect(removeContactDetailsFromText(input)).toBe(expected)
  })

  it.each([
    "Appelez le 0612345678",
    "Appelez le 06 12 34 56 78",
    "Appelez le 06.12.34.56.78",
    "Appelez le 06-12-34-56-78",
    "Appelez le +33612345678",
    "Appelez le +33 6 12 34 56 78",
    "Appelez le 0033 6 12 34 56 78",
    "Appelez le +33 (0)6 12 34 56 78",
    "Appelez le 01 44 55 66 77",
  ])("retire les téléphones : %s", (input) => {
    expect(removeContactDetailsFromText(input)).toBe("Appelez le")
  })

  it("ne touche pas aux balises HTML autour d'une coordonnée", () => {
    // le point clé face à detectUrlAndEmails, qui renvoie l'empan du mot entier et emporterait <p>
    expect(removeContactDetailsFromText("<p>Contact : <strong>rh@acme.fr</strong></p>")).toBe("<p>Contact : <strong></strong></p>")
  })

  it("préserve les retours à la ligne et ne laisse pas de blanc en bout de ligne", () => {
    expect(removeContactDetailsFromText("Poste ouvert\nContact rh@acme.fr\nMerci")).toBe("Poste ouvert\nContact\nMerci")
  })

  it("ne laisse pas d'espace en fin de chaîne", () => {
    expect(removeContactDetailsFromText("Merci d'appeler le 06 12 34 56 78")).toBe("Merci d'appeler le")
  })

  it.each([null, undefined, ""])("renvoie une chaîne vide pour %s", (input) => {
    expect(removeContactDetailsFromText(input)).toBe("")
  })

  // faux positifs : ce qui ressemble à un numéro sans en être un
  it.each([
    ["Notre SIRET est 01234567800012", "Notre SIRET est 01234567800012"],
    ["SIRET 12345678900011", "SIRET 12345678900011"],
    ["Poste basé au 75001 Paris", "Poste basé au 75001 Paris"],
    ["Rémunération 12 500 € brut annuel", "Rémunération 12 500 € brut annuel"],
    ["Candidature avant le 01.02.2026", "Candidature avant le 01.02.2026"],
    ["Contrat de 24 mois à partir du 01/09/2026", "Contrat de 24 mois à partir du 01/09/2026"],
    ["Référence interne 000123", "Référence interne 000123"],
    ["Notre équipe compte 06 personnes", "Notre équipe compte 06 personnes"],
  ])("ne retire pas %s", (input, expected) => {
    expect(removeContactDetailsFromText(input)).toBe(expected)
  })

  it.each([
    ["Le taux horaire est de 12,50 € et l'entreprise @ Lyon", "Le taux horaire est de 12,50 € et l'entreprise @ Lyon"],
    ["Suivez-nous sur @acme_recrute", "Suivez-nous sur @acme_recrute"],
    ["Poste en CDI @ Paris", "Poste en CDI @ Paris"],
  ])("ne retire pas une arobase qui n'est pas un email : %s", (input, expected) => {
    expect(removeContactDetailsFromText(input)).toBe(expected)
  })

  it("retire email et téléphone dans le même texte", () => {
    expect(removeContactDetailsFromText("Contactez Léa : lea@acme.fr ou au 06 12 34 56 78.")).toBe("Contactez Léa : ou au.")
  })
  it.each([
    "Poste  à  pourvoir   dès septembre",
    "<ul>\n  <li>Missions</li>\n  <li>Profil</li>\n</ul>",
    "  Description avec des blancs en bord  ",
    "Une phrase mal ponctuée , et une autre .",
  ])("rend verbatim un texte sans coordonnée, sans reformater sa typographie : %s", (input) => {
    // le nettoyage ne doit réparer que les blancs créés par une suppression effective
    expect(removeContactDetailsFromText(input)).toBe(input)
  })
})
