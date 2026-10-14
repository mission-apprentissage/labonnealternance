import type { IFeedbackTriggerEvent } from "shared/models/feedback-form.model"

const EVENT_NAME = "lba:feedback-event"

/**
 * Signale un parcours du site qui peut déclencher un formulaire de feedback (cf.
 * FEEDBACK_TRIGGER_EVENTS). Découplé du widget : la page émet, `useFeedbackTrigger` décide.
 */
export function emitFeedbackEvent(event: IFeedbackTriggerEvent): void {
  window.dispatchEvent(new CustomEvent<IFeedbackTriggerEvent>(EVENT_NAME, { detail: event }))
}

export function onFeedbackEvent(listener: (event: IFeedbackTriggerEvent) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<IFeedbackTriggerEvent>).detail)
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
