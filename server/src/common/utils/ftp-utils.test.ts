import { describe, expect, it } from "vitest"
import { normalizeSshPrivateKey } from "./ftp-utils"

// Contenu volontairement non réaliste : la fonction ne fait que normaliser des retours à la ligne,
// elle ne lit pas le format. Un en-tête PEM ou un corps en base64 ferait échouer gitleaks.
const KEY = ["--- debut ---", "ligne du milieu", "--- fin ---"].join("\n")

describe("normalizeSshPrivateKey", () => {
  it("restaure les retours à la ligne des clés stockées sur une seule ligne au vault", () => {
    const stored = KEY.replaceAll("\n", "\\n")

    expect(normalizeSshPrivateKey(stored)).toBe(`${KEY}\n`)
  })

  it("laisse intacte une clé déjà multi-ligne", () => {
    expect(normalizeSshPrivateKey(`${KEY}\n`)).toBe(`${KEY}\n`)
  })

  it("ajoute la newline finale que ssh2 exige", () => {
    // Sans elle, ssh2 rejette la clé avec "Cannot parse privateKey: Unsupported key format".
    expect(normalizeSshPrivateKey(KEY)).toBe(`${KEY}\n`)
    expect(normalizeSshPrivateKey(KEY).endsWith("\n")).toBe(true)
  })
})
