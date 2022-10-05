import util from "util";
import { throttle, omit, isEmpty } from "lodash-es";
import bunyan from "bunyan";
import BunyanSlack from "bunyan-slack";
import chalk from "chalk"; // eslint-disable-line node/no-unpublished-import
import { compose, writeData, transformData } from "oleoduc";
import config from "../config.js";

function prettyPrintStream(outputName) {
  let levels = {
    10: chalk.grey.bold("TRACE"),
    20: chalk.green.bold("DEBUG"),
    30: chalk.blue.bold("INFO"),
    40: chalk.yellow.bold("WARN"),
    50: chalk.red.bold("ERROR"),
    60: chalk.magenta.bold("FATAL"),
  };

  return compose(
    transformData((raw) => {
      let stack = raw.err?.stack;
      let message = stack ? `${raw.msg}\n${stack}` : raw.msg;
      let rest = omit(raw, [
        //Bunyan core fields https://github.com/trentm/node-bunyan#core-fields
        "v",
        "level",
        "name",
        "hostname",
        "pid",
        "time",
        "msg",
        "src",
        //Error fields already serialized with https://github.com/trentm/node-bunyan#standard-serializers
        "err.name",
        "err.stack",
        "err.message",
        "err.code",
        "err.signal",
        //Misc
        "context",
      ]);

      let params = [
        util.format("[%s][%s][%s] %s", raw.time.toISOString()),
        levels[raw.level],
        raw.context || "global",
        message,
      ];
      if (!isEmpty(rest)) {
        params.push(chalk.gray(`\n${util.inspect(rest, { depth: null })}`));
      }
      return params;
    }),
    writeData((data) => console[outputName === "stdout" ? "log" : "error"](...data))
  );
}

function sendLogsToConsole(outputName) {
  const { level, format } = config.log;
  return format === "pretty"
    ? {
        type: "raw",
        name: outputName,
        level,
        stream: prettyPrintStream(outputName),
      }
    : {
        name: outputName,
        level,
        stream: process[outputName],
      };
}

function sendLogsToSlack() {
  const stream = new BunyanSlack(
    {
      webhook_url: config.slackWebhookUrl,
      customFormatter: (record, levelName) => {
        if (record.type === "http") {
          record = {
            url: record.request.url.relative,
            statusCode: record.response.statusCode,
            ...(record.error ? { message: record.error.message } : {}),
          };
        }
        return {
          text: util.format(`[%s][${config.env}] %O`, levelName.toUpperCase(), record),
        };
      },
    },
    (error) => {
      console.error("Unable to send log to slack", error);
    }
  );

  stream.write = throttle(stream.write, 5000);

  return {
    name: "slack",
    level: "error",
    stream,
  };
}

const createStreams = () => {
  let availableDestinations = {
    stdout: () => sendLogsToConsole("stdout"),
    stderr: () => sendLogsToConsole("stderr"),
    slack: () => sendLogsToSlack(),
  };

  return config.log.destinations
    .filter((type) => availableDestinations[type])
    .map((type) => {
      let createDestination = availableDestinations[type];
      return createDestination();
    });
};

export const logger = bunyan.createLogger({
  name: "trajectoire-pro",
  serializers: {
    ...bunyan.stdSerializers,
    err: function (err) {
      return {
        ...bunyan.stdSerializers.err(err),
        ...(err.errInfo ? { errInfo: err.errInfo } : {}),
      };
    },
  },
  streams: createStreams(),
});

export function getLoggerWithContext(context) {
  return logger.child({ context });
}
