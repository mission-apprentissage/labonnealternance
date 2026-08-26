import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import CreationWithOriginPage from "./CreationWithOriginPage"
export const metadata: Metadata = {
  title: METADATA.static.espaceProCreationEntreprise().title,
  description: METADATA.static.espaceProCreationEntreprise().description,
}

const Page = async () => {
  return <CreationWithOriginPage />
}

export default Page
