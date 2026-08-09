import type { Metadata } from "next"
import PremiumParcoursupPage from "./PremiumParcoursupPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Activation du service Rendez-vous Apprentissage sur Parcoursup - La bonne alternance",
}

const Page = async () => {
  return <PremiumParcoursupPage />
}

export default Page
