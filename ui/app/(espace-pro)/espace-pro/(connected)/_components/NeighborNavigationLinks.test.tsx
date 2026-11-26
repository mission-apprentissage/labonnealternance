import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { NeighborNavigationLinks } from "./NeighborNavigationLinks"

describe("NeighborNavigationLinks", () => {
  it("lie les voisins et désactive le bouton de l'extrémité atteinte", () => {
    const html = renderToStaticMarkup(
      <NeighborNavigationLinks
        ariaLabel="Navigation entre les candidatures de l'offre"
        previous={{ href: null, label: "Candidature précédente" }}
        next={{ href: "/candidature/b", label: "Candidature suivante" }}
      />
    )

    expect(html).toMatch(/<nav[^>]*aria-label="Navigation entre les candidatures de l&#x27;offre"/)
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Candidature précédente<\/button>/)
    expect(html).toMatch(/<a[^>]*href="\/candidature\/b"[^>]*>Candidature suivante<\/a>/)
  })
})
