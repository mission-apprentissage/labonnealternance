import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import ProcesseurJobInstancePage from "./ProcesseurJobInstancePage"
export async function generateMetadata({ params }: { params: Promise<{ name: string; id: string }> }): Promise<Metadata> {
  const { name, id } = await params
  return {
    title: METADATA.dynamic.adminProcessorJobInstance({ name, id }).title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string; id: string }> }) {
  return <ProcesseurJobInstancePage params={params} />
}
