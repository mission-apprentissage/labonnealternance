import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import PlausibleProvider from "next-plausible"
import type { PropsWithChildren } from "react";
import React from "react"


import LogoProvider from "./contextLogo"
import WidgetProvider from "./contextWidget"
import DisplayContextProvider from "./DisplayContextProvider"
import { publicConfig } from "@/config.public"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <PlausibleProvider domain={publicConfig.plausibleDomain} trackOutboundLinks={true} trackLocalhost={true} enabled={true}>
      <DisplayContextProvider>
        <WidgetProvider>
          <LogoProvider>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </LogoProvider>
        </WidgetProvider>
      </DisplayContextProvider>
    </PlausibleProvider>
  )
}

export default Providers
