import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import ProcesseurJobPage from "./ProcesseurJobPage"
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  return {
    title: METADATA.dynamic.adminProcessorJob(name).title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  return <ProcesseurJobPage params={params} />
}
