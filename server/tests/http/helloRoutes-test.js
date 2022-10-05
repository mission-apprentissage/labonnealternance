import assert from "assert";
import { startServer } from "../utils/testUtils.js";

describe("helloRoute", () => {
  it("Vérifie que la route fonctionne", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/hello");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.hello, []);
  });

  it("Vérifie qu'on peut passer des messages", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/hello?messages=world");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.hello, ["world"]);
  });
});
