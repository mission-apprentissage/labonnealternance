import type { Metadata } from "next"
import { PropositionOffreId } from "./PropositionOffreId"

export const metadata: Metadata = {
  title: "Proposition d'offre - La bonne alternance",
}

export default async function Page({ params, searchParams }) {
  const { idFormulaire, jobId, siretFormateur } = (await params) as { idFormulaire: string; jobId: string; siretFormateur: string }
  const { token } = (await searchParams) as { token: string }

  return <PropositionOffreId idFormulaire={idFormulaire} jobId={jobId} siretFormateur={siretFormateur} token={token} />
}
