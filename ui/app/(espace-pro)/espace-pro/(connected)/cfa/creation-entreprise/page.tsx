import type { Metadata } from "next"
import CreationEntreprisePage from "./CreationEntreprisePage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.backCfaCreationEntreprise.getMetadata().title,
}

export default async function Page() {
  return <CreationEntreprisePage />
}
