import assert from "assert";
import httpTests from "../../utils/httpTests.js";
import config from "../../../src/config.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url)

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que le server fonctionne", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.healthcheck.mongodb, true);
  });
});
