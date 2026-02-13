"use client"

import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"

export function ClientOnly({ children }: PropsWithChildren) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <>{children}</>
}
