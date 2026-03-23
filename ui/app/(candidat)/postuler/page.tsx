import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import PostulerPage from "./PostulerPage"

export const metadata: Metadata = {
  title: PAGES.static.postuler.getMetadata().title,
}

const Page = async () => {
  return <PostulerPage />
}

export default Page
