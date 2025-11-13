"use client"

import { useEffect, useState } from "react"

export function useIsMobileDevice(query: string = "(max-width: 500px)"): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)

    const handleMatchChange = (e) => {
      setMatches(e.matches)
    }

    mediaQueryList.addEventListener("change", handleMatchChange)

    return () => {
      mediaQueryList.removeEventListener("change", handleMatchChange)
    }
  }, [query])

  return matches
}
