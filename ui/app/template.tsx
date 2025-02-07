"use client"

import type { PropsWithChildren } from "react"

import Providers from "@/context/Providers"

function RootTemplate({ children }: PropsWithChildren) {
  return <Providers>{children}</Providers>
}

export default RootTemplate
