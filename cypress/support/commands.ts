// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

//Exemple issu de BAL
/*Cypress.Commands.add("loginAsUser", () => {
    cy.request(
        "POST",
        "https://bal-recette.apprentissage.beta.gouv.fr/api/auth/login",
        {
        email: Cypress.env("email_user"),
        password: Cypress.env("password_user"),
        }
    );
});*/
