import type { Metadata } from "next"
import MiseEnRelation from "@/app/(espace-pro)/_components/MiseEnRelation"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ job_id: string }> }): Promise<Metadata> {
  const { job_id } = await params
  return {
    title: PAGES.dynamic.backEntrepriseMiseEnRelation({ job_id }).getMetadata().title,
  }
}

export default async function Page({ params }) {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user

  const { job_id } = await params
  return <MiseEnRelation job_id={job_id} establishment_id={establishment_id} />
}
