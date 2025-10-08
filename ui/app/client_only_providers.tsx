"use client"

import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui"
import { Suspense, useEffect, type PropsWithChildren } from "react"

import Providers from "@/context/Providers"
import { setIsTrackingEnabled, setTrackingCookies } from "@/tracking/trackingCookieUtils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

function Tracking(): null {
  const searchParamsRecord = useSearchParamsRecord()

  useEffect(() => {
    setIsTrackingEnabled()
  }, [])
  useEffect(() => {
    setTrackingCookies(searchParamsRecord)
  }, [searchParamsRecord])

  return null
}

export default function RootTemplate({ children }: PropsWithChildren) {
  return (
    <MuiDsfrThemeProvider>
      <Suspense fallback={null}>
        <Tracking />
      </Suspense>
      <Providers>{children}</Providers>
    </MuiDsfrThemeProvider>
  )
}
