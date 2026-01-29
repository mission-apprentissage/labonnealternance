import type { Metadata } from "next"
import ProcesseurCronPage from "./ProcesseurCronPage"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  return {
    title: PAGES.dynamic.adminProcessorCron(name).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  return <ProcesseurCronPage params={params} />
}
