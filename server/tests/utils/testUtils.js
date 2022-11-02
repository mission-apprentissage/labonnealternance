import server from "../../src/http/server.ts";
import axiosist from "axiosist"; // eslint-disable-line node/no-unpublished-import

export async function startServer() {
  const app = await server();
  const httpClient = axiosist(app);

  return {
    httpClient,
  };
}
