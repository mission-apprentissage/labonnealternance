import type { Metadata } from "next"
import RdvaPage from "./RdvaPage"

export const metadata: Metadata = {
  title: "Contacter un centre de formation - La bonne alternance",
}

const Page = async () => {
  return <RdvaPage />
}

export default Page
