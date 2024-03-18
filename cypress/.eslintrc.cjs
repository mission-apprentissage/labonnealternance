module.exports = {
  extends: ["plugin:cypress/recommended"],
  rules: {
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["cypress/e2e/**/*.cy.ts"],
        optionalDependencies: false,
      },
    ],
  },
}
