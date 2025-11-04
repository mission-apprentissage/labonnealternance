import type { Metadata } from "next"

import StatistiquesClient from "./StatistiquesClient"
import { PAGES } from "@/utils/routes.utils"


export const metadata: Metadata = {
  title: PAGES.static.statistiques.getMetadata().title,
  description: PAGES.static.statistiques.getMetadata().description,
}

export default function Statistiques() {
  return <StatistiquesClient />
}
