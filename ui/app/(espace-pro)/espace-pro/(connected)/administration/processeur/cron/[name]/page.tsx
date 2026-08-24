import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import ProcesseurCronPage from "./ProcesseurCronPage"
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  return {
    title: METADATA.dynamic.adminProcessorCron(name).title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  return <ProcesseurCronPage params={params} />
}
