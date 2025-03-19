import { redirect } from "next/navigation"

import DetailRendezVousRendererClient from "@/app/(candidat)/detail-rendez-vous/[id]/DetailRendezVousRendererClient"
import { apiGet } from "@/utils/api.utils"

export default async function DetailRendezVousPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token: string }> }) {
  const { id } = await params
  const { token } = await searchParams
  const appointmentRecap = await apiGet("/appointment-request/context/recap", {
    querystring: { appointmentId: id },
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (!appointmentRecap) redirect("/404")

  return <DetailRendezVousRendererClient appointmentId={id} appointment={appointmentRecap} token={token} />
}
