import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import ProcesseurJobPage from "./ProcesseurJobPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  return {
    title: PAGES.dynamic.adminProcessorJob(name).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  return <ProcesseurJobPage params={params} />
}
