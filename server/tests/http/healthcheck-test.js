import assert from "assert";
import { startServer } from "../utils/testUtils.js";

describe("healthcheckRoutes", () => {
  it("Vérifie que le server fonctionne", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.healthcheck.mongodb, true);
    assert.ok(response.data.env);
    assert.ok(response.data.version);
  });
});
