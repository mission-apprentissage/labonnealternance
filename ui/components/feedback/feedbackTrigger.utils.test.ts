import type { IFeedbackFormPublic } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import {
  findFeedbackFormForPath,
  incrementInteractionCount,
  isFeedbackInteraction,
  isFeedbackSuppressed,
  readFeedbackMemory,
  readInteractionCount,
  rememberFeedbackCompleted,
  rememberFeedbackDismissed,
  takeAnnouncement,
} from "./feedbackTrigger.utils"

const memoryStorage = () => {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) }
}
const brokenStorage = {
  getItem: () => {
    throw new Error("SecurityError")
  },
  setItem: () => {
    throw new Error("QuotaExceededError")
  },
}

const form = (slug: string, scope: string[]): IFeedbackFormPublic => ({ slug, version: 1, trigger: { minInteractions: 1, scope }, questions: [] })

describe("findFeedbackFormForPath", () => {
  const forms = [form("recherche", ["/recherche"]), form("formations", ["/formation/:id/:titre", "/guide-alternant/*"])]

  it("trouve le formulaire dont une page de déclenchement couvre le chemin", () => {
    expect(findFeedbackFormForPath(forms, "/recherche")?.slug).toBe("recherche")
    expect(findFeedbackFormForPath(forms, "/formation/123/cap")?.slug).toBe("formations")
    expect(findFeedbackFormForPath(forms, "/guide-alternant/remuneration")?.slug).toBe("formations")
  })

  it("renvoie null hors de toute page de déclenchement", () => {
    expect(findFeedbackFormForPath(forms, "/")).toBeNull()
    expect(findFeedbackFormForPath([], "/recherche")).toBeNull()
  })
})

describe("isFeedbackSuppressed", () => {
  const now = new Date("2026-09-24T12:00:00Z")

  it("propose un formulaire jamais écarté ni répondu", () => {
    expect(isFeedbackSuppressed({}, now)).toBe(false)
  })

  it("ne repropose jamais un formulaire répondu", () => {
    expect(isFeedbackSuppressed({ completedVersion: 1, dismissedAt: "2020-01-01T00:00:00Z" }, now)).toBe(true)
  })

  it("écarte un formulaire pendant 30 jours", () => {
    expect(isFeedbackSuppressed({ dismissedAt: "2026-09-01T12:00:00Z" }, now)).toBe(true)
    expect(isFeedbackSuppressed({ dismissedAt: "2026-08-25T12:00:00Z" }, now)).toBe(false)
  })
})

describe("mémoire du navigateur", () => {
  it("retient l'écartement et la réponse", () => {
    const storage = memoryStorage()
    rememberFeedbackDismissed("recherche", new Date("2026-09-24T12:00:00Z"), storage)
    rememberFeedbackCompleted("recherche", 2, storage)

    expect(readFeedbackMemory("recherche", storage)).toEqual({ dismissedAt: "2026-09-24T12:00:00.000Z", completedVersion: 2 })
    expect(readFeedbackMemory("autre", storage)).toEqual({})
  })

  it("cumule les interactions par formulaire", () => {
    const storage = memoryStorage()
    incrementInteractionCount("recherche", storage)
    expect(incrementInteractionCount("recherche", storage)).toBe(2)
    expect(readInteractionCount("autre", storage)).toBe(0)
  })

  it("n'annonce le bouton qu'une fois", () => {
    const storage = memoryStorage()
    expect(takeAnnouncement("recherche", storage)).toBe(true)
    expect(takeAnnouncement("recherche", storage)).toBe(false)
  })

  it("ne plante pas quand le stockage est indisponible", () => {
    expect(() => rememberFeedbackDismissed("recherche", new Date(), brokenStorage)).not.toThrow()
    expect(readFeedbackMemory("recherche", brokenStorage)).toEqual({})
    expect(incrementInteractionCount("recherche", brokenStorage)).toBe(1)
    expect(readFeedbackMemory("recherche", null)).toEqual({})
  })
})

describe("isFeedbackInteraction", () => {
  // simule `Element.closest` : `ancestors` liste les sélecteurs que l'élément ou un parent satisfait
  const target = (...ancestors: ("interactive" | "header" | "launcher")[]) => ({
    closest: (selector: string) =>
      (selector.startsWith("a[href]") && ancestors.includes("interactive")) || (selector.startsWith("header") && (ancestors.includes("header") || ancestors.includes("launcher"))),
  })

  it("compte un clic sur un élément interactif du contenu", () => {
    expect(isFeedbackInteraction(target("interactive"))).toBe(true)
  })

  it("ignore un clic hors élément interactif", () => {
    expect(isFeedbackInteraction(target())).toBe(false)
    expect(isFeedbackInteraction(null)).toBe(false)
  })

  it("ignore l'en-tête, le pied de page, le bandeau de consentement et le widget", () => {
    expect(isFeedbackInteraction(target("interactive", "header"))).toBe(false)
    expect(isFeedbackInteraction(target("interactive", "launcher"))).toBe(false)
  })
})
