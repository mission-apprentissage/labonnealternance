import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead"
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider"
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import Link from "next/link"
import "react-notion-x/src/styles.css"

import { Footer } from "./components/Footer"
import { Header } from "./components/Header"
import { defaultColorScheme } from "./dsfr-setup/default-color-scheme"
import { StartDsfr } from "./dsfr-setup/start-dsfr"

import "../public/styles/application.css"
import "../public/styles/fonts.css"
import "../public/styles/notion.css"
import "../styles/search.css"

export default function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <html {...getHtmlAttributes({ defaultColorScheme })}>
      <head>
        <StartDsfr />
        <DsfrHead
          Link={Link}
          preloadFonts={[
            //"Marianne-Light",
            //"Marianne-Light_Italic",
            "Marianne-Regular",
            //"Marianne-Regular_Italic",
            "Marianne-Medium",
            //"Marianne-Medium_Italic",
            "Marianne-Bold",
            //"Marianne-Bold_Italic",
            //"Spectral-Regular",
            //"Spectral-ExtraBold"
          ]}
        />
      </head>
      <body>
        {
          <AppRouterCacheProvider>
            <DsfrProvider>
              <Header />
              {children}
              <Footer />
            </DsfrProvider>
          </AppRouterCacheProvider>
        }
      </body>
    </html>
  )
}
