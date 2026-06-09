import { describe, expect, it, vi } from "vitest"

vi.mock("@/utils/getStaticData", () => ({
  getStaticMetiers: () => [{ name: "Développeur web", slug: "developpeur-web", romes: ["M1805"] }],
}))

import { generateLlmsTxt } from "./generateLlmsTxt"
import { generateMainSitemap } from "./generateMainSitemap"

const host = "labonnealternance.apprentissage.beta.gouv.fr"
const request = {
  headers: { get: (name: string) => (name === "host" ? host : null) },
} as unknown as Request

describe("generateLlmsTxt", () => {
  const llmsTxt = generateLlmsTxt(request)

  it("commence par le H1 et le blockquote de présentation (spec llmstxt.org)", () => {
    expect(llmsTxt.startsWith("# La bonne alternance\n")).toBe(true)
    expect(llmsTxt).toContain("> La bonne alternance est le service public")
  })

  it("explique que les offres d'emploi sont volontairement exclues", () => {
    expect(llmsTxt).toContain("/sitemap-offers.xml")
  })

  it("liste les pages issues de la même source que le sitemap, en URLs absolues", () => {
    expect(llmsTxt).toContain("## L'alternance par ville")
    expect(llmsTxt).toContain(`- [Alternance à Bordeaux](https://${host}/alternance/ville/bordeaux):`)
    expect(llmsTxt).toContain(`- [Développeur web](https://${host}/metiers/developpeur-web):`)
  })

  it("regroupe les pages légales sous une section ## Optional placée en dernier", () => {
    expect(llmsTxt).toContain("## Optional")
    expect(llmsTxt).toContain(`- [Mentions légales](https://${host}/mentions-legales):`)
    expect(llmsTxt.lastIndexOf("## ")).toBe(llmsTxt.indexOf("## Optional"))
  })
})

describe("generateMainSitemap (non-régression)", () => {
  const sitemap = generateMainSitemap(request)

  it("conserve la home en priorité 1 puis les pages fixes en 0.9", () => {
    expect(sitemap).toContain(`<loc>https://${host}</loc>\n<priority>1</priority>`)
    expect(sitemap).toContain(`<loc>https://${host}/a-propos</loc>\n<priority>0.9</priority>`)
  })

  it("conserve l'ordre d'origine : pages légales (0.9) avant les villes (0.95)", () => {
    const legalIndex = sitemap.indexOf("/mentions-legales")
    const villeIndex = sitemap.indexOf("/alternance/ville/bordeaux")
    expect(legalIndex).toBeGreaterThan(-1)
    expect(villeIndex).toBeGreaterThan(-1)
    expect(legalIndex).toBeLessThan(villeIndex)
  })

  it("conserve les priorités des pages dynamiques (villes 0.95, fiches métiers 0.8)", () => {
    expect(sitemap).toContain(`<loc>https://${host}/alternance/ville/bordeaux</loc>\n<priority>0.95</priority>`)
    expect(sitemap).toContain(`<loc>https://${host}/metiers/developpeur-web</loc>\n<priority>0.8</priority>`)
  })
})
