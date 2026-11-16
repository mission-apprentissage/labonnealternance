import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TexteEmphase } from "./TexteEmphase"

describe("TexteEmphase", () => {
  it("rend les passages entre ** en <strong>", () => {
    const html = renderToStaticMarkup(<TexteEmphase texte="Le **BTS SIO** est courant" />)
    expect(html).toMatch(/^Le <strong[^>]*>BTS SIO<\/strong> est courant$/)
  })

  it("laisse un texte sans marqueur intact et échappe le HTML", () => {
    expect(renderToStaticMarkup(<TexteEmphase texte="a < b" />)).toBe("a &lt; b")
  })

  it("ignore un marqueur non fermé", () => {
    expect(renderToStaticMarkup(<TexteEmphase texte="début **sans fin" />)).toBe("début **sans fin")
  })
})
