import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import SuccesDesinscription from "./SuccesDesinscription"

const findLink = (html: string, label: string) => html.match(/<a\b[^>]*>(?:(?!<\/a>).)*<\/a>/g)?.find((anchor) => anchor.includes(label))

describe("SuccesDesinscription", () => {
  it("renvoie le lien de financement vers le simulateur des aides, dans un nouvel onglet", () => {
    const html = renderToStaticMarkup(<SuccesDesinscription />)
    const link = findLink(html, "un financement gouvernemental")

    expect(link).toBeDefined()
    expect(link).toContain('href="https://travail-emploi.gouv.fr/aides-couts-salaire-le-simulateur-en-ligne-pour-les-employeurs-apprentis"')
    expect(link).toContain('target="_blank"')
    expect(link).toContain('rel="noopener noreferrer"')
    expect(link).toContain(" - nouvelle fenêtre")
    expect(html).not.toContain("alternance.emploi.gouv.fr")
  })

  it("structure les énumérations en listes et les intertitres en titres de niveau 2 (RGAA 9.1, 9.3)", () => {
    const html = renderToStaticMarkup(<SuccesDesinscription />)

    expect(html.match(/<ul\b/g)).toHaveLength(2)
    expect(html.match(/<li\b/g)).toHaveLength(7)
    expect(html).not.toContain("list-item")
    expect([...html.matchAll(/<h2\b[^>]*>([^<]*)<\/h2>/g)].map(([, text]) => text)).toEqual([
      "En complément, permettez-nous de vous expliquer notre fonctionnement.",
      "Votre établissement se situait dans la troisième catégorie.",
      "Le saviez-vous ?",
    ])
  })
})
