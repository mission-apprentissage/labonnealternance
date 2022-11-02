import assert from "assert";
import httpTests from "../../utils/httpTests.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que l'on transfert bien la requête au catalogue", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/catalogue/formations");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.formations);
    assert.ok(response.data.pagination);
  });
});
