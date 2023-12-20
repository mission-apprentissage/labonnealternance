export function addMongoPluginCommands() {
  Cypress.Commands.add("deleteMany", (filter, { collection }) => {
    return cy
      .task("executeMongoDb", {
        commandName: "deleteMany",
        args: [filter],
        collection,
      })
      .then((result) => result)
  })
}
