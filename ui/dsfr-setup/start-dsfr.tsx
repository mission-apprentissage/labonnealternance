"use client"

import { startReactDsfr } from "@codegouvfr/react-dsfr/next-appdir"
import Link from "next/link"

import { defaultColorScheme } from "./default-color-scheme"

declare module "@codegouvfr/react-dsfr/next-appdir" {
  interface RegisterLink {
    Link: typeof Link
  }
}

startReactDsfr({ defaultColorScheme })

export function StartDsfr() {
  //Yes, leave null here.
  return null
}
