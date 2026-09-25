import { describe, expect, it } from "vitest"

import { describeFeedbackTrigger } from "./feedbackTrigger.labels"

describe("describeFeedbackTrigger", () => {
  it("décrit chaque type de déclencheur", () => {
    expect(describeFeedbackTrigger({ type: "interactions", minInteractions: 1 })).toBe("après 1 interaction")
    expect(describeFeedbackTrigger({ type: "interactions", minInteractions: 3 })).toBe("après 3 interactions")
    expect(describeFeedbackTrigger({ type: "delay", delaySeconds: 30 })).toBe("après 30 secondes sur la page")
    expect(describeFeedbackTrigger({ type: "event", event: "application_abandoned" })).toBe("candidature commencée puis abandonnée")
  })
})
