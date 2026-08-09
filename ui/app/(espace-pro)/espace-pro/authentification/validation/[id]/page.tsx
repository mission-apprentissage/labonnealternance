import type { Metadata } from "next"
import ValidationPage from "./ValidationPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Validation de votre email - La bonne alternance",
}

export default async function Page() {
  return <ValidationPage />
}
