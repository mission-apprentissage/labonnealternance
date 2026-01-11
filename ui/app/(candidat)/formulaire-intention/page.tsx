import type { Metadata } from "next"
import FormulaireIntentionPage from "./FormulaireIntentionPage"

export const metadata: Metadata = {
  title: "Formulaire d'intention de recrutement - La bonne alternance",
}

const Page = async () => {
  return <FormulaireIntentionPage />
}

export default Page
