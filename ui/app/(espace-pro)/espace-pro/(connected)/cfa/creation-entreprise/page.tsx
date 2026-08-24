import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import CreationEntreprisePage from "./CreationEntreprisePage"
export const metadata: Metadata = {
  title: METADATA.static.backCfaCreationEntreprise().title,
}

export default async function Page() {
  return <CreationEntreprisePage />
}
