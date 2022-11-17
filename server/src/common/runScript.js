import { isEmpty } from "lodash-es";
import { access, mkdir } from "node:fs/promises";
import prettyMilliseconds from "pretty-ms";
import createComponents from "../common/components/components.js";
import config from "../config.js";
import { getLoggerWithContext } from "./logger.js";
import { closeMongoConnection } from "./mongodb.js";

const logger = getLoggerWithContext("script");

process.on("unhandledRejection", (e) => logger.error(e));
process.on("uncaughtException", (e) => logger.error(e));
process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
});

const createTimer = () => {
  let launchTime;
  return {
    start: () => {
      launchTime = new Date().getTime();
    },
    stop: (results) => {
      const duration = prettyMilliseconds(new Date().getTime() - launchTime);
      const data = results && results.toJSON ? results.toJSON() : results;
      if (!isEmpty(data)) {
        logger.info(JSON.stringify(data, null, 2));
      }
      logger.info(`Completed in ${duration}`);
    },
  };
};

const ensureOutputDirExists = async () => {
  const outputDir = config.outputDir;
  try {
    await access(outputDir);
  } catch (e) {
    if (e.code !== "EEXIST") {
      await mkdir(outputDir, { recursive: true });
    }
  }
  return outputDir;
};

const exit = async (scriptError) => {
  if (scriptError) {
    logger.error(scriptError.constructor.name === "EnvVarError" ? scriptError.message : scriptError);
    process.exitCode = 1;
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongoConnection().catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
  }, 250);
};

async function runScript(job) {
  try {
    const timer = createTimer();
    timer.start();

    await ensureOutputDirExists();

    const components = await createComponents();
    const results = await job(components);

    timer.stop(results);
    await exit();
  } catch (e) {
    await exit(e);
  }
}

export { runScript };
