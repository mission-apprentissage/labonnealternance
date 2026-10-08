"use client"

import { useSyncExternalStore } from "react"
import { LiveStatus } from "@/app/_components/LiveStatus"

type Announcement = { message: string; role: "status" | "alert" }

const EMPTY: Announcement = { message: "", role: "status" }
let current = EMPTY
const listeners = new Set<() => void>()
let fillTimer: ReturnType<typeof setTimeout> | undefined
let clearTimer: ReturnType<typeof setTimeout> | undefined

const emit = (next: Announcement) => {
  current = next
  for (const listener of listeners) listener()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// La zone est vidée puis remplie pour qu'un message identique au précédent soit de nouveau restitué,
// et vidée à la disparition du toast pour ne pas rester lisible au parcours de la page.
export function announceToast(message: string, role: Announcement["role"], durationInMs: number) {
  clearTimeout(fillTimer)
  clearTimeout(clearTimer)
  emit(EMPTY)
  fillTimer = setTimeout(() => emit({ message, role }), 100)
  clearTimer = setTimeout(() => emit(EMPTY), durationInMs)
}

// Monté une fois dans le layout racine : il survit à la navigation qui suit souvent un toast.
// notistack insère chaque toast avec son contenu, ce qu'une zone live ne restitue pas de façon fiable.
export function ToastAnnouncer() {
  const { message, role } = useSyncExternalStore(
    subscribe,
    () => current,
    () => EMPTY
  )
  return (
    <>
      <LiveStatus message={role === "status" ? message : ""} />
      <LiveStatus role="alert" message={role === "alert" ? message : ""} />
    </>
  )
}
