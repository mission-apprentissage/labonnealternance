import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CreationEntreprisePage from "./CreationEntreprisePage"

export const metadata: Metadata = {
  title: PAGES.static.backCfaCreationEntreprise.getMetadata().title,
}

export default async function Page() {
  return <CreationEntreprisePage />
}
