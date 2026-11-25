import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { OPCO_GUIDE_SECTIONS } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import GuideModerationOpcoPage, { metadata } from "./page"

const html = renderToStaticMarkup(<GuideModerationOpcoPage />)

describe("Guide de modération OPCO", () => {
  it("n'est pas indexé", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it("a un seul H1, une section H2 par entrée du sommaire et aucun autre titre", () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html.match(/<h2[\s>]/g)).toHaveLength(OPCO_GUIDE_SECTIONS.length)
    expect(html).not.toMatch(/<h[3-6][\s>]/)
  })

  it.each(OPCO_GUIDE_SECTIONS.map(({ id }) => id))("le sommaire mène à une section existante : %s", (id) => {
    expect(html).toContain(`href="#${id}"`)
    expect(html).toMatch(new RegExp(`<section[^>]* id="${id}"`))
  })

  it("propose le contact par mail et renvoie vers les comptes en attente", () => {
    expect(html).toContain('href="mailto:contact@labonnealternance.apprentissage.beta.gouv.fr"')
    expect(html).toMatch(/href="\/espace-pro\/opco"[^>]*>[^<]*(<[^>]+>)*Vérifier les comptes en attente/)
  })
})
