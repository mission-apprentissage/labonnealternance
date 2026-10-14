"use client"

import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui"
import dynamic from "next/dynamic"
import { SnackbarProvider } from "notistack"
import type { PropsWithChildren } from "react"
import { Suspense, useEffect } from "react"

import { ToastAnnouncer } from "@/app/_components/ToastAnnouncer"
import { ToastContent } from "@/app/_components/ToastContent"
import Providers from "@/context/Providers"
import { setIsTrackingEnabled, setTrackingCookies } from "@/tracking/tracking-cookie-utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"

// hors du bundle initial : le bouton n'apparaît qu'une fois son déclencheur atteint, rien ne presse au chargement
const FeedbackLauncher = dynamic(() => import("@/components/feedback/FeedbackLauncher").then((module) => module.FeedbackLauncher), { ssr: false })

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
      <SnackbarProvider Components={{ default: ToastContent, success: ToastContent, error: ToastContent, warning: ToastContent, info: ToastContent }}>
        <Suspense fallback={null}>
          <Tracking />
        </Suspense>
        <Providers>{children}</Providers>
        <ToastAnnouncer />
        <FeedbackLauncher />
      </SnackbarProvider>
    </MuiDsfrThemeProvider>
  )
}
