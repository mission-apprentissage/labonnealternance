/* eslint-disable node/no-unpublished-require */
import axiosist from "axiosist";
import createComponents from "../../src/common/components/components.js";
import { connectToMongoForTests, cleanAll } from "./testUtils.js";
import server from "../../src/http/server";
import { nockApis } from "./nockApis/index.js";

const startServer = async () => {
  const { db } = await connectToMongoForTests();
  const components = await createComponents({ db });
  const app = await server(components);
  const httpClient = axiosist(app);

  return {
    httpClient,
    components,
    createAndLogUser: async (username, password, options) => {
      await components.users.createUser(username, password, options);

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      });

      return {
        Authorization: "Bearer " + response.data.token,
      };
    },
  };
};

export default (desc, cb) => {
  describe(desc, function () {
    beforeEach(async () => {
      await nockApis();
    });
    cb({ startServer });
    afterEach(cleanAll);
  });
};
