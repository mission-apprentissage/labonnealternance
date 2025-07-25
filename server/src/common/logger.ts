import { Transform, Writable } from "node:stream"
import util from "util"

import bunyan from "bunyan"
import chalk from "chalk"
import { isEmpty, omit } from "lodash-es"

import config from "@/config"

function prettyPrintStream(outputName: "stdout" | "stderr") {
  const levels = {
    10: chalk.grey.bold("TRACE"),
    20: chalk.green.bold("DEBUG"),
    30: chalk.blue.bold("INFO"),
    40: chalk.yellow.bold("WARN"),
    50: chalk.red.bold("ERROR"),
    60: chalk.magenta.bold("FATAL"),
  }

  const transform = new Transform({
    objectMode: true,
    transform(raw, _, callback) {
      try {
        const stack = raw.err?.stack
        const message = stack ? `${raw.msg}\n${stack}` : raw.msg
        const rest = omit(raw, ["v", "level", "name", "hostname", "pid", "time", "msg", "src", "err.name", "err.stack", "err.message", "err.code", "err.signal", "context"])

        const params = [util.format("[%s][%s][%s] %s", raw.time.toISOString(), levels[raw.level], raw.context || "global", message)]

        if (!isEmpty(rest)) {
          params.push(chalk.gray(`\n${util.inspect(rest, { depth: null })}`))
        }

        callback(null, params)
      } catch (err: any) {
        callback(err)
      }
    },
  })

  const writer = new Writable({
    objectMode: true,
    write(data, _, callback) {
      console[outputName === "stdout" ? "log" : "error"](...data)
      callback()
    },
  })

  // Combine transform and writer into a duplex-like stream
  transform.pipe(writer)
  return transform
}

function sendLogsToConsole(outputName) {
  const { level, format } = config.log
  return format === "pretty" || format === "one-line"
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
      }
}

const createStreams = () => {
  const availableDestinations = {
    stdout: () => sendLogsToConsole("stdout"),
    stderr: () => sendLogsToConsole("stderr"),
  }

  return config.log.destinations
    .filter((type) => availableDestinations[type])
    .map((type) => {
      const createDestination = availableDestinations[type]
      return createDestination()
    })
}

export const logger = bunyan.createLogger({
  name: "lba",
  serializers: {
    ...bunyan.stdSerializers,
    err: function (err) {
      return {
        ...bunyan.stdSerializers.err(err),
        ...(err.errInfo ? { errInfo: err.errInfo } : {}),
      }
    },
  },
  streams: createStreams(),
})

export function getLoggerWithContext(context) {
  return logger.child({ context })
}
