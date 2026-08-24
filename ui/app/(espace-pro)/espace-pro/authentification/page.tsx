import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import AuthentificationPage from "./AuthentificationPage"
export const metadata: Metadata = {
  title: METADATA.static.authentification().title,
  description: METADATA.static.authentification().description,
}

const Page = async () => {
  return <AuthentificationPage />
}

export default Page
