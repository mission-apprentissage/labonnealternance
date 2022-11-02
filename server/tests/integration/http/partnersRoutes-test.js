import assert from "assert";
import httpTests from "../../utils/httpTests.js";

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que l'on expose bien les id_parcoursup disponibles sur le catalogue", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/partners/parcoursup/formations");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.ids);
  });
});
