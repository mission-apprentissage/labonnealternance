import MiseEnRelation from "@/app/(espace-pro)/_components/MiseEnRelation"

export default async function Page({ params, searchParams }) {
  const { establishmentId, job_id } = await params
  const { token } = await searchParams
  return <MiseEnRelation job_id={job_id} token={token} establishment_id={establishmentId} />
}
