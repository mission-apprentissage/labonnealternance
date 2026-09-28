// Preview provider: react-dsfr requires startReactDsfr() to run before any
// component renders (else "react-dsfr not initialized"). We init once at module
// load, then wrap the tree in MuiDsfrThemeProvider so MUI reads DSFR tokens.
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui"
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa"
import type * as React from "react"

startReactDsfr({ defaultColorScheme: "light" })

export function LbaDsProvider({ children }: { children?: React.ReactNode }) {
  return <MuiDsfrThemeProvider>{children}</MuiDsfrThemeProvider>
}
