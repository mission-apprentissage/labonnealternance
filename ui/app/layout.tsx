import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead"
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider"
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import { Metadata } from "next"
import Link from "next/link"
import PlausibleProvider from "next-plausible"
import type { PropsWithChildren } from "react"
import { setupZodErrorMap } from "shared/helpers/zodHelpers/setupZodErrorMap"

import RootTemplate from "@/app/client_only_providers"
import { publicConfig } from "@/config.public"
import { Matomo } from "@/tracking/trackingMatomo"

import { defaultColorScheme } from "../dsfr-setup/default-color-scheme"
import { StartDsfr } from "../dsfr-setup/start-dsfr"

import "react-notion-x/src/styles.css"
import "../public/styles/application.css"
import "../public/styles/fonts.css"
import "../public/styles/notion.css"
import "../styles/search.css"

export const metadata: Metadata = {
  title: "La bonne alternance",
  description: "Trouvez votre alternance",
  metadataBase: new URL(publicConfig.baseUrl),
  manifest: "/favicon/site.webmanifest",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon/apple-touch-icon.png", other: { rel: "icon", url: "/favicon/favicon.svg", type: "image/svg+xml" } },
  openGraph: {
    title: "La bonne alternance",
    type: "website",
    description: "Trouvez votre alternance",
    images: "/favicon/apple-touch-icon.png", // to test
  },
}

setupZodErrorMap()

const lang = "fr"

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
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
        <PlausibleProvider domain={publicConfig.host} />
        <Matomo />
      </head>
      <body>
        {
          <AppRouterCacheProvider>
            <DsfrProvider lang={lang} defaultColorScheme={defaultColorScheme} Link={Link}>
              <RootTemplate>{children}</RootTemplate>
            </DsfrProvider>
          </AppRouterCacheProvider>
        }
      </body>
    </html>
  )
}
