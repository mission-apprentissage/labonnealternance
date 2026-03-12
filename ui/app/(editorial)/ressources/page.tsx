import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import RessourcePage from "./RessourcePage"

export const metadata: Metadata = {
  title: PAGES.static.ressources.getMetadata().title,
  description: PAGES.static.ressources.getMetadata().description,
}

const Page = async () => {
  return <RessourcePage />
}

export default Page
