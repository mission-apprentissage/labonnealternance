import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import ProcesseurCronTaskPage from "./ProcesseurCronTaskPage"

export async function generateMetadata({ params }: { params: Promise<{ name: string; id: string }> }): Promise<Metadata> {
  const { name, id } = await params
  return {
    title: PAGES.dynamic.adminProcessorCronTask({ name, id }).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string; id: string }> }) {
  return <ProcesseurCronTaskPage params={params} />
}
