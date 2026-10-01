import type { IFeedbackFormTrigger, IFeedbackTriggerEvent, IFeedbackTriggerType } from "shared/models/feedback-form.model"

export const TRIGGER_TYPE_LABEL: Record<IFeedbackTriggerType, string> = {
  interactions: "Après des interactions",
  delay: "Après un temps passé sur la page",
  event: "Sur un événement précis",
}

export const TRIGGER_EVENT_LABEL: Record<IFeedbackTriggerEvent, { label: string; hint: string }> = {
  application_abandoned: {
    label: "Candidature commencée puis abandonnée",
    hint: "Le formulaire de candidature simplifiée est ouvert puis fermé sans avoir été envoyé.",
  },
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`

/** « après 3 interactions », « après 30 secondes sur la page », « candidature commencée puis abandonnée ». */
export function describeFeedbackTrigger(trigger: Partial<Pick<IFeedbackFormTrigger, "type" | "minInteractions" | "delaySeconds" | "event">>): string {
  switch (trigger.type ?? "interactions") {
    case "interactions":
      return `après ${plural(trigger.minInteractions ?? 1, "interaction")}`
    case "delay":
      return `après ${plural(trigger.delaySeconds ?? 0, "seconde")} sur la page`
    case "event":
      return trigger.event ? TRIGGER_EVENT_LABEL[trigger.event].label.toLowerCase() : "sur un événement"
  }
}
