import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import AuthentificationPage from "./AuthentificationPage"

export const metadata: Metadata = {
  title: PAGES.static.authentification.getMetadata().title,
  description: PAGES.static.authentification.getMetadata().description,
}

const Page = async () => {
  return <AuthentificationPage />
}

export default Page
