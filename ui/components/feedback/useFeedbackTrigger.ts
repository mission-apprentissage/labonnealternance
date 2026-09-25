"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import type { IFeedbackFormPublic } from "shared/models/feedback-form.model"
import { getFeedbackTriggerType, ZFeedbackFormPublic } from "shared/models/feedback-form.model"
import { z } from "zod"

import { useIsWidget } from "@/app/hooks/use-is-widget"
import { apiGet } from "@/utils/api.utils"

import { onFeedbackEvent } from "./feedbackEvents"
import {
  findFeedbackFormForPath,
  incrementInteractionCount,
  isFeedbackInteraction,
  isFeedbackSuppressed,
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
  /** Déclencheur atteint, formulaire ni écarté ni déjà répondu : le bouton peut apparaître. */
  ready: boolean
  dismiss: () => void
  complete: () => void
}

/**
 * Décide si le bouton « Donner mon avis » apparaît sur la page courante, selon le type de
 * déclencheur du formulaire actif de la page :
 * - `interactions` : clics sur des éléments interactifs (cf. `isFeedbackInteraction`), cumulés sur la session ;
 * - `delay` : secondes passées sur la page, onglet visible ; le compte repart à zéro à chaque page ;
 * - `event` : événement émis par la page (cf. `emitFeedbackEvent`), valable pour la page vue.
 *
 * Les formulaires actifs sont récupérés une fois, quand le navigateur est inactif après le premier
 * affichage : le déclencheur par temps doit pouvoir partir sans aucune interaction. Jamais dans le
 * widget embarqué chez un partenaire (iframe).
 */
export function useFeedbackTrigger(): IFeedbackTrigger {
  const pathname = usePathname()
  const isEmbedded = useIsWidget()
  const [forms, setForms] = useState<IFeedbackFormPublic[] | null>(null)
  // compteurs et mémoire vivent dans le stockage du navigateur : ce compteur de rendu force leur relecture
  const [, refresh] = useReducer((tick: number) => tick + 1, 0)
  // pages vues (formulaire + chemin) où le temps est écoulé ou l'événement survenu
  const [reachedPages, setReachedPages] = useState<string[]>([])
  const markReached = useCallback((key: string) => setReachedPages((previous) => (previous.includes(key) ? previous : [...previous, key])), [])

  useEffect(() => {
    if (isEmbedded) return
    const load = () => loadActiveForms().then(setForms)
    // Safari n'a pas requestIdleCallback
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(load, { timeout: 3000 })
      return () => window.cancelIdleCallback(handle)
    }
    const handle = setTimeout(load, 1000)
    return () => clearTimeout(handle)
  }, [isEmbedded])

  useEffect(() => {
    if (isEmbedded) return
    const onInteraction = (event: Event) => {
      if (!event.isTrusted || !isFeedbackInteraction(event.target as Element | null)) return
      // le chemin au moment du clic : un lien aura changé de page avant la fin du chargement
      const path = window.location.pathname
      loadActiveForms().then((loaded) => {
        setForms(loaded)
        const target = findFeedbackFormForPath(loaded, path)
        if (target && getFeedbackTriggerType(target.trigger) === "interactions") {
          incrementInteractionCount(target.slug)
          refresh()
        }
      })
    }
    document.addEventListener("click", onInteraction, true)
    const unsubscribe = onFeedbackEvent((emitted) => {
      const path = window.location.pathname
      loadActiveForms().then((loaded) => {
        const target = findFeedbackFormForPath(loaded, path)
        if (target && getFeedbackTriggerType(target.trigger) === "event" && target.trigger.event === emitted) markReached(`${target.slug}|${path}`)
      })
    })
    return () => {
      document.removeEventListener("click", onInteraction, true)
      unsubscribe()
    }
  }, [isEmbedded, markReached])

  const form = !isEmbedded && forms ? findFeedbackFormForPath(forms, pathname) : null
  const pageKey = form ? `${form.slug}|${pathname}` : null
  const delaySeconds = form && getFeedbackTriggerType(form.trigger) === "delay" ? form.trigger.delaySeconds : undefined

  // temps passé sur la page, compté seconde par seconde tant que l'onglet est visible
  const elapsed = useRef(0)
  useEffect(() => {
    if (!pageKey || delaySeconds === undefined) return
    elapsed.current = 0
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      elapsed.current += 1
      if (elapsed.current >= delaySeconds) {
        markReached(pageKey)
        window.clearInterval(interval)
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [pageKey, delaySeconds, markReached])

  const reached =
    form !== null &&
    (getFeedbackTriggerType(form.trigger) === "interactions"
      ? readInteractionCount(form.slug) >= (form.trigger.minInteractions ?? 1)
      : pageKey !== null && reachedPages.includes(pageKey))
  const ready = reached && !isFeedbackSuppressed(readFeedbackMemory(form.slug))

  const slug = form?.slug
  const dismiss = useCallback(() => {
    if (!slug) return
    rememberFeedbackDismissed(slug)
    refresh()
  }, [slug])
  const complete = useCallback(() => {
    if (!slug) return
    rememberFeedbackCompleted(slug)
    refresh()
  }, [slug])

  return { form, ready, dismiss, complete }
}
