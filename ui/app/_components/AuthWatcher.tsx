"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import type { IUserRecruteurPublic } from "shared"

export function AuthWatcher({ user }: { user: IUserRecruteurPublic | null }) {
  const router = useRouter()

  const isBroadcastChannelDefined = typeof BroadcastChannel !== "undefined"
  const channel = useMemo(() => (isBroadcastChannelDefined ? new BroadcastChannel("auth") : null), [isBroadcastChannelDefined])

  useEffect(() => {
    if (!channel) {
      return
    }

    const currentId = user?._id ?? null
    channel.postMessage(currentId)

    const listener = (event: BroadcastChannelEventMap["message"]) => {
      if (event.data !== currentId) {
        router.refresh()
      }
    }

    channel.addEventListener("message", listener)

    return () => {
      channel.removeEventListener("message", listener)
    }
  }, [channel, user, router])

  return null
}
