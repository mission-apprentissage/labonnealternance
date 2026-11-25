import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { OPCO_GUIDE_SECTIONS } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { structureOpcoGuide } from "../_lib/notion-guide"
import { block, heading2, paragraph, text } from "../_lib/notion-guide.fixtures"
import { OpcoGuideView } from "./OpcoGuideView"

vi.mock("server-only", () => ({}))

const fixtureGuide = () => {
  const sections = OPCO_GUIDE_SECTIONS.flatMap((_, index) => [heading2(`${index + 1}. Titre Notion ${index + 1}`), paragraph(text(`Texte fictif ${index + 1}`))])
  sections.splice(
    3,
    0,
    paragraph(text("Masque "), text("emxxx@xxx.fr", { href: "mailto:emxxx@xxx.fr" }), text(" et "), text("page interne", { href: "https://www.notion.so/page-123" })),
    block("table", { has_column_header: true }, [block("table_row", { cells: [[text("Colonne fictive")]] }), block("table_row", { cells: [[text("Cellule fictive")]] })]),
    block("toggle", { rich_text: [text("Question fictive")] }, [paragraph(text("Réponse fictive"))]),
    block("video")
  )
  const result = structureOpcoGuide([paragraph(text("Chapeau fictif")), ...sections])
  if (result.status !== "ok") throw new Error(result.reason)
  return result.guide
}

const headingsOf = (html: string) => ({ h1: html.match(/<h1[\s>]/g)?.length ?? 0, h2: html.match(/<h2[\s>]/g)?.length ?? 0 })

describe("OpcoGuideView, contenu Notion disponible", () => {
  const html = renderToStaticMarkup(<OpcoGuideView guide={fixtureGuide()} />)

  it("garde un seul H1 et une section H2 par entrée du sommaire, titrée depuis Notion", () => {
    expect(headingsOf(html)).toEqual({ h1: 1, h2: OPCO_GUIDE_SECTIONS.length })
    expect(html).toContain("1. Titre Notion 1")
  })

  it.each(OPCO_GUIDE_SECTIONS.map(({ id }) => id))("le sommaire mène à une section existante : %s", (id) => {
    expect(html).toContain(`href="#${id}"`)
    expect(html).toMatch(new RegExp(`<section[^>]* id="${id}"`))
  })

  it("rend tableaux et questions dépliables en composants DSFR", () => {
    expect(html).toContain("fr-table")
    expect(html).toContain("fr-accordion")
    expect(html).toContain("Réponse fictive")
  })

  it("ne fait pas de lien vers l'exemple masqué ni vers l'espace Notion", () => {
    expect(html).toContain("emxxx@xxx.fr")
    expect(html).not.toContain("mailto:emxxx")
    expect(html).not.toContain("notion.so")
  })

  it("n'affiche pas le contenu de secours", () => {
    expect(html).not.toContain("Contenu momentanément indisponible")
    expect(html).toMatch(/href="\/espace-pro\/opco"[^>]*>[^<]*(<[^>]+>)*Vérifier les comptes en attente/)
  })
})

describe("OpcoGuideView, contenu indisponible", () => {
  const html = renderToStaticMarkup(<OpcoGuideView guide={null} />)

  it("garde la structure et les ancres de la page", () => {
    expect(headingsOf(html)).toEqual({ h1: 1, h2: OPCO_GUIDE_SECTIONS.length })
    for (const { id } of OPCO_GUIDE_SECTIONS) expect(html).toMatch(new RegExp(`<section[^>]* id="${id}"`))
  })

  it("annonce l'indisponibilité et garde le contact et le CTA", () => {
    expect(html).toContain("Contenu momentanément indisponible")
    expect(html).toContain('href="mailto:contact@labonnealternance.apprentissage.beta.gouv.fr"')
    expect(html).toContain("Vérifier les comptes en attente")
  })
})
