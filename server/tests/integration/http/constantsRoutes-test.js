import assert from "assert";
import httpTests from "../../utils/httpTests.js";

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que l'on expose bien l'ensemble des constantes", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/constants");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.referrers);
  });
});
