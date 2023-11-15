import { ChakraProvider, createStylesContext } from "@chakra-ui/react"
import PlausibleProvider from "next-plausible"
import React from "react"
import { QueryClient, QueryClientProvider } from "react-query"

import theme from "../theme/index"

import LogoProvider from "./contextLogo"
import WidgetProvider from "./contextWidget"
import DisplayContextProvider from "./DisplayContextProvider"
import ParameterContextProvider from "./ParameterContextProvider"
import SearchResultContextProvider from "./SearchResultContextProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const [StylesProvider] = createStylesContext("Component")

const Providers = ({ env, children }) => {
  return (
    <ChakraProvider theme={theme}>
      <StylesProvider value={{}}>
        <PlausibleProvider
          domain={env !== "production" ? "labonnealternance-recette2.apprentissage.beta.gouv.fr" : "labonnealternance.apprentissage.beta.gouv.fr"}
          trackOutboundLinks={true}
          trackLocalhost={true}
          enabled={true}
        >
          <SearchResultContextProvider>
            <ParameterContextProvider>
              <DisplayContextProvider>
                <WidgetProvider>
                  <LogoProvider>
                    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
                  </LogoProvider>
                </WidgetProvider>
              </DisplayContextProvider>
            </ParameterContextProvider>
          </SearchResultContextProvider>
        </PlausibleProvider>
      </StylesProvider>
    </ChakraProvider>
  )
}

export default Providers
