import { generateRandomString } from "../utils/generateRandomString"

export const givenAMatchaOffer = (callback?: (job: any) => void) => {
  const apiKey = Cypress.env("SERVER_API_KEY")

  cy.request({
    method: "POST",
    url: Cypress.env("server") + "/api/v1/jobs/establishment",
    headers: {
      authorization: apiKey,
    },
    body: {
      first_name: "John",
      last_name: "Doe",
      phone: "0612345678",
      email: `john.doe+${generateRandomString(10)}@gmail.com`,
      establishment_siret: "42476141900045", // ovh
    },
  }).then((response) => {
    const entreprise = response.body
    cy.request({
      method: "POST",
      url: Cypress.env("server") + `/api/v1/jobs/${entreprise.establishment_id}`,
      headers: {
        authorization: apiKey,
      },
      body: {
        job_level_label: "Indifférent",
        job_duration: 12,
        job_count: 1,
        job_type: ["Apprentissage"],
        is_disabled_elligible: true,
        job_start_date: "2025-12-21",
        appellation_code: "12509", // Chef d'exploitation agricole
      },
    }).then((jobResponse) => {
      if (jobResponse.body.error) {
        throw new Error("error creating the offer")
      }
      callback?.(jobResponse.body)
    })
  })
}
