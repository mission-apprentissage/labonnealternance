export const FlowItemList = {
  lbaCompanies: {
    openFirstWithEmail() {
      cy.url().should("contain", "/recherche?display=list")
      cy.url().then((url) => {
        const searchParams = new URL(url).searchParams
        const romes = searchParams.get("romes")
        const longitude = searchParams.get("lon")
        const latitude = searchParams.get("lat")
        const insee = searchParams.get("insee")
        const radius = searchParams.get("radius")
        const diploma = searchParams.get("diploma")
        const builtParams = new URLSearchParams()
        builtParams.append("romes", romes)
        builtParams.append("longitude", longitude)
        builtParams.append("latitude", latitude)
        builtParams.append("insee", insee)
        builtParams.append("radius", radius)
        builtParams.append("diploma", diploma)
        cy.request(`${Cypress.env("server")}/api/v1/jobs?sources=lba,matcha&caller=cypress&${builtParams.toString()}`).then((response) => {
          const json = response.body
          const resultWithEmail = json.lbaCompanies.results.find((result) => Boolean(result.contact.email))
          if (!resultWithEmail) {
            throw new Error("impossible de trouver une candidature spontanée avec un email")
          }
          const raisonSociale = resultWithEmail.title
          cy.get(".resultCard.lba").contains(raisonSociale).click()
        })
      })
    },
  },
  lbaJobs: {
    openFirst() {
      cy.get(".resultCard.matcha").first().click()
    },
  },
  formations: {
    openFirst() {
      cy.get(".resultCard.training").first().click()
    },
  },
}
