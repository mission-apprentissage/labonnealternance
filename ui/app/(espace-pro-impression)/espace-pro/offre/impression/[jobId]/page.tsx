import type { Metadata } from "next"
import ImpressionPage from "./ImpressionPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Impression d'offre - La bonne alternance",
}

const Page = async () => {
  return <ImpressionPage />
}

export default Page
