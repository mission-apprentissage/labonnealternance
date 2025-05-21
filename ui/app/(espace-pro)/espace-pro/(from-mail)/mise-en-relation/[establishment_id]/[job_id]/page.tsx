import MiseEnRelation from "@/app/(espace-pro)/_components/MiseEnRelation"

export default async function Page({ params, searchParams }) {
  const { establishment_id, job_id } = await params
  const { token } = await searchParams
  if (!token) {
    throw new Error("Données manquantes")
  }
  return <MiseEnRelation job_id={job_id} token={token} establishment_id={establishment_id} />
}
