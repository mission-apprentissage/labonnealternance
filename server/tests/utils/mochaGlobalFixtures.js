import "./testConfig.js";
import nock from "nock"; // eslint-disable-line node/no-unpublished-import
import { stopMongod, removeAll, startMongod } from "./mongoMemoryServer.js";

nock.disableNetConnect();
nock.enableNetConnect((host) => {
  return host.startsWith("127.0.0.1") || host.indexOf("fastdl.mongodb.org") !== -1;
});

export function mochaGlobalSetup() {
  return startMongod();
}

export const mochaHooks = {
  afterEach: async function () {
    nock.cleanAll();
    return removeAll();
  },
};

export function mochaGlobalTeardown() {
  return stopMongod();
}
