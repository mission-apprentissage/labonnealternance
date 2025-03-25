import { Metadata } from "next"

import DesinscriptionRecruteur from "@/app/(home)/desinscription/Desinscription"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.desinscription.getMetadata().title,
  description: PAGES.static.desinscription.getMetadata().description,
}

export default async function PageDesinscription() {
  return <DesinscriptionRecruteur />
}
