import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import PostulerPage from "./PostulerPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.postuler.getMetadata().title,
}

const Page = async () => {
  return <PostulerPage />
}

export default Page
