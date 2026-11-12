import { renderToStaticMarkup } from "react-dom/server"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { describe, expect, it, vi } from "vitest"
import { OpcoSection } from "./OpcoSection"

// next/image exige des dimensions qu'un import d'image de Vite (simple URL) ne fournit pas
vi.mock("next/image", () => ({ default: () => null }))

const render = ({ detectedOpco, value = "", error }: { detectedOpco?: OPCOS_LABEL; value?: OPCOS_LABEL | ""; error?: string }) => {
  const html = renderToStaticMarkup(
    <OpcoSection
      title="2. L'OPCO de votre entreprise"
      detectedOpco={detectedOpco}
      name="opco"
      value={value}
      onChange={vi.fn()}
      errors={error ? { opco: error } : {}}
      touched={error ? { opco: true } : {}}
    />
  )
  const select = html.match(/<select [^>]*>/)?.[0]
  const describedBy = select?.match(/aria-describedby="([^"]*)"/)?.[1]?.trim()
  const describedText = describedBy ? (html.match(new RegExp(`<p id="${describedBy}"[^>]*>(.*?)</p>`))?.[1] ?? "") : ""
  return { html, select, describedText }
}

describe("OpcoSection", () => {
  it("OPCO identifié : encart en lecture seule, sans select", () => {
    const { html, select } = render({ detectedOpco: OPCOS_LABEL.MOBILITE })

    expect(select).toBeUndefined()
    expect(html).toContain("Votre OPCO : Opco Mobilités")
    expect(html).toContain("identifié automatiquement")
  })

  it("OPCO inconnu : select obligatoire et mention de vérification reliée au champ", () => {
    const { html, select, describedText } = render({})

    expect(select).toContain("required")
    expect(html).toContain("OPCO de votre entreprise")
    expect(describedText).toContain("Vérifiez cette information")
    expect(html).not.toContain("Votre OPCO :")
  })

  it("en erreur, le message d'erreur remplace la mention", () => {
    const { describedText } = render({ error: "Sélectionnez l'OPCO de votre entreprise, ou « Je ne sais pas »." })

    expect(describedText).toContain("Sélectionnez l&#x27;OPCO")
    expect(describedText).not.toContain("Vérifiez")
  })

  it("OPCO choisi : encart affiché sous le select", () => {
    const { html, select } = render({ value: OPCOS_LABEL.AKTO })

    expect(select).toBeDefined()
    expect(html).toContain("Votre OPCO : AKTO")
  })

  it("« Je ne sais pas » : pas d'encart", () => {
    const { html } = render({ value: OPCOS_LABEL.UNKNOWN_OPCO })

    expect(html).not.toContain("Votre OPCO :")
  })
})
