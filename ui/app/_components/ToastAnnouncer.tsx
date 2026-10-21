"use client"

import { usePathname } from "next/navigation"
import { Suspense, useEffect, useSyncExternalStore } from "react"
import { LiveStatus } from "@/app/_components/LiveStatus"

type Announcement = { message: string; role: "status" | "alert" }

const EMPTY: Announcement = { message: "", role: "status" }
const AFTER_NAVIGATION_DELAY_IN_MS = 1000

let current = EMPTY
const listeners = new Set<() => void>()
let fillTimer: ReturnType<typeof setTimeout> | undefined
let clearTimer: ReturnType<typeof setTimeout> | undefined
let beforeNavigation: (Announcement & { durationInMs: number; expiresAt: number }) | null = null

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
const fill = ({ message, role }: Announcement, durationInMs: number, delayInMs: number) => {
  clearTimeout(fillTimer)
  clearTimeout(clearTimer)
  emit(EMPTY)
  fillTimer = setTimeout(() => emit({ message, role }), delayInMs)
  clearTimer = setTimeout(() => emit(EMPTY), delayInMs + durationInMs)
}

// Temps laissé à la lecture d'un toast : une navigation plus tardive ne l'a pas coupé.
const TOAST_READING_TIME_IN_MS = 2500

/** À attendre entre un toast et une redirection, pour que le message soit lu sur la page qui l'émet. */
export const waitForToastReading = () => new Promise<void>((resolve) => setTimeout(resolve, TOAST_READING_TIME_IN_MS))

export function announceToast(message: string, role: Announcement["role"], durationInMs: number) {
  beforeNavigation = { message, role, durationInMs, expiresAt: Date.now() + TOAST_READING_TIME_IN_MS }
  fill({ message, role }, durationInMs, 100)
}

// Next annonce le titre de la nouvelle page en role="alert" et la page peut placer le focus : l'un comme
// l'autre coupe un toast émis juste avant un router.push sans waitForToastReading. Le message est donc
// répété une fois la page affichée.
const repeatAfterNavigation = () => {
  if (!beforeNavigation || Date.now() > beforeNavigation.expiresAt) return
  const { durationInMs, ...announcement } = beforeNavigation
  beforeNavigation = null
  fill(announcement, durationInMs, AFTER_NAVIGATION_DELAY_IN_MS)
}

// usePathname hors <Suspense> bloque le prérendu (cacheComponents) : isolé ici pour que les zones live,
// elles, restent dans le HTML initial.
function NavigationWatcher() {
  const pathname = usePathname()
  useEffect(() => {
    repeatAfterNavigation()
  }, [pathname])
  return null
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
      <Suspense fallback={null}>
        <NavigationWatcher />
      </Suspense>
      <LiveStatus message={role === "status" ? message : ""} />
      <LiveStatus role="alert" message={role === "alert" ? message : ""} />
    </>
  )
}
