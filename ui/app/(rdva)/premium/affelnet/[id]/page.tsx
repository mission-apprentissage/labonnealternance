import type { Metadata } from "next"
import PremiumAffelnetPage from "./PremiumAffelnetPage"

export const metadata: Metadata = {
  title: "Activation du service Rendez-vous Apprentissage sur Choisir son affectation après la 3ème - La bonne alternance",
}

const Page = async () => {
  return <PremiumAffelnetPage />
}

export default Page
