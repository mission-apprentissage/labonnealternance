import type { Metadata } from "next"
import CreationWithOriginPage from "./CreationWithOriginPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.espaceProCreationEntreprise.getMetadata().title,
  description: PAGES.static.espaceProCreationEntreprise.getMetadata().description,
}

const Page = async () => {
  return <CreationWithOriginPage />
}

export default Page
