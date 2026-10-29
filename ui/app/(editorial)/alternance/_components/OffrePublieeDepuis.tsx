"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { getDaysSinceDate } from "@/utils/days-since-date"

// Composant client : `new Date()` dans un composant serveur interrompt le prérendu (blocking-prerender-current-time, LBA-UI-5CVZZZZZZG6G9).
export function OffrePublieeDepuis({ date }: { date: string | Date }) {
  const daysPublished = getDaysSinceDate(date)
  return (
    <Typography
      component="span"
      sx={{
        color: fr.colors.decisions.text.mention.grey.default,
        py: fr.spacing("1v"),
      }}
      className={fr.cx("fr-text--xs")}
      // L'horloge du navigateur peut différer de celle du serveur autour d'un changement de jour.
      suppressHydrationWarning
    >
      Publiée {`${daysPublished ? `depuis ${daysPublished} jour(s)` : "aujourd'hui"}`}
    </Typography>
  )
}
