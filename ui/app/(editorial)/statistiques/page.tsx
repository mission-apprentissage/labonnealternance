import { Metadata } from "next"

import { PAGES } from "@/utils/routes.utils"

import StatistiquesClient from "./StatistiquesClient"

export const metadata: Metadata = {
  title: PAGES.static.statistiques.getMetadata().title,
  description: PAGES.static.statistiques.getMetadata().description,
}

export default function Statistiques() {
  return <StatistiquesClient />
}
