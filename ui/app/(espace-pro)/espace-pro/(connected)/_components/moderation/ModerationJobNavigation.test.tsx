import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ModerationJobNavigationLinks } from "./ModerationJobNavigation"

const PREVIOUS = "6ad734de852d3675eb942548"
const NEXT = "6ad734de852d3675eb942549"

describe("ModerationJobNavigationLinks", () => {
  it("lie les offres voisines vers la page de modération du bon espace", () => {
    const admin = renderToStaticMarkup(<ModerationJobNavigationLinks previous={PREVIOUS} next={NEXT} userType="ADMIN" />)
    const opco = renderToStaticMarkup(<ModerationJobNavigationLinks previous={PREVIOUS} next={NEXT} userType="OPCO" />)

    expect(admin).toContain(`href="/espace-pro/administration/offres-a-moderer/${PREVIOUS}"`)
    expect(admin).toContain(`href="/espace-pro/administration/offres-a-moderer/${NEXT}"`)
    expect(opco).toContain(`href="/espace-pro/opco/offres-a-moderer/${NEXT}"`)
    expect(admin).not.toContain("disabled")
  })

  it("désactive le bouton de l'extrémité atteinte, sans lien", () => {
    const html = renderToStaticMarkup(<ModerationJobNavigationLinks previous={null} next={NEXT} userType="ADMIN" />)

    expect(html).toMatch(/<button[^>]*disabled[^>]*>Offre précédente<\/button>/)
    expect(html).toMatch(/<a[^>]*href="\/espace-pro\/administration\/offres-a-moderer\/6ad734de852d3675eb942549"[^>]*>Offre suivante<\/a>/)
    expect(html.match(/href=/g)).toHaveLength(1)
  })
})
