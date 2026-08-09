import type { Metadata } from "next"
import MiseEnRelation from "@/app/(espace-pro)/_components/MiseEnRelation"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Mise en relation avec des organismes de formation - La bonne alternance",
}

export default async function Page({ params, searchParams }) {
  const { establishment_id, job_id } = await params
  const { token } = await searchParams
  if (!token) {
    throw new Error("Données manquantes")
  }
  return <MiseEnRelation job_id={job_id} token={token} establishment_id={establishment_id} />
}
