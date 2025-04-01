"use client"

import { useEffect, useState } from "react"

const getHash = () => (typeof window !== "undefined" ? window.location.hash?.substring(1) : undefined)

/**
 * based on https://github.com/vercel/next.js/discussions/49465#discussioncomment-7968587
 */
export function useUrlHash() {
  const [isClient, setIsClient] = useState(false)
  const [hash, setHash] = useState(getHash())

  useEffect(() => {
    setIsClient(true)
    const listener = () => setHash(getHash())
    listener()
    window.addEventListener("hashchange", listener)
    return () => window.removeEventListener("hashchange", listener)
  }, [])

  return { hash: isClient ? hash : null, isClient }
}
