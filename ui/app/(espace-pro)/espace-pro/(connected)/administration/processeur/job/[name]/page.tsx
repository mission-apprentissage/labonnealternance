import type { Metadata } from "next"
import ProcesseurJobPage from "./ProcesseurJobPage"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  return {
    title: PAGES.dynamic.adminProcessorJob(name).getMetadata().title,
  }
}

export default async function Page() {
  return <ProcesseurJobPage />
}
