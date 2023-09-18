import { ChakraProvider } from "@chakra-ui/react"
import dayjs from "dayjs"
import "dayjs/locale/fr"
import ReactDOM from "react-dom"
import { QueryClient, QueryClientProvider } from "react-query"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import LogoProvider from "./contextLogo"
import WidgetProvider from "./contextWidget"
import "./index.css"
import theme from "./theme"

dayjs.locale("fr")

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.render(
  <QueryClientProvider client={client}>
    <BrowserRouter basename="/espace-pro">
      <ChakraProvider theme={theme}>
        <WidgetProvider>
          <LogoProvider>
            <App />
          </LogoProvider>
        </WidgetProvider>
      </ChakraProvider>
    </BrowserRouter>
  </QueryClientProvider>,
  document.getElementById("root")
)
