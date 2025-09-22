const diplomaMap = {
  "3 (CAP...)": "Cap, autres formations niveau (Infrabac)",
  "4 (BAC...)": "BP, Bac, autres formations niveau (Bac)",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6 (Licence, BUT...)": "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveau (Bac+5)",
}

type Diploma = keyof typeof diplomaMap

export const SearchForm = {
  goToHome() {
    cy.visit(Cypress.env("ui"))
  },
  goToSearchFormation() {
    cy.visit(Cypress.env("ui") + "/recherche-formation")
  },
  fillSearch({ metier, location, distance, niveauEtude }: { metier?: string; location?: string; distance?: 10 | 30 | 60 | 100; niveauEtude?: Diploma }) {
    if (metier) {
      cy.get("#headerFormJobField-input").click()
      cy.get("#headerFormJobField-input").type(metier.substring(0, 15))
      cy.get("#headerFormJobField-item-0", { timeout: 10000 }).should("have.text", metier)
      cy.get("#headerFormJobField-item-0").click()
    }
    if (location) {
      cy.get("#headerFormPlaceField-input").click()
      cy.get("#headerFormPlaceField-input").type(location.substring(0, 4))
      cy.get("#headerFormPlaceField-item-0", { timeout: 10000 }).should("have.text", location)
      cy.get("#headerFormPlaceField-item-0").click()
    }
    if (distance) {
      cy.get("[data-testid='widget-form'] select[data-testid='locationRadius']").select(distance.toString())
    }
    if (niveauEtude) {
      cy.get("[data-testid='widget-form'] select[data-testid='diploma']").select(niveauEtude)
    }
  },
  submit() {
    cy.get("[data-testid='widget-form'] button").click()
  },
  uncheckFormations() {
    cy.get("[data-testid='checkbox-filter-trainings']").click({ multiple: true, force: true })
  },
}
