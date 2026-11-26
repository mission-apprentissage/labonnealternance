"use client"

import type { TouchEvent } from "react"
import { useRef } from "react"

type IPoint = { x: number; y: number }

const MIN_SWIPE_DISTANCE = 60
// Un geste plus vertical que franchement horizontal est un défilement de la page.
const MIN_HORIZONTAL_RATIO = 2
// Champs de saisie et tableaux : le glissement y sert à déplacer le curseur ou à faire défiler le contenu.
const IGNORED_TARGETS = "input, textarea, select, [contenteditable], .fr-table"

export const getSwipeDirection = (start: IPoint, end: IPoint): "left" | "right" | null => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.abs(dx) < MIN_SWIPE_DISTANCE || Math.abs(dx) < MIN_HORIZONTAL_RATIO * Math.abs(dy)) return null
  return dx < 0 ? "left" : "right"
}

const isIgnoredTarget = (target: EventTarget) => target instanceof Element && Boolean(target.closest(IGNORED_TARGETS))

/** Gestionnaires tactiles à poser sur un conteneur : un glissement horizontal d'un doigt déclenche `onSwipeLeft` ou `onSwipeRight`. */
export const useHorizontalSwipe = ({ onSwipeLeft, onSwipeRight }: { onSwipeLeft?: () => void; onSwipeRight?: () => void }) => {
  const start = useRef<IPoint | null>(null)

  return {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0]
      start.current = event.touches.length === 1 && !isIgnoredTarget(event.target) ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd: (event: TouchEvent) => {
      const origin = start.current
      start.current = null
      // Un glissement qui sélectionne du texte n'est pas un geste de navigation.
      if (!origin || window.getSelection()?.toString()) return
      const touch = event.changedTouches[0]
      const direction = getSwipeDirection(origin, { x: touch.clientX, y: touch.clientY })
      if (direction === "left") onSwipeLeft?.()
      if (direction === "right") onSwipeRight?.()
    },
    onTouchCancel: () => {
      start.current = null
    },
  }
}
