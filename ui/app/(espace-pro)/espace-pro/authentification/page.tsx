import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import AuthentificationPage from "./AuthentificationPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.authentification.getMetadata().title,
  description: PAGES.static.authentification.getMetadata().description,
}

const Page = async () => {
  return <AuthentificationPage />
}

export default Page
