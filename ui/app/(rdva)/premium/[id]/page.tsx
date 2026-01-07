import type { Metadata } from "next"
import PremiumParcoursupPage from "./PremiumParcoursupPage"

export const metadata: Metadata = {
  title: "Activation du service Rendez-vous Apprentissage sur Parcoursup - La bonne alternance",
}

const Page = async () => {
  return <PremiumParcoursupPage />
}

export default Page
