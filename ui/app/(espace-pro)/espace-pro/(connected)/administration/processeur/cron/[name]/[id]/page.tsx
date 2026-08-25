import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import ProcesseurCronTaskPage from "./ProcesseurCronTaskPage"
export async function generateMetadata({ params }: { params: Promise<{ name: string; id: string }> }): Promise<Metadata> {
  const { name, id } = await params
  return {
    title: METADATA.dynamic.adminProcessorCronTask({ name, id }).title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string; id: string }> }) {
  return <ProcesseurCronTaskPage params={params} />
}
