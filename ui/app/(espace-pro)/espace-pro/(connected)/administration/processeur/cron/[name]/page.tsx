import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import ProcesseurCronPage from "./ProcesseurCronPage"

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  return {
    title: PAGES.dynamic.adminProcessorCron(name).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  return <ProcesseurCronPage params={params} />
}
