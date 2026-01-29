import type { Metadata } from "next"
import ImpressionPage from "./ImpressionPage"

export const metadata: Metadata = {
  title: "Impression d'offre - La bonne alternance",
}

const Page = async () => {
  return <ImpressionPage />
}

export default Page
