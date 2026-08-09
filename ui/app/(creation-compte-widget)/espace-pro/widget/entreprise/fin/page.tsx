import type { Metadata } from "next"
import FinPage from "./FinPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Fin de création d'offre - La bonne alternance",
}

const Page = async () => {
  return <FinPage />
}

export default Page
