// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands"

beforeEach(() => {
  ;["https://api.mapbox.com/**", "https://plausible.io/**"].map((url) => {
    cy.intercept(url, (req) => {
      req.reply({}) // Empty response
    })
  })
})

Cypress.on("uncaught:exception", (err) => {
  // Erreurs mapbox non bloquantes pour les tests
  if (err.message.includes("Failed to initialize WebGL")) {
    return false
  }
  if (err.message.includes("Cannot read properties of null (reading 'getLayer')")) {
    return false
  }
})
