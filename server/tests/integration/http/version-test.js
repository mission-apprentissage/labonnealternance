import assert from "assert";
import httpTests from "../../utils/httpTests.js";
import isSemver from "is-semver";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url)

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que la route répond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/version");

    assert.strictEqual(response.status, 200);
  });

  it("Vérifie que la route répond avec une version au format semver", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/version");

    assert(isSemver(response.data.version));
  });
});
