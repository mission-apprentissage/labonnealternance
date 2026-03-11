import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import ProcesseurJobInstancePage from "./ProcesseurJobInstancePage"

export async function generateMetadata({ params }: { params: Promise<{ name: string; id: string }> }): Promise<Metadata> {
  const { name, id } = await params
  return {
    title: PAGES.dynamic.adminProcessorJobInstance({ name, id }).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string; id: string }> }) {
  return <ProcesseurJobInstancePage params={params} />
}
