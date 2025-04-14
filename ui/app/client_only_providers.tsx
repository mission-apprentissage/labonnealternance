"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { createMuiDsfrThemeProvider } from "@codegouvfr/react-dsfr/mui"
import { THEME_ID } from "@mui/material"
import { useEffect, type PropsWithChildren } from "react"

import Providers from "@/context/Providers"
import { setIsTrackingEnabled, setTrackingCookies } from "@/tracking/trackingCookieUtils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

// https://mui.com/material-ui/integrations/theme-scoping/?srsltid=AfmBOopC5sffoR7iiFA6HxJK-F1sIbPFTE8Bt9V2CZ9b2uGrAgJYXyNc
// TODO: Move back to layout when chakra is removed
const { MuiDsfrThemeProvider } = createMuiDsfrThemeProvider({
  isDark: false,
  // @ts-ignore
  augmentMuiTheme: ({ nonAugmentedMuiTheme }) => {
    return {
      [THEME_ID]: {
        ...nonAugmentedMuiTheme,
        components: {
          ...nonAugmentedMuiTheme.components,
          MuiAutocomplete: {
            ...nonAugmentedMuiTheme.components?.MuiAutocomplete,
            styleOverrides: {
              ...nonAugmentedMuiTheme.components?.MuiAutocomplete?.styleOverrides,
              option: {
                padding: `${fr.spacing("1w")} ${fr.spacing("2w")} !important`,
                "&.Mui-focused": {
                  backgroundColor: fr.colors.decisions.background.open.blueFrance.default + " !important",
                },
                "&.Mui-focusVisible": {
                  backgroundColor: fr.colors.decisions.background.open.blueFrance.default + " !important",
                },
              },
              noOptions: {
                margin: 0,
                color: fr.colors.decisions.text.disabled.grey.default,
              },
              loading: {
                margin: 0,
                color: fr.colors.decisions.text.disabled.grey.default,
              },
            },
          },
        },
      },
    }
  },
})

export default function RootTemplate({ children }: PropsWithChildren) {
  const searchParamsRecord = useSearchParamsRecord()

  useEffect(() => {
    setIsTrackingEnabled()
  }, [])
  useEffect(() => {
    setTrackingCookies(searchParamsRecord)
  }, [searchParamsRecord])

  return (
    <MuiDsfrThemeProvider>
      <Providers>{children}</Providers>
    </MuiDsfrThemeProvider>
  )
}
