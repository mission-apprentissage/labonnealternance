import { Writable } from "node:stream"
import pino from "pino"
import { describe, expect, it } from "vitest"
import { enterRequestLoggerContext } from "@/common/logger"
import { manageApiError } from "./error-manager"

describe("manageApiError pendant une requête HTTP", () => {
  it("journalise une ligne JSON portant le reqId de la requête", async () => {
    const lines: string[] = []
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString())
        callback()
      },
    })
    const requestLogger = pino({ level: "info" }, destination).child({ reqId: "req-42" })
    enterRequestLoggerContext(requestLogger)

    await manageApiError({ error: new Error("boom"), api_path: "applicationV2", errorTitle: "error_sending_application" })

    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0])).toMatchObject({
      level: 50,
      reqId: "req-42",
      errorTitle: "error_sending_application",
      api_path: "applicationV2",
      message: "boom",
      msg: "error_sending_application",
    })
  })
})
