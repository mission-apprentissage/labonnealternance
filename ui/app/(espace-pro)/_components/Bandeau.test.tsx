import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Bandeau } from "./Bandeau"

describe("Bandeau", () => {
  it("rend le titre en h2 par défaut", () => {
    const html = renderToStaticMarkup(<Bandeau type="error" header="Votre centre de formation est renseigné comme fermé." description="Contactez l’INSEE." />)

    expect(html).toMatch(/<h2 class="fr-alert__title">Votre centre de formation est renseigné comme fermé\.<\/h2>/)
  })

  it("rend le titre en paragraphe quand titleAs vaut p", () => {
    const html = renderToStaticMarkup(<Bandeau type="success" titleAs="p" header="Votre compte a été créé avec succès." description="Déposez votre offre dès maintenant." />)

    expect(html).toMatch(/<p class="fr-alert__title">Votre compte a été créé avec succès\.<\/p>/)
    expect(html).not.toMatch(/<h[1-6]\b/)
  })
})
