import React from "react"
import { QueryClient, QueryClientProvider } from "react-query"
import SearchResultContextProvider from "./SearchResultContextProvider"
import ParameterContextProvider from "./ParameterContextProvider"
import DisplayContextProvider from "./DisplayContextProvider"
import PlausibleProvider from "next-plausible"
import { ChakraProvider } from "@chakra-ui/react"
import theme from "../theme/index"

const queryClient = new QueryClient()

const Providers = ({ env, children }) => {
  return (
    <ChakraProvider theme={theme}>
      <PlausibleProvider
        domain={env !== "production" ? "labonnealternance-recette2.apprentissage.beta.gouv.fr" : "labonnealternance.apprentissage.beta.gouv.fr"}
        trackOutboundLinks={true}
        trackLocalhost={true}
        enabled={true}
      >
        <SearchResultContextProvider>
          <ParameterContextProvider>
            <DisplayContextProvider>
              <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </DisplayContextProvider>
          </ParameterContextProvider>
        </SearchResultContextProvider>
      </PlausibleProvider>
    </ChakraProvider>
  )
}

export default Providers
