import type { Metadata } from "next"
import ProcesseurJobInstancePage from "./ProcesseurJobInstancePage"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ name: string; id: string }> }): Promise<Metadata> {
  const { name, id } = await params
  return {
    title: PAGES.dynamic.adminProcessorJobInstance({ name, id }).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string; id: string }> }) {
  return <ProcesseurJobInstancePage params={params} />
}
