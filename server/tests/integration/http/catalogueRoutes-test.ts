import assert from "assert"
import __filename from "../../../src/common/filename.js"
import httpTests from "../../utils/httpTests.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que l'on récupère bien les données de formation depuis la base de données", async () => {
    const { httpClient } = await startServer()

    const formations = await httpClient.get("/api/catalogue/formations")

    assert.ok(formations)
  })
})
