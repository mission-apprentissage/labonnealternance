"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"
import type { IFeedbackFormPublic } from "shared/models/feedback-form.model"

import { apiPost, apiPut } from "@/utils/api.utils"
import type { IFeedbackWidgetProgress } from "./FeedbackWidget"
import { getFeedbackPageContext } from "./feedbackTrigger.utils"
import { toFeedbackAnswerList } from "./feedbackWidget.utils"

type IResponseSession = { response_id: string; token: string }

/**
 * Enregistrement côté serveur : une apparition du bouton par page vue, un parcours créé à
 * l'ouverture du panneau, puis l'état complet du parcours à chaque étape. Les appels sont mis en
 * file pour arriver dans l'ordre. Un échec réseau n'interrompt jamais l'usager : sa réponse est
 * simplement perdue.
 */
export function useFeedbackSession(form: IFeedbackFormPublic | null, ready: boolean) {
  const pathname = usePathname()
  const displayRef = useRef<{ key: string; id: Promise<string | null> } | null>(null)
  const responseRef = useRef<Promise<IResponseSession | null> | null>(null)
  const queueRef = useRef<Promise<unknown>>(Promise.resolve())

  const slug = form?.slug
  useEffect(() => {
    // nouveau formulaire, nouveau parcours
    responseRef.current = null
  }, [slug])

  useEffect(() => {
    if (!form || !ready) return
    const key = `${form.slug}|${pathname}`
    if (displayRef.current?.key === key) return
    const context = getFeedbackPageContext(form, pathname, new URLSearchParams(window.location.search))
    if (!context) return
    displayRef.current = {
      key,
      id: apiPost("/feedback-forms/:slug/displays", { params: { slug: form.slug }, body: context })
        .then(({ display_id }) => display_id)
        .catch(() => null),
    }
  }, [form, ready, pathname])

  const start = useCallback(() => {
    if (!form || responseRef.current || !displayRef.current) return
    const formSlug = form.slug
    responseRef.current = displayRef.current.id
      .then((displayId) => (displayId ? apiPost("/feedback-forms/:slug/responses", { params: { slug: formSlug }, body: { display_id: displayId } }) : null))
      .catch(() => null)
  }, [form])

  const save = useCallback(
    (progress: IFeedbackWidgetProgress) => {
      const session = responseRef.current
      if (!form || !session || progress.status === "closed") return
      const answers = toFeedbackAnswerList(form.questions, progress.answers)
      queueRef.current = queueRef.current
        .then(async () => {
          const response = await session
          if (response) {
            await apiPut("/feedback-responses/:id", { params: { id: response.response_id }, body: { token: response.token, answers, skipped: progress.skipped } })
          }
        })
        .catch(() => undefined)
    },
    [form]
  )

  return { start, save }
}
