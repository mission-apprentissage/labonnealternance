import type { Metadata } from "next"
import { getSession } from "@/utils/get-session"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PageWithParams } from "./PageWithParams"

export async function generateMetadata({ params }: { params: Promise<{ job_id: string }> }): Promise<Metadata> {
  const { job_id } = await params
  return {
    title: METADATA.dynamic.backEntrepriseEditionOffre({ job_id }).title,
  }
}

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user
  return <PageWithParams establishment_id={establishment_id} />
}
