import type { Metadata } from "next"
import PostulerPage from "./PostulerPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.postuler.getMetadata().title,
}

const Page = async () => {
  return <PostulerPage />
}

export default Page
