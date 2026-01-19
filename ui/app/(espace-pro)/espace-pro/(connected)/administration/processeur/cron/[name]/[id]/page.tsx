import type { Metadata } from "next"
import ProcesseurCronTaskPage from "./ProcesseurCronTaskPage"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ name: string; id: string }> }): Promise<Metadata> {
  const { name, id } = await params
  return {
    title: PAGES.dynamic.adminProcessorCronTask({ name, id }).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string; id: string }> }) {
  return <ProcesseurCronTaskPage params={params} />
}
