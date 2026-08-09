import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CreationWithOriginPage from "./CreationWithOriginPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.espaceProCreationEntreprise.getMetadata().title,
  description: PAGES.static.espaceProCreationEntreprise.getMetadata().description,
}

const Page = async () => {
  return <CreationWithOriginPage />
}

export default Page
