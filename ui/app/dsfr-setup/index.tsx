"use client"
import { DsfrProviderBase,  StartDsfrOnHydration } from "@codegouvfr/react-dsfr/next-app-router"
import type {DsfrProviderProps} from "@codegouvfr/react-dsfr/next-app-router";
import Link from "next/link"

import { defaultColorScheme } from "./defaultColorScheme"

declare module "@codegouvfr/react-dsfr/next-app-router" {
  interface RegisterLink {
    Link: typeof Link
  }
}

export function DsfrProvider(props: DsfrProviderProps) {
  return <DsfrProviderBase defaultColorScheme={defaultColorScheme} Link={Link} {...props} />
}

export { StartDsfrOnHydration }
