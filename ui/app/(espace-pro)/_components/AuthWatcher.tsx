"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { IUserRecruteurPublic } from "shared"

export function AuthWatcher({ user }: { user: IUserRecruteurPublic | null }) {
  const router = useRouter()
  const [channel, setChannel] = useState<BroadcastChannel | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      setChannel((old) => {
        if (old) {
          old.close()
        }

        return new BroadcastChannel("auth")
      })

      const chan = new BroadcastChannel("auth")

      chan.onmessage = (event) => {
        if (event.data === "update") {
          router.refresh()
        }
      }

      return () => {
        setChannel((old) => {
          if (old) {
            old.close()
          }
          return null
        })
      }
    }
  }, [router])

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
