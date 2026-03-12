import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CreationWithOriginPage from "./CreationWithOriginPage"

export const metadata: Metadata = {
  title: PAGES.static.espaceProCreationEntreprise.getMetadata().title,
  description: PAGES.static.espaceProCreationEntreprise.getMetadata().description,
}

const Page = async () => {
  return <CreationWithOriginPage />
}

export default Page
