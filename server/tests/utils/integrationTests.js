import { connectToMongoForTests, cleanAll } from "../utils/testUtils.js"

export default function (desc, cb) {
  describe(desc, function () {
    let context

    beforeEach(async () => {
      const { db } = await connectToMongoForTests()
      context = { db }
    })

    cb({ getContext: () => context })

    afterEach(cleanAll)
  })
}
