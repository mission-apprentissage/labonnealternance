import type { Metadata } from "next"
import FinPage from "./FinPage"

export const metadata: Metadata = {
  title: "Fin de création d'offre - La bonne alternance",
}

const Page = async () => {
  return <FinPage />
}

export default Page
