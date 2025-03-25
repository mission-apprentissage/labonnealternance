import { ChakraProvider } from "@chakra-ui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import PlausibleProvider from "next-plausible"
import React from "react"

import { publicConfig } from "@/config.public"

import theme from "../theme/index"

import LogoProvider from "./contextLogo"
import WidgetProvider from "./contextWidget"
import DisplayContextProvider from "./DisplayContextProvider"
import SearchResultContextProvider from "./SearchResultContextProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const Providers = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      <PlausibleProvider domain={publicConfig.plausibleDomain} trackOutboundLinks={true} trackLocalhost={true} enabled={true}>
        <SearchResultContextProvider>
          <DisplayContextProvider>
            <WidgetProvider>
              <LogoProvider>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
              </LogoProvider>
            </WidgetProvider>
          </DisplayContextProvider>
        </SearchResultContextProvider>
      </PlausibleProvider>
    </ChakraProvider>
  )
}

export default Providers
