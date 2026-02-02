import type { Metadata } from "next"
import AuthentificationPage from "./AuthentificationPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.authentification.getMetadata().title,
  description: PAGES.static.authentification.getMetadata().description,
}

const Page = async () => {
  return <AuthentificationPage />
}

export default Page
