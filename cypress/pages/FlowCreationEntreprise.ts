export const FlowCreationEntreprise = {
  siretPage: {
    goTo() {
      cy.visit(`${Cypress.env("ui")}/espace-pro/creation/entreprise`)
    },
    fillSiret(siret: string) {
      cy.get("input[name='establishment_siret']").click()
      cy.get("input[name='establishment_siret']").type(siret)
    },
    searchAndSelectSiret(siret: string) {
      FlowCreationEntreprise.siretPage.fillSiret(siret)
      cy.contains(siret).click()
    },
    submit() {
      cy.get("button[type='submit']").click({ timeout: 10000 })
    },
  },
  personalInfosPage: {
    fillForm({ email, firstName, lastName, phone }: { firstName: string; lastName: string; email: string; phone: string }) {
      cy.contains("Informations légales", { timeout: 10000 }).should("exist")
      cy.get("input[name='last_name']").click()
      cy.get("input[name='last_name']").type(lastName)
      cy.get("input[name='first_name']").click()
      cy.get("input[name='first_name']").type(firstName)
      cy.get("input[name='phone']").click()
      cy.get("input[name='phone']").type(phone)
      cy.get("input[name='email'").click()
      cy.get("input[name='email'").type(email)
    },
    submit() {
      cy.get("button[type='submit']").click()
    },
    confirmAccountCreation() {
      cy.get("[data-testid='confirm-account-creation']", { timeout: 20000 }).click()
    },
  },
  offerPage: {
    assertUrl() {
      cy.url().should("contain", "/espace-pro/creation/offre?")
    },
    fillForm({
      romeLabel,
      studyLevel,
      contractType: { Apprentissage, Professionnalisation },
      startDate,
      isDisabledElligible,
      jobCount = 1,
      jobDurationInMonths,
    }: {
      romeLabel: string
      contractType: { Apprentissage?: true; Professionnalisation?: true }
      studyLevel: string
      startDate: string // format YYYY-MM-DD
      isDisabledElligible?: boolean
      jobCount?: number
      jobDurationInMonths: number
    }) {
      const typedRomeLabel = romeLabel.substring(0, romeLabel.length - 10)
      cy.intercept(`${Cypress.env("server")}/api/v1/metiers/intitule?label=${encodeURIComponent(typedRomeLabel).replace(/%20/g, "+")}`).as("romeSearch")

      cy.get("[data-testid='offre-metier'] input").click()
      cy.get("[data-testid='offre-metier'] input").type(typedRomeLabel)
      cy.wait("@romeSearch")
      // cy.get(`[data-testid='offre-metier'] #downshift-1-item-0 p:first-of-type`, { timeout: 10000 }).should("have.text", romeLabel)
      cy.get(`[data-testid='offre-metier'] [data-testid='${romeLabel}']`, { timeout: 20000 }).click({ timeout: 20000 })

      cy.get("[data-testid='offre-job-type'] [data-testid='Apprentissage']").click()
      if (Apprentissage) {
        cy.get("[data-testid='offre-job-type'] [data-testid='Apprentissage']").click()
      }
      if (Professionnalisation) {
        cy.get("[data-testid='offre-job-type'] [data-testid='Professionnalisation']").click()
      }

      cy.get(`select[name='job_level_label']`).select(studyLevel)
      cy.get("input[name='job_start_date']").type(startDate)
      if (isDisabledElligible) {
        cy.get("input[name='is_disabled_elligible'] + span").click()
      }
      if (jobCount !== 1) {
        for (let i = 0; i < jobCount; i++) {
          cy.get("[data-testid='offre-job-count'] [data-testid='+']").click()
        }
        cy.get("[data-testid='offre-job-count'] [data-testid='-']").click()
        cy.get("[data-testid='offre-job-count-value']").should("have.text", jobCount.toString())
      }
      cy.get("input[name='job_duration']").clear()
      cy.get("input[name='job_duration']").type(jobDurationInMonths.toString())
    },
    submit() {
      cy.get("[data-testid='creer-offre']").click()
    },
  },
  delegationPage: {
    selectCFAs(cfas: string[]) {
      cy.url().should("contain", Cypress.env("ui") + "/espace-pro/creation/mise-en-relation")
      ;[...new Array(10)].forEach((_, index) => {
        cy.get(`[data-testid='cfa-${index}'] input[type='checkbox']`).uncheck({ force: true })
      })
      cfas.forEach((cfa) => {
        cy.contains(cfa).should("have.text", cfa).parents("[data-testid^='cfa-']").find("input[type='checkbox']").check({ force: true })
      })
    },
    submitNoDelegation() {
      cy.get("[data-testid='pass-delegation']").click()
    },
    submit() {
      cy.get("[data-testid='submit-delegation']").click()
    },
  },
  emailSentPage: {
    verify(labels: string[]) {
      cy.url().should("contain", "/espace-pro/creation/fin")
      labels.forEach((label) => {
        cy.contains(label)
      })
    },
    goBackHome() {
      cy.get("button").contains("Retour à l'accueil").click()
      cy.url().should("equal", Cypress.env("ui") + "/acces-recruteur")
    },
    getJobId() {
      return cy.url().then((url) => {
        return new URLSearchParams(url.substring(url.indexOf("?"))).get("jobId")
      })
    },
  },
}
