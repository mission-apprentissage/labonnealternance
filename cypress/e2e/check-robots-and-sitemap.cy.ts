describe("Test du fichier robots.txt", () => {
  it('Vérifie que robots.txt commence par "User-agent: *"', () => {
    cy.request(`${Cypress.env("ui")}/robots.txt`) // Envoyer une requête pour obtenir le contenu de robots.txt
      .then((response) => {
        // Vérifier si la réponse est réussie et le contenu est non vide
        expect(response.status).to.equal(200)
        expect(response.body).to.not.be.empty

        // Séparer les lignes du contenu
        const lines = response.body.split("\r\n")

        // Vérifier si la première ligne commence par "User-agent: *"
        const firstLine = lines[0]
        expect(firstLine).to.equal("User-agent: *")
      })
  })
})

describe("Test du fichier sitemap.xml", () => {
  it('Vérifie que sitemap.xml contient "<urlset', () => {
    cy.request(`${Cypress.env("ui")}/sitemap.xml`) // Envoyer une requête pour obtenir le contenu de robots.txt
      .then((response) => {
        // Vérifier si la réponse est réussie et le contenu est non vide
        expect(response.status).to.equal(200)
        expect(response.body).to.not.be.empty

        expect(response.body).to.contains("<urlset")
      })
  })
})
