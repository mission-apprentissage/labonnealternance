"use client"

import { useEffect, useState } from "react"

export function useIsMobileDevice(query: string = "(max-width: 500px)") {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)

    const handleMatchChange = (e) => {
      setMatches(e.matches)
    }

    mediaQueryList.addEventListener("change", handleMatchChange)
    setMatches(mediaQueryList.matches)

    return () => {
      mediaQueryList.removeEventListener("change", handleMatchChange)
    }
  }, [query])

  return matches
}
