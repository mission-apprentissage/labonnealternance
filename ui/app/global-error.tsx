"use client"

import * as Sentry from "@sentry/nextjs"
import Image from "next/image"
import { useEffect } from "react"

import type { ErrorProps } from "@/app/_components/ErrorComponent"

import "./global-error.css"

export default function GlobalError({ error }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/images/logo-violet-seul.svg" />
        <title>Le service est temporairement indisponible</title>
      </head>
      <body>
        <div id="global_error_container">
          <div id="content">
            <Image id="logo" src="/images/logo_LBA.svg" alt="logo La bonne alternance" width={213} height={55} />
            <div id="center-container">
              <h1>Le service est temporairement indisponible.</h1>
              <p>Nous mettons tout en œuvre pour rétablir l’accès rapidement. Merci de votre patience et à très bientôt !</p>
              <Image id="woman" src="/images/5xx.svg" alt="femme ne sachant pas quoi faire" height={661} width={391} />
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
