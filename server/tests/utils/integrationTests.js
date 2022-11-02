import { connectToMongoForTests, cleanAll } from "./testUtils.js";
import createComponents from "../../src/common/components/components.js";
import { nockApis } from "./nockApis/index.js";

export default (desc, cb) => {
  describe(desc, function () {
    let context;

    beforeEach(async () => {
      let [{ db }] = await Promise.all([connectToMongoForTests()]);
      const components = await createComponents({ db });
      context = { db, components };
      await nockApis();
    });

    cb({ getContext: () => context });

    afterEach(cleanAll);
  });
};
