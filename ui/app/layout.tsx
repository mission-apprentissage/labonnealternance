//import { Alert, AlertTitle } from "@mui/material"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import type { Metadata } from "next"
import type { PropsWithChildren } from "react"
import { setupZodErrorMap } from "shared/helpers/zodHelpers/setupZodErrorMap"

import RootTemplate from "./client_only_providers"
import { DsfrProvider, StartDsfrOnHydration } from "./dsfr-setup"
import { DsfrHead, getHtmlAttributes } from "./dsfr-setup/server-only-index"
import { HeadLaBonneAlternance } from "@/components/head"
import { publicConfig } from "@/config.public"
import { Matomo } from "@/tracking/trackingMatomo"

import "react-notion-x/src/styles.css"
import "@/public/styles/application.css"
import "@/public/styles/fonts.css"
import "@/public/styles/notion.css"
import "@/styles/search.css"

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.baseUrl),
  manifest: "/favicon/site.webmanifest",
}

setupZodErrorMap()

const lang = "fr"

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html {...getHtmlAttributes({ lang })}>
      <head>
        <HeadLaBonneAlternance />
        <DsfrHead
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
          doDisableFavicon={true}
        />
        <Matomo />
      </head>
      <body>
        {
          <>
            {/* <Alert variant="filled" severity="error">
              <AlertTitle>Service temporairement dégradé.</AlertTitle>
              Suite à un problème chez notre prestataire d'envoi d'emails, les connexions aux comptes et les envois de candidatures sont momentanément interrompus. <br /> Nous vous
              prions de nous excuser pour la gêne occasionnée et vous invitons à revenir ultérieurement.{" "}
            </Alert> */}
            <AppRouterCacheProvider>
              <DsfrProvider lang={lang}>
                <StartDsfrOnHydration />
                <RootTemplate>{children}</RootTemplate>
              </DsfrProvider>
            </AppRouterCacheProvider>
          </>
        }
      </body>
    </html>
  )
}
