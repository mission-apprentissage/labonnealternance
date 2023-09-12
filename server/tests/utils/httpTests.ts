import axiosist from "axiosist"
import nock from "nock"
import createComponents from "../../src/common/components/components.js"
import server from "../../src/http/server.js"
import { createUser } from "../../src/services/user.service.js"
import { cleanAll, connectToMongoForTests } from "./testUtils.js"

//FIXME : issue https://github.com/mission-apprentissage/labonnealternance/issues/158
nock.enableNetConnect()
//nock.enableNetConnect("127.0.0.1");

const startServer = async () => {
  const { db } = await connectToMongoForTests()
  const components = await createComponents({ db })
  const app = await server(components)
  /**
   * issue with Axios > v1 : https://github.com/axios/axios/pull/5324, waiting for merge
   * ref: https://github.com/Gerhut/axiosist/issues/55
   */
  const httpClient = axiosist(app)

  // Allow localhost connections so we can test local routes and mock servers.

  return {
    httpClient,
    components,
    createAndLogUser: async (username, password, options) => {
      await createUser(username, password, options)

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      })

      return {
        Authorization: "Bearer " + response.data.token,
      }
    },
  }
}

export default function (desc, cb) {
  describe(desc, function () {
    cb({ startServer })
    afterEach(cleanAll)
  })
}
