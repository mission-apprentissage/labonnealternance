"use client"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"

export default function CfaPage() {
  const session = useConnectedSessionClient()
  return <>Welcome CFA {JSON.stringify(session, null, 2)}</>
}
