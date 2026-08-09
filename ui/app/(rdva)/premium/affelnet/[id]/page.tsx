import type { Metadata } from "next"
import PremiumAffelnetPage from "./PremiumAffelnetPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Activation du service Rendez-vous Apprentissage sur Choisir son affectation après la 3ème - La bonne alternance",
}

const Page = async () => {
  return <PremiumAffelnetPage />
}

export default Page
