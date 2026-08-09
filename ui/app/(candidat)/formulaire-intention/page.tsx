import type { Metadata } from "next"
import FormulaireIntentionPage from "./FormulaireIntentionPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Formulaire d'intention de recrutement - La bonne alternance",
}

const Page = async () => {
  return <FormulaireIntentionPage />
}

export default Page
