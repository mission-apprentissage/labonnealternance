import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { LiveStatus } from "./LiveStatus"

describe("LiveStatus", () => {
  it("rend une zone role=status masquée visuellement, montée même vide", () => {
    expect(renderToStaticMarkup(<LiveStatus message="" />)).toBe('<div role="status" class="fr-sr-only"></div>')
  })

  it("rend le message dans la zone", () => {
    expect(renderToStaticMarkup(<LiveStatus message="3 résultats" />)).toBe('<div role="status" class="fr-sr-only">3 résultats</div>')
  })

  it("accepte role=alert pour une erreur, sans aria-live redondant", () => {
    const html = renderToStaticMarkup(<LiveStatus role="alert" message="Erreur" />)
    expect(html).toBe('<div role="alert" class="fr-sr-only">Erreur</div>')
    expect(html).not.toContain("aria-live")
  })
})
