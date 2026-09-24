"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useReducer, useState } from "react"
import type { IFeedbackFormPublic } from "shared/models/feedback-form.model"
import { ZFeedbackFormPublic } from "shared/models/feedback-form.model"
import { z } from "zod"

import { useIsWidget } from "@/app/hooks/use-is-widget"
import { apiGet } from "@/utils/api.utils"

import {
  findFeedbackFormForPath,
  hasEngaged,
  incrementInteractionCount,
  isFeedbackInteraction,
  isFeedbackSuppressed,
  markEngaged,
  readFeedbackMemory,
  readInteractionCount,
  rememberFeedbackCompleted,
  rememberFeedbackDismissed,
} from "./feedbackTrigger.utils"

// une seule requête par chargement de l'application ; en cas d'échec, on n'insiste pas : pas de widget
let activeFormsPromise: Promise<IFeedbackFormPublic[]> | null = null
const loadActiveForms = () =>
  (activeFormsPromise ??= apiGet("/feedback-forms/active", {})
    .then(({ forms }) => z.array(ZFeedbackFormPublic).parse(forms))
    .catch(() => []))

export type IFeedbackTrigger = {
  /** Formulaire actif de la page courante, proposé ou non. */
  form: IFeedbackFormPublic | null
  /** Seuil d'interactions atteint, ni écarté ni déjà répondu : le bouton peut apparaître. */
  ready: boolean
  dismiss: () => void
  complete: () => void
}

/**
 * Décide si le bouton « Donner mon avis » apparaît sur la page courante.
 *
 * Aucune requête au chargement : les formulaires actifs ne sont récupérés qu'à la première
 * interaction de la session (cf. `isFeedbackInteraction`), puis chaque interaction sur une page
 * de déclenchement incrémente le compteur du formulaire. Jamais dans le widget embarqué chez un
 * partenaire (iframe).
 */
export function useFeedbackTrigger(): IFeedbackTrigger {
  const pathname = usePathname()
  const isEmbedded = useIsWidget()
  const [forms, setForms] = useState<IFeedbackFormPublic[] | null>(null)
  // compteurs et mémoire vivent dans le stockage du navigateur : ce compteur de rendu force leur relecture
  const [, refresh] = useReducer((tick: number) => tick + 1, 0)

  useEffect(() => {
    if (isEmbedded) return
    if (hasEngaged()) loadActiveForms().then(setForms)

    const onInteraction = (event: Event) => {
      if (!event.isTrusted || !isFeedbackInteraction(event.target as Element | null)) return
      // le chemin au moment du clic : un lien aura changé de page avant la fin du chargement
      const path = window.location.pathname
      markEngaged()
      loadActiveForms().then((loaded) => {
        setForms(loaded)
        const target = findFeedbackFormForPath(loaded, path)
        if (target) {
          incrementInteractionCount(target.slug)
          refresh()
        }
      })
    }
    document.addEventListener("click", onInteraction, true)
    return () => document.removeEventListener("click", onInteraction, true)
  }, [isEmbedded])

  const form = !isEmbedded && forms ? findFeedbackFormForPath(forms, pathname) : null
  const ready = form !== null && readInteractionCount(form.slug) >= form.trigger.minInteractions && !isFeedbackSuppressed(readFeedbackMemory(form.slug))

  const slug = form?.slug
  const version = form?.version
  const dismiss = useCallback(() => {
    if (!slug) return
    rememberFeedbackDismissed(slug)
    refresh()
  }, [slug])
  const complete = useCallback(() => {
    if (!slug || version === undefined) return
    rememberFeedbackCompleted(slug, version)
    refresh()
  }, [slug, version])

  return { form, ready, dismiss, complete }
}
