import type { Metadata } from "next"
import { PropositionOffreId } from "./PropositionOffreId"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Proposition d'offre - La bonne alternance",
}

export default async function Page({ params, searchParams }) {
  const { idFormulaire, jobId, siretFormateur } = (await params) as { idFormulaire: string; jobId: string; siretFormateur: string }
  const { token } = (await searchParams) as { token: string }

  return <PropositionOffreId idFormulaire={idFormulaire} jobId={jobId} siretFormateur={siretFormateur} token={token} />
}
