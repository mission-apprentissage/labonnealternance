import { describe, expect, it } from "vitest"
import { buildGoogleIndexingJwtClaims, normalizePrivateKey } from "./google-indexing.client"

describe("buildGoogleIndexingJwtClaims", () => {
  it("construit les claims OAuth2 attendus par le endpoint de token Google", () => {
    const claims = buildGoogleIndexingJwtClaims("svc@projet.iam.gserviceaccount.com", 1_756_000_000)

    expect(claims).toEqual({
      iss: "svc@projet.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_756_000_000,
      exp: 1_756_003_600,
    })
  })
})

describe("normalizePrivateKey", () => {
  // Contenu volontairement neutre (pas de motif PEM) pour ne pas déclencher le scanner de
  // secrets : la fonction ne fait que restaurer les sauts de ligne, le contenu est indifférent.
  it("restaure les sauts de ligne d'une valeur stockée avec des \\n littéraux", () => {
    expect(normalizePrivateKey("ligne1\\nligne2\\nligne3\\n")).toBe("ligne1\nligne2\nligne3\n")
  })

  it("laisse intacte une valeur déjà multi-lignes", () => {
    const multiline = "ligne1\nligne2\nligne3\n"
    expect(normalizePrivateKey(multiline)).toBe(multiline)
  })
})
