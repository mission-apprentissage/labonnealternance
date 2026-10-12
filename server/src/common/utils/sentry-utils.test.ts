import * as Sentry from "@sentry/node"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { withoutChildSpans } from "./sentry-utils"

const descendantNames = (span: Sentry.Span) => Sentry.getSpanDescendants(span).map((descendant) => Sentry.spanToJSON(descendant).description)

describe("withoutChildSpans", () => {
  beforeAll(() => {
    // Client réel avec traçage : sans client, aucune span n'est active et le test passerait à vide.
    Sentry.init({ dsn: "https://public@127.0.0.1:9/1", tracesSampleRate: 1, defaultIntegrations: false })
  })

  afterAll(async () => {
    await Sentry.close(0)
  })

  it("n'expose aucune span active au callback, contrairement à un appel direct", async () => {
    await Sentry.startSpan({ name: "job", op: "processor.job" }, async (jobSpan) => {
      expect(Sentry.getActiveSpan()).toBe(jobSpan)
      expect(withoutChildSpans(() => Sentry.getActiveSpan())).toBeUndefined()
    })
  })

  it("ne rattache pas à la span du job les spans créées dans le callback", async () => {
    await Sentry.startSpan({ name: "job", op: "processor.job" }, async (jobSpan) => {
      Sentry.startInactiveSpan({ name: "requête hors withoutChildSpans" }).end()
      withoutChildSpans(() => Sentry.startInactiveSpan({ name: "requête dans withoutChildSpans" }).end())

      expect(descendantNames(jobSpan)).toEqual(["job", "requête hors withoutChildSpans"])
    })
  })

  it("renvoie le résultat du callback", async () => {
    await expect(withoutChildSpans(async () => 42)).resolves.toBe(42)
  })
})
