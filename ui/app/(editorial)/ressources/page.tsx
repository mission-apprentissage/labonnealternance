import type { Metadata } from "next"
import RessourcePage from "./RessourcePage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.ressources.getMetadata().title,
  description: PAGES.static.ressources.getMetadata().description,
}

const Page = async () => {
  return <RessourcePage />
}

export default Page
