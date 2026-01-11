import type { Metadata } from "next"
import ValidationPage from "./ValidationPage"

export const metadata: Metadata = {
  title: "Validation de votre email - La bonne alternance",
}

export default async function Page() {
  return <ValidationPage />
}
