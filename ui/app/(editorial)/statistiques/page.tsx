import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import StatistiquesClient from "./StatistiquesClient"
export const metadata: Metadata = {
  title: METADATA.static.statistiques().title,
  description: METADATA.static.statistiques().description,
}

export default function Statistiques() {
  return <StatistiquesClient />
}
